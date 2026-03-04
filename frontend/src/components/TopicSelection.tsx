import React from 'react';
import { useGame, Subject } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

interface TopicSelectionProps {
  onTopicSelected: (topic: string) => void;
  onBack: () => void;
}

// Kazakhstan curriculum topics for each subject
const TOPICS_BY_SUBJECT: Record<Subject, string[]> = {
  math: [
    'Addition & Subtraction',
    'Multiplication & Division',
    'Fractions & Decimals',
    'Ratios & Percentages',
    'Algebra Equations',
    'Geometry',
    'Word Problems',
    'Coordinate Geometry',
    'Pattern Recognition'
  ],
  logic: [
    'Number Sequences',
    'Pattern Recognition',
    'Analogies',
    'Odd One Out',
    'Logical Deductions',
    'Matrix Reasoning',
    'Series Completion',
    'Abstract Reasoning',
    'Verbal Reasoning'
  ],
  english: [
    'Grammar Basics',
    'Vocabulary Building',
    'Reading Comprehension',
    'Tenses',
    'Sentence Structure',
    'Articles & Prepositions',
    'Synonyms & Antonyms',
    'Subject-Verb Agreement',
    'Modal Verbs'
  ],
  physics: [
    'Motion & Speed',
    'Forces & Gravity',
    'Energy & Work',
    'Heat & Temperature',
    'Electricity & Circuits',
    'Magnetism',
    'Light & Optics',
    'Sound Waves',
    'Newton\'s Laws'
  ],
  chemistry: [
    'Matter & Properties',
    'Atomic Structure',
    'Periodic Table',
    'Chemical Bonding',
    'Chemical Reactions',
    'Acids & Bases',
    'Stoichiometry',
    'Organic Chemistry',
    'Oxidation & Reduction'
  ],
  biology: [
    'Cell Structure',
    'Cell Division',
    'Genetics & DNA',
    'Evolution',
    'Ecosystems',
    'Human Body Systems',
    'Photosynthesis',
    'Classification',
    'Microbiology'
  ],
  geography: [
    'Continents & Oceans',
    'Kazakhstan Geography',
    'Maps & Globes',
    'Climate & Weather',
    'Natural Resources',
    'Population & Settlements',
    'Economic Geography',
    'Natural Disasters',
    'Environmental Issues'
  ],
  history: [
    'Ancient Civilizations',
    'Kazakhstan Ancient History',
    'Silk Road',
    'Medieval Kazakhstan',
    'Kazakh Khanate',
    'Soviet Period',
    'Kazakhstan Independence',
    'World Wars',
    'Modern Kazakhstan'
  ],
  informatics: [
    'Algorithms Basics',
    'Flowcharts',
    'Binary Numbers',
    'Logic Gates',
    'Data Structures',
    'Sorting & Searching',
    'Programming Concepts',
    'Recursion',
    'Networks & Internet'
  ]
};

export const TopicSelection: React.FC<TopicSelectionProps> = ({ onTopicSelected, onBack }) => {
  const { subject } = useGame();
  const { language } = useLanguage();
  const t = translations[language];

  if (!subject) {
    return null;
  }

  const topics = TOPICS_BY_SUBJECT[subject];

  const subjectConfig = {
    math: { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-700', button: 'bg-teal-500 hover:bg-teal-600' },
    logic: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', button: 'bg-purple-500 hover:bg-purple-600' },
    english: { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-700', button: 'bg-amber-500 hover:bg-amber-600' },
    physics: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-700', button: 'bg-indigo-500 hover:bg-indigo-600' },
    chemistry: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-700', button: 'bg-green-500 hover:bg-green-600' },
    biology: { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-700', button: 'bg-teal-400 hover:bg-teal-500' },
    geography: { bg: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700', button: 'bg-cyan-500 hover:bg-cyan-600' },
    history: { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-700', button: 'bg-rose-500 hover:bg-rose-600' },
    informatics: { bg: 'bg-slate-50', border: 'border-slate-500', text: 'text-slate-700', button: 'bg-slate-500 hover:bg-slate-600' }
  };

  const config = subjectConfig[subject];

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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Choose a Topic</h1>
        </div>
        <div className="w-[60px]"></div>
      </div>

      {/* Subject info */}
      <div className={`${config.bg} ${config.text} text-center px-4 py-3 text-base sm:text-sm font-semibold`}>
        {subject.charAt(0).toUpperCase() + subject.slice(1)} Topics
      </div>

      {/* Main content */}
      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full overflow-y-auto pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topics.map((topic) => (
            <button
              key={topic}
              onClick={() => onTopicSelected(topic)}
              className={`${config.button} text-white rounded-2xl p-4 text-left shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105`}
            >
              <div className="flex items-center justify-between">
                <span className="text-base font-bold">{topic}</span>
                <span className="text-xl">→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
