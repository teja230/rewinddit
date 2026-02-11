import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const HowItWorks = () => (
  <div className="flex items-center justify-center gap-6 mt-2">
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-11 h-11 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xl">
        {'\ud83d\udcdc'}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Read</span>
    </div>
    <div className="text-gray-300 dark:text-gray-600 text-lg">{'\u2192'}</div>
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">
        {'\ud83c\udfaf'}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Guess</span>
    </div>
    <div className="text-gray-300 dark:text-gray-600 text-lg">{'\u2192'}</div>
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-11 h-11 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-xl">
        {'\ud83c\udfc6'}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Score</span>
    </div>
  </div>
);

export const Splash = () => {
  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-5 bg-gradient-to-b from-gray-50 to-orange-50/30 dark:from-gray-950 dark:to-gray-900">
      {/* Logo / Brand */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-2xl bg-[#d93900] flex items-center justify-center shadow-lg shadow-[#d93900]/20">
          <span className="text-3xl">{'\u23ea'}</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
          Rewinddit
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Daily Reddit History Quiz
        </p>
      </div>

      {/* Description */}
      <div className="text-center px-8 max-w-xs">
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          5 historic Reddit moments, details redacted.
          <br />
          Guess the year. How well do you know Reddit?
        </p>
      </div>

      {/* How it works */}
      <HowItWorks />

      {/* Play button */}
      <button
        className="flex items-center justify-center bg-[#d93900] text-white h-13 rounded-full cursor-pointer transition-all px-10 font-bold text-lg hover:bg-[#c03000] active:bg-[#a02800] active:scale-95 shadow-lg shadow-[#d93900]/25 mt-2 press-feedback"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Play Today's Quiz
      </button>

      {/* Footer */}
      <p className="text-xs text-gray-300 dark:text-gray-600 mt-2">New puzzle every day at midnight UTC</p>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
