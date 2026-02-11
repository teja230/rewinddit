import { getAllMomentIds, getMomentById } from '../data/moments';
import type { MomentPrompt, QuestionResult } from '../../shared/api';
import { KEY_PREFIX } from './redisKeys';

// ── Deterministic PRNG (mulberry32) ──

export function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i);
    h |= 0; // keep 32-bit
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle with PRNG
export function shuffleArray<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

// ── Puzzle selection ──

export type DailyPuzzle = {
  date: string;
  momentIds: string[];
  seed: string;
  generatedAt: string;
};

export function generateDailyPuzzle(date: string): DailyPuzzle {
  const seed = `${KEY_PREFIX}:${date}`;
  const seedNum = hashString(seed);
  const rng = mulberry32(seedNum);

  const allIds = getAllMomentIds();
  const shuffled = shuffleArray(allIds, rng);
  const momentIds = shuffled.slice(0, 5);

  return {
    date,
    momentIds,
    seed,
    generatedAt: new Date().toISOString(),
  };
}

// ── Build prompts for client ──

export function getMomentPrompts(momentIds: string[]): MomentPrompt[] {
  return momentIds.map((id) => {
    const m = getMomentById(id);
    if (!m) throw new Error(`Moment not found: ${id}`);
    return {
      id: m.id,
      category: m.category,
      promptTitle: m.promptTitle,
      promptTextRedacted: m.promptTextRedacted,
    };
  });
}

// ── Scoring ──
// Points scale (max 100 per question, 500 total):
//   delta 0  → 100
//   delta 1  → 90
//   delta 2  → 70
//   delta 3  → 50
//   delta 4  → 30
//   delta 5  → 15
//   delta 6+ → 5

const POINTS_TABLE: Record<number, number> = {
  0: 100,
  1: 90,
  2: 70,
  3: 50,
  4: 30,
  5: 15,
};

export function calculatePoints(delta: number): number {
  if (delta < 0) delta = Math.abs(delta);
  return POINTS_TABLE[delta] ?? 5;
}

export function scoreGuesses(
  momentIds: string[],
  guessesById: Record<string, number>
): { perQuestion: QuestionResult[]; totalScore: number } {
  const perQuestion: QuestionResult[] = momentIds.map((id) => {
    const moment = getMomentById(id);
    if (!moment) throw new Error(`Moment not found: ${id}`);
    const guess = guessesById[id];
    if (guess === undefined) throw new Error(`Missing guess for ${id}`);
    const delta = Math.abs(guess - moment.year);
    const points = calculatePoints(delta);
    return {
      id,
      promptTitle: moment.promptTitle,
      guess,
      actual: moment.year,
      delta,
      points,
      revealContext: moment.revealContext,
      revealLink: moment.revealLink,
    };
  });

  const totalScore = perQuestion.reduce((sum, q) => sum + q.points, 0);
  return { perQuestion, totalScore };
}

// ── Date helpers ──

export function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getYesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const MIN_YEAR = 2005;
export const MAX_YEAR = new Date().getUTCFullYear();
