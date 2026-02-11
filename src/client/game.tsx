import './index.css';

import {
  StrictMode,
  useState,
  useCallback,
  useEffect,
  useRef,
  type TouchEvent,
} from 'react';
import { createRoot } from 'react-dom/client';
import { showToast, navigateTo } from '@devvit/web/client';
import { useGame } from './hooks/useGame';
import type {
  MomentPrompt,
  QuestionResult,
  QuestionDifficulty,
  Achievement,
  LeaderboardEntry,
  SubmitResult,
  HintResponse,
  UserStats,
} from '../shared/api';

// ── Category config ──

const CATEGORY_CONFIG: Record<string, { color: string; darkColor: string; label: string; emoji: string }> = {
  legendary_comment: { color: 'bg-amber-100 text-amber-800 border-amber-200', darkColor: 'dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700', label: 'Legendary Comment', emoji: '\ud83d\udcac' },
  platform_event: { color: 'bg-blue-100 text-blue-800 border-blue-200', darkColor: 'dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700', label: 'Platform Event', emoji: '\ud83c\udfaa' },
  meme: { color: 'bg-pink-100 text-pink-800 border-pink-200', darkColor: 'dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700', label: 'Meme', emoji: '\ud83d\ude02' },
  controversy: { color: 'bg-red-100 text-red-800 border-red-200', darkColor: 'dark:bg-red-900/30 dark:text-red-300 dark:border-red-700', label: 'Controversy', emoji: '\ud83d\udd25' },
  subreddit_moment: { color: 'bg-green-100 text-green-800 border-green-200', darkColor: 'dark:bg-green-900/30 dark:text-green-300 dark:border-green-700', label: 'Subreddit Moment', emoji: '\ud83c\udf1f' },
  viral_post: { color: 'bg-purple-100 text-purple-800 border-purple-200', darkColor: 'dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700', label: 'Viral Post', emoji: '\ud83d\ude80' },
};

// ── Sound engine ──

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioCtx(): AudioContext | null {
  if (!soundEnabled) return null;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch { return null; }
}

function playTick() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine'; osc.frequency.value = 800; gain.gain.value = 0.04;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
  osc.stop(ctx.currentTime + 0.05);
}

function playRevealSound(good: boolean) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine'; osc.frequency.value = good ? 880 : 330; gain.gain.value = 0.06;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.stop(ctx.currentTime + 0.15);
}

function playCelebration() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine'; osc.frequency.value = freq; gain.gain.value = 0.05;
    osc.start(ctx.currentTime + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
    osc.stop(ctx.currentTime + i * 0.12 + 0.2);
  });
}

// ── Helpers ──

function getScoreEmoji(delta: number): string {
  if (delta === 0) return '\ud83c\udfaf';
  if (delta === 1) return '\ud83d\udd25';
  if (delta <= 2) return '\ud83d\udcaa';
  if (delta <= 3) return '\ud83d\ude0f';
  if (delta <= 5) return '\ud83d\ude2c';
  return '\ud83d\udca9';
}

function getShareSquare(delta: number): string {
  if (delta === 0) return '\ud83d\udfe2';
  if (delta <= 1) return '\ud83d\udfe9';
  if (delta <= 2) return '\ud83d\udfe8';
  if (delta <= 3) return '\ud83d\udfe7';
  if (delta <= 5) return '\ud83d\udfe5';
  return '\u2b1b';
}

function getScoreReaction(score: number): { text: string; emoji: string } {
  if (score >= 480) return { text: 'Reddit Historian!', emoji: '\ud83c\udfc6' };
  if (score >= 400) return { text: 'True Redditor!', emoji: '\ud83e\udde0' };
  if (score >= 300) return { text: 'Nice Memory!', emoji: '\ud83d\udc4d' };
  if (score >= 200) return { text: 'Getting There!', emoji: '\ud83d\ude04' };
  if (score >= 100) return { text: 'Casual Scroller', emoji: '\ud83d\ude05' };
  return { text: 'Lurker Detected', emoji: '\ud83d\udc40' };
}

function getRankMedal(rank: number): string {
  if (rank === 1) return '\ud83e\udd47';
  if (rank === 2) return '\ud83e\udd48';
  if (rank === 3) return '\ud83e\udd49';
  return '';
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const CONFETTI_COLORS = ['#d93900', '#ff6b35', '#ffd700', '#16a34a', '#3b82f6', '#a855f7'];
const CONFETTI_PIECES = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: `${pseudoRandom(i + 1) * 100}%`,
  delay: `${pseudoRandom(i + 101) * 2}s`,
  duration: `${2 + pseudoRandom(i + 201) * 2}s`,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
  size: 6 + pseudoRandom(i + 301) * 8,
  shape: pseudoRandom(i + 401) > 0.5 ? 'circle' as const : 'square' as const,
}));

function getYearShortcuts(year: number, minYear: number, maxYear: number, isTouched: boolean): number[] {
  if (!isTouched) return [2008, 2013, 2018, 2023].filter((y) => y >= minYear && y <= maxYear);
  return [-2, -1, 1, 2].map((o) => year + o).filter((y) => y >= minYear && y <= maxYear);
}

