import { useCallback, useEffect, useState } from 'react';
import type {
  LeaderboardEntry,
  PuzzleTodayResponse,
  SubmitResult,
  UserStats,
  HintResponse,
} from '../../shared/api';
import { trpc } from '../trpc';

export type GamePhase = 'loading' | 'quiz' | 'revealing' | 'results';

type GameState = {
  phase: GamePhase;
  puzzle: PuzzleTodayResponse | null;
  guesses: Record<string, number>;
  touched: Set<string>;
  result: SubmitResult | null;
  submitting: boolean;
  error: string | null;
  currentCard: number;
  liveLeaderboards: {
    dailyTop: LeaderboardEntry[];
    allTimeTop: LeaderboardEntry[];
    monthlyTop: LeaderboardEntry[];
    playerCount: number;
  } | null;
  hints: Record<string, HintResponse>;
  userStats: UserStats | null;
  attemptsUsed: number;
  maxAttempts: number;
  allAttempts: SubmitResult[];
};

function normalizeResult(result: SubmitResult): SubmitResult {
  return {
    ...result,
    percentile: result.percentile ?? 0,
    newAchievements: result.newAchievements ?? [],
    questionDifficulty: result.questionDifficulty ?? [],
    leaderboards: {
      dailyTop: result.leaderboards?.dailyTop ?? [],
      allTimeTop: result.leaderboards?.allTimeTop ?? [],
      monthlyTop: result.leaderboards?.monthlyTop ?? [],
    },
    perQuestion: (result.perQuestion ?? []).map((q) => ({
      ...q,
      promptTitle: q.promptTitle ?? '',
    })),
    attemptNumber: result.attemptNumber ?? 1,
    countedForLeaderboard: result.countedForLeaderboard ?? true,
  };
}

