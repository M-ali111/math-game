import React, { useState, useEffect } from 'react';
import { useApi } from '../utils/api';
import { GradeSelector } from './GradeSelector';
import { useLanguage } from '../context/LanguageContext';
import { useGame } from '../context/GameContext';
import { translations } from '../utils/translations';

interface Question {
  id: string;
  text: string;
  options: string[];
  difficulty: number;
  explanation?: string | null;
  subject?: string;
}

interface SoloGameProps {
  onBack: () => void;
}

export const SoloGame: React.FC<SoloGameProps> = ({ onBack }) => {
  const [gameId, setGameId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [timeStarted, setTimeStarted] = useState<number>(0);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [answerExplanation, setAnswerExplanation] = useState<string | null>(null);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const { request } = useApi();
  const { language } = useLanguage();
  const { subject } = useGame();
  const t = translations[language];

  const gradeLabel = selectedGrade === 1
    ? 'Primary (Grades 1-6)'
    : selectedGrade === 2
      ? 'Grade 5 -> 6 NIS/BIL Entry'
      : selectedGrade === 3
        ? 'Grade 6 -> 7 NIS/BIL Entry'
        : '';

  useEffect(() => {
    if (selectedGrade !== null && subject !== null) {
      startGame(selectedGrade, subject);
    } else if (subject === 'logic' && selectedGrade === null) {
      // For logic, auto-start with grade 0 (general level)
      startGame(0, 'logic');
    }
  }, [selectedGrade, subject]);

  const startGame = async (grade: number, gameSubject: 'math' | 'logic') => {
    setLoading(true);
    try {
      const data = await request('/games/solo/start', {
        method: 'POST',
        body: JSON.stringify({ grade, language, subject: gameSubject }),
      });
      setGameId(data.gameId);
      setQuestions(data.questions);
      setGameStarted(true);
      setTimeStarted(Date.now());
    } catch (error: any) {
      // Log error for debugging on frontend console
      console.error('Failed to start game:', error);
      // Show user-friendly message instead of technical error
      alert('Unable to start game. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSubmit = async (answerIndex: number) => {
    if (loading) return;

    setLoading(true);
    try {
      const timeToAnswer = Math.round((Date.now() - timeStarted) / 1000);
      const currentQuestion = questions[currentIndex];

      const response = await request(`/games/solo/${gameId}/answer`, {
        method: 'POST',
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedAnswer: answerIndex,
          timeToAnswer,
        }),
      });

      if (response.isCorrect) {
        setScore(score + 1);
        setAnswerExplanation(null);

        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setSelectedAnswer(null);
          setTimeStarted(Date.now());
        } else {
          completeGame();
        }
      } else {
        setAnswerExplanation(currentQuestion.explanation || null);
        setAwaitingNext(true);
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const completeGame = async () => {
    try {
      const result = await request(`/games/solo/${gameId}/complete`, { method: 'POST' });
      setGameResult(result);
      setGameCompleted(true);
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleNextAfterExplanation = () => {
    setAwaitingNext(false);
    setAnswerExplanation(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setTimeStarted(Date.now());
    } else {
      completeGame();
    }
  };

  if (subject === 'math' && selectedGrade === null) {
    return (
      <GradeSelector
        title={t.chooseGrade}
        onSelect={(grade) => {
          setSelectedGrade(grade);
        }}
        onBack={onBack}
      />
    );
  }

  if (!gameStarted || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-amber-50 items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center max-w-md w-full">
          <div className="text-5xl sm:text-6xl mb-4">⚡</div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">Loading game...</p>
          <div className="mt-6 flex justify-center gap-1">
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (gameCompleted && gameResult) {
    const percentage = gameResult.score;
    const isPassed = percentage >= 70;
    
    return (
      <div className="flex flex-col min-h-screen bg-amber-50 items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6 sm:p-8 text-center">
          <div className="text-6xl sm:text-7xl mb-4">{isPassed ? '🎉' : '💪'}</div>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-6 ${
            isPassed ? 'text-green-600' : 'text-cyan-600'
          }`}>
            {isPassed ? 'Excellent!' : 'Good Effort!'}
          </h1>
          
          <div className={`inline-block px-6 py-4 rounded-2xl mb-8 ${
            isPassed ? 'bg-green-100' : 'bg-cyan-100'
          }`}>
            <p className={`text-5xl sm:text-6xl font-bold ${
              isPassed ? 'text-green-600' : 'text-cyan-600'
            }`}>
              {gameResult.score}%
            </p>
          </div>

          <div className="space-y-3 text-left bg-gray-50 rounded-xl p-4 sm:p-6 mb-6">
            <p className="text-gray-900 text-base sm:text-lg"><strong>Correct Answers:</strong> {gameResult.correctAnswers}/{gameResult.totalAnswers}</p>
            <p className="text-gray-900 text-base sm:text-lg"><strong>Grade:</strong> {gradeLabel || selectedGrade}</p>
            <p className="text-gray-900 text-base sm:text-lg"><strong>Next Level:</strong> {gameResult.nextDifficulty}</p>
          </div>

          <p className="text-base sm:text-sm text-gray-600 italic mb-6">
            {isPassed ? '✓ Great performance! Difficulty increased.' : '✓ Keep practicing to improve!'}
          </p>

          <button 
            onClick={onBack} 
            className="w-full bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white font-bold py-4 sm:py-5 rounded-2xl text-lg sm:text-xl transition-colors min-h-[56px]"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="flex flex-col min-h-screen bg-amber-50 pb-20">
      {/* Top Bar */}
      <div className="bg-white shadow-md px-4 py-4 sm:py-5">
        <div className="max-w-md mx-auto flex justify-between items-center mb-3">
          <div>
            <p className="text-xs sm:text-sm text-gray-500 uppercase font-semibold">Question</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{currentIndex + 1} of {questions.length}</p>
          </div>
          <div className="text-right">
            <p className="text-xs sm:text-sm text-gray-500 uppercase font-semibold">Score</p>
            <p className="text-xl sm:text-2xl font-bold text-cyan-500">{score}/{currentIndex}</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="max-w-md mx-auto bg-gray-200 rounded-full h-3">
          <div 
            className="bg-cyan-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Subject Badge */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 sm:py-4">
        <div className="max-w-md mx-auto">
          <span className={`inline-block px-4 py-2 sm:py-3 rounded-full text-white text-base sm:text-sm font-bold ${
            currentQuestion.subject === 'logic' ? 'bg-purple-500' : 'bg-blue-500'
          }`}>
            {currentQuestion.subject === 'logic' ? '🧠 Logic & IQ' : '🔢 Mathematics'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8 max-w-md mx-auto w-full">
        {currentQuestion && (
          <>
            {/* Question Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 w-full mb-6 sm:mb-8 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{currentQuestion.text}</h2>
            </div>

            {/* Answer Options Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full mb-6 sm:mb-8">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedAnswer(index);
                    handleAnswerSubmit(index);
                  }}
                  disabled={loading || selectedAnswer !== null || awaitingNext}
                  className={`p-4 sm:p-5 rounded-2xl text-center font-bold transition-all min-h-[80px] sm:min-h-[90px] text-lg sm:text-xl flex items-center justify-center ${
                    selectedAnswer === index
                      ? 'bg-cyan-500 text-white shadow-lg scale-95'
                      : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-cyan-300 active:scale-95'
                  } ${loading || selectedAnswer !== null || awaitingNext ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {option}
                </button>
              ))}
            </div>

            {/* Explanation Box */}
            {answerExplanation && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 sm:p-5 w-full mb-6">
                <p className="font-bold text-yellow-900 mb-2 text-lg sm:text-base">💡 Explanation</p>
                <p className="text-yellow-800 text-base sm:text-sm leading-relaxed">{answerExplanation}</p>
              </div>
            )}

            {/* Next Button */}
            {awaitingNext && (
              <button 
                onClick={handleNextAfterExplanation} 
                className="w-full bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white font-bold py-4 sm:py-5 rounded-2xl text-lg sm:text-xl transition-colors mb-12 min-h-[56px]"
              >
                {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Exit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 sm:py-4 safe-area-inset-bottom">
        <div className="max-w-md mx-auto">
          <button 
            onClick={onBack} 
            className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-bold py-4 rounded-2xl transition-colors text-base sm:text-lg min-h-[56px]"
          >
            Exit Game
          </button>
        </div>
      </div>
    </div>
  );
};
