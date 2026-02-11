import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { PuzzleTodayResponse, SubmitResult, QuestionResult } from '../shared/api';

type SplashData = {
  username: string;
  hasPlayed: boolean;
  playerCount: number;
  attemptsUsed: number;
  maxAttempts: number;
  lastResult: SubmitResult | null;
};

// ── Helpers (same as game.tsx) ──

function getScoreReaction(score: number): { text: string; emoji: string } {
  if (score >= 480) return { text: 'Reddit Historian!', emoji: '\ud83c\udfc6' };
  if (score >= 400) return { text: 'True Redditor!', emoji: '\ud83e\udde0' };
  if (score >= 300) return { text: 'Nice Memory!', emoji: '\ud83d\udc4d' };
  if (score >= 200) return { text: 'Getting There!', emoji: '\ud83d\ude04' };
  if (score >= 100) return { text: 'Casual Scroller', emoji: '\ud83d\ude05' };
  return { text: 'Lurker Detected', emoji: '\ud83d\udc40' };
}

const DELTA_COLORS: Record<number, string> = { 0: 'bg-green-500', 1: 'bg-green-400', 2: 'bg-yellow-400', 3: 'bg-orange-400', 4: 'bg-red-400', 5: 'bg-red-500' };

// ── Score Ring (same as game.tsx) ──

function ScoreRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  const percent = score / 500;
  const circumference = 2 * Math.PI * 54;
  const offset = animated ? circumference * (1 - percent) : circumference;
  const color = percent >= 0.7 ? '#16a34a' : percent >= 0.4 ? '#ca8a04' : '#ef4444';
  const reaction = getScoreReaction(score);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" className="dark:stroke-gray-700" />
          <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-gray-900 dark:text-white">{score}</span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">/500</span>
        </div>
      </div>
      <div className="mt-1.5 text-center">
        <span className="text-xl">{reaction.emoji}</span>
        <p className="font-bold text-sm text-gray-900 dark:text-white">{reaction.text}</p>
      </div>
    </div>
  );
}

// ── Share Card (same colored squares as game.tsx) ──

