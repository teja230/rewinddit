import { useCallback, useEffect, useState } from 'react';
import type {
  LeaderboardEntry,
  PuzzleTodayResponse,
  SubmitResult,
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
  // Live leaderboard data (refreshed independently of the saved result)
  liveLeaderboards: {
    dailyTop: LeaderboardEntry[];
    allTimeTop: LeaderboardEntry[];
  } | null;
};

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
  });

  // Fetch fresh leaderboards whenever we enter a results-showing phase
  const fetchLeaderboards = useCallback(async () => {
    try {
      const lb = await trpc.leaderboards.query({ date: 'today' });
      setState((prev) => ({
        ...prev,
        liveLeaderboards: { dailyTop: lb.dailyTop, allTimeTop: lb.allTimeTop },
      }));
    } catch (err) {
      console.error('Failed to fetch leaderboards', err);
    }
  }, []);

  // Load today's puzzle on mount via tRPC
  useEffect(() => {
    const load = async () => {
      try {
        const data = await trpc.puzzleToday.query();

        if (data.hasPlayed && data.previousResult) {
          const prevGuesses = data.previousResult.perQuestion.reduce(
            (acc, q) => ({ ...acc, [q.id]: q.guess }),
            {} as Record<string, number>
          );
          setState({
            phase: 'results',
            puzzle: data,
            guesses: prevGuesses,
            touched: new Set(Object.keys(prevGuesses)),
            result: data.previousResult,
            submitting: false,
            error: null,
            currentCard: 0,
            liveLeaderboards: null,
          });
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

      setState((prev) => ({
        ...prev,
        phase: 'revealing',
        result,
        submitting: false,
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

  const allGuessed = state.puzzle
    ? state.puzzle.moments.every((m) => state.touched.has(m.id))
    : false;

  // Merge: prefer live leaderboards over stale snapshot from result
  const leaderboards = state.liveLeaderboards ?? state.result?.leaderboards ?? null;

  const currentUser = state.puzzle?.currentUser ?? null;

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
    currentUser,
    setGuess,
    submit,
    goNext,
    goPrev,
    goToCard,
    finishReveal,
  } as const;
};
