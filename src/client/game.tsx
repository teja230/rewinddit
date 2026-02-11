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
  LeaderboardEntry,
  SubmitResult,
} from '../shared/api';

// ── Category config with emojis ──

const CATEGORY_CONFIG: Record<string, { color: string; label: string; emoji: string }> = {
  legendary_comment: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Legendary Comment', emoji: '\ud83d\udcac' },
  platform_event: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Platform Event', emoji: '\ud83c\udfaa' },
  meme: { color: 'bg-pink-100 text-pink-800 border-pink-200', label: 'Meme', emoji: '\ud83d\ude02' },
  controversy: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Controversy', emoji: '\ud83d\udd25' },
  subreddit_moment: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Subreddit Moment', emoji: '\ud83c\udf1f' },
  viral_post: { color: 'bg-purple-100 text-purple-800 border-purple-200', label: 'Viral Post', emoji: '\ud83d\ude80' },
};

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

type ConfettiPiece = {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: string;
  size: number;
  shape: 'circle' | 'square';
};

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const CONFETTI_COLORS = ['#d93900', '#ff6b35', '#ffd700', '#16a34a', '#3b82f6', '#a855f7'];
const CONFETTI_PIECES: ConfettiPiece[] = Array.from({ length: 40 }, (_, i) => {
  const r1 = pseudoRandom(i + 1);
  const r2 = pseudoRandom(i + 101);
  const r3 = pseudoRandom(i + 201);
  const r4 = pseudoRandom(i + 301);
  return {
    id: i,
    left: `${r1 * 100}%`,
    delay: `${r2 * 2}s`,
    duration: `${2 + r3 * 2}s`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
    size: 6 + r4 * 8,
    shape: pseudoRandom(i + 401) > 0.5 ? 'circle' : 'square',
  };
});

// ── Confetti ──

function Confetti() {
  return (
    <div className="confetti-container">
      {CONFETTI_PIECES.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// ── Skeleton Loading ──

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header skeleton */}
        <div className="flex flex-col items-center gap-2 mb-6">
          <div className="skeleton w-32 h-7" />
          <div className="skeleton w-20 h-4" />
        </div>

        {/* Progress dots skeleton */}
        <div className="flex justify-center gap-2.5 mb-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="w-3 h-3 rounded-full bg-gray-200" />
          ))}
        </div>

        {/* Card skeleton */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <div className="skeleton w-28 h-6 rounded-full mb-3" />
          <div className="skeleton w-3/4 h-6 mb-3" />
          <div className="space-y-2 mb-6">
            <div className="skeleton w-full h-4" />
            <div className="skeleton w-full h-4" />
            <div className="skeleton w-2/3 h-4" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="skeleton w-24 h-12 rounded-lg" />
            <div className="flex items-center gap-3 w-full">
              <div className="skeleton w-14 h-14 rounded-2xl shrink-0" />
              <div className="skeleton flex-1 h-2 rounded-full" />
              <div className="skeleton w-14 h-14 rounded-2xl shrink-0" />
            </div>
          </div>
        </div>

        {/* Button skeleton */}
        <div className="skeleton w-full h-12 rounded-full mt-6" />
      </div>
    </div>
  );
}

// ── Year Picker with filled track ──

