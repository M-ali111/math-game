import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ProfileScreen } from './ProfileScreen';

interface GameMenuProps {
  onSelectSubject: (subject: 'math' | 'logic') => void;
  onSelectNav: (nav: 'stats' | 'leaderboard') => void;
  onLogout: () => void;
}

export const GameMenu: React.FC<GameMenuProps> = ({ onSelectSubject, onSelectNav, onLogout }) => {
  const { user } = useAuth();
  const { setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'home' | 'profile'>('home');
  const [rank] = useState<number | null>(null);
  const [lastGameSettings, setLastGameSettings] = useState<{
    subject: 'math' | 'logic';
    grade: number;
    language: 'english' | 'russian' | 'kazakh';
    mode: 'solo';
  } | null>(null);

  const totalGames = (user as any)?.totalGamesPlayed || 0;
  const totalWins = (user as any)?.totalWins || 0;
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const currentStreak = Number(localStorage.getItem('zirekIqCurrentStreak') || 0);
  const longestStreak = Number(localStorage.getItem('zirekIqBestStreak') || currentStreak || 0);
  const mathAccuracy = Number(localStorage.getItem('zirekIqMathAccuracy') || 0);
  const logicAccuracy = Number(localStorage.getItem('zirekIqLogicAccuracy') || 0);

  useEffect(() => {
    const storedSettings = localStorage.getItem('lastGameSettings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        if (parsed?.subject && parsed?.grade && parsed?.language && parsed?.mode === 'solo') {
          setLastGameSettings(parsed);
        }
      } catch {
        setLastGameSettings(null);
      }
    }
  }, []);

  const levelFromGames = useMemo(() => {
    if (totalGames <= 10) return 1;
    if (totalGames <= 25) return 2;
    if (totalGames <= 50) return 3;
    if (totalGames <= 100) return 4;
    return 5;
  }, [totalGames]);

  const quickPlayLabel = useMemo(() => {
    if (!lastGameSettings) return '';
    const subjectLabel = lastGameSettings.subject === 'math' ? 'Math' : 'Logic';
    const gradeLabel =
      lastGameSettings.grade === 1
        ? 'Primary 1-6'
        : lastGameSettings.grade === 2
        ? 'Grade 5→6'
        : 'Grade 6→7';
    const languageLabel =
      lastGameSettings.language === 'english'
        ? 'English'
        : lastGameSettings.language === 'russian'
        ? 'Russian'
        : 'Kazakh';
    return `⚡ Quick Play — ${subjectLabel}, ${gradeLabel}, ${languageLabel}`;
  }, [lastGameSettings]);

  const handleQuickPlay = () => {
    if (!lastGameSettings) return;

    setLanguage(lastGameSettings.language);
    localStorage.setItem('quickPlayPending', 'true');
    localStorage.setItem('quickPlaySettings', JSON.stringify(lastGameSettings));
    onSelectSubject(lastGameSettings.subject);
  };

  if (activeTab === 'profile') {
    return (
      <div className="flex flex-col min-h-screen bg-amber-50 overflow-y-auto">
        <div className="bg-white shadow-sm px-4 py-4 text-center">
          <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        </div>

        <ProfileScreen
          username={user?.username || 'Player'}
          data={{
            totalGames,
            currentStreak,
            bestStreak: longestStreak,
            mathAccuracy,
            logicAccuracy,
            multiplayerWinRate: winRate,
            rank,
          }}
          onLogout={onLogout}
        />

        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 safe-area-inset-bottom">
          <div className="max-w-md mx-auto flex justify-around">
            <button
              onClick={() => setActiveTab('home')}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 font-semibold text-xs min-w-[60px]"
            >
              <span className="text-2xl">🏠</span>
              <span>Home</span>
            </button>
            <button
              onClick={() => onSelectNav('leaderboard')}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 font-semibold text-xs min-w-[60px]"
            >
              <span className="text-2xl">🏆</span>
              <span>Leaderboard</span>
            </button>
            <button
              onClick={() => onSelectNav('stats')}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 font-semibold text-xs min-w-[60px]"
            >
              <span className="text-2xl">📈</span>
              <span>Stats</span>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className="flex flex-col items-center gap-1 text-teal-500 hover:text-teal-600 font-semibold text-xs min-w-[60px]"
            >
              <span className="text-2xl">👤</span>
              <span>Profile</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-amber-50 overflow-y-auto animate-fade-in">
      <div className="bg-white shadow-sm px-4 py-4 text-center">
        <div className="text-xl font-bold text-gray-900">🧠 ZirekIQ</div>
        <p className="text-lg font-bold text-gray-900 mt-2">Welcome back, {user?.username}! 👋</p>
        {currentStreak > 0 && (
          <p className="text-sm font-medium text-gray-600 mt-1">🔥 {currentStreak} day streak</p>
        )}
      </div>

      <div className="px-4 py-6 max-w-md mx-auto pb-24 space-y-4 w-full">
        <div className="bg-white shadow-md rounded-2xl p-4 hover:shadow-lg transition-shadow duration-200">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-400">Games</p>
              <p className="text-lg font-bold text-gray-900">{totalGames}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Win Rate</p>
              <p className="text-lg font-bold text-gray-900">{winRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Level</p>
              <p className="text-lg font-bold text-gray-900">{levelFromGames}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-200 via-yellow-200 to-orange-200 rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow duration-200">
          <p className="font-bold text-gray-900">🎯 Today's Goal</p>
          <p className="text-sm font-medium text-gray-700 mt-1">Complete 3 games to maintain your streak</p>
          <div className="flex gap-2 mt-3">
            <span className="w-3 h-3 rounded-full bg-white/90" />
            <span className="w-3 h-3 rounded-full bg-white/70" />
            <span className="w-3 h-3 rounded-full bg-white/50" />
          </div>
        </div>

        {lastGameSettings && (
          <button
            onClick={handleQuickPlay}
            className="w-full border-2 border-teal-500 text-teal-600 bg-white rounded-2xl px-4 py-4 min-h-[56px] font-bold shadow-sm hover:scale-105 transition-transform duration-200"
          >
            {quickPlayLabel}
          </button>
        )}

        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => onSelectSubject('math')}
            className="w-full bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-2xl py-8 px-5 text-left shadow-md min-h-[148px] hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl mb-2">🔢</div>
                <h2 className="text-2xl font-bold">Mathematics</h2>
                <p className="text-sm font-medium text-teal-100 mt-2">Algebra, Fractions & More</p>
              </div>
              <span className="text-3xl">→</span>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-1 opacity-20">
              {Array.from({ length: 12 }).map((_, idx) => (
                <span key={idx} className="h-1 bg-white rounded" />
              ))}
            </div>
          </button>

          <button
            onClick={() => onSelectSubject('logic')}
            className="w-full bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl py-8 px-5 text-left shadow-md min-h-[148px] hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl mb-2">🧠</div>
                <h2 className="text-2xl font-bold">Logic & IQ</h2>
                <p className="text-sm font-medium text-purple-100 mt-2">Patterns, Reasoning & Puzzles</p>
              </div>
              <span className="text-3xl">→</span>
            </div>
            <div className="mt-3 flex gap-1 opacity-25">
              {Array.from({ length: 10 }).map((_, idx) => (
                <span key={idx} className="w-2 h-2 rounded-full bg-white" />
              ))}
            </div>
          </button>

          <button
            onClick={() => onSelectNav('stats')}
            className="w-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl py-8 px-5 text-left shadow-md min-h-[148px] hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl mb-2">📊</div>
                <h2 className="text-2xl font-bold">Stats & Leaderboard</h2>
                <p className="text-sm font-medium text-indigo-100 mt-2">View your progress</p>
              </div>
              <span className="text-3xl">→</span>
            </div>
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 safe-area-inset-bottom">
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
            onClick={() => setActiveTab('profile')}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 active:text-gray-700 font-semibold text-xs sm:text-sm min-w-[60px]"
          >
            <span className="text-2xl sm:text-xl">👤</span>
            <span>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
