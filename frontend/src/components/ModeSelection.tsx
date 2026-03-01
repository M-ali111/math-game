import React, { useEffect, useRef } from 'react';
import { useGame, GameMode } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

interface ModeSelectionProps {
  onModeSelect: (mode: GameMode | 'random') => void;
  onBack: () => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onModeSelect, onBack }) => {
  const { subject } = useGame();
  const { language, setLanguage } = useLanguage();
  const quickPlayHandledRef = useRef(false);

  const t = translations[language];

  const modes: { value: GameMode | 'random'; label: string; description: string; icon: string }[] = [
    {
      value: 'solo',
      label: t.playSolo,
      description: 'Practice alone and improve your skills',
      icon: '👤',
    },
    {
      value: 'multiplayer',
      label: t.multiplayer,
      description: 'Compete with other players in real-time',
      icon: '🎮',
    },
  ];

  const handleSelectMode = (mode: GameMode | 'random') => {
    onModeSelect(mode);
  };

  useEffect(() => {
    if (quickPlayHandledRef.current) return;

    const isQuickPlayPending = localStorage.getItem('quickPlayPending') === 'true';
    if (!isQuickPlayPending) return;

    const rawSettings = localStorage.getItem('quickPlaySettings');
    if (!rawSettings) return;

    try {
      const settings = JSON.parse(rawSettings);
      if (settings?.language) {
        setLanguage(settings.language);
      }

      quickPlayHandledRef.current = true;

      if (subject === 'logic') {
        localStorage.removeItem('quickPlayPending');
        localStorage.removeItem('quickPlaySettings');
      }

      onModeSelect('solo');
    } catch {
      localStorage.removeItem('quickPlayPending');
      localStorage.removeItem('quickPlaySettings');
    }
  }, [onModeSelect, setLanguage, subject]);

  const isMath = subject === 'math';
  const buttonColor = isMath 
    ? 'bg-cyan-500 hover:bg-cyan-600 text-white' 
    : 'bg-purple-500 hover:bg-purple-600 text-white';
  const headerBgColor = isMath ? 'bg-cyan-50 text-cyan-700' : 'bg-purple-50 text-purple-700';

  return (
    <div className="flex flex-col min-h-screen bg-amber-50 animate-fade-in">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-6 text-center flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-cyan-500 hover:text-cyan-600 active:text-cyan-700 font-bold text-base sm:text-lg min-w-[60px] text-left"
        >
          ← {t.back}
        </button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t.selectMode}</h1>
        </div>
        <div className="w-[60px]"></div>
      </div>

      {/* Subject info */}
      <div className={`${headerBgColor} text-center px-4 py-3 text-base sm:text-sm font-semibold`}>
        {subject === 'math' ? '🔢 Mathematics' : '🧠 Logic & IQ'}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
        {/* Mode Cards */}
        <div className="w-full flex flex-col gap-4">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => handleSelectMode(mode.value)}
              className={`${buttonColor} rounded-2xl shadow-md p-6 sm:p-8 text-center hover:shadow-lg active:opacity-90 transition-all duration-200 hover:scale-105 min-h-[140px] w-full`}
            >
              <div className="text-5xl sm:text-4xl mb-3">{mode.icon}</div>
              <h2 className="text-xl sm:text-2xl font-bold">{mode.label}</h2>
              <p className="text-base sm:text-sm mt-2 opacity-90">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
