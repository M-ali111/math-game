import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GAMES_PER_DAY_TARGET = 3;

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Get date N days ago in YYYY-MM-DD format
 */
function getDateNDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Record a game for a user on a specific day
 */
export async function recordGameForDay(userId: string): Promise<void> {
  const today = getTodayDate();
  
  // Find or create streak day record
  const streakDay = await prisma.streakDay.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    update: {
      gameCount: {
        increment: 1,
      },
    },
    create: {
      userId,
      date: today,
      gameCount: 1,
    },
  });

  // Check if user completed today's goal (3+ games)
  if (streakDay.gameCount >= GAMES_PER_DAY_TARGET) {
    await updateStreakStatus(userId);
  }
}

/**
 * Calculate and update user's streak based on consecutive days
 */
export async function updateStreakStatus(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      streakDays: {
        orderBy: { date: 'desc' },
        take: 30, // Look back 30 days max
      },
    },
  });

  if (!user) return;

  // Find consecutive days with 3+ games
  let currentStreak = 0;
  let maxStreak = 0;

  const today = getTodayDate();
  let checkDate = today;

  // Check if today has games, if not check yesterday
  const hasGameToday = user.streakDays.some(sd => sd.date === today && sd.gameCount >= GAMES_PER_DAY_TARGET);
  const hasGameYesterday = user.streakDays.some(sd => sd.date === getYesterdayDate() && sd.gameCount >= GAMES_PER_DAY_TARGET);

  // Only count streak if user played today or yesterday
  if (!hasGameToday && !hasGameYesterday) {
    // Streak is broken - reset to 0
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: 0,
        lastStreakDate: null,
      },
    });
    return;
  }

  // Starting point for streak calculation
  checkDate = hasGameToday ? today : getYesterdayDate();

  // Count consecutive days backwards
  for (let i = 0; i < 365; i++) {
    const dateToCheck = getDateNDaysAgo(i);
    const hasGameOnDate = user.streakDays.some(
      sd => sd.date === dateToCheck && sd.gameCount >= GAMES_PER_DAY_TARGET
    );

    if (hasGameOnDate) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      // Streak broken if gap is more than 1 day
      if (i > 1 || (i === 1 && !hasGameToday)) {
        break;
      }
    }
  }

  // Update user's streak
  const newLongestStreak = Math.max(user.longestStreak || 0, currentStreak);

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentStreak,
      longestStreak: newLongestStreak,
      lastStreakDate: hasGameToday ? today : getYesterdayDate(),
    },
  });
}

/**
 * Get user's streak information
 */
export async function getUserStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  todayGameCount: number;
  lastStreakDate: string | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      todayGameCount: 0,
      lastStreakDate: null,
    };
  }

  const today = getTodayDate();
  const todayRecord = await prisma.streakDay.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  return {
    currentStreak: user.currentStreak || 0,
    longestStreak: user.longestStreak || 0,
    todayGameCount: todayRecord?.gameCount || 0,
    lastStreakDate: user.lastStreakDate?.toISOString().split('T')[0] || null,
  };
}

/**
 * Reset streak if needed (call when user hasn't played in 2+ days)
 */
export async function resetStreakIfNeeded(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || user.currentStreak === 0) return;

  const yesterday = getYesterdayDate();
  const dayBeforeYesterday = getDateNDaysAgo(2);

  const hasGameYesterday = !!(await prisma.streakDay.findUnique({
    where: {
      userId_date: {
        userId,
        date: yesterday,
      },
    },
  }));

  const hasGameDayBeforeYesterday = !!(await prisma.streakDay.findUnique({
    where: {
      userId_date: {
        userId,
        date: dayBeforeYesterday,
      },
    },
  }));

  // If no games yesterday or day before, reset streak
  if (!hasGameYesterday && !hasGameDayBeforeYesterday) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak: 0,
        lastStreakDate: null,
      },
    });
  }
}
