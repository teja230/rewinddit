import { Hono } from 'hono';
import { redis, reddit, context } from '@devvit/web/server';
import type {
  ErrorResponse,
  LeaderboardEntry,
  LeaderboardsResponse,
  PuzzleTodayResponse,
  SubmitRequest,
  SubmitResult,
} from '../../shared/api';
import {
  generateDailyPuzzle,
  getMomentPrompts,
  getTodayUTC,
  getYesterdayUTC,
  scoreGuesses,
  MIN_YEAR,
  MAX_YEAR,
} from '../core/puzzle';
import { getMomentById } from '../data/moments';
import type { DailyPuzzle } from '../core/puzzle';
import { K } from '../core/redisKeys';

export const api = new Hono();

// ── Helpers ──

async function ensurePuzzle(date: string): Promise<DailyPuzzle> {
  const cached = await redis.get(K.puzzle(date));
  if (cached) {
    const puzzle = JSON.parse(cached) as DailyPuzzle;
    const allValid = puzzle.momentIds.every((id) => getMomentById(id) !== undefined);
    if (allValid) return puzzle;
  }
  const puzzle = generateDailyPuzzle(date);
  await redis.set(K.puzzle(date), JSON.stringify(puzzle));
  return puzzle;
}

async function getTopEntries(
  key: string,
  count: number
): Promise<LeaderboardEntry[]> {
  const members = await redis.zRange(key, '+inf', '-inf', {
    by: 'score',
    reverse: true,
    limit: { offset: 0, count },
  });

  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < members.length; i++) {
    const m = members[i]!;
    const username = (await redis.get(K.userName(m.member))) ?? 'anonymous';
    entries.push({ rank: i + 1, userId: m.member, username, score: m.score });
  }
  return entries;
}

async function getUserRank(key: string, userId: string): Promise<number | undefined> {
  const rank = await redis.zRank(key, userId);
  if (rank === undefined) return undefined;
  const all = await redis.zRange(key, 0, -1, { by: 'rank' });
  return all.length - rank;
}

function getPostUrl(): string {
  try {
    const sub = context.subredditName;
    const postId = context.postId;
    if (sub && postId) {
      const cleanId = postId.startsWith('t3_') ? postId.slice(3) : postId;
      return `https://reddit.com/r/${sub}/comments/${cleanId}`;
    }
  } catch { /* */ }
  return '';
}

function getYearMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getYearMonthFromDate(date: string): string {
  return date.slice(0, 7);
}

async function ensureLeaderboardMembership(
  date: string,
  userId: string,
  totalScore: number
): Promise<void> {
  const yearMonth = getYearMonthFromDate(date);
  const dailyKey = K.dailyLb(date);
  const monthlyKey = K.monthlyLb(yearMonth);
  const allTimeKey = K.allTimeLb;

  const [dailyScore, monthlyScore, allTimeScore] = await Promise.all([
    redis.zScore(dailyKey, userId),
    redis.zScore(monthlyKey, userId),
    redis.zScore(allTimeKey, userId),
  ]);

  await Promise.all([
    dailyScore === undefined
      ? redis.zAdd(dailyKey, { member: userId, score: totalScore })
      : Promise.resolve(),
    monthlyScore === undefined
      ? redis.zAdd(monthlyKey, { member: userId, score: totalScore })
      : Promise.resolve(),
    allTimeScore === undefined
      ? redis.zAdd(allTimeKey, { member: userId, score: totalScore })
      : Promise.resolve(),
  ]);
}

// ── GET /api/puzzle/today ──

api.get('/puzzle/today', async (c) => {
  try {
    const today = getTodayUTC();
    const puzzle = await ensurePuzzle(today);
    const username = await reddit.getCurrentUsername();
    const userId = username ?? 'anonymous';

    const existingPlay = await redis.get(K.play(today, userId));
    const hasPlayed = existingPlay !== undefined && existingPlay !== null;

    let previousResult: SubmitResult | undefined;
    if (hasPlayed) {
      previousResult = JSON.parse(existingPlay!) as SubmitResult;
    }

    const moments = getMomentPrompts(puzzle.momentIds);

    let playerCount = 0;
    try { playerCount = await redis.zCard(K.dailyLb(today)); } catch { /* */ }

    return c.json<PuzzleTodayResponse>({
      date: today,
      minYear: MIN_YEAR,
      maxYear: MAX_YEAR,
      moments,
      hasPlayed,
      previousResult,
      currentUser: userId,
      postUrl: getPostUrl(),
      playerCount,
    });
  } catch (error) {
    console.error('Error in puzzle/today:', error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Failed to load puzzle' },
      500
    );
  }
});

