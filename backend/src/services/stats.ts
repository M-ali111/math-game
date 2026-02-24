import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function toPercent(correct: number, total: number): number {
  if (!total) return 0;
  return Math.round((correct / total) * 1000) / 10;
}

function buildStreaks(dateKeys: string[]) {
  if (dateKeys.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const uniqueKeys = Array.from(new Set(dateKeys));
  const sorted = uniqueKeys.sort();

  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / MS_PER_DAY;
    if (diff === 1) {
      currentRun += 1;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 1;
    }
  }

  const dateSet = new Set(uniqueKeys);
  const todayKey = toDateKey(startOfUtcDay(new Date()));
  let currentStreak = 0;
  let cursor = startOfUtcDay(new Date());

  while (dateSet.has(toDateKey(cursor))) {
    currentStreak += 1;
    cursor = addDays(cursor, -1);
  }

  if (!dateSet.has(todayKey)) {
    currentStreak = 0;
  }

  return { currentStreak, longestStreak };
}

function buildDailySeries(
  days: number,
  soloMap: Map<string, { totalScore: number; count: number }>,
  multiMap: Map<string, { totalScore: number; count: number }>
) {
  const today = startOfUtcDay(new Date());
  const series: Array<{ date: string; soloAverageScore: number | null; multiplayerAverageScore: number | null }> = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    const key = toDateKey(date);
    const soloEntry = soloMap.get(key);
    const multiEntry = multiMap.get(key);

    const soloAverageScore = soloEntry ? Math.round((soloEntry.totalScore / soloEntry.count) * 10) / 10 : null;
    const multiplayerAverageScore = multiEntry ? Math.round((multiEntry.totalScore / multiEntry.count) * 10) / 10 : null;

    series.push({ date: key, soloAverageScore, multiplayerAverageScore });
  }

  return series;
}

export const statsService = {
  async getDashboard(userId: string) {
    const answers = await prisma.gameAnswer.findMany({
      where: { userId },
      include: {
        question: true,
      },
    });

    const gamePlayers = await prisma.gamePlayer.findMany({
      where: { userId },
      include: {
        game: {
          select: { gameType: true, createdAt: true },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    const completedGames = gamePlayers.filter((game) => game.completedAt);

    const totalAnswers = answers.length;
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length;

    // Separate by subject
    const mathAnswers = answers.filter((a) => a.question && a.question.subject === 'math');
    const logicAnswers = answers.filter((a) => a.question && a.question.subject === 'logic');
    const mathCorrect = mathAnswers.filter((a) => a.isCorrect).length;
    const logicCorrect = logicAnswers.filter((a) => a.isCorrect).length;

    const totalSoloGames = gamePlayers.filter((game) => game.game.gameType === 'solo').length;
    const totalMultiplayerGames = gamePlayers.filter((game) => game.game.gameType === 'multiplayer').length;

    const soloCompleted = completedGames.filter((game) => game.game.gameType === 'solo');
    const multiplayerCompleted = completedGames.filter((game) => game.game.gameType === 'multiplayer');

    const soloAverageScore = soloCompleted.length
      ? Math.round((soloCompleted.reduce((sum, game) => sum + game.score, 0) / soloCompleted.length) * 10) / 10
      : 0;

    const soloBestScore = soloCompleted.length
      ? Math.max(...soloCompleted.map((game) => game.score))
      : 0;

    const multiplayerWins = multiplayerCompleted.filter((game) => game.isWinner).length;
    const multiplayerLosses = multiplayerCompleted.filter((game) => !game.isWinner).length;
    const multiplayerWinRate = toPercent(multiplayerWins, multiplayerWins + multiplayerLosses);

    const now = new Date();
    const last30Start = addDays(startOfUtcDay(now), -29);

    const soloScoreMap = new Map<string, { totalScore: number; count: number }>();
    const multiplayerScoreMap = new Map<string, { totalScore: number; count: number }>();

    for (const game of completedGames) {
      const completedAt = game.completedAt;
      if (!completedAt) continue;
      if (completedAt < last30Start) continue;

      const key = toDateKey(completedAt);
      const targetMap = game.game.gameType === 'multiplayer' ? multiplayerScoreMap : soloScoreMap;

      if (!targetMap.has(key)) {
        targetMap.set(key, { totalScore: 0, count: 0 });
      }

      const entry = targetMap.get(key)!;
      entry.totalScore += game.score;
      entry.count += 1;
    }

    const performanceOverTime = buildDailySeries(30, soloScoreMap, multiplayerScoreMap);

    const streakDates = completedGames
      .filter((game) => game.completedAt)
      .map((game) => toDateKey(game.completedAt!));

    const { currentStreak, longestStreak } = buildStreaks(streakDates);

    const recentGamePlayers = await prisma.gamePlayer.findMany({
      where: { userId, completedAt: { not: null } },
      include: {
        game: {
          select: { gameType: true, createdAt: true },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });

    const recentGames = recentGamePlayers.map((game) => ({
      gameId: game.gameId,
      date: game.completedAt ? game.completedAt.toISOString() : game.game.createdAt.toISOString(),
      mode: game.game.gameType,
      score: game.score,
      result: game.game.gameType === 'multiplayer' ? (game.isWinner ? 'Win' : 'Loss') : 'Completed',
    }));

    return {
      overview: {
        totalGames: totalSoloGames + totalMultiplayerGames,
        overallAccuracy: toPercent(correctAnswers, totalAnswers),
        currentStreak,
        longestStreak,
        multiplayerWinRate,
      },
      subjectStats: {
        mathAccuracy: toPercent(mathCorrect, mathAnswers.length),
        logicAccuracy: toPercent(logicCorrect, logicAnswers.length),
      },
      soloStats: {
        totalGames: totalSoloGames,
        averageScore: soloAverageScore,
        bestScore: soloBestScore,
      },
      multiplayerStats: {
        totalGames: totalMultiplayerGames,
        wins: multiplayerWins,
        losses: multiplayerLosses,
        winRate: multiplayerWinRate,
      },
      performanceOverTime,
      recentGames,
    };
  },
};