function YearPicker({
  momentId,
  year,
  minYear,
  maxYear,
  isTouched,
  onChange,
}: {
  momentId: string;
  year: number;
  minYear: number;
  maxYear: number;
  isTouched: boolean;
  onChange: (id: string, year: number) => void;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const yearRef = useRef(year);

  useEffect(() => {
    yearRef.current = year;
  }, [year]);

  const stopIncrement = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    intervalRef.current = null;
    timeoutRef.current = null;
  }, []);

  const startIncrement = useCallback(
    (direction: 1 | -1) => {
      const next = Math.max(minYear, Math.min(maxYear, yearRef.current + direction));
      onChange(momentId, next);
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          const n = Math.max(minYear, Math.min(maxYear, yearRef.current + direction));
          onChange(momentId, n);
        }, 100);
      }, 400);
    },
    [momentId, minYear, maxYear, onChange]
  );

  useEffect(() => {
    return () => stopIncrement();
  }, [stopIncrement]);

  // Filled track percentage
  const progress = ((year - minYear) / (maxYear - minYear)) * 100;
  const trackStyle = isTouched
    ? { background: `linear-gradient(to right, #d93900 0%, #d93900 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)` }
    : { background: '#e5e7eb' };

  return (
    <div className="flex flex-col items-center gap-3 w-full mt-4">
      <div
        className={`text-5xl font-black tabular-nums transition-all duration-150 ${isTouched ? 'text-[#d93900]' : 'text-gray-300'}`}
      >
        {isTouched ? year : '????'}
      </div>

      {!isTouched && (
        <p className="text-xs text-gray-400 -mt-1" style={{ animation: 'swipe-hint 2s ease-in-out infinite' }}>
          Slide to guess the year
        </p>
      )}

      <div className="flex items-center gap-3 w-full">
        <button
          className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-700 font-bold text-2xl flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-200 active:bg-gray-300 transition-all select-none press-feedback"
          onPointerDown={() => startIncrement(-1)}
          onPointerUp={stopIncrement}
          onPointerLeave={stopIncrement}
          aria-label="Decrease year"
        >
          -
        </button>

        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={year}
          onChange={(e) => onChange(momentId, parseInt(e.target.value))}
          className="flex-1 h-2 cursor-pointer"
          style={trackStyle}
          step={1}
        />

        <button
          className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-700 font-bold text-2xl flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-200 active:bg-gray-300 transition-all select-none press-feedback"
          onPointerDown={() => startIncrement(1)}
          onPointerUp={stopIncrement}
          onPointerLeave={stopIncrement}
          aria-label="Increase year"
        >
          +
        </button>
      </div>

      <div className="flex justify-between w-full text-xs text-gray-400 px-16">
        <span>{minYear}</span>
        <span>{maxYear}</span>
      </div>
    </div>
  );
}

// ── Quiz Card with numbered badge and category emoji ──

function QuizCard({
  moment,
  index,
  year,
  minYear,
  maxYear,
  isTouched,
  onChange,
}: {
  moment: MomentPrompt;
  index: number;
  year: number;
  minYear: number;
  maxYear: number;
  isTouched: boolean;
  onChange: (id: string, year: number) => void;
}) {
  const config = CATEGORY_CONFIG[moment.category] ?? {
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    label: moment.category,
    emoji: '\u2753',
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 relative"
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      {/* Question number badge */}
      <div className="absolute -top-3 -left-2 w-8 h-8 rounded-full bg-[#d93900] text-white text-sm font-bold flex items-center justify-center shadow-md">
        {index + 1}
      </div>

      <div className="mb-3 ml-4">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${config.color}`}
        >
          {config.emoji} {config.label}
        </span>
      </div>
      <h3 className="font-bold text-gray-900 text-lg mb-2">
        {moment.promptTitle}
      </h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        {moment.promptTextRedacted}
      </p>
      <YearPicker
        momentId={moment.id}
        year={year}
        minYear={minYear}
        maxYear={maxYear}
        isTouched={isTouched}
        onChange={onChange}
      />
    </div>
  );
}

// ── Progress Dots ──

function ProgressDots({
  total,
  current,
  touched,
  momentIds,
  onDotClick,
}: {
  total: number;
  current: number;
  touched: Set<string>;
  momentIds: string[];
  onDotClick: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current;
        const isDone = momentIds[i] ? touched.has(momentIds[i]) : false;
        return (
          <button
            key={i}
            onClick={() => onDotClick(i)}
            className={`rounded-full transition-all duration-200 cursor-pointer ${
              isActive
                ? 'w-8 h-3 bg-[#d93900] rounded-full'
                : isDone
                  ? 'w-3 h-3 bg-[#d93900]/50'
                  : 'w-3 h-3 bg-gray-200'
            }`}
            aria-label={`Go to question ${i + 1}`}
          />
        );
      })}
    </div>
  );
}

// ── Reveal Screen with question titles ──

function RevealScreen({
  result,
  onComplete,
}: {
  result: SubmitResult;
  onComplete: () => void;
}) {
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    if (revealedCount < result.perQuestion.length) {
      const timer = setTimeout(() => {
        setRevealedCount((c) => c + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onComplete, 1200);
      return () => clearTimeout(timer);
    }
  }, [revealedCount, result.perQuestion.length, onComplete]);

  const runningTotal = result.perQuestion
    .slice(0, revealedCount)
    .reduce((s, q) => s + q.points, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Revealing...</h1>
          <p className="text-xs text-gray-400 mt-1">
            {revealedCount}/{result.perQuestion.length} answers
          </p>
        </div>

        <div className="space-y-3">
          {result.perQuestion.map((q, i) => {
            if (i >= revealedCount) return null;
            const emoji = getScoreEmoji(q.delta);
            const pointsColor =
              q.points >= 70
                ? 'text-green-600'
                : q.points >= 30
                  ? 'text-yellow-600'
                  : 'text-red-500';
            const isPerfect = q.delta === 0;

            return (
              <div
                key={q.id}
                className={`bg-white rounded-xl shadow-sm border p-4 ${isPerfect ? 'border-green-300 ring-1 ring-green-200' : 'border-gray-200'}`}
                style={{ animation: 'popIn 0.4s ease-out' }}
              >
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  {q.promptTitle}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" style={isPerfect ? { animation: 'celebrate-bounce 0.6s ease-in-out' } : undefined}>
                      {emoji}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Guessed</span>
                        <span className="font-bold">{q.guess}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-500">Actual</span>
                        <span className="font-bold">{q.actual}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {q.delta === 0
                          ? 'Nailed it! \ud83c\udf89'
                          : `${q.delta} year${q.delta > 1 ? 's' : ''} off`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xl font-black ${pointsColor}`}>
                    +{q.points}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {revealedCount > 0 && (
          <div
            className="text-center mt-5"
            style={{ animation: 'countUp 0.3s ease-out' }}
          >
            <span className="text-4xl font-black text-gray-900">
              {runningTotal}
            </span>
            <span className="text-lg text-gray-400">/500</span>
          </div>
        )}

        {revealedCount < result.perQuestion.length && (
          <button
            className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
            onClick={onComplete}
          >
            Skip to results &rarr;
          </button>
        )}
      </div>
    </div>
  );
}