// ── Small components ──

function SoundToggle() {
  const [enabled, setEnabled] = useState(soundEnabled);
  return (
    <button
      className="text-lg cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
      onClick={() => { soundEnabled = !soundEnabled; setEnabled(soundEnabled); if (soundEnabled) playTick(); }}
      aria-label={enabled ? 'Mute sound' : 'Enable sound'}
    >
      {enabled ? '\ud83d\udd0a' : '\ud83d\udd07'}
    </button>
  );
}

function Confetti() {
  return (
    <div className="confetti-container">
      {CONFETTI_PIECES.map((p) => (
        <div key={p.id} className="confetti-piece" style={{ left: p.left, animationDelay: p.delay, animationDuration: p.duration, width: p.size, height: p.size, backgroundColor: p.color, borderRadius: p.shape === 'circle' ? '50%' : '2px' }} />
      ))}
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex flex-col items-center gap-2 mb-6"><div className="skeleton w-32 h-7" /><div className="skeleton w-20 h-4" /></div>
        <div className="flex justify-center gap-3 mb-6">{[0,1,2,3,4].map(i => <div key={i} className="skeleton w-8 h-8 rounded-full" />)}</div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 p-5">
          <div className="skeleton w-28 h-6 rounded-full mb-3" /><div className="skeleton w-3/4 h-6 mb-3" />
          <div className="space-y-2 mb-6"><div className="skeleton w-full h-4" /><div className="skeleton w-full h-4" /><div className="skeleton w-2/3 h-4" /></div>
        </div>
        <div className="skeleton w-full h-12 rounded-full mt-6" />
      </div>
    </div>
  );
}

// ── Year Picker ──