function ShareCard({ questions }: { questions: QuestionResult[] }) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-center gap-1.5">
        {questions.map((q) => (
          <div key={q.id} className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${DELTA_COLORS[Math.min(q.delta, 5)] ?? 'bg-gray-800'}`}>
            {q.delta === 0 ? '\u2713' : q.delta}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-green-500 inline-block" /> Exact</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-yellow-400 inline-block" /> Close</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Far</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-gray-800 dark:bg-gray-600 inline-block" /> 6+</span>
      </div>
    </div>
  );
}

// ── How It Works ──

const HowItWorks = () => (
  <div className="flex items-center justify-center gap-6 mt-2">
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xl">{'\ud83d\udcdc'}</div>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Read</span>
    </div>
    <div className="text-gray-300 dark:text-gray-600 text-lg">{'\u2192'}</div>
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">{'\ud83c\udfaf'}</div>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Guess</span>
    </div>
    <div className="text-gray-300 dark:text-gray-600 text-lg">{'\u2192'}</div>
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-11 h-11 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xl">{'\ud83c\udfc6'}</div>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Score</span>
    </div>
  </div>
);

// ── Main Splash ──

export const Splash = () => {
  const [data, setData] = useState<SplashData | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch('/api/puzzle/today');
        if (!res.ok) {
          if (active) setData({ username: 'there', hasPlayed: false, playerCount: 0, attemptsUsed: 0, maxAttempts: 3, lastResult: null });
          return;
        }
        const json = (await res.json()) as PuzzleTodayResponse;
        const username = json.currentUser && json.currentUser !== 'anonymous' ? json.currentUser : 'there';
        if (active) {
          setData({
            username,
            hasPlayed: json.hasPlayed,
            playerCount: json.playerCount ?? 0,
            attemptsUsed: json.attemptsUsed ?? (json.hasPlayed ? 1 : 0),
            maxAttempts: json.maxAttempts ?? 3,
            lastResult: json.previousResult ?? null,
          });
        }
      } catch {
        if (active) setData({ username: 'there', hasPlayed: false, playerCount: 0, attemptsUsed: 0, maxAttempts: 3, lastResult: null });
      }
    };
    void load();
    return () => { active = false; };
  }, []);

  const handlePlay = (e: React.MouseEvent) => {
    sessionStorage.removeItem('rewinddit-retry');
    requestExpandedMode(e.nativeEvent, 'game');
  };

  const handleRetry = (e: React.MouseEvent) => {
    sessionStorage.setItem('rewinddit-retry', '1');
    requestExpandedMode(e.nativeEvent, 'game');
  };

  // Loading
  if (!data) {
    return (
      <div className="flex relative flex-col justify-center items-center min-h-screen bg-gradient-to-b from-gray-50 to-orange-50/30 dark:from-gray-950 dark:to-gray-900">
        <div className="w-16 h-16 rounded-2xl bg-[#d93900] flex items-center justify-center shadow-lg shadow-[#d93900]/20">
          <span className="text-3xl">{'\u23ea'}</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-3">Rewinddit</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading...</p>
      </div>
    );
  }

  const canRetry = data.hasPlayed && data.attemptsUsed < data.maxAttempts;
  const result = data.lastResult;

  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-3 bg-gradient-to-b from-gray-50 to-orange-50/30 dark:from-gray-950 dark:to-gray-900">
      {/* Logo */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-14 h-14 rounded-2xl bg-[#d93900] flex items-center justify-center shadow-lg shadow-[#d93900]/20">
          <span className="text-2xl">{'\u23ea'}</span>
        </div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Rewinddit</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Daily Reddit History Quiz</p>
      </div>

      {/* Score display — same visuals as results screen */}
      {data.hasPlayed && result ? (
        <div className="flex flex-col items-center">
          <ScoreRing score={result.totalScore} />
          <ShareCard questions={result.perQuestion} />

          {/* Streak / Best / Rank row */}
          <div className="flex justify-center gap-5 mt-3">
            <div className="text-center">
              <p className="text-xl font-black text-gray-900 dark:text-white">{result.streak}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Streak</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-gray-900 dark:text-white">{result.bestStreak}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Best</p>
            </div>
            {result.dailyRank && (
              <div className="text-center">
                <p className="text-xl font-black text-gray-900 dark:text-white">#{result.dailyRank}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Rank</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="text-center px-8 max-w-xs">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              5 historic Reddit moments, details redacted.
              <br />
              Hello {data.username}, how well do you know Reddit?
            </p>
          </div>
          <HowItWorks />
        </>
      )}

      {/* Action buttons */}
      {data.hasPlayed && canRetry ? (
        <div className="flex gap-3 w-full max-w-xs px-4 mt-1">
          <button
            className="flex-1 flex items-center justify-center h-12 rounded-full cursor-pointer transition-all font-bold text-sm border-2 border-[#d93900] text-[#d93900] hover:bg-[#d93900]/5 active:scale-95 press-feedback"
            onClick={handlePlay}
          >
            View Results
          </button>
          <button
            className="flex-1 flex items-center justify-center h-12 rounded-full cursor-pointer transition-all font-bold text-sm bg-[#d93900] text-white hover:bg-[#c03000] active:bg-[#a02800] active:scale-95 shadow-lg shadow-[#d93900]/25 press-feedback"
            onClick={handleRetry}
          >
            Retry ({data.maxAttempts - data.attemptsUsed} left)
          </button>
        </div>
      ) : (
        <button
          className="flex items-center justify-center bg-[#d93900] text-white h-12 rounded-full cursor-pointer transition-all px-10 font-bold text-base hover:bg-[#c03000] active:bg-[#a02800] active:scale-95 shadow-lg shadow-[#d93900]/25 mt-1 press-feedback"
          onClick={handlePlay}
        >
          {data.hasPlayed ? 'View Results' : "Play Today's Quiz"}
        </button>
      )}

      {data.playerCount > 0 && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500">{data.playerCount} played today</p>
      )}
      <p className="text-[10px] text-gray-300 dark:text-gray-600">New puzzle every day at midnight UTC</p>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
