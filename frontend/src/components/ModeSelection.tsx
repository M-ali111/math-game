import React from 'react';
import { useGame, GameMode } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

interface ModeSelectionProps {
  onModeSelect: (mode: GameMode) => void;
  onBack: () => void;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ onModeSelect, onBack }) => {
  const { subject } = useGame();
  const { language } = useLanguage();

  const t = translations[language];

  const modes: { value: GameMode; label: string; description: string; icon: string }[] = [
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

  const handleSelectMode = (mode: GameMode) => {
    onModeSelect(mode);
  };

  return (
    <div className="flex flex-col min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-6 text-center flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-cyan-500 hover:text-cyan-600 font-bold text-base"
        >
          ← {t.back}
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{t.selectMode}</h1>
        </div>
        <div className="w-8"></div>
      </div>

      {/* Subject info */}
      <div className="bg-cyan-50 text-center px-4 py-3 text-sm font-semibold text-cyan-700">
        {subject === 'math' ? t.mathematics : t.logicIQ}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
        {/* Mode Cards */}
        <div className="w-full flex flex-col gap-4">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => handleSelectMode(mode.value)}
              className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <div className="text-4xl mb-3">{mode.icon}</div>
              <h2 className="text-xl font-bold text-gray-900">{mode.label}</h2>
              <p className="text-sm text-gray-600 mt-2">{mode.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
