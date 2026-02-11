import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { redis, reddit, context } from '@devvit/web/server';
import type {
  Achievement,
  LeaderboardEntry,
  PuzzleTodayResponse,
  QuestionDifficulty,
  SubmitResult,
  UserStats,
  HintResponse,
} from '../shared/api';
import {
  generateDailyPuzzle,
  getMomentPrompts,
  getTodayUTC,
  getYesterdayUTC,
  scoreGuesses,
  hashString,
  mulberry32,
  shuffleArray,
  MIN_YEAR,
  MAX_YEAR,
} from './core/puzzle';
import { getMomentById } from './data/moments';
import type { DailyPuzzle } from './core/puzzle';
import { K } from './core/redisKeys';

// ── tRPC init ──

const t = initTRPC.create();

// ── Helpers ──

async function getUserId(): Promise<string> {
  try {
    const username = await reddit.getCurrentUsername();
    return username ?? 'anonymous';
  } catch (err) {
    console.error('Failed to get username:', err);
    return 'anonymous';
  }
}

function getPostUrl(): string {
  try {
    const sub = context.subredditName;
    const postId = context.postId;
    if (sub && postId) {
      // Strip t3_ prefix if present
      const cleanId = postId.startsWith('t3_') ? postId.slice(3) : postId;
      return `https://reddit.com/r/${sub}/comments/${cleanId}`;
    }
  } catch {
    // Context may not be available in all environments
  }
  return '';
}

function getYearMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getYearMonthFromDate(date: string): string {
  return date.slice(0, 7);
}

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
  const members = await redis.zRange(key, 0, count - 1, {
    by: 'rank',
    reverse: true,
  });

  const entries: LeaderboardEntry[] = [];
  for (let i = 0; i < members.length; i++) {
    const m = members[i]!;
    const username = (await redis.get(K.userName(m.member))) ?? 'anonymous';
    entries.push({ rank: i + 1, userId: m.member, username, score: m.score });
  }
  return entries;
}

async function getUserRank(
  key: string,
  userId: string
): Promise<number | undefined> {
  const rank = await redis.zRank(key, userId);
  if (rank === undefined || rank === null) return undefined;
  const total = await redis.zCard(key);
  return total - rank;
}

async function getPlayerCount(date: string): Promise<number> {
  try {
    return await redis.zCard(K.dailyLb(date));
  } catch {
    return 0;
  }
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

// ── Achievement definitions ──

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first-timer', title: 'First Timer', emoji: '\ud83c\udf1f', description: 'Play your first game' },
  { id: 'perfect-q', title: 'Bullseye', emoji: '\ud83c\udfaf', description: 'Score 100 on any question' },
  { id: 'perfect-game', title: 'Perfect Game', emoji: '\ud83d\udc51', description: 'Score 500/500' },
  { id: 'streak-7', title: 'Hot Streak', emoji: '\ud83d\udd25', description: '7-day streak' },
  { id: 'streak-14', title: 'Dedicated', emoji: '\ud83d\udcaa', description: '14-day streak' },
  { id: 'streak-30', title: 'Legendary', emoji: '\ud83c\udfc6', description: '30-day streak' },
  { id: 'century', title: 'Century Club', emoji: '\ud83d\udcaf', description: 'Play 10 games' },
  { id: 'scholar', title: 'Scholar', emoji: '\ud83c\udf93', description: 'Average 80+ pts/question over 5+ games' },
];

function checkAchievements(
  existingIds: Set<string>,
  totalScore: number,
  perQuestion: { points: number }[],
  streak: number,
  gamesPlayed: number,
  avgScore: number
): Achievement[] {
  const newAchievements: Achievement[] = [];

  const checks: [string, boolean][] = [
    ['first-timer', gamesPlayed >= 1],
    ['perfect-q', perQuestion.some((q) => q.points === 100)],
    ['perfect-game', totalScore === 500],
    ['streak-7', streak >= 7],
    ['streak-14', streak >= 14],
    ['streak-30', streak >= 30],
    ['century', gamesPlayed >= 10],
    ['scholar', gamesPlayed >= 5 && avgScore >= 400],
  ];

  for (const [id, earned] of checks) {
    if (earned && !existingIds.has(id)) {
      const achievement = ALL_ACHIEVEMENTS.find((a) => a.id === id);
      if (achievement) newAchievements.push(achievement);
    }
  }

  return newAchievements;
}

