import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

type GradeOption = {
  grade: number;
  title: string;
  description: string;
};

interface GradeSelectorProps {
  title?: string;
  onSelect: (grade: number) => void;
  onBack?: () => void;
}

const gradeOptions: GradeOption[] = [
  {
    grade: 1,
    title: 'Primary (Grades 1-6)',
    description: 'Core arithmetic, geometry basics, word problems, time and money.',
  },
  {
    grade: 2,
    title: 'Grade 5 → 6',
    description: 'Fractions, decimals, ratios, percentages, area and perimeter, logic puzzles.',
  },
  {
    grade: 3,
    title: 'Grade 6 → 7',
    description: 'Algebra equations, integers, coordinate geometry, patterns, multi-step problems.',
  },
];

export const GradeSelector: React.FC<GradeSelectorProps> = ({ title, onSelect, onBack }) => {
  const { language, setLanguage } = useLanguage();
  const t = translations[language];

  const handleGradeSelect = (grade: number) => {
    onSelect(grade);
  };

  return (
    <div className="flex flex-col min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">{title || t.chooseGrade}</h1>
      </div>

      {/* Language Selector */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-md mx-auto">
          <p className="text-base sm:text-sm font-semibold text-gray-700 mb-3 text-center">{t.language}</p>
          <div className="flex gap-2 flex-wrap justify-center">
            {[
              { lang: 'english', flag: '🇬🇧', label: 'English' },
              { lang: 'russian', flag: '🇷🇺', label: 'Русский' },
              { lang: 'kazakh', flag: '🇰🇿', label: 'Қазақша' },
            ].map(({ lang, flag, label }) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang as any)}
                className={`px-4 py-3 rounded-full text-base sm:text-sm font-semibold transition-all min-w-[100px] ${
                  language === lang
                    ? 'bg-cyan-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                {flag} {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
        {/* Grade Cards */}
        <div className="w-full flex flex-col gap-4 mb-6">
          {gradeOptions.map((option) => (
            <button
              key={option.grade}
              onClick={() => handleGradeSelect(option.grade)}
              className="bg-white rounded-2xl shadow-md p-6 sm:p-8 text-left hover:shadow-lg active:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200 min-h-[120px] w-full"
            >
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{option.title}</h3>
              <p className="text-base sm:text-sm text-gray-600">{option.description}</p>
            </button>
          ))}
        </div>

        {/* Back Button */}
        {onBack && (
          <button 
            onClick={onBack} 
            className="w-full bg-white border-2 border-gray-300 text-gray-700 rounded-2xl py-4 px-4 font-bold text-lg hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[56px]"
          >
            ← {t.back}
          </button>
        )}
      </div>
    </div>
  );
};