// ── Score Ring with mount animation ──

function ScoreRing({ score, maxScore }: { score: number; maxScore: number }) {
  const [animated, setAnimated] = useState(false);
  const percent = score / maxScore;
  const circumference = 2 * Math.PI * 54;
  const offset = animated ? circumference * (1 - percent) : circumference;
  const color =
    percent >= 0.7 ? '#16a34a' : percent >= 0.4 ? '#ca8a04' : '#ef4444';
  const reaction = getScoreReaction(score);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-gray-900" style={{ animation: animated ? 'score-count 0.5s ease-out 0.3s both' : undefined }}>
            {score}
          </span>
          <span className="text-xs text-gray-400">/500</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <span className="text-2xl">{reaction.emoji}</span>
        <p className="font-bold text-gray-900 mt-1">{reaction.text}</p>
      </div>
    </div>
  );
}

// ── Result Card with question title ──

function ResultCard({ q }: { q: QuestionResult }) {
  const emoji = getScoreEmoji(q.delta);
  const pointsColor =
    q.points >= 70
      ? 'text-green-600'
      : q.points >= 30
        ? 'text-yellow-600'
        : 'text-red-500';
  const isPerfect = q.delta === 0;

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-4 ${isPerfect ? 'border-green-300' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{q.promptTitle}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>Guessed <span className="font-bold text-gray-700">{q.guess}</span></span>
              <span className="text-gray-300">|</span>
              <span>Actual <span className="font-bold text-gray-700">{q.actual}</span></span>
              <span className="text-gray-300">|</span>
              <span>{q.delta === 0 ? 'Exact!' : `${q.delta}yr off`}</span>
            </div>
          </div>
        </div>
        <span className={`text-lg font-black ${pointsColor}`}>
          +{q.points}
        </span>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">
        {q.revealContext}
      </p>
      {q.revealLink && (
        <button
          onClick={() => navigateTo(q.revealLink!)}
          className="text-sm text-[#d93900] hover:underline mt-2 inline-block font-medium cursor-pointer bg-transparent border-none p-0"
        >
          View original post &rarr;
        </button>
      )}
    </div>
  );
}

// ── Share Card (visual grid) ──