// ── POST /api/submit (simplified — tRPC is the primary path) ──

api.post('/submit', async (c) => {
  try {
    const today = getTodayUTC();
    const username = await reddit.getCurrentUsername();
    const userId = username ?? 'anonymous';

    await redis.set(K.userName(userId), username ?? 'anonymous');

    const existingPlay = await redis.get(K.play(today, userId));
    if (existingPlay) {
      const existing = JSON.parse(existingPlay) as SubmitResult;
      await ensureLeaderboardMembership(existing.date, userId, existing.totalScore);
      return c.json<SubmitResult>(existing);
    }

    const body = (await c.req.json()) as SubmitRequest;

    if (body.date !== today) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'Can only submit for today' },
        400
      );
    }

    const puzzle = await ensurePuzzle(today);

    const puzzleIdSet = new Set(puzzle.momentIds);
    const guessIds = Object.keys(body.guessesById);
    if (
      guessIds.length !== 5 ||
      !guessIds.every((id) => puzzleIdSet.has(id))
    ) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'Guesses must match today\'s puzzle IDs' },
        400
      );
    }

    for (const year of Object.values(body.guessesById)) {
      if (year < MIN_YEAR || year > MAX_YEAR) {
        return c.json<ErrorResponse>(
          { status: 'error', message: `Year must be between ${MIN_YEAR} and ${MAX_YEAR}` },
          400
        );
      }
    }

    const { perQuestion, totalScore } = scoreGuesses(
      puzzle.momentIds,
      body.guessesById
    );

    const lastPlayed = await redis.get(K.lastPlayed(userId));
    const yesterday = getYesterdayUTC();
    let streak = 1;
    if (lastPlayed === yesterday) {
      const prevStreak = await redis.get(K.streak(userId));
      streak = (prevStreak ? parseInt(prevStreak) : 0) + 1;
    }

    const prevBest = await redis.get(K.bestStreak(userId));
    const bestStreak = Math.max(streak, prevBest ? parseInt(prevBest) : 0);

    await Promise.all([
      redis.set(K.lastPlayed(userId), today),
      redis.set(K.streak(userId), streak.toString()),
      redis.set(K.bestStreak(userId), bestStreak.toString()),
    ]);

    const rawStats = await redis.get(K.stats(userId));
    const stats = rawStats
      ? (JSON.parse(rawStats) as { gamesPlayed: number; totalScore: number })
      : { gamesPlayed: 0, totalScore: 0 };
    stats.gamesPlayed += 1;
    stats.totalScore += totalScore;
    await redis.set(K.stats(userId), JSON.stringify(stats));

    const yearMonth = getYearMonth();
    await Promise.all([
      redis.zAdd(K.dailyLb(today), { member: userId, score: totalScore }),
      redis.zIncrBy(K.allTimeLb, userId, totalScore),
      redis.zIncrBy(K.monthlyLb(yearMonth), userId, totalScore),
    ]);

    const [dailyRank, dailyTop, allTimeTop, monthlyTop] = await Promise.all([
      getUserRank(K.dailyLb(today), userId),
      getTopEntries(K.dailyLb(today), 10),
      getTopEntries(K.allTimeLb, 10),
      getTopEntries(K.monthlyLb(yearMonth), 10),
    ]);

    const result: SubmitResult = {
      date: today,
      perQuestion,
      totalScore,
      streak,
      bestStreak,
      dailyRank,
      percentile: 50,
      newAchievements: [],
      questionDifficulty: [],
      leaderboards: { dailyTop, allTimeTop, monthlyTop },
    };

    await redis.set(K.play(today, userId), JSON.stringify(result));
    return c.json<SubmitResult>(result);
  } catch (error) {
    console.error('Error in submit:', error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Failed to submit' },
      500
    );
  }
});

// ── GET /api/leaderboards ──

api.get('/leaderboards', async (c) => {
  try {
    const rawDate = c.req.query('date');
    const date = !rawDate || rawDate === 'today' ? getTodayUTC() : rawDate;
    const yearMonth = getYearMonth();

    let playerCount = 0;
    try { playerCount = await redis.zCard(K.dailyLb(date)); } catch { /* */ }

    const [dailyTop, allTimeTop, monthlyTop] = await Promise.all([
      getTopEntries(K.dailyLb(date), 10),
      getTopEntries(K.allTimeLb, 10),
      getTopEntries(K.monthlyLb(yearMonth), 10),
    ]);

    return c.json<LeaderboardsResponse>({
      date,
      dailyTop,
      allTimeTop,
      monthlyTop,
      playerCount,
    });
  } catch (error) {
    console.error('Error in leaderboards:', error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Failed to load leaderboards' },
      500
    );
  }
});
