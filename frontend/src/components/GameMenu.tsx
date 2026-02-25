import React from 'react';
import { useAuth } from '../context/AuthContext';

interface GameMenuProps {
  onSelectSubject: (subject: 'math' | 'logic') => void;
  onSelectNav: (nav: 'stats' | 'leaderboard') => void;
  onLogout: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({ onSelectSubject, onSelectNav, onLogout }) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-amber-50">
      {/* Header with logo and user info */}
      <div className="bg-white shadow-sm px-4 py-6 text-center">
        <div className="text-5xl sm:text-6xl mb-2">⚡</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">ZirekIQ</h1>
        <p className="text-gray-500 text-base sm:text-sm mt-1">Master Mathematics & Logic</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
        {/* User greeting */}
        <div className="bg-white rounded-2xl shadow-md p-4 sm:p-6 w-full mb-6 text-center">
          <p className="text-lg sm:text-xl font-bold text-gray-900">Welcome, {user?.username}! 👋</p>
          <div className="flex gap-4 mt-4 justify-center">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Level</p>
              <p className="text-2xl font-bold text-cyan-500">{user?.currentDifficulty}</p>
            </div>
          </div>
        </div>

        {/* Subject selection buttons */}
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => onSelectSubject('math')}
            className="w-full bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white rounded-2xl py-6 sm:py-8 px-4 text-center transition-colors shadow-md min-h-[120px]"
          >
            <div className="text-4xl sm:text-5xl mb-2">🔢</div>
            <h2 className="text-xl sm:text-2xl font-bold">Mathematics</h2>
            <p className="text-base sm:text-sm mt-2 text-cyan-100">Algebra, Fractions & More</p>
          </button>

          <button
            onClick={() => onSelectSubject('logic')}
            className="w-full bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white rounded-2xl py-6 sm:py-8 px-4 text-center transition-colors shadow-md min-h-[120px]"
          >
            <div className="text-4xl sm:text-5xl mb-2">🧠</div>
            <h2 className="text-xl sm:text-2xl font-bold">Logic & IQ</h2>
            <p className="text-base sm:text-sm mt-2 text-purple-100">Patterns, Reasoning & Puzzles</p>
          </button>

          <button
            onClick={() => onSelectNav('stats')}
            className="w-full bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-2xl py-6 sm:py-8 px-4 text-center transition-colors shadow-md min-h-[120px]"
          >
            <div className="text-4xl sm:text-5xl mb-2">📊</div>
            <h2 className="text-xl sm:text-2xl font-bold">Stats & Leaderboard</h2>
            <p className="text-base sm:text-sm mt-2 text-indigo-100">View your progress</p>
          </button>
        </div>
      </div>

      {/* Bottom navigation bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 safe-area-inset-bottom">
        <div className="max-w-md mx-auto flex justify-around">
          <button className="flex flex-col items-center gap-1 text-cyan-500 hover:text-cyan-600 active:text-cyan-700 font-semibold text-xs sm:text-sm min-w-[60px]">
            <span className="text-2xl sm:text-xl">🏠</span>
            <span>Home</span>
          </button>
          <button 
            onClick={() => onSelectNav('leaderboard')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 active:text-gray-700 font-semibold text-xs sm:text-sm min-w-[60px]"
          >
            <span className="text-2xl sm:text-xl">🏆</span>
            <span className="text-xs">Leaderboard</span>
          </button>
          <button 
            onClick={() => onSelectNav('stats')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 active:text-gray-700 font-semibold text-xs sm:text-sm min-w-[60px]"
          >
            <span className="text-2xl sm:text-xl">📈</span>
            <span>Stats</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 active:text-gray-700 font-semibold text-xs sm:text-sm min-w-[60px]"
          >
            <span className="text-2xl sm:text-xl">👤</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};