function ShareCard({ result }: { result: SubmitResult }) {
  const DELTA_COLORS: Record<number, string> = {
    0: 'bg-green-500',
    1: 'bg-green-400',
    2: 'bg-yellow-400',
    3: 'bg-orange-400',
    4: 'bg-red-400',
    5: 'bg-red-500',
  };

  return (
    <div className="flex items-center justify-center gap-1.5 my-3">
      {result.perQuestion.map((q) => (
        <div
          key={q.id}
          className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold ${DELTA_COLORS[Math.min(q.delta, 5)] ?? 'bg-gray-800'}`}
          title={`${q.promptTitle}: ${q.delta === 0 ? 'Exact!' : `${q.delta}yr off`}`}
        >
          {q.delta === 0 ? '\u2713' : q.delta}
        </div>
      ))}
    </div>
  );
}

// ── Leaderboard with medals and user highlight ──

function Leaderboard({
  title,
  entries,
  currentUser,
}: {
  title: string;
  entries: LeaderboardEntry[];
  currentUser: string | null;
}) {
  if (entries.length === 0) {
    return (
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-400">No entries yet</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        {title}
      </h3>
      <div className="space-y-1">
        {entries.map((e) => {
          const isMe = currentUser !== null && e.username === currentUser;
          const medal = getRankMedal(e.rank);

          return (
            <div
              key={`${e.rank}-${e.username}`}
              className={`flex items-center justify-between py-1.5 px-3 rounded-lg transition-colors ${
                isMe
                  ? 'bg-[#d93900]/10 ring-1 ring-[#d93900]/20'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-400 w-6">
                  {medal || `${e.rank}.`}
                </span>
                <span className={`text-sm font-medium ${isMe ? 'text-[#d93900] font-bold' : 'text-gray-800'}`}>
                  {e.username}
                  {isMe && (
                    <span className="ml-1.5 text-[10px] bg-[#d93900] text-white px-1.5 py-0.5 rounded-full font-bold uppercase">
                      You
                    </span>
                  )}
                </span>
              </div>
              <span className={`text-sm font-bold ${isMe ? 'text-[#d93900]' : 'text-[#d93900]'}`}>
                {e.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Next puzzle countdown in a card ──

function NextPuzzleCountdown() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tomorrow = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1
        )
      );
      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center mt-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
        Next puzzle in
      </p>
      <p className="text-2xl font-bold text-gray-700 font-mono">{timeLeft}</p>
      <p className="text-xs text-gray-400 mt-1">Come back tomorrow for a new challenge!</p>
    </div>
  );
}

// ── Swipe hook ──

function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.touches[0]!.clientX;
    touchStartY.current = e.touches[0]!.clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const deltaX = e.changedTouches[0]!.clientX - touchStartX.current;
      const deltaY = e.changedTouches[0]!.clientY - touchStartY.current;

      // Only trigger if horizontal swipe is dominant and significant
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) onSwipeLeft();
        else onSwipeRight();
      }
    },
    [onSwipeLeft, onSwipeRight]
  );

  return { onTouchStart, onTouchEnd };
}

// ── Main App ──

