import React from 'react';
import { GameFlowStep } from '../context/GameContext';

interface ProgressIndicatorProps {
  currentStep: GameFlowStep;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  const steps: { key: GameFlowStep; label: string; icon: string }[] = [
    { key: 'subject', label: 'Subject', icon: '📚' },
    { key: 'mode', label: 'Mode', icon: '🎮' },
    { key: 'grade', label: 'Grade', icon: '📊' },
    { key: 'language', label: 'Language', icon: '🌐' },
    { key: 'playing', label: 'Play', icon: '▶️' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-6">
      <div className="flex items-center justify-between gap-2 max-w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1 relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCurrent
                    ? 'bg-cyan-500 text-white'
                    : isCompleted
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                <span className="text-lg">{step.icon}</span>
              </div>
              <div
                className={`text-xs mt-2 text-center transition-all ${
                  isCurrent || isCompleted ? 'text-gray-900 font-semibold' : 'text-gray-500'
                }`}
              >
                {step.label}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`absolute h-1 top-5 left-1/2 right-[-50%] transition-all ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
