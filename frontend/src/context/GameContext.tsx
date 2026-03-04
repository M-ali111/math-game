import React, { createContext, useContext, useMemo, useState, useCallback, ReactNode } from 'react';

export type Subject = 'math' | 'logic' | 'english' | 'physics' | 'chemistry' | 'biology' | 'geography' | 'history' | 'informatics';
export type GameMode = 'solo' | 'multiplayer';
export type GameFlowStep = 'subject' | 'mode' | 'topic' | 'language' | 'playing';

interface GameContextType {
  subject: Subject | null;
  setSubject: (subject: Subject) => void;
  selectedMode: GameMode | null;
  setSelectedMode: (mode: GameMode) => void;
  selectedTopic: string | null;
  setSelectedTopic: (topic: string) => void;
  currentStep: GameFlowStep;
  setCurrentStep: (step: GameFlowStep) => void;
  resetGameFlow: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const SUBJECT_STORAGE_KEY = 'selectedSubject';

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [subject, setSubjectState] = useState<Subject | null>(() => {
    const stored = localStorage.getItem(SUBJECT_STORAGE_KEY) as Subject | null;
    const validSubjects = ['math', 'logic', 'english', 'physics', 'chemistry', 'biology', 'geography', 'history', 'informatics'];
    return stored && validSubjects.includes(stored) ? stored : null;
  });
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<GameFlowStep>('subject');

  console.log('[GameProvider] Mounted - subject:', subject);

  const setSubject = useCallback((next: Subject) => {
    setSubjectState(next);
    localStorage.setItem(SUBJECT_STORAGE_KEY, next);
  }, []);

  const resetGameFlow = useCallback(() => {
    setSelectedMode(null);
    setSelectedTopic(null);
    setCurrentStep('subject');
  }, []);

  const value = useMemo(
    () => ({
      subject,
      setSubject,
      selectedMode,
      setSelectedMode,
      selectedTopic,
      setSelectedTopic,
      currentStep,
      setCurrentStep,
      resetGameFlow,
    }),
    [subject, setSubject, selectedMode, selectedTopic, currentStep, resetGameFlow]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    console.error('[useGame] Called outside GameProvider! Context is undefined.');
    throw new Error('useGame must be used within a GameProvider');
  }
  console.log('[useGame] Hook called, subject:', context.subject);
  return context;
};