export const App = () => {
  const {
    phase,
    puzzle,
    guesses,
    touched,
    result,
    submitting,
    error,
    allGuessed,
    currentCard,
    leaderboards,
    currentUser,
    setGuess,
    submit,
    goNext,
    goPrev,
    goToCard,
    finishReveal,
  } = useGame();

  const swipeHandlers = useSwipe(goNext, goPrev);
  const showConfetti = phase === 'results' && (result?.totalScore ?? 0) >= 400;

  const handleShare = useCallback(() => {
    if (!result) return;
    const grid = result.perQuestion.map((q) => getShareSquare(q.delta)).join('');
    const text = [
      `\u23ea Rewinddit ${result.date}`,
      `${grid} ${result.totalScore}/500`,
      `\ud83d\udd25 Streak: ${result.streak}`,
    ].join('\n');
    void navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!');
    });
  }, [result]);

  // Loading — skeleton
  if (phase === 'loading') {
    if (error) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <span className="text-4xl">{'\u26a0\ufe0f'}</span>
            <p className="text-sm text-red-500">{error}</p>
            <button
              className="text-sm text-[#d93900] font-medium cursor-pointer"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return <SkeletonLoader />;
  }

  // Quiz — one card at a time with swipe
  if (phase === 'quiz' && puzzle) {
    const currentMoment = puzzle.moments[currentCard]!;
    const midYear = Math.round((puzzle.minYear + puzzle.maxYear) / 2);
    const isLastCard = currentCard === 4;
    const isFirstCard = currentCard === 0;
    const currentTouched = touched.has(currentMoment.id);

    return (
      <div className="min-h-screen bg-gray-50">
        <div
          className="max-w-lg mx-auto px-4 py-6"
          onTouchStart={swipeHandlers.onTouchStart}
          onTouchEnd={swipeHandlers.onTouchEnd}
        >
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              {'\u23ea'} Rewinddit
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{puzzle.date}</p>
          </div>

          <ProgressDots
            total={5}
            current={currentCard}
            touched={touched}
            momentIds={puzzle.moments.map((m) => m.id)}
            onDotClick={goToCard}
          />

          <p className="text-center text-sm text-gray-500 mb-4">
            Question {currentCard + 1} of 5
          </p>

          <QuizCard
            key={currentMoment.id}
            moment={currentMoment}
            index={currentCard}
            year={guesses[currentMoment.id] ?? midYear}
            minYear={puzzle.minYear}
            maxYear={puzzle.maxYear}
            isTouched={currentTouched}
            onChange={setGuess}
          />

          <div className="flex gap-3 mt-6">
            {!isFirstCard && (
              <button
                className="flex-1 py-3 rounded-full font-semibold bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors press-feedback"
                onClick={goPrev}
              >
                Previous
              </button>
            )}

            {!isLastCard ? (
              <button
                className={`flex-1 py-3 rounded-full font-semibold cursor-pointer transition-all press-feedback ${
                  currentTouched
                    ? 'bg-[#d93900] text-white hover:bg-[#c03000]'
                    : 'bg-gray-200 text-gray-500'
                }`}
                onClick={goNext}
              >
                Next
              </button>
            ) : (
              <button
                className="flex-1 py-3 rounded-full text-white font-semibold text-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[#d93900] hover:bg-[#c03000] press-feedback"
                disabled={!allGuessed || submitting}
                onClick={submit}
              >
                {submitting ? 'Submitting...' : 'Submit Guesses'}
              </button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center mt-3">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // Revealing — animated one-at-a-time
  if (phase === 'revealing' && result) {
    return <RevealScreen result={result} onComplete={finishReveal} />;
  }

  // Results
  if (phase === 'results' && result) {
    return (
      <div className="min-h-screen bg-gray-50">
        {showConfetti && <Confetti />}

        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              {'\u23ea'} Rewinddit
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">{result.date}</p>
          </div>

          {/* Score ring + stats */}
          <div
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6"
            style={{ animation: 'fadeIn 0.5s ease-out' }}
          >
            <div className="flex flex-col items-center">
              <ScoreRing score={result.totalScore} maxScore={500} />

              {/* Visual share grid */}
              <ShareCard result={result} />

              <div className="flex justify-center gap-6 mt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {result.streak}
                  </p>
                  <p className="text-xs text-gray-500">Streak</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {result.bestStreak}
                  </p>
                  <p className="text-xs text-gray-500">Best</p>
                </div>
                {result.dailyRank && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      #{result.dailyRank}
                    </p>
                    <p className="text-xs text-gray-500">Rank</p>
                  </div>
                )}
              </div>

              <button
                className="mt-5 px-6 py-2.5 rounded-full bg-[#d93900] text-white font-semibold cursor-pointer hover:bg-[#c03000] transition-colors press-feedback shadow-lg shadow-[#d93900]/20"
                onClick={handleShare}
              >
                {'\ud83d\udcf1'} Share Results
              </button>
            </div>
          </div>

          {/* Per-question reveals */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Breakdown
          </h2>
          <div className="space-y-3 mb-6">
            {result.perQuestion.map((q, i) => (
              <div key={q.id} style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}>
                <ResultCard q={q} />
              </div>
            ))}
          </div>

          {/* Leaderboards */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <Leaderboard
              title="Today's Top 10"
              entries={leaderboards?.dailyTop ?? []}
              currentUser={currentUser}
            />
            <Leaderboard
              title="All-Time Top 10"
              entries={leaderboards?.allTimeTop ?? []}
              currentUser={currentUser}
            />
          </div>

          {/* Next puzzle countdown */}
          <NextPuzzleCountdown />
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-4xl">{'\ud83e\udd14'}</span>
        <p className="text-gray-500">Something went wrong. Please reload.</p>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