// ── Router ──

export const appRouter = t.router({
  puzzleToday: t.procedure.query(async (): Promise<PuzzleTodayResponse> => {
    const today = getTodayUTC();
    const puzzle = await ensurePuzzle(today);
    const userId = await getUserId();

    const existingPlay = await redis.get(K.play(today, userId));
    const hasPlayed = existingPlay !== undefined && existingPlay !== null;

    let previousResult: SubmitResult | undefined;
    if (hasPlayed) {
      previousResult = JSON.parse(existingPlay!) as SubmitResult;
    }

    const userSeed = hashString(`${userId}:${today}`);
    const userRng = mulberry32(userSeed);
    const shuffledIds = shuffleArray([...puzzle.momentIds], userRng);
    const moments = getMomentPrompts(shuffledIds);

    const playerCount = await getPlayerCount(today);

    return {
      date: today,
      minYear: MIN_YEAR,
      maxYear: MAX_YEAR,
      moments,
      hasPlayed,
      previousResult,
      currentUser: userId,
      postUrl: getPostUrl(),
      playerCount,
    };
  }),

  submit: t.procedure
    .input(
      z.object({
        date: z.string(),
        guessesById: z.record(z.string(), z.number()),
      })
    )
    .mutation(async ({ input }): Promise<SubmitResult> => {
      const today = getTodayUTC();
      const userId = await getUserId();

      await redis.set(K.userName(userId), userId);

      // Check replay
      const existingPlay = await redis.get(K.play(today, userId));
      if (existingPlay) {
        const existing = JSON.parse(existingPlay) as SubmitResult;
        await ensureLeaderboardMembership(existing.date, userId, existing.totalScore);
        return existing;
      }

      if (input.date !== today) {
        throw new Error('Can only submit for today');
      }

      const puzzle = await ensurePuzzle(today);

      const puzzleIdSet = new Set(puzzle.momentIds);
      const guessIds = Object.keys(input.guessesById);
      if (
        guessIds.length !== 5 ||
        !guessIds.every((id) => puzzleIdSet.has(id))
      ) {
        throw new Error("Guesses must match today's puzzle IDs");
      }

      for (const year of Object.values(input.guessesById)) {
        if (year < MIN_YEAR || year > MAX_YEAR) {
          throw new Error(`Year must be between ${MIN_YEAR} and ${MAX_YEAR}`);
        }
      }

      // Check hints used — deduct from scoring
      const hintsRaw = await redis.get(K.hintsUsed(today, userId));
      const hintedIds: Set<string> = hintsRaw
        ? new Set(JSON.parse(hintsRaw) as string[])
        : new Set();

      const { perQuestion, totalScore: rawScore } = scoreGuesses(
        puzzle.momentIds,
        input.guessesById
      );

      // Apply hint penalty: -25 max points per hinted question
      let hintPenalty = 0;
      for (const q of perQuestion) {
        if (hintedIds.has(q.id)) {
          const penalty = Math.min(25, q.points);
          q.points -= penalty;
          hintPenalty += penalty;
        }
      }
      const totalScore = rawScore - hintPenalty;

      // Streak
      const lastPlayed = await redis.get(K.lastPlayed(userId));
      const yesterday = getYesterdayUTC();
      let streak = 1;
      if (lastPlayed === yesterday) {
        const prevStreak = await redis.get(K.streak(userId));
        streak = (prevStreak ? parseInt(prevStreak) : 0) + 1;
      }

      const prevBest = await redis.get(K.bestStreak(userId));
      const bestStreak = Math.max(streak, prevBest ? parseInt(prevBest) : 0);

      // Streak milestones
      const MILESTONES = [30, 14, 7];
      let streakMilestone: number | undefined;
      for (const m of MILESTONES) {
        if (streak === m) {
          streakMilestone = m;
          break;
        }
      }

      await Promise.all([
        redis.set(K.lastPlayed(userId), today),
        redis.set(K.streak(userId), streak.toString()),
        redis.set(K.bestStreak(userId), bestStreak.toString()),
      ]);

      // Stats
      const rawStats = await redis.get(K.stats(userId));
      const stats = rawStats
        ? (JSON.parse(rawStats) as { gamesPlayed: number; totalScore: number })
        : { gamesPlayed: 0, totalScore: 0 };
      stats.gamesPlayed += 1;
      stats.totalScore += totalScore;
      await redis.set(K.stats(userId), JSON.stringify(stats));

      // Best score
      const prevBestScore = await redis.get(K.bestScore(userId));
      const bestScore = Math.max(totalScore, prevBestScore ? parseInt(prevBestScore) : 0);
      await redis.set(K.bestScore(userId), bestScore.toString());

      // Achievements
      const existingAchRaw = await redis.get(K.achievements(userId));
      const existingAchIds: Set<string> = existingAchRaw
        ? new Set(JSON.parse(existingAchRaw) as string[])
        : new Set();

      const avgScore = stats.totalScore / stats.gamesPlayed;
      const newAchievements = checkAchievements(
        existingAchIds,
        totalScore,
        perQuestion,
        streak,
        stats.gamesPlayed,
        avgScore
      );

      if (newAchievements.length > 0) {
        for (const a of newAchievements) existingAchIds.add(a.id);
        await redis.set(K.achievements(userId), JSON.stringify([...existingAchIds]));
      }

      // Leaderboards (daily + all-time + monthly)
      const yearMonth = getYearMonth();
      await Promise.all([
        redis.zAdd(K.dailyLb(today), { member: userId, score: totalScore }),
        redis.zIncrBy(K.allTimeLb, userId, totalScore),
        redis.zIncrBy(K.monthlyLb(yearMonth), userId, totalScore),
      ]);

      // Per-question difficulty stats
      const qStatPromises = perQuestion.map(async (q) => {
        const key = K.qStats(today, q.id);
        await Promise.all([
          redis.hIncrBy(key, 'plays', 1),
          redis.hIncrBy(key, 'totalDelta', q.delta),
          ...(q.delta === 0 ? [redis.hIncrBy(key, 'exactCount', 1)] : []),
        ]);
      });
      await Promise.all(qStatPromises);

      // Read back difficulty stats
      const questionDifficulty: QuestionDifficulty[] = await Promise.all(
        perQuestion.map(async (q) => {
          const key = K.qStats(today, q.id);
          const [plays, exactCount, totalDelta] = await Promise.all([
            redis.hGet(key, 'plays'),
            redis.hGet(key, 'exactCount'),
            redis.hGet(key, 'totalDelta'),
          ]);
          const p = parseInt(plays ?? '1');
          const e = parseInt(exactCount ?? '0');
          const td = parseInt(totalDelta ?? '0');
          return {
            id: q.id,
            plays: p,
            exactPercent: Math.round((e / p) * 100),
            avgDelta: Math.round((td / p) * 10) / 10,
          };
        })
      );

      // Rank + percentile
      const [dailyRank, dailyTop, allTimeTop, monthlyTop, totalPlayers] = await Promise.all([
        getUserRank(K.dailyLb(today), userId),
        getTopEntries(K.dailyLb(today), 10),
        getTopEntries(K.allTimeLb, 10),
        getTopEntries(K.monthlyLb(yearMonth), 10),
        getPlayerCount(today),
      ]);

      const percentile = totalPlayers > 1 && dailyRank
        ? Math.round(((totalPlayers - dailyRank) / (totalPlayers - 1)) * 100)
        : 50;

      const result: SubmitResult = {
        date: today,
        perQuestion,
        totalScore,
        streak,
        bestStreak,
        dailyRank,
        percentile,
        streakMilestone,
        newAchievements,
        questionDifficulty,
        leaderboards: { dailyTop, allTimeTop, monthlyTop },
      };

      await redis.set(K.play(today, userId), JSON.stringify(result));
      return result;
    }),

  postComment: t.procedure
    .input(z.object({ text: z.string() }))
    .mutation(async ({ input }) => {
      const postId = context.postId;
      if (!postId) throw new Error('No post context available');

      await reddit.submitComment({
        id: postId,
        text: input.text,
      });

      return { success: true };
    }),

  getHint: t.procedure
    .input(z.object({ date: z.string(), momentId: z.string() }))
    .query(async ({ input }): Promise<HintResponse> => {
      const userId = await getUserId();
      const moment = getMomentById(input.momentId);
      if (!moment) throw new Error('Moment not found');

      // Track hints used
      const hintsRaw = await redis.get(K.hintsUsed(input.date, userId));
      const hintedIds: string[] = hintsRaw ? (JSON.parse(hintsRaw) as string[]) : [];

      if (!hintedIds.includes(input.momentId)) {
        hintedIds.push(input.momentId);
        await redis.set(K.hintsUsed(input.date, userId), JSON.stringify(hintedIds));
      }

      // Generate hint: reveal which half of the range the year falls in
      const mid = Math.round((MIN_YEAR + MAX_YEAR) / 2);
      const hint = moment.year <= mid
        ? `This happened in ${MIN_YEAR}\u2013${mid}`
        : `This happened in ${mid + 1}\u2013${MAX_YEAR}`;

      return { momentId: input.momentId, hint, pointsCost: 25 };
    }),

  getUserStats: t.procedure.query(async (): Promise<UserStats> => {
    const userId = await getUserId();

    const [rawStats, rawStreak, rawBestStreak, rawBestScore, rawAchievements] =
      await Promise.all([
        redis.get(K.stats(userId)),
        redis.get(K.streak(userId)),
        redis.get(K.bestStreak(userId)),
        redis.get(K.bestScore(userId)),
        redis.get(K.achievements(userId)),
      ]);

    const stats = rawStats
      ? (JSON.parse(rawStats) as { gamesPlayed: number; totalScore: number })
      : { gamesPlayed: 0, totalScore: 0 };

    const achIds: string[] = rawAchievements
      ? (JSON.parse(rawAchievements) as string[])
      : [];
    const achievements = achIds
      .map((id) => ALL_ACHIEVEMENTS.find((a) => a.id === id))
      .filter((a): a is Achievement => a !== undefined);

    return {
      gamesPlayed: stats.gamesPlayed,
      totalScore: stats.totalScore,
      averageScore: stats.gamesPlayed > 0 ? Math.round(stats.totalScore / stats.gamesPlayed) : 0,
      bestScore: rawBestScore ? parseInt(rawBestScore) : 0,
      currentStreak: rawStreak ? parseInt(rawStreak) : 0,
      bestStreak: rawBestStreak ? parseInt(rawBestStreak) : 0,
      achievements,
    };
  }),

  leaderboards: t.procedure
    .input(z.object({ date: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const rawDate = input?.date;
      const date = !rawDate || rawDate === 'today' ? getTodayUTC() : rawDate;
      const yearMonth = getYearMonth();

      const [dailyTop, allTimeTop, monthlyTop, playerCount] = await Promise.all([
        getTopEntries(K.dailyLb(date), 10),
        getTopEntries(K.allTimeLb, 10),
        getTopEntries(K.monthlyLb(yearMonth), 10),
        getPlayerCount(date),
      ]);

      return { date, dailyTop, allTimeTop, monthlyTop, playerCount };
    }),
});

export type AppRouter = typeof appRouter;
