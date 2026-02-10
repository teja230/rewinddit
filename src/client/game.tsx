import './index.css';

import { StrictMode, useState, useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { showToast } from '@devvit/web/client';
import { useGame } from './hooks/useGame';
import type {
  MomentPrompt,
  QuestionResult,
  LeaderboardEntry,
  SubmitResult,
} from '../shared/api';

// ── Category badge colors ──

const CATEGORY_COLORS: Record<string, string> = {
  legendary_comment: 'bg-amber-100 text-amber-800',
  platform_event: 'bg-blue-100 text-blue-800',
  meme: 'bg-pink-100 text-pink-800',
  controversy: 'bg-red-100 text-red-800',
  subreddit_moment: 'bg-green-100 text-green-800',
  viral_post: 'bg-purple-100 text-purple-800',
};

const CATEGORY_LABELS: Record<string, string> = {
  legendary_comment: 'Legendary Comment',
  platform_event: 'Platform Event',
  meme: 'Meme',
  controversy: 'Controversy',
  subreddit_moment: 'Subreddit Moment',
  viral_post: 'Viral Post',
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

// ── Year Picker ──

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

  return (
    <div className="flex flex-col items-center gap-3 w-full mt-4">
      <div
        className={`text-5xl font-black tabular-nums transition-all duration-150 ${isTouched ? 'text-[#d93900]' : 'text-gray-300'}`}
      >
        {isTouched ? year : '????'}
      </div>

      <div className="flex items-center gap-3 w-full">
        <button
          className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-700 font-bold text-2xl flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-200 active:bg-gray-300 active:scale-95 transition-all select-none"
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
          step={1}
        />

        <button
          className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-700 font-bold text-2xl flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-200 active:bg-gray-300 active:scale-95 transition-all select-none"
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

// ── Quiz Card ──

function QuizCard({
  moment,
  year,
  minYear,
  maxYear,
  isTouched,
  onChange,
}: {
  moment: MomentPrompt;
  year: number;
  minYear: number;
  maxYear: number;
  isTouched: boolean;
  onChange: (id: string, year: number) => void;
}) {
  const catColor =
    CATEGORY_COLORS[moment.category] ?? 'bg-gray-100 text-gray-700';
  const catLabel = CATEGORY_LABELS[moment.category] ?? moment.category;

  return (
    <div
      className="bg-white rounded-2xl shadow-md border border-gray-100 p-5"
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      <div className="mb-3">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor}`}
        >
          {catLabel}
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
    <div className="flex items-center justify-center gap-2.5 mb-4">
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current;
        const isDone = momentIds[i] ? touched.has(momentIds[i]) : false;
        return (
          <button
            key={i}
            onClick={() => onDotClick(i)}
            className={`rounded-full transition-all duration-200 cursor-pointer ${
              isActive
                ? 'w-3.5 h-3.5 bg-[#d93900] ring-2 ring-[#d93900]/30'
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

// ── Reveal Screen ──

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

            return (
              <div
                key={q.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                style={{ animation: 'popIn 0.4s ease-out' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
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
                          ? 'Nailed it!'
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

// ── Score Ring ──

function ScoreRing({ score, maxScore }: { score: number; maxScore: number }) {
  const percent = score / maxScore;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - percent);
  const color =
    percent >= 0.7 ? '#16a34a' : percent >= 0.4 ? '#ca8a04' : '#ef4444';
  const reaction = getScoreReaction(score);

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
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-gray-900">{score}</span>
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

// ── Result Card ──

function ResultCard({ q }: { q: QuestionResult }) {
  const emoji = getScoreEmoji(q.delta);
  const pointsColor =
    q.points >= 70
      ? 'text-green-600'
      : q.points >= 30
        ? 'text-yellow-600'
        : 'text-red-500';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold">{q.guess}</span>
              <span className="text-gray-400">vs</span>
              <span className="font-bold">{q.actual}</span>
            </div>
            <p className="text-xs text-gray-400">
              {q.delta === 0
                ? 'Exact match!'
                : `${q.delta} year${q.delta > 1 ? 's' : ''} off`}
            </p>
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
        <a
          href={q.revealLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#d93900] hover:underline mt-2 inline-block font-medium"
        >
          View original post &rarr;
        </a>
      )}
    </div>
  );
}

// ── Leaderboard ──

function Leaderboard({
  title,
  entries,
}: {
  title: string;
  entries: LeaderboardEntry[];
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
        {entries.map((e) => (
          <div
            key={`${e.rank}-${e.username}`}
            className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-400 w-6">
                {e.rank}.
              </span>
              <span className="text-sm font-medium text-gray-800">
                {e.username}
              </span>
            </div>
            <span className="text-sm font-bold text-[#d93900]">{e.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
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
    setGuess,
    submit,
    goNext,
    goPrev,
    goToCard,
    finishReveal,
  } = useGame();

  const handleShare = useCallback(() => {
    if (!result) return;
    const grid = result.perQuestion.map((q) => getShareSquare(q.delta)).join('');
    const text = [
      `Rewinddit ${result.date}`,
      `${grid} ${result.totalScore}/500`,
      `Streak: ${result.streak}`,
    ].join('\n');
    void navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!');
    });
  }, [result]);

  // Loading
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-[#d93900] rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading today's puzzle...</p>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  // Quiz — one card at a time
  if (phase === 'quiz' && puzzle) {
    const currentMoment = puzzle.moments[currentCard]!;
    const midYear = Math.round((puzzle.minYear + puzzle.maxYear) / 2);
    const isLastCard = currentCard === 4;
    const isFirstCard = currentCard === 0;
    const currentTouched = touched.has(currentMoment.id);

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-gray-900">Rewinddit</h1>
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
            year={guesses[currentMoment.id] ?? midYear}
            minYear={puzzle.minYear}
            maxYear={puzzle.maxYear}
            isTouched={currentTouched}
            onChange={setGuess}
          />

          <div className="flex gap-3 mt-6">
            {!isFirstCard && (
              <button
                className="flex-1 py-3 rounded-full font-semibold bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200 active:bg-gray-300 transition-colors"
                onClick={goPrev}
              >
                Previous
              </button>
            )}

            {!isLastCard ? (
              <button
                className={`flex-1 py-3 rounded-full font-semibold cursor-pointer transition-all ${
                  currentTouched
                    ? 'bg-[#d93900] text-white hover:bg-[#c03000] active:bg-[#a02800]'
                    : 'bg-gray-200 text-gray-500'
                }`}
                onClick={goNext}
              >
                Next
              </button>
            ) : (
              <button
                className="flex-1 py-3 rounded-full text-white font-semibold text-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[#d93900] hover:bg-[#c03000] active:bg-[#a02800]"
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
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Rewinddit</h1>
            <p className="text-xs text-gray-400 mt-0.5">{result.date}</p>
          </div>

          {/* Score ring + reaction */}
          <div
            className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6"
            style={{ animation: 'fadeIn 0.5s ease-out' }}
          >
            <div className="flex flex-col items-center">
              <ScoreRing score={result.totalScore} maxScore={500} />

              <div className="flex justify-center gap-6 mt-4">
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
                className="mt-5 px-6 py-2.5 rounded-full bg-[#d93900] text-white font-semibold cursor-pointer hover:bg-[#c03000] active:bg-[#a02800] transition-colors"
                onClick={handleShare}
              >
                Share Results
              </button>
            </div>
          </div>

          {/* Per-question reveals — auto-expanded */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Results
          </h2>
          <div className="space-y-3 mb-6">
            {result.perQuestion.map((q) => (
              <ResultCard key={q.id} q={q} />
            ))}
          </div>

          {/* Leaderboards */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <Leaderboard
              title="Today's Top 10"
              entries={result.leaderboards.dailyTop}
            />
            <Leaderboard
              title="All-Time Top 10"
              entries={result.leaderboards.allTimeTop}
            />
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Something went wrong. Please reload.</p>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
