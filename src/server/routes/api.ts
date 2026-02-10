import { Hono } from 'hono';
import { redis, reddit } from '@devvit/web/server';
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
import type { DailyPuzzle } from '../core/puzzle';
import { K } from '../core/redisKeys';

export const api = new Hono();

// ── Ensure puzzle exists for a date ──

async function ensurePuzzle(date: string): Promise<DailyPuzzle> {
  const cached = await redis.get(K.puzzle(date));
  if (cached) return JSON.parse(cached) as DailyPuzzle;

  const puzzle = generateDailyPuzzle(date);
  await redis.set(K.puzzle(date), JSON.stringify(puzzle));
  return puzzle;
}

// ── Leaderboard helpers ──

async function getTopEntries(
  key: string,
  count: number
): Promise<LeaderboardEntry[]> {
  // zRange with BYSCORE reversed gives highest scores first
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
  // zRank returns 0-based rank from lowest score; we want rank from highest
  const rank = await redis.zRank(key, userId);
  if (rank === undefined) return undefined;
  // Get total count to compute reverse rank
  const all = await redis.zRange(key, 0, -1, { by: 'rank' });
  return all.length - rank;
}

// ── GET /api/puzzle/today ──

api.get('/puzzle/today', async (c) => {
  try {
    const today = getTodayUTC();
    const puzzle = await ensurePuzzle(today);
    const username = await reddit.getCurrentUsername();
    const userId = username ?? 'anonymous';

    // Check if already played
    const existingPlay = await redis.get(K.play(today, userId));
    const hasPlayed = existingPlay !== undefined && existingPlay !== null;

    let previousResult: SubmitResult | undefined;
    if (hasPlayed) {
      previousResult = JSON.parse(existingPlay!) as SubmitResult;
    }

    const moments = getMomentPrompts(puzzle.momentIds);

    return c.json<PuzzleTodayResponse>({
      date: today,
      minYear: MIN_YEAR,
      maxYear: MAX_YEAR,
      moments,
      hasPlayed,
      previousResult,
    });
  } catch (error) {
    console.error('Error in puzzle/today:', error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Failed to load puzzle' },
      500
    );
  }
});

// ── POST /api/submit ──

api.post('/submit', async (c) => {
  try {
    const today = getTodayUTC();
    const username = await reddit.getCurrentUsername();
    const userId = username ?? 'anonymous';

    // Store/update display name
    await redis.set(K.userName(userId), username ?? 'anonymous');

    // Check replay
    const existingPlay = await redis.get(K.play(today, userId));
    if (existingPlay) {
      return c.json<SubmitResult>(JSON.parse(existingPlay) as SubmitResult);
    }

    const body = (await c.req.json()) as SubmitRequest;

    // Validate date
    if (body.date !== today) {
      return c.json<ErrorResponse>(
        { status: 'error', message: 'Can only submit for today' },
        400
      );
    }

    // Get puzzle
    const puzzle = await ensurePuzzle(today);

    // Validate all IDs match
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

    // Validate years in range
    for (const year of Object.values(body.guessesById)) {
      if (year < MIN_YEAR || year > MAX_YEAR) {
        return c.json<ErrorResponse>(
          {
            status: 'error',
            message: `Year must be between ${MIN_YEAR} and ${MAX_YEAR}`,
          },
          400
        );
      }
    }

    // Score
    const { perQuestion, totalScore } = scoreGuesses(
      puzzle.momentIds,
      body.guessesById
    );

    // Update streak
    const lastPlayed = await redis.get(K.lastPlayed(userId));
    const yesterday = getYesterdayUTC();
    let streak = 1;
    if (lastPlayed === yesterday) {
      const prevStreak = await redis.get(K.streak(userId));
      streak = (prevStreak ? parseInt(prevStreak) : 0) + 1;
    }

    const prevBest = await redis.get(K.bestStreak(userId));
    const bestStreak = Math.max(streak, prevBest ? parseInt(prevBest) : 0);

    // Persist user state
    await Promise.all([
      redis.set(K.lastPlayed(userId), today),
      redis.set(K.streak(userId), streak.toString()),
      redis.set(K.bestStreak(userId), bestStreak.toString()),
    ]);

    // Update stats
    const rawStats = await redis.get(K.stats(userId));
    const stats = rawStats
      ? (JSON.parse(rawStats) as { gamesPlayed: number; totalScore: number })
      : { gamesPlayed: 0, totalScore: 0 };
    stats.gamesPlayed += 1;
    stats.totalScore += totalScore;
    await redis.set(K.stats(userId), JSON.stringify(stats));

    // Update leaderboards
    await Promise.all([
      redis.zAdd(K.dailyLb(today), {
        member: userId,
        score: totalScore,
      }),
      redis.zIncrBy(K.allTimeLb, userId, totalScore),
    ]);

    // Get rank + leaderboard data
    const [dailyRank, dailyTop, allTimeTop] = await Promise.all([
      getUserRank(K.dailyLb(today), userId),
      getTopEntries(K.dailyLb(today), 10),
      getTopEntries(K.allTimeLb, 10),
    ]);

    const result: SubmitResult = {
      date: today,
      perQuestion,
      totalScore,
      streak,
      bestStreak,
      dailyRank,
      leaderboards: { dailyTop, allTimeTop },
    };

    // Store play result for replay protection
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

    const [dailyTop, allTimeTop] = await Promise.all([
      getTopEntries(K.dailyLb(date), 10),
      getTopEntries(K.allTimeLb, 10),
    ]);

    return c.json<LeaderboardsResponse>({
      date,
      dailyTop,
      allTimeTop,
    });
  } catch (error) {
    console.error('Error in leaderboards:', error);
    return c.json<ErrorResponse>(
      { status: 'error', message: 'Failed to load leaderboards' },
      500
    );
  }
});
