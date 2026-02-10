import { useCallback, useEffect, useState } from 'react';
import type { PuzzleTodayResponse, SubmitResult } from '../../shared/api';
import { trpc } from '../trpc';

export type GamePhase = 'loading' | 'quiz' | 'results';

type GameState = {
  phase: GamePhase;
  puzzle: PuzzleTodayResponse | null;
  guesses: Record<string, number>;
  touched: Set<string>; // tracks which cards the user has interacted with
  result: SubmitResult | null;
  submitting: boolean;
  error: string | null;
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
  });

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
        phase: 'results',
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

  const allGuessed = state.puzzle
    ? state.puzzle.moments.every((m) => state.touched.has(m.id))
    : false;

  return {
    phase: state.phase,
    puzzle: state.puzzle,
    guesses: state.guesses,
    touched: state.touched,
    result: state.result,
    submitting: state.submitting,
    error: state.error,
    allGuessed,
    setGuess,
    submit,
  } as const;
};
