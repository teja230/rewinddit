import { describe, it, expect } from 'vitest';
import {
  generateDailyPuzzle,
  calculatePoints,
  scoreGuesses,
  getTodayUTC,
  MIN_YEAR,
  MAX_YEAR,
} from '../puzzle';
import { getMomentById, getAllMomentIds } from '../../data/moments';

describe('generateDailyPuzzle', () => {
  it('returns 5 unique moment IDs', () => {
    const puzzle = generateDailyPuzzle('2025-01-15');
    expect(puzzle.momentIds).toHaveLength(5);
    expect(new Set(puzzle.momentIds).size).toBe(5);
  });

  it('is deterministic for the same date', () => {
    const a = generateDailyPuzzle('2025-06-01');
    const b = generateDailyPuzzle('2025-06-01');
    expect(a.momentIds).toEqual(b.momentIds);
  });

  it('produces different puzzles for different dates', () => {
    const a = generateDailyPuzzle('2025-06-01');
    const b = generateDailyPuzzle('2025-06-02');
    expect(a.momentIds).not.toEqual(b.momentIds);
  });

  it('only selects valid moment IDs', () => {
    const allIds = new Set(getAllMomentIds());
    const puzzle = generateDailyPuzzle('2025-03-10');
    for (const id of puzzle.momentIds) {
      expect(allIds.has(id)).toBe(true);
    }
  });
});

describe('calculatePoints', () => {
  it('gives 100 for exact match', () => {
    expect(calculatePoints(0)).toBe(100);
  });

  it('gives 90 for delta 1', () => {
    expect(calculatePoints(1)).toBe(90);
  });

  it('gives 70 for delta 2', () => {
    expect(calculatePoints(2)).toBe(70);
  });

  it('gives 50 for delta 3', () => {
    expect(calculatePoints(3)).toBe(50);
  });

  it('gives 30 for delta 4', () => {
    expect(calculatePoints(4)).toBe(30);
  });

  it('gives 15 for delta 5', () => {
    expect(calculatePoints(5)).toBe(15);
  });

  it('gives 5 for delta 6+', () => {
    expect(calculatePoints(6)).toBe(5);
    expect(calculatePoints(10)).toBe(5);
    expect(calculatePoints(20)).toBe(5);
  });

  it('handles negative deltas by taking absolute value', () => {
    expect(calculatePoints(-1)).toBe(90);
    expect(calculatePoints(-3)).toBe(50);
  });
});

describe('scoreGuesses', () => {
  it('calculates correct total score for exact guesses', () => {
    const puzzle = generateDailyPuzzle('2025-01-01');
    const guesses: Record<string, number> = {};
    for (const id of puzzle.momentIds) {
      const moment = getMomentById(id);
      guesses[id] = moment!.year;
    }
    const { perQuestion, totalScore } = scoreGuesses(puzzle.momentIds, guesses);
    expect(totalScore).toBe(500);
    expect(perQuestion).toHaveLength(5);
    for (const q of perQuestion) {
      expect(q.delta).toBe(0);
      expect(q.points).toBe(100);
    }
  });

  it('returns reveal context in results', () => {
    const puzzle = generateDailyPuzzle('2025-01-01');
    const guesses: Record<string, number> = {};
    for (const id of puzzle.momentIds) {
      guesses[id] = 2015;
    }
    const { perQuestion } = scoreGuesses(puzzle.momentIds, guesses);
    for (const q of perQuestion) {
      expect(q.revealContext).toBeTruthy();
    }
  });
});

describe('data integrity', () => {
  it('has at least 40 moments', () => {
    expect(getAllMomentIds().length).toBeGreaterThanOrEqual(40);
  });

  it('all moments have years within valid range', () => {
    for (const id of getAllMomentIds()) {
      const m = getMomentById(id);
      expect(m).toBeTruthy();
      expect(m!.year).toBeGreaterThanOrEqual(MIN_YEAR);
      expect(m!.year).toBeLessThanOrEqual(MAX_YEAR);
    }
  });

  it('all moment IDs are unique', () => {
    const ids = getAllMomentIds();
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('getTodayUTC', () => {
  it('returns a YYYY-MM-DD string', () => {
    const today = getTodayUTC();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
