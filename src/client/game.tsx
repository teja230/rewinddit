import './index.css';

import { StrictMode, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { showToast } from '@devvit/web/client';
import { useGame } from './hooks/useGame';
import type {
  MomentPrompt,
  QuestionResult,
  LeaderboardEntry,
} from '../shared/api';

// ── Category badge colors ──

const CATEGORY_COLORS: Record<string, string> = {
  legendary_comment: 'bg-amber-100 text-amber-800',
  platform_event: 'bg-blue-100 text-blue-800',
  meme: 'bg-pink-100 text-pink-800',
  controversy: 'bg-red-100 text-red-800',
  subreddit_moment: 'bg-green-100 text-green-800',
  product_feature: 'bg-purple-100 text-purple-800',
};

const CATEGORY_LABELS: Record<string, string> = {
  legendary_comment: 'Legendary Comment',
  platform_event: 'Platform Event',
  meme: 'Meme',
  controversy: 'Controversy',
  subreddit_moment: 'Subreddit Moment',
  product_feature: 'Product Feature',
};

// ── Points scale display ──

const POINTS_SCALE = [
  { delta: 'Exact', points: 100 },
  { delta: '1 yr', points: 90 },
  { delta: '2 yr', points: 70 },
  { delta: '3 yr', points: 50 },
  { delta: '4 yr', points: 30 },
  { delta: '5 yr', points: 15 },
  { delta: '6+ yr', points: 5 },
];

// ── Year Slider Component ──

function YearSlider({
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
  return (
    <div className="flex items-center gap-2 w-full mt-2">
      <button
        className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-300 active:bg-gray-400 transition-colors"
        onClick={() => onChange(momentId, Math.max(minYear, year - 1))}
        aria-label="Decrease year"
      >
        -
      </button>
      <div className="flex-1 flex flex-col items-center">
        <span className={`text-lg font-bold tabular-nums ${isTouched ? 'text-[#d93900]' : 'text-gray-400'}`}>
          {isTouched ? year : 'Pick a year'}
        </span>
        <input
          type="range"
          min={minYear}
          max={maxYear}
          value={year}
          onChange={(e) => onChange(momentId, parseInt(e.target.value))}
          className={`w-full h-2 cursor-pointer ${isTouched ? 'accent-[#d93900]' : 'accent-gray-300'}`}
          step={1}
        />
        <div className="flex justify-between w-full text-xs text-gray-400 mt-0.5">
          <span>{minYear}</span>
          <span>{maxYear}</span>
        </div>
      </div>
      <button
        className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 font-bold text-lg flex items-center justify-center shrink-0 cursor-pointer hover:bg-gray-300 active:bg-gray-400 transition-colors"
        onClick={() => onChange(momentId, Math.min(maxYear, year + 1))}
        aria-label="Increase year"
      >
        +
      </button>
    </div>
  );
}

// ── Quiz Card Component ──

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
  const catColor = CATEGORY_COLORS[moment.category] ?? 'bg-gray-100 text-gray-700';
  const catLabel = CATEGORY_LABELS[moment.category] ?? moment.category;

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${isTouched ? 'border-[#d93900]/30' : 'border-gray-200'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-400">#{index + 1}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}>
          {catLabel}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{moment.promptTitle}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">
        {moment.promptTextRedacted}
      </p>
      <YearSlider
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

// ── Result Card Component ──

function ResultCard({
  q,
  index,
  isOpen,
  onToggle,
}: {
  q: QuestionResult;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const deltaColor =
    q.delta === 0
      ? 'text-green-600'
      : q.delta <= 2
        ? 'text-yellow-600'
        : 'text-red-500';

  const pointsColor =
    q.points >= 70
      ? 'text-green-600'
      : q.points >= 30
        ? 'text-yellow-600'
        : 'text-red-500';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all">
      <button
        className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-400">#{index + 1}</span>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {q.guess}
              </span>
              <span className="text-gray-400">vs</span>
              <span className="font-bold text-gray-900">{q.actual}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-medium ${deltaColor}`}>
            {q.delta === 0 ? 'Exact!' : `${q.delta} yr off`}
          </span>
          <span className={`font-bold ${pointsColor}`}>{q.points} pts</span>
          <span className="text-gray-400 text-sm">{isOpen ? '\u25B2' : '\u25BC'}</span>
        </div>
      </button>
      <div
        className="transition-all duration-300 ease-in-out overflow-hidden"
        style={{ maxHeight: isOpen ? '200px' : '0px', opacity: isOpen ? 1 : 0 }}
      >
        <div className="px-4 pb-4 pt-0 border-t border-gray-100">
          <p className="text-sm text-gray-700 mt-3 leading-relaxed">
            {q.revealContext}
          </p>
          {q.revealLink ? (
            <a
              href={q.revealLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#d93900] hover:underline mt-2 inline-block"
            >
              View original post
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Leaderboard Component ──

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

// ── Scoring Scale Info ──

function ScoringInfo() {
  return (
    <div className="bg-gray-50 rounded-lg p-3 mb-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Scoring
      </h4>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
        {POINTS_SCALE.map((s) => (
          <span key={s.delta}>
            <span className="font-medium">{s.delta}</span>
            <span className="text-gray-400"> = </span>
            <span className="font-bold text-gray-700">{s.points}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──

export const App = () => {
  const { phase, puzzle, guesses, touched, result, submitting, error, allGuessed, setGuess, submit } =
    useGame();

  const [openCards, setOpenCards] = useState<Set<number>>(new Set());

  const toggleCard = useCallback((index: number) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleShare = useCallback(() => {
    if (!result) return;
    const deltas = result.perQuestion.map((q) => q.delta).join(',');
    const text = `Rewinddit ${result.date}: ${result.totalScore}/500 | Streak ${result.streak} | Deltas: ${deltas}`;
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
          {error ? (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          ) : null}
        </div>
      </div>
    );
  }

  // Quiz
  if (phase === 'quiz' && puzzle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Rewinddit</h1>
            <p className="text-sm text-gray-500 mt-1">
              Guess the year for each Reddit moment
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{puzzle.date}</p>
          </div>

          <ScoringInfo />

          <div className="space-y-4 mb-6">
            {puzzle.moments.map((m, i) => {
              const midYear = Math.round((puzzle.minYear + puzzle.maxYear) / 2);
              return (
                <QuizCard
                  key={m.id}
                  moment={m}
                  index={i}
                  year={guesses[m.id] ?? midYear}
                  minYear={puzzle.minYear}
                  maxYear={puzzle.maxYear}
                  isTouched={touched.has(m.id)}
                  onChange={setGuess}
                />
              );
            })}
          </div>

          {error ? (
            <p className="text-sm text-red-500 text-center mb-3">{error}</p>
          ) : null}

          <button
            className="w-full py-3 rounded-full text-white font-semibold text-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[#d93900] hover:bg-[#c03000] active:bg-[#a02800]"
            disabled={!allGuessed || submitting}
            onClick={submit}
          >
            {submitting ? 'Submitting...' : 'Submit Guesses'}
          </button>
        </div>
      </div>
    );
  }

  // Results
  if (phase === 'results' && result) {
    const scorePercent = Math.round((result.totalScore / 500) * 100);
    const scoreColor =
      scorePercent >= 70
        ? 'text-green-600'
        : scorePercent >= 40
          ? 'text-yellow-600'
          : 'text-red-500';

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Rewinddit</h1>
            <p className="text-xs text-gray-400 mt-0.5">{result.date}</p>
          </div>

          {/* Score summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center mb-6">
            <p className={`text-5xl font-bold ${scoreColor}`}>
              {result.totalScore}
              <span className="text-lg text-gray-400">/500</span>
            </p>
            <div className="flex justify-center gap-6 mt-3">
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {result.streak}
                </p>
                <p className="text-xs text-gray-500">Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {result.bestStreak}
                </p>
                <p className="text-xs text-gray-500">Best Streak</p>
              </div>
              {result.dailyRank ? (
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    #{result.dailyRank}
                  </p>
                  <p className="text-xs text-gray-500">Today's Rank</p>
                </div>
              ) : null}
            </div>

            <button
              className="mt-4 px-6 py-2 rounded-full bg-[#d93900] text-white font-medium cursor-pointer hover:bg-[#c03000] active:bg-[#a02800] transition-colors"
              onClick={handleShare}
            >
              Share Results
            </button>
          </div>

          {/* Per-question reveals */}
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Results
          </h2>
          <div className="space-y-3 mb-6">
            {result.perQuestion.map((q, i) => (
              <ResultCard
                key={q.id}
                q={q}
                index={i}
                isOpen={openCards.has(i)}
                onToggle={() => toggleCard(i)}
              />
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

          {/* Scoring reference */}
          <div className="mt-6">
            <ScoringInfo />
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
