import { PrismaClient } from '@prisma/client';
import { getQuestionDifficultyMix } from '../utils/difficulty';

const prisma = new PrismaClient();

export const questionService = {
  /**
   * Get random questions for a game
   */
  async getRandomQuestions(difficulty: number, count: number = 10) {
    const difficultyMix = getQuestionDifficultyMix(difficulty);

    // Determine how many questions from each difficulty level
    const questions: any[] = [];
    let remainingCount = count;

    for (const mix of difficultyMix) {
      // For the last mix, use remaining count to ensure exactly 'count' questions
      const countForThisDifficulty = mix === difficultyMix[difficultyMix.length - 1]
        ? remainingCount
        : Math.round(mix.weight * count);

      if (countForThisDifficulty === 0) continue;

      const questionsForDifficulty = await prisma.question.findMany({
        where: { difficulty: mix.difficulty },
        take: countForThisDifficulty,
        skip: Math.floor(Math.random() * Math.max(0, 50 - countForThisDifficulty)),
        orderBy: { id: 'desc' },
      });

      questions.push(...questionsForDifficulty);
      remainingCount -= questionsForDifficulty.length;
    }

    // If we still don't have enough questions, fill from any difficulty
    if (questions.length < count) {
      const remaining = count - questions.length;
      const allQuestions = await prisma.question.findMany({
        take: remaining,
        skip: Math.floor(Math.random() * 50),
        orderBy: { id: 'desc' },
      });
      questions.push(...allQuestions);
    }

    // Shuffle questions and return exactly 'count' questions
    return questions.sort(() => Math.random() - 0.5).slice(0, count);
  },


  /**
   * Get a specific question with options
   */
  async getQuestion(questionId: string) {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    return {
      id: question.id,
      text: question.text,
      options: JSON.parse(question.options),
      difficulty: question.difficulty,
      // Don't send correct answer
    };
  },

  /**
   * Verify if answer is correct
   */
  async verifyAnswer(questionId: string, selectedAnswerIndex: number): Promise<boolean> {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    return question.correctAnswer === selectedAnswerIndex;
  },

  /**
   * Get all questions (for admin)
   */
  async getAllQuestions() {
    return await prisma.question.findMany({
      orderBy: { difficulty: 'asc' },
    });
  },
};
