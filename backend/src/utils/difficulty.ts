/**
 * Calculate the next difficulty level based on user performance
 */
export const calculateNextDifficulty = (currentDifficulty: number, correctAnswers: number, totalQuestions: number): number => {
  const accuracy = (correctAnswers / totalQuestions) * 100;
  let nextDifficulty = currentDifficulty;

  if (accuracy >= 80) {
    nextDifficulty = Math.min(currentDifficulty + 1, 10);
  } else if (accuracy < 50) {
    nextDifficulty = Math.max(currentDifficulty - 1, 1);
  }

  return nextDifficulty;
};

/**
 * Get difficulty range for question selection
 * Mix of current difficulty and adjacent levels
 */
export const getQuestionDifficultyMix = (difficulty: number) => {
  const difficulties: { difficulty: number; weight: number }[] = [
    { difficulty: Math.max(difficulty - 1, 1), weight: 0.1 }, // 10% easier
    { difficulty, weight: 0.7 }, // 70% current level
    { difficulty: Math.min(difficulty + 1, 10), weight: 0.2 }, // 20% harder
  ];

  return difficulties;
};