export const useGame = () => {
  const [state, setState] = useState<GameState>({
    phase: 'loading',
    puzzle: null,
    guesses: {},
    touched: new Set<string>(),
    result: null,
    submitting: false,
    error: null,
    currentCard: 0,
    liveLeaderboards: null,
    hints: {},
    userStats: null,
    attemptsUsed: 0,
    maxAttempts: 3,
    allAttempts: [],
  });

  const fetchLeaderboards = useCallback(async () => {
    try {
      const lb = await trpc.leaderboards.query({ date: 'today' });
      setState((prev) => ({
        ...prev,
        liveLeaderboards: {
          dailyTop: lb.dailyTop,
          allTimeTop: lb.allTimeTop,
          monthlyTop: lb.monthlyTop,
          playerCount: lb.playerCount,
        },
      }));
    } catch (err) {
      console.error('Failed to fetch leaderboards', err);
    }
  }, []);

  // Load today's puzzle on mount
  useEffect(() => {
    const load = async () => {
      try {
        const data = await trpc.puzzleToday.query();
        const allAttempts = (data.allAttempts ?? []).map(normalizeResult);
        const attemptsUsed = data.attemptsUsed ?? allAttempts.length;
        const maxAttempts = data.maxAttempts ?? 3;
        const userStats = data.userStats ?? null;

        // Check if user clicked "Retry" from the splash post
        const wantsRetry = sessionStorage.getItem('rewinddit-retry') === '1';
        if (wantsRetry) sessionStorage.removeItem('rewinddit-retry');

        if (data.hasPlayed && data.previousResult) {
          const safePrevious = normalizeResult(data.previousResult);

          // If retry was requested and attempts remain, go straight to quiz
          if (wantsRetry && attemptsUsed < maxAttempts) {
            setState({
              phase: 'quiz',
              puzzle: data,
              guesses: {},
              touched: new Set<string>(),
              result: null,
              submitting: false,
              error: null,
              currentCard: 0,
              liveLeaderboards: null,
              hints: {},
              userStats,
              attemptsUsed,
              maxAttempts,
              allAttempts,
            });
          } else {
            const prevGuesses = safePrevious.perQuestion.reduce(
              (acc, q) => ({ ...acc, [q.id]: q.guess }),
              {} as Record<string, number>
            );
            setState({
              phase: 'results',
              puzzle: data,
              guesses: prevGuesses,
              touched: new Set(Object.keys(prevGuesses)),
              result: safePrevious,
              submitting: false,
              error: null,
              currentCard: 0,
              liveLeaderboards: null,
              hints: {},
              userStats,
              attemptsUsed,
              maxAttempts,
              allAttempts,
            });
          }
        } else {
          setState({
            phase: 'quiz',
            puzzle: data,
            guesses: {},
            touched: new Set<string>(),
            result: null,
            submitting: false,
            error: null,
            currentCard: 0,
            liveLeaderboards: null,
            hints: {},
            userStats,
            attemptsUsed,
            maxAttempts,
            allAttempts,
          });
        }
      } catch (err) {
        console.error('Failed to load puzzle', err);
        setState((prev) => ({
          ...prev,
          phase: 'loading',
          error: 'Failed to load puzzle. Try again.',
        }));
      }
    };
    void load();
  }, []);

  // Refresh leaderboards when entering results or revealing phase
  useEffect(() => {
    if (state.phase === 'results' || state.phase === 'revealing') {
      void fetchLeaderboards();
    }
  }, [state.phase, fetchLeaderboards]);

  // Fetch user stats when entering results (if not already loaded)
  useEffect(() => {
    if (state.phase === 'results' && !state.userStats) {
      void (async () => {
        try {
          const stats = await trpc.getUserStats.query();
          setState((prev) => ({ ...prev, userStats: stats }));
        } catch (err) {
          console.error('Failed to fetch user stats', err);
        }
      })();
    }
  }, [state.phase, state.userStats]);

  const setGuess = useCallback((momentId: string, year: number) => {
    setState((prev) => {
      const touched = new Set(prev.touched);
      touched.add(momentId);
      return {
        ...prev,
        guesses: { ...prev.guesses, [momentId]: year },
        touched,
      };
    });
  }, []);

  const goNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentCard: Math.min(prev.currentCard + 1, 4),
    }));
  }, []);

  const goPrev = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentCard: Math.max(prev.currentCard - 1, 0),
    }));
  }, []);

  const goToCard = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      currentCard: Math.max(0, Math.min(4, index)),
    }));
  }, []);

  const submit = useCallback(async () => {
    setState((prev) => ({ ...prev, submitting: true, error: null }));
    try {
      const { puzzle, guesses } = state;
      if (!puzzle) throw new Error('No puzzle loaded');

      const result = await trpc.submit.mutate({
        date: puzzle.date,
        guessesById: guesses,
      });
      const safeResult = normalizeResult(result);

      setState((prev) => ({
        ...prev,
        phase: 'revealing',
        result: safeResult,
        submitting: false,
        attemptsUsed: prev.attemptsUsed + 1,
        allAttempts: [...prev.allAttempts, safeResult],
      }));
    } catch (err) {
      console.error('Failed to submit', err);
      setState((prev) => ({
        ...prev,
        submitting: false,
        error: err instanceof Error ? err.message : 'Failed to submit',
      }));
    }
  }, [state]);

  const finishReveal = useCallback(() => {
    setState((prev) => ({ ...prev, phase: 'results' }));
  }, []);

  const retry = useCallback(() => {
    setState((prev) => {
      if (prev.attemptsUsed >= prev.maxAttempts) return prev;
      return {
        ...prev,
        phase: 'quiz',
        guesses: {},
        touched: new Set<string>(),
        result: null,
        error: null,
        currentCard: 0,
        hints: {},
      };
    });
  }, []);

  const requestHint = useCallback(
    async (momentId: string) => {
      if (!state.puzzle || state.hints[momentId]) return;
      try {
        const hint = await trpc.getHint.query({
          date: state.puzzle.date,
          momentId,
        });
        setState((prev) => ({
          ...prev,
          hints: { ...prev.hints, [momentId]: hint },
        }));
      } catch (err) {
        console.error('Failed to get hint', err);
      }
    },
    [state.puzzle, state.hints]
  );

  const postToComments = useCallback(
    async (text: string, date: string): Promise<'posted' | 'already' | 'failed'> => {
      try {
        const res = await trpc.postComment.mutate({ text, date });
        if (res.alreadyPosted) return 'already';
        return 'posted';
      } catch (err) {
        console.error('Failed to post comment', err);
        return 'failed';
      }
    },
    []
  );

  const allGuessed = state.puzzle
    ? state.puzzle.moments.every((m) => state.touched.has(m.id))
    : false;

  const leaderboards = state.liveLeaderboards
    ? {
        dailyTop: state.liveLeaderboards.dailyTop,
        allTimeTop: state.liveLeaderboards.allTimeTop,
        monthlyTop: state.liveLeaderboards.monthlyTop,
      }
    : state.result?.leaderboards ?? null;

  const playerCount =
    state.liveLeaderboards?.playerCount ?? state.puzzle?.playerCount ?? 0;

  const currentUser = state.puzzle?.currentUser ?? null;
  const postUrl = state.puzzle?.postUrl ?? '';
  const canRetry = state.attemptsUsed < state.maxAttempts;

  return {
    phase: state.phase,
    puzzle: state.puzzle,
    guesses: state.guesses,
    touched: state.touched,
    result: state.result,
    submitting: state.submitting,
    error: state.error,
    allGuessed,
    currentCard: state.currentCard,
    leaderboards,
    playerCount,
    currentUser,
    postUrl,
    hints: state.hints,
    userStats: state.userStats,
    attemptsUsed: state.attemptsUsed,
    maxAttempts: state.maxAttempts,
    allAttempts: state.allAttempts,
    canRetry,
    setGuess,
    submit,
    goNext,
    goPrev,
    goToCard,
    finishReveal,
    retry,
    requestHint,
    postToComments,
  } as const;
};
