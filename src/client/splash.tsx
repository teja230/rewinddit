import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

export const Splash = () => {
  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-4 bg-gray-50">
      <div className="flex flex-col items-center gap-1">
        <h1 className="text-3xl font-bold text-gray-900">Rewinddit</h1>
        <p className="text-sm text-gray-500">
          Daily Reddit History Time-Travel Quiz
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 text-center px-6">
        <p className="text-sm text-gray-600 leading-relaxed max-w-xs">
          5 historic Reddit moments, details redacted. Guess the year for each.
          How well do you know Reddit history?
        </p>
      </div>
      <div className="flex items-center justify-center mt-3">
        <button
          className="flex items-center justify-center bg-[#d93900] text-white h-12 rounded-full cursor-pointer transition-colors px-8 font-semibold text-lg hover:bg-[#c03000] active:bg-[#a02800]"
          onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
        >
          Play Today's Quiz
        </button>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
