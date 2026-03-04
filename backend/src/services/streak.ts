import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() as any;

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

function dateStringToUtcDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Record a game for a user on a specific day
 */
export async function recordGameForDay(userId: string): Promise<void> {
  const today = getTodayDate();
  console.log(`[recordGameForDay] Starting: userId=${userId}, date=${today}`);
  
  try {
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

    console.log(`[recordGameForDay] StreakDay updated: userId=${userId}, date=${today}, gameCount=${streakDay.gameCount}`);

    // Check if user completed today's goal (3+ games)
    if (streakDay.gameCount >= GAMES_PER_DAY_TARGET) {
      console.log(`[recordGameForDay] User hit 3 games target! Calling updateStreakStatus`);
      await updateStreakStatus(userId);
    }
  } catch (error) {
    console.error(`[recordGameForDay] FAILED for userId=${userId}, date=${today}:`, error);
  }
}

/**
 * Calculate and update user's streak based on consecutive days
 */
export async function updateStreakStatus(userId: string): Promise<void> {
  console.log(`[updateStreakStatus] Starting for userId=${userId}`);
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        streakDays: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!user) {
      console.error(`[updateStreakStatus] User not found: userId=${userId}`);
      return;
    }

    const today = getTodayDate();
    const yesterday = getYesterdayDate();

    const hasGameToday = user.streakDays.some((sd: any) => sd.date === today && sd.gameCount >= GAMES_PER_DAY_TARGET);
    const hasGameYesterday = user.streakDays.some((sd: any) => sd.date === yesterday && sd.gameCount >= GAMES_PER_DAY_TARGET);

    console.log(`[updateStreakStatus] hasGameToday=${hasGameToday}, hasGameYesterday=${hasGameYesterday}, today=${today}, yesterday=${yesterday}`);

    if (!hasGameToday && !hasGameYesterday) {
      console.log(`[updateStreakStatus] No games today or yesterday - resetting streak to 0`);
      await prisma.user.update({
        where: { id: userId },
        data: {
          currentStreak: 0,
          lastStreakDate: null,
        },
      });
      return;
    }

    let currentStreak = 0;

    for (let i = 0; i < 365; i++) {
      const dateToCheck = getDateNDaysAgo(i);
      const hasGameOnDate = user.streakDays.some(
        (sd: any) => sd.date === dateToCheck && sd.gameCount >= GAMES_PER_DAY_TARGET
      );

      if (hasGameOnDate) {
        currentStreak++;
      } else {
        if (i > 1 || (i === 1 && !hasGameToday)) {
          break;
        }
      }
    }

    const newLongestStreak = Math.max((user as any).longestStreak || 0, currentStreak);
    const streakDateString = hasGameToday ? today : yesterday;

    console.log(`[updateStreakStatus] Calculated: currentStreak=${currentStreak}, longestStreak=${newLongestStreak}, updating streakDate=${streakDateString}`);

    await prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak,
        longestStreak: newLongestStreak,
        lastStreakDate: dateStringToUtcDate(streakDateString),
      },
    });

    console.log(`[updateStreakStatus] SUCCESS: userId=${userId}, streak=${currentStreak}`);
  } catch (error) {
    console.error(`[updateStreakStatus] FAILED for userId=${userId}:`, error);
  }
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
  try {
    console.log(`[getUserStreak] Fetching for userId=${userId}`);
    
    await updateStreakStatus(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.warn(`[getUserStreak] User not found: userId=${userId}`);
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

    const lastStreakDate = (user as any).lastStreakDate;
    
    const result = {
      currentStreak: ((user as any).currentStreak || 0) as number,
      longestStreak: ((user as any).longestStreak || 0) as number,
      todayGameCount: todayRecord?.gameCount || 0,
      lastStreakDate: lastStreakDate instanceof Date 
        ? lastStreakDate.toISOString().split('T')[0] 
        : lastStreakDate || null,
    };

    console.log(`[getUserStreak] Result for userId=${userId}:`, result);
    return result;
  } catch (error) {
    console.error(`[getUserStreak] FAILED for userId=${userId}:`, error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      todayGameCount: 0,
      lastStreakDate: null,
    };
  }
}

/**
 * Reset streak if needed (call when user hasn't played in 2+ days)
 */
export async function resetStreakIfNeeded(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (user as any).currentStreak === 0) return;

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
  } catch (error) {
    console.error('Error resetting streak if needed:', error);
  }
}
