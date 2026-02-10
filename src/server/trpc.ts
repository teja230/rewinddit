import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { redis, reddit } from '@devvit/web/server';
import type {
  LeaderboardEntry,
  PuzzleTodayResponse,
  SubmitResult,
} from '../shared/api';
import {
  generateDailyPuzzle,
  getMomentPrompts,
  getTodayUTC,
  getYesterdayUTC,
  scoreGuesses,
  MIN_YEAR,
  MAX_YEAR,
} from './core/puzzle';
import type { DailyPuzzle } from './core/puzzle';
import { K } from './core/redisKeys';

// ── tRPC init ──

const t = initTRPC.create();

// ── Safe user ID helper ──

async function getUserId(): Promise<string> {
  try {
    const username = await reddit.getCurrentUsername();
    return username ?? 'anonymous';
  } catch (err) {
    console.error('Failed to get username:', err);
    return 'anonymous';
  }
}

// ── Helpers ──

async function ensurePuzzle(date: string): Promise<DailyPuzzle> {
  const cached = await redis.get(K.puzzle(date));
  if (cached) return JSON.parse(cached) as DailyPuzzle;
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

async function getUserRank(
  key: string,
  userId: string
): Promise<number | undefined> {
  const rank = await redis.zRank(key, userId);
  if (rank === undefined) return undefined;
  const all = await redis.zRange(key, 0, -1, { by: 'rank' });
  return all.length - rank;
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

    const moments = getMomentPrompts(puzzle.momentIds);

    return {
      date: today,
      minYear: MIN_YEAR,
      maxYear: MAX_YEAR,
      moments,
      hasPlayed,
      previousResult,
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
        return JSON.parse(existingPlay) as SubmitResult;
      }

      if (input.date !== today) {
        throw new Error('Can only submit for today');
      }

      const puzzle = await ensurePuzzle(today);

      // Validate IDs
      const puzzleIdSet = new Set(puzzle.momentIds);
      const guessIds = Object.keys(input.guessesById);
      if (
        guessIds.length !== 5 ||
        !guessIds.every((id) => puzzleIdSet.has(id))
      ) {
        throw new Error("Guesses must match today's puzzle IDs");
      }

      // Validate years
      for (const year of Object.values(input.guessesById)) {
        if (year < MIN_YEAR || year > MAX_YEAR) {
          throw new Error(`Year must be between ${MIN_YEAR} and ${MAX_YEAR}`);
        }
      }

      const { perQuestion, totalScore } = scoreGuesses(
        puzzle.momentIds,
        input.guessesById
      );

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

      await Promise.all([
        redis.set(K.lastPlayed(userId), today),
        redis.set(K.streak(userId), streak.toString()),
        redis.set(K.bestStreak(userId), bestStreak.toString()),
      ]);

      // Stats
      const rawStats = await redis.get(K.stats(userId));
      const stats = rawStats
        ? (JSON.parse(rawStats) as {
            gamesPlayed: number;
            totalScore: number;
          })
        : { gamesPlayed: 0, totalScore: 0 };
      stats.gamesPlayed += 1;
      stats.totalScore += totalScore;
      await redis.set(K.stats(userId), JSON.stringify(stats));

      // Leaderboards
      await Promise.all([
        redis.zAdd(K.dailyLb(today), { member: userId, score: totalScore }),
        redis.zIncrBy(K.allTimeLb, userId, totalScore),
      ]);

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

      await redis.set(K.play(today, userId), JSON.stringify(result));
      return result;
    }),

  leaderboards: t.procedure
    .input(z.object({ date: z.string().optional() }).optional())
    .query(async ({ input }) => {
      const rawDate = input?.date;
      const date =
        !rawDate || rawDate === 'today' ? getTodayUTC() : rawDate;

      const [dailyTop, allTimeTop] = await Promise.all([
        getTopEntries(K.dailyLb(date), 10),
        getTopEntries(K.allTimeLb, 10),
      ]);

      return { date, dailyTop, allTimeTop };
    }),
});

export type AppRouter = typeof appRouter;