function YearPicker({ momentId, year, minYear, maxYear, isTouched, hint, onHint, onChange }: {
  momentId: string; year: number; minYear: number; maxYear: number; isTouched: boolean;
  hint: HintResponse | undefined; onHint: () => void;
  onChange: (id: string, year: number) => void;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const yearRef = useRef(year);
  useEffect(() => { yearRef.current = year; }, [year]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    intervalRef.current = null; timeoutRef.current = null;
  }, []);

  const start = useCallback((dir: 1 | -1) => {
    const next = Math.max(minYear, Math.min(maxYear, yearRef.current + dir));
    onChange(momentId, next); navigator.vibrate?.(5);
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        onChange(momentId, Math.max(minYear, Math.min(maxYear, yearRef.current + dir)));
      }, 100);
    }, 400);
  }, [momentId, minYear, maxYear, onChange]);

  useEffect(() => stop, [stop]);

  const progress = ((year - minYear) / (maxYear - minYear)) * 100;
  const trackStyle = isTouched ? { background: `linear-gradient(to right, #d93900 0%, #d93900 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)` } : undefined;
  const shortcuts = getYearShortcuts(year, minYear, maxYear, isTouched);

  return (
    <div className="flex flex-col items-center gap-3 w-full mt-4">
      <div className={`text-5xl font-black tabular-nums transition-all duration-150 ${isTouched ? 'text-[#d93900]' : 'text-gray-300 dark:text-gray-600'}`}>
        {isTouched ? year : '????'}
      </div>

      {!isTouched && <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1" style={{ animation: 'swipe-hint 2s ease-in-out infinite' }}>Slide to guess the year</p>}

      {/* Hint display */}
      {hint && (
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
          {'\ud83d\udca1'} {hint.hint} (-{hint.pointsCost}pts max)
        </p>
      )}

      <div className="flex items-center gap-2 sm:gap-3 w-full">
        <button className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xl flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-all select-none press-feedback" onPointerDown={() => start(-1)} onPointerUp={stop} onPointerLeave={stop} aria-label="Decrease year">-</button>
        <input type="range" min={minYear} max={maxYear} value={year} onChange={(e) => { onChange(momentId, parseInt(e.target.value)); navigator.vibrate?.(3); }} className="flex-1 h-2 cursor-pointer" style={trackStyle} step={1} aria-label="Year guess" aria-valuetext={isTouched ? `Year ${year}` : 'Not set'} />
        <button className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xl flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-all select-none press-feedback" onPointerDown={() => start(1)} onPointerUp={stop} onPointerLeave={stop} aria-label="Increase year">+</button>
      </div>

      <div className="flex items-center justify-center gap-2">
        {shortcuts.map((y) => (
          <button key={y} className={`px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border ${isTouched && year === y ? 'bg-[#d93900] text-white border-[#d93900]' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'}`} onClick={() => { onChange(momentId, y); navigator.vibrate?.(10); playTick(); }}>{y}</button>
        ))}
        {!hint && (
          <div className="relative group">
            <button
              className="w-7 h-7 rounded-full text-sm font-semibold cursor-pointer transition-all border bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-800/30 press-feedback flex items-center justify-center"
              onClick={() => {
                playTick();
                onHint();
              }}
              aria-label="Get hint"
            >
              {'\ud83d\udca1'}
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap px-2 py-1 rounded-md text-[10px] font-medium bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Get hint (-25 pts max)
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-between w-full text-xs text-gray-400 dark:text-gray-500 px-14 sm:px-16">
        <span>{minYear}</span><span>{maxYear}</span>
      </div>
    </div>
  );
}

// ── Quiz Card ──

function QuizCard({ moment, index, year, minYear, maxYear, isTouched, slideDirection, hint, onHint, onChange }: {
  moment: MomentPrompt; index: number; year: number; minYear: number; maxYear: number;
  isTouched: boolean; slideDirection: 'left' | 'right'; hint: HintResponse | undefined;
  onHint: () => void; onChange: (id: string, year: number) => void;
}) {
  const config = CATEGORY_CONFIG[moment.category] ?? { color: 'bg-gray-100 text-gray-700 border-gray-200', darkColor: 'dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600', label: moment.category, emoji: '\u2753' };
  const animation = slideDirection === 'left' ? 'slideFromRight 0.3s ease-out' : 'slideFromLeft 0.3s ease-out';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 p-4 sm:p-5 relative" style={{ animation }}>
      <div className="absolute -top-3 -left-2 w-8 h-8 rounded-full bg-[#d93900] text-white text-sm font-bold flex items-center justify-center shadow-md">{index + 1}</div>
      <div className="mb-3 ml-5">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.color} ${config.darkColor}`}>{config.emoji} {config.label}</span>
      </div>
      <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{moment.promptTitle}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{moment.promptTextRedacted}</p>
      <YearPicker momentId={moment.id} year={year} minYear={minYear} maxYear={maxYear} isTouched={isTouched} hint={hint} onHint={onHint} onChange={onChange} />
    </div>
  );
}

// ── Progress Steps ──

function ProgressSteps({ total, current, touched, momentIds, onStepClick }: {
  total: number; current: number; touched: Set<string>; momentIds: string[]; onStepClick: (i: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-5" role="tablist">
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current;
        const isDone = momentIds[i] ? touched.has(momentIds[i]) : false;
        return (
          <button key={i} role="tab" aria-selected={isActive} onClick={() => onStepClick(i)}
            className={`rounded-full font-bold text-xs transition-all duration-200 cursor-pointer flex items-center justify-center ${isActive ? 'w-9 h-9 bg-[#d93900] text-white shadow-md shadow-[#d93900]/20' : isDone ? 'w-8 h-8 bg-[#d93900]/15 text-[#d93900] dark:bg-[#d93900]/25' : 'w-8 h-8 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'}`}
            aria-label={`Question ${i + 1}${isDone ? ' (answered)' : ''}`}
          >{i + 1}</button>
        );
      })}
    </div>
  );
}

// ── Scoring Rules ──

function ScoringRules({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="mb-4">
      <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors flex items-center gap-1 mx-auto" onClick={onToggle} aria-expanded={isOpen}>
        {'\u2139\ufe0f'} How scoring works {isOpen ? '\u25b2' : '\u25bc'}
      </button>
      {isOpen && (
        <div className="mt-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-xs text-gray-600 dark:text-gray-400" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span>Exact year</span><span className="font-bold text-green-600 dark:text-green-400 text-right">100 pts</span>
            <span>1 year off</span><span className="font-bold text-green-500 dark:text-green-400 text-right">90 pts</span>
            <span>2 years off</span><span className="font-bold text-yellow-600 dark:text-yellow-400 text-right">70 pts</span>
            <span>3 years off</span><span className="font-bold text-yellow-500 dark:text-yellow-400 text-right">50 pts</span>
            <span>4 years off</span><span className="font-bold text-orange-500 dark:text-orange-400 text-right">30 pts</span>
            <span>5 years off</span><span className="font-bold text-red-400 text-right">15 pts</span>
            <span>6+ years off</span><span className="font-bold text-gray-400 dark:text-gray-500 text-right">5 pts</span>
          </div>
          <p className="mt-2 text-center text-gray-400 dark:text-gray-500">{'\ud83d\udca1'} Hints cost 25pts max per question</p>
        </div>
      )}
    </div>
  );
}

// ── Review Screen ──

function ReviewScreen({ moments, guesses, onEdit, onConfirm, submitting }: {
  moments: MomentPrompt[]; guesses: Record<string, number>; onEdit: (i: number) => void; onConfirm: () => void; submitting: boolean;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="text-center mb-5">
          <h1 className="text-xl font-black text-gray-900 dark:text-white">{'\ud83d\udcdd'} Review Your Answers</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tap any answer to change it</p>
        </div>
        <div className="space-y-2">
          {moments.map((m, i) => {
            const config = CATEGORY_CONFIG[m.category];
            return (
              <button key={m.id} className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left" onClick={() => onEdit(i)} style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both` }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#d93900] text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.promptTitle}</p>
                    {config && <span className="text-xs text-gray-500 dark:text-gray-400">{config.emoji} {config.label}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-lg font-black text-[#d93900]">{guesses[m.id] !== undefined ? guesses[m.id] : '???'}</span>
                  <span className="text-gray-300 dark:text-gray-600 text-sm">{'\u270e'}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex gap-3 mt-6">
          <button className="flex-1 py-3 rounded-full font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors press-feedback" onClick={() => onEdit(0)}>Go Back</button>
          <button className="flex-1 py-3 rounded-full text-white font-semibold text-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[#d93900] hover:bg-[#c03000] press-feedback" disabled={submitting} onClick={onConfirm}>{submitting ? 'Submitting...' : 'Confirm & Submit'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Reveal Screen ──

function RevealScreen({ result, onComplete }: { result: SubmitResult; onComplete: () => void }) {
  const [revealedCount, setRevealedCount] = useState(0);
  const allRevealed = revealedCount >= result.perQuestion.length;
  const prevCountRef = useRef(0);

  useEffect(() => { if (revealedCount === 0) { const t = setTimeout(() => setRevealedCount(1), 400); return () => clearTimeout(t); } }, [revealedCount]);
  useEffect(() => { if (revealedCount > prevCountRef.current && revealedCount > 0) { const q = result.perQuestion[revealedCount - 1]; if (q) playRevealSound(q.points >= 70); } prevCountRef.current = revealedCount; }, [revealedCount, result.perQuestion]);

  const runningTotal = result.perQuestion.slice(0, revealedCount).reduce((s, q) => s + q.points, 0);
  const diffMap = new Map(result.questionDifficulty.map((d) => [d.id, d]));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Revealing...</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{revealedCount}/{result.perQuestion.length} answers</p>
        </div>
        <div className="space-y-3">
          {result.perQuestion.map((q, i) => {
            if (i >= revealedCount) return null;
            const emoji = getScoreEmoji(q.delta);
            const pointsColor = q.points >= 70 ? 'text-green-600 dark:text-green-400' : q.points >= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500 dark:text-red-400';
            const isPerfect = q.delta === 0;
            const diff = diffMap.get(q.id);

            return (
              <div key={q.id} className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border p-4 ${isPerfect ? 'border-green-300 dark:border-green-700 ring-1 ring-green-200 dark:ring-green-800' : 'border-gray-200 dark:border-gray-800'}`} style={{ animation: 'popIn 0.4s ease-out' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{q.promptTitle}</p>
                  {diff && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      avg {diff.avgDelta}yr off
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" style={isPerfect ? { animation: 'celebrate-bounce 0.6s ease-in-out' } : undefined}>{emoji}</span>
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Guessed</span>
                        <span className="font-bold text-gray-900 dark:text-white">{q.guess}</span>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className="text-gray-500 dark:text-gray-400">Actual</span>
                        <span className="font-bold text-gray-900 dark:text-white">{q.actual}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{q.delta === 0 ? 'Nailed it! \ud83c\udf89' : `${q.delta} year${q.delta > 1 ? 's' : ''} off`}</p>
                    </div>
                  </div>
                  <span className={`text-xl font-black ${pointsColor}`}>+{q.points}</span>
                </div>
              </div>
            );
          })}
        </div>

        {revealedCount > 0 && (
          <div className="text-center mt-5" aria-live="polite" style={{ animation: 'countUp 0.3s ease-out' }}>
            <span className="text-4xl font-black text-gray-900 dark:text-white">{runningTotal}</span>
            <span className="text-lg text-gray-400 dark:text-gray-500">/500</span>
          </div>
        )}

        {!allRevealed && revealedCount > 0 ? (
          <button className="w-full mt-4 py-3 rounded-full font-semibold bg-[#d93900] text-white cursor-pointer hover:bg-[#c03000] transition-colors press-feedback" onClick={() => setRevealedCount((c) => c + 1)}>
            Tap to reveal next ({revealedCount}/{result.perQuestion.length})
          </button>
        ) : allRevealed ? (
          <button className="w-full mt-4 py-3 rounded-full font-semibold bg-[#d93900] text-white cursor-pointer hover:bg-[#c03000] transition-colors press-feedback" onClick={onComplete}>See Full Results</button>
        ) : null}

        {!allRevealed && revealedCount > 0 && (
          <button className="w-full mt-2 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors" onClick={onComplete}>Skip to results &rarr;</button>
        )}
      </div>
    </div>
  );
}

// ── Score Ring ──

function ScoreRing({ score, maxScore }: { score: number; maxScore: number }) {
  const [animated, setAnimated] = useState(false);
  const percent = score / maxScore;
  const circumference = 2 * Math.PI * 54;
  const offset = animated ? circumference * (1 - percent) : circumference;
  const color = percent >= 0.7 ? '#16a34a' : percent >= 0.4 ? '#ca8a04' : '#ef4444';
  const reaction = getScoreReaction(score);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" className="dark:stroke-gray-700" />
          <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-gray-900 dark:text-white" style={{ animation: animated ? 'score-count 0.5s ease-out 0.3s both' : undefined }}>{score}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">/500</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="text-2xl">{reaction.emoji}</span>
        <p className="font-bold text-gray-900 dark:text-white mt-1">{reaction.text}</p>
      </div>
    </div>
  );
}

// ── Result Card with difficulty ──

function ResultCard({ q, difficulty }: { q: QuestionResult; difficulty?: QuestionDifficulty | undefined }) {
  const emoji = getScoreEmoji(q.delta);
  const pointsColor = q.points >= 70 ? 'text-green-600 dark:text-green-400' : q.points >= 30 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-500 dark:text-red-400';
  const isPerfect = q.delta === 0;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-sm border p-4 ${isPerfect ? 'border-green-300 dark:border-green-700' : 'border-gray-200 dark:border-gray-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{q.promptTitle}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span>Guessed <span className="font-bold text-gray-700 dark:text-gray-300">{q.guess}</span></span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>Actual <span className="font-bold text-gray-700 dark:text-gray-300">{q.actual}</span></span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>{q.delta === 0 ? 'Exact!' : `${q.delta}yr off`}</span>
            </div>
          </div>
        </div>
        <span className={`text-lg font-black ${pointsColor}`}>+{q.points}</span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{q.revealContext}</p>
      <div className="flex items-center justify-between mt-2">
        {q.revealLink ? (
          <button onClick={() => navigateTo(q.revealLink!)} className="text-sm text-[#d93900] hover:underline font-medium cursor-pointer bg-transparent border-none p-0">View original post &rarr;</button>
        ) : <span />}
        {difficulty && difficulty.plays > 1 && (
          <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
            avg {difficulty.avgDelta}yr off &middot; {difficulty.plays} plays
          </span>
        )}
      </div>
    </div>
  );
}

// ── Share Card ──

function ShareCard({ result }: { result: SubmitResult }) {
  const DELTA_COLORS: Record<number, string> = { 0: 'bg-green-500', 1: 'bg-green-400', 2: 'bg-yellow-400', 3: 'bg-orange-400', 4: 'bg-red-400', 5: 'bg-red-500' };
  return (
    <div className="my-3">
      <div className="flex items-center justify-center gap-1.5">
        {result.perQuestion.map((q) => (
          <div key={q.id} className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold ${DELTA_COLORS[Math.min(q.delta, 5)] ?? 'bg-gray-800'}`} title={`${q.promptTitle}: ${q.delta === 0 ? 'Exact!' : `${q.delta}yr off`}`}>
            {q.delta === 0 ? '\u2713' : q.delta}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" /> Exact</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" /> Close</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Far</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-gray-800 dark:bg-gray-600 inline-block" /> 6+</span>
      </div>
    </div>
  );
}

// ── Leaderboard ──

function Leaderboard({ title, entries, currentUser }: { title: string; entries: LeaderboardEntry[]; currentUser: string | null }) {
  if (!entries.length) return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{title}</h3>
      <p className="text-sm text-gray-400 dark:text-gray-500">No entries yet</p>
    </div>
  );

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{title}</h3>
      <div className="space-y-1">
        {entries.map((e) => {
          const isMe = currentUser !== null && e.username === currentUser;
          const medal = getRankMedal(e.rank);
          return (
            <div key={`${e.rank}-${e.username}`} className={`flex items-center justify-between py-1.5 px-3 rounded-lg ${isMe ? 'bg-[#d93900]/10 ring-1 ring-[#d93900]/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-400 dark:text-gray-500 w-6">{medal || `${e.rank}.`}</span>
                <span className={`text-sm font-medium ${isMe ? 'text-[#d93900] font-bold' : 'text-gray-800 dark:text-gray-200'}`}>
                  {e.username}{isMe && <span className="ml-1.5 text-[10px] bg-[#d93900] text-white px-1.5 py-0.5 rounded-full font-bold uppercase">You</span>}
                </span>
              </div>
              <span className="text-sm font-bold text-[#d93900]">{e.score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Leaderboard Tabs (daily / monthly / all-time) ──

function LeaderboardTabs({ leaderboards, currentUser }: {
  leaderboards: { dailyTop: LeaderboardEntry[]; allTimeTop: LeaderboardEntry[]; monthlyTop: LeaderboardEntry[] };
  currentUser: string | null;
}) {
  const [tab, setTab] = useState<'daily' | 'monthly' | 'alltime'>('daily');
  const tabs: { key: typeof tab; label: string }[] = [
    { key: 'daily', label: 'Today' },
    { key: 'monthly', label: 'This Month' },
    { key: 'alltime', label: 'All Time' },
  ];

  const entries = tab === 'daily' ? leaderboards.dailyTop : tab === 'monthly' ? leaderboards.monthlyTop : leaderboards.allTimeTop;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex gap-1 mb-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {tabs.map((t) => (
          <button key={t.key} className={`flex-1 text-xs font-semibold py-1.5 rounded-md cursor-pointer transition-colors ${tab === t.key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <Leaderboard title={tabs.find((t) => t.key === tab)!.label + ' Top 10'} entries={entries} currentUser={currentUser} />
    </div>
  );
}

// ── Achievements ──

function AchievementBadges({ achievements, isNew }: { achievements: Achievement[]; isNew: boolean }) {
  if (!achievements.length) return null;
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 mb-4 ${isNew ? '' : ''}`} style={isNew ? { animation: 'popIn 0.5s ease-out' } : undefined}>
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        {isNew ? '\ud83c\udf89 New Achievements!' : 'Achievements'}
      </p>
      <div className="flex flex-wrap gap-2">
        {achievements.map((a) => (
          <div key={a.id} className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-full px-3 py-1.5" title={a.description}>
            <span className="text-sm">{a.emoji}</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{a.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Streak Milestone ──

function StreakMilestone({ days }: { days: number }) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-4 text-center" style={{ animation: 'popIn 0.5s ease-out' }}>
      <span className="text-3xl">{days >= 30 ? '\ud83c\udfc6' : days >= 14 ? '\ud83d\udcaa' : '\ud83d\udd25'}</span>
      <p className="font-bold text-gray-900 dark:text-white mt-1">{days}-Day Streak!</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">You've played {days} days in a row</p>
    </div>
  );
}

// ── Personal Stats ──

function PersonalStatsCard({ stats }: { stats: UserStats }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-4">
      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Your Stats</h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.gamesPlayed}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Games</p>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.averageScore}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Avg Score</p>
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.bestScore}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">Best</p>
        </div>
      </div>
      {stats.achievements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <AchievementBadges achievements={stats.achievements} isNew={false} />
        </div>
      )}
    </div>
  );
}

// ── Best Category ──

function BestCategoryInsight({ puzzle, result }: { puzzle: { moments: MomentPrompt[] }; result: SubmitResult }) {
  const catScores: Record<string, { total: number; count: number }> = {};
  result.perQuestion.forEach((q) => { const m = puzzle.moments.find((x) => x.id === q.id); if (!m) return; const c = m.category; if (!catScores[c]) catScores[c] = { total: 0, count: 0 }; catScores[c]!.total += q.points; catScores[c]!.count += 1; });
  const entries = Object.entries(catScores);
  if (!entries.length) return null;
  const [bestCat, bestStats] = entries.sort((a, b) => b[1].total / b[1].count - a[1].total / a[1].count)[0]!;
  const config = CATEGORY_CONFIG[bestCat];
  if (!config) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 mb-4 flex items-center gap-3" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <span className="text-2xl">{config.emoji}</span>
      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">Best at</p>
        <p className="text-sm font-bold text-gray-900 dark:text-white">{config.label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Avg: {Math.round(bestStats.total / bestStats.count)} pts/question</p>
      </div>
    </div>
  );
}

// ── Countdown ──

function NextPuzzleCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => { const n = new Date(); const t = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1)); const d = t.getTime() - n.getTime(); setTimeLeft(`${Math.floor(d/3600000).toString().padStart(2,'0')}:${Math.floor((d%3600000)/60000).toString().padStart(2,'0')}:${Math.floor((d%60000)/1000).toString().padStart(2,'0')}`); };
    update(); const id = setInterval(update, 1000); return () => clearInterval(id);
  }, []);
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 text-center mt-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Next puzzle in</p>
      <p className="text-2xl font-bold text-gray-700 dark:text-gray-200 font-mono">{timeLeft}</p>
    </div>
  );
}

// ── Swipe ──

function useSwipe(onLeft: () => void, onRight: () => void) {
  const sx = useRef(0); const sy = useRef(0);
  const onTouchStart = useCallback((e: TouchEvent) => { sx.current = e.touches[0]!.clientX; sy.current = e.touches[0]!.clientY; }, []);
  const onTouchEnd = useCallback((e: TouchEvent) => {
    const dx = e.changedTouches[0]!.clientX - sx.current;
    const dy = e.changedTouches[0]!.clientY - sy.current;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) onLeft();
      else onRight();
    }
  }, [onLeft, onRight]);
  return { onTouchStart, onTouchEnd };
}

// ── Main App ──

export const App = () => {
  const {
    phase, puzzle, guesses, touched, result, submitting, error, allGuessed,
    currentCard, leaderboards, playerCount, currentUser, postUrl, hints, userStats,
    attemptsUsed, maxAttempts, allAttempts, canRetry,
    setGuess, submit, goNext, goPrev, goToCard, finishReveal, retry,
    requestHint, postToComments,
  } = useGame();

  const showConfetti = phase === 'results' && (result?.totalScore ?? 0) >= 400;
  const [showReview, setShowReview] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const [commentPosted, setCommentPosted] = useState(false);

  const handleNext = useCallback(() => { setSlideDirection('left'); goNext(); }, [goNext]);
  const handlePrev = useCallback(() => { setSlideDirection('right'); goPrev(); }, [goPrev]);
  const handleGoToCard = useCallback((i: number) => { setSlideDirection(i > currentCard ? 'left' : 'right'); goToCard(i); }, [currentCard, goToCard]);
  const swipeHandlers = useSwipe(handleNext, handlePrev);

  // Share with post URL
  const handleShare = useCallback(() => {
    if (!result) return;
    const grid = result.perQuestion.map((q) => getShareSquare(q.delta)).join('');
    const lines = [
      `\u23ea Rewinddit ${result.date}`,
      `${grid} ${result.totalScore}/500`,
      `\ud83d\udd25 Streak: ${result.streak}`,
    ];
    if (postUrl) lines.push(`\nCan you beat my score? ${postUrl}`);
    void navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Copied to clipboard!'));
  }, [result, postUrl]);

  // Post score to comments
  const handlePostToComments = useCallback(async () => {
    if (!result || commentPosted) return;
    const grid = result.perQuestion.map((q) => getShareSquare(q.delta)).join('');
    const text = `**\u23ea Rewinddit ${result.date}**\n\n${grid} **${result.totalScore}/500**\n\n\ud83d\udd25 Streak: ${result.streak} | \ud83c\udfc6 Best Streak: ${result.bestStreak}`;
    const status = await postToComments(text, result.date);
    if (status === 'posted' || status === 'already') {
      setCommentPosted(true);
      showToast(status === 'already' ? 'Already posted for today' : 'Score posted to comments!');
    } else {
      showToast('Failed to post comment');
    }
  }, [result, commentPosted, postToComments]);

  const firstUnanswered = puzzle ? puzzle.moments.findIndex((m) => !touched.has(m.id)) : -1;
  const jumpToUnanswered = useCallback(() => { if (firstUnanswered >= 0) { setSlideDirection(firstUnanswered > currentCard ? 'left' : 'right'); goToCard(firstUnanswered); } }, [firstUnanswered, currentCard, goToCard]);
  const answeredCount = puzzle ? puzzle.moments.filter((m) => touched.has(m.id)).length : 0;

  const celebrationPlayed = useRef(false);
  useEffect(() => { if (phase === 'results' && (result?.totalScore ?? 0) >= 400 && !celebrationPlayed.current) { celebrationPlayed.current = true; setTimeout(playCelebration, 300); } }, [phase, result?.totalScore]);

  const diffMap = new Map(result?.questionDifficulty?.map((d) => [d.id, d]) ?? []);

  // ── Loading ──
  if (phase === 'loading') {
    if (error) return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <span className="text-4xl">{'\u26a0\ufe0f'}</span>
          <p className="text-sm text-red-500" role="alert">{error}</p>
          <button className="text-sm text-[#d93900] font-medium cursor-pointer" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    );
    return <SkeletonLoader />;
  }

  // ── Review ──
  if (showReview && phase === 'quiz' && puzzle) {
    return <ReviewScreen moments={puzzle.moments} guesses={guesses} onEdit={(i) => { setShowReview(false); setSlideDirection(i > currentCard ? 'left' : 'right'); goToCard(i); }} onConfirm={() => { setShowReview(false); void submit(); }} submitting={submitting} />;
  }

  // ── Quiz ──
  if (phase === 'quiz' && puzzle) {
    const cm = puzzle.moments[currentCard]!;
    const midYear = Math.round((puzzle.minYear + puzzle.maxYear) / 2);
    const isLast = currentCard === 4;
    const isFirst = currentCard === 0;
    const ct = touched.has(cm.id);

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-6" onTouchStart={swipeHandlers.onTouchStart} onTouchEnd={swipeHandlers.onTouchEnd}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="w-8" />
            <div className="text-center">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">{'\u23ea'} Rewinddit</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {puzzle.date}
                {playerCount > 0 && <span className="ml-2">&middot; {playerCount} played</span>}
              </p>
            </div>
            <SoundToggle />
          </div>

          <ProgressSteps total={5} current={currentCard} touched={touched} momentIds={puzzle.moments.map((m) => m.id)} onStepClick={handleGoToCard} />
          <ScoringRules isOpen={showRules} onToggle={() => setShowRules((v) => !v)} />

          <QuizCard key={cm.id} moment={cm} index={currentCard} year={guesses[cm.id] ?? midYear} minYear={puzzle.minYear} maxYear={puzzle.maxYear} isTouched={ct} slideDirection={slideDirection} hint={hints[cm.id]} onHint={() => requestHint(cm.id)} onChange={setGuess} />

          {isLast && !allGuessed && (
            <div className="mt-3 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2" role="alert">
              <p className="text-xs text-amber-700 dark:text-amber-300">{'\u26a0\ufe0f'} {5 - answeredCount} unanswered</p>
              <button className="text-xs font-semibold text-[#d93900] cursor-pointer hover:underline" onClick={jumpToUnanswered}>Answer Q{firstUnanswered + 1} &rarr;</button>
            </div>
          )}

          <div className="flex gap-3 mt-5 sm:mt-6">
            {!isFirst && <button className="flex-1 py-3 rounded-full font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors press-feedback" onClick={handlePrev}>Previous</button>}
            {!isLast ? (
              <button className={`flex-1 py-3 rounded-full font-semibold cursor-pointer transition-all press-feedback ${ct ? 'bg-[#d93900] text-white hover:bg-[#c03000]' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`} onClick={handleNext}>Next</button>
            ) : (
              <button className="flex-1 py-3 rounded-full text-white font-semibold text-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[#d93900] hover:bg-[#c03000] press-feedback" disabled={!allGuessed || submitting} onClick={() => setShowReview(true)}>{submitting ? 'Submitting...' : 'Review & Submit'}</button>
            )}
          </div>
          {error && <p className="text-sm text-red-500 text-center mt-3" role="alert">{error}</p>}
        </div>
      </div>
    );
  }

  // ── Revealing ──
  if (phase === 'revealing' && result) return <RevealScreen result={result} onComplete={finishReveal} />;

  // ── Results ──
  if (phase === 'results' && result) {
    const newAchievements = result.newAchievements ?? [];
    const safeLeaderboards = leaderboards ?? {
      dailyTop: result.leaderboards?.dailyTop ?? [],
      allTimeTop: result.leaderboards?.allTimeTop ?? [],
      monthlyTop: result.leaderboards?.monthlyTop ?? [],
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {showConfetti && <Confetti />}
        <div className="max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="w-8" />
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">{'\u23ea'} Rewinddit</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {result.date}
                {playerCount > 0 && <span className="ml-2">&middot; {playerCount} played</span>}
              </p>
            </div>
            <SoundToggle />
          </div>

          {/* Streak milestone */}
          {result.streakMilestone && <StreakMilestone days={result.streakMilestone} />}

          {/* New achievements */}
          {newAchievements.length > 0 && <AchievementBadges achievements={newAchievements} isNew={true} />}

          {/* Score */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 p-4 sm:p-6 mb-6" style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div className="flex flex-col items-center">
              <ScoreRing score={result.totalScore} maxScore={500} />

              {/* Percentile */}
              {result.percentile > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Better than {result.percentile}% of players
                </p>
              )}

              <ShareCard result={result} />

              <div className="flex justify-center gap-6 mt-2">
                <div className="text-center"><p className="text-2xl font-bold text-gray-900 dark:text-white">{result.streak}</p><p className="text-xs text-gray-500 dark:text-gray-400">Streak</p></div>
                <div className="text-center"><p className="text-2xl font-bold text-gray-900 dark:text-white">{result.bestStreak}</p><p className="text-xs text-gray-500 dark:text-gray-400">Best</p></div>
                {result.dailyRank && <div className="text-center"><p className="text-2xl font-bold text-gray-900 dark:text-white">#{result.dailyRank}</p><p className="text-xs text-gray-500 dark:text-gray-400">Rank</p></div>}
              </div>

              {/* Attempt indicator */}
              {result.attemptNumber > 1 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Attempt {result.attemptNumber}/{maxAttempts}
                  {!result.countedForLeaderboard && ' (practice — first attempt counts for leaderboard)'}
                </p>
              )}

              {/* Action buttons — single row */}
              <div className="flex gap-2 mt-4 sm:mt-5 w-full">
                <button className="flex-1 py-2.5 rounded-full bg-[#d93900] text-white text-sm font-semibold cursor-pointer hover:bg-[#c03000] transition-colors press-feedback shadow-lg shadow-[#d93900]/20" onClick={handleShare}>
                  {'\ud83d\udcf1'} Share
                </button>
                <button
                  className={`flex-1 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-colors press-feedback border ${commentPosted ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  onClick={handlePostToComments}
                  disabled={commentPosted}
                >
                  {commentPosted ? '\u2713 Posted' : '\ud83d\udcac Comment'}
                </button>
                {canRetry && (
                  <button className="flex-1 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-colors press-feedback border-2 border-[#d93900] text-[#d93900] hover:bg-[#d93900]/5" onClick={retry}>
                    {'\ud83d\udd04'} Retry ({maxAttempts - attemptsUsed})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Best at category */}
          {puzzle && <BestCategoryInsight puzzle={puzzle} result={result} />}

          {/* Personal stats */}
          {userStats && <PersonalStatsCard stats={userStats} />}

          {/* All attempts comparison */}
          {allAttempts.length > 1 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Your Attempts</h3>
              <div className="space-y-2">
                {allAttempts.map((a, i) => (
                  <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg ${a.attemptNumber === result.attemptNumber ? 'bg-[#d93900]/10 ring-1 ring-[#d93900]/20' : 'bg-gray-50 dark:bg-gray-800'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-500 dark:text-gray-400">#{a.attemptNumber}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {a.perQuestion.map((q) => getShareSquare(q.delta)).join('')}
                      </span>
                      {a.countedForLeaderboard && <span className="text-[10px] bg-[#d93900] text-white px-1.5 py-0.5 rounded-full font-bold uppercase">Ranked</span>}
                    </div>
                    <span className="text-sm font-bold text-[#d93900]">{a.totalScore}/500</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown */}
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Breakdown</h2>
          <div className="space-y-3 mb-6">
            {result.perQuestion.map((q, i) => (
              <div key={q.id} style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}>
                <ResultCard q={q} difficulty={diffMap.get(q.id)} />
              </div>
            ))}
          </div>

          {/* Leaderboards with tabs */}
          <LeaderboardTabs leaderboards={safeLeaderboards} currentUser={currentUser} />

          <NextPuzzleCountdown />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-4xl">{'\ud83e\udd14'}</span>
        <p className="text-gray-500 dark:text-gray-400">Something went wrong. Please reload.</p>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
