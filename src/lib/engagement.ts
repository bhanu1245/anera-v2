import { db } from '@/lib/db';
import { createNotification, getUnreadCount, type NotificationType } from './notifications';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
}

export interface EngagementSummary {
  streak: StreakData;
  profileCompletion: number;
  unreadNotifications: number;
  pendingLikes: number;
  peopleWaiting: number;
  prompts: EngagementPrompt[];
}

export interface EngagementPrompt {
  type: NotificationType;
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
}

interface ProfileWithPhotos {
  name: string;
  age: number;
  gender: string;
  bio: string;
  interests: string;
  city: string;
  relationshipIntent: string;
  photos: { id: string }[];
}

// ─── Streak Management ─────────────────────────────────────────────────────

/**
 * Update the daily streak for a user.
 *
 * Logic:
 * - If lastActiveDate is today → no change
 * - If lastActiveDate is yesterday → increment streak
 * - If lastActiveDate is older → reset streak to 1
 * - If no streak record exists → create one with streak = 1
 */
export async function updateStreak(userId: string): Promise<StreakData> {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  const existing = await db.userStreak.findUnique({
    where: { userId },
  });

  if (!existing) {
    // No streak record yet — create one
    const streak = await db.userStreak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: today,
      },
    });
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
    };
  }

  if (existing.lastActiveDate === today) {
    // Already active today — no change
    return {
      currentStreak: existing.currentStreak,
      longestStreak: existing.longestStreak,
      lastActiveDate: existing.lastActiveDate,
    };
  }

  if (existing.lastActiveDate === yesterday) {
    // Active yesterday — increment streak
    const newStreak = existing.currentStreak + 1;
    const newLongest = Math.max(newStreak, existing.longestStreak);
    const streak = await db.userStreak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActiveDate: today,
      },
    });
    return {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
    };
  }

  // Older than yesterday — reset streak to 1
  const streak = await db.userStreak.update({
    where: { userId },
    data: {
      currentStreak: 1,
      longestStreak: existing.longestStreak,
      lastActiveDate: today,
    },
  });
  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveDate: streak.lastActiveDate,
  };
}

/**
 * Get current streak data for a user without updating it.
 */
export async function getStreak(userId: string): Promise<StreakData | null> {
  const streak = await db.userStreak.findUnique({
    where: { userId },
  });

  if (!streak) return null;

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveDate: streak.lastActiveDate,
  };
}

// ─── Engagement Actions ────────────────────────────────────────────────────

/**
 * Record an engagement action (e.g., swipe, match, message, login).
 */
export async function recordAction(userId: string, action: string) {
  return db.engagementAction.create({
    data: {
      userId,
      action,
    },
  });
}

// ─── Profile Completion ────────────────────────────────────────────────────

/**
 * Calculate profile completion percentage.
 *
 * Scoring:
 * - Has name: 10%
 * - Has bio: 15%
 * - Has city: 10%
 * - Has interests: 15%
 * - Has 3+ photos: 25%
 * - Has relationshipIntent: 10%
 * - Age set: 5%
 * - Gender set: 10%
 */
export function getProfileCompletionPercent(profile: ProfileWithPhotos | null): number {
  if (!profile) return 0;

  let score = 0;

  // Has name (10%)
  if (profile.name && profile.name.trim().length > 0) {
    score += 10;
  }

  // Has bio (15%)
  if (profile.bio && profile.bio.trim().length > 0) {
    score += 15;
  }

  // Has city (10%)
  if (profile.city && profile.city.trim().length > 0) {
    score += 10;
  }

  // Has interests (15%)
  try {
    const interests = JSON.parse(profile.interests) as string[];
    if (Array.isArray(interests) && interests.length > 0) {
      score += 15;
    }
  } catch {
    // Not valid JSON — no interests
  }

  // Has 3+ photos (25%)
  if (profile.photos && profile.photos.length >= 3) {
    score += 25;
  }

  // Has relationshipIntent (10%)
  if (profile.relationshipIntent && profile.relationshipIntent.trim().length > 0) {
    score += 10;
  }

  // Age set (5%) — age is a required Int field, but could be 0 or default
  if (profile.age && profile.age > 0) {
    score += 5;
  }

  // Gender set (10%)
  if (profile.gender && profile.gender.trim().length > 0) {
    score += 10;
  }

  return Math.min(score, 100);
}

// ─── Engagement Summary ────────────────────────────────────────────────────

/**
 * Get a comprehensive engagement summary for a user.
 */
export async function getEngagementSummary(userId: string): Promise<EngagementSummary> {
  // Fetch all data in parallel for efficiency
  const [streakData, profile, unreadNotifications, pendingLikes] = await Promise.all([
    getStreak(userId),
    db.profile.findUnique({
      where: { userId },
      include: { photos: true },
    }),
    getUnreadCount(userId),
    db.swipe.count({
      where: {
        toUserId: userId,
        action: { in: ['like', 'superlike'] },
      },
    }),
  ]);

  // Default streak data
  const streak: StreakData = streakData ?? {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
  };

  // Profile completion
  const profileCompletion = getProfileCompletionPercent(profile as ProfileWithPhotos | null);

  // People waiting = pending likes for simplicity
  const peopleWaiting = pendingLikes;

  return {
    streak,
    profileCompletion,
    unreadNotifications,
    pendingLikes,
    peopleWaiting,
    prompts: [],
  };
}

// ─── Prompt Notifications ──────────────────────────────────────────────────

/**
 * Check engagement state and create system notification prompts.
 *
 * Creates prompts for:
 * - Streak at risk (no activity today)
 * - Profile incomplete (<80%)
 * - People waiting (likes received)
 */
export async function checkAndCreatePromptNotifications(userId: string): Promise<EngagementPrompt[]> {
  const prompts: EngagementPrompt[] = [];

  // Fetch data needed for checks
  const [streakData, profile, pendingLikes] = await Promise.all([
    getStreak(userId),
    db.profile.findUnique({
      where: { userId },
      include: { photos: true },
    }),
    db.swipe.count({
      where: {
        toUserId: userId,
        action: { in: ['like', 'superlike'] },
      },
    }),
  ]);

  const today = getTodayString();

  // Check: Streak at risk (has a streak but hasn't been active today)
  if (streakData && streakData.currentStreak > 0 && streakData.lastActiveDate !== today) {
    prompts.push({
      type: 'streak_reminder',
      title: 'Your streak is at risk! 🔥',
      body: `You have a ${streakData.currentStreak}-day streak. Come back today to keep it going!`,
      priority: 'high',
    });

    // Create the notification (avoid duplicates: check if one already exists today)
    await createNotificationIfNotExists(userId, {
      type: 'streak_reminder',
      title: 'Your streak is at risk! 🔥',
      body: `You have a ${streakData.currentStreak}-day streak. Come back today to keep it going!`,
      entityType: 'streak',
    });
  }

  // Check: Profile incomplete
  const completionPercent = getProfileCompletionPercent(profile as ProfileWithPhotos | null);
  if (completionPercent < 80) {
    const missingItems = getMissingProfileItems(profile as ProfileWithPhotos | null);
    prompts.push({
      type: 'profile_incomplete',
      title: 'Complete your profile',
      body: `Your profile is ${completionPercent}% complete. Add ${missingItems} to get more matches!`,
      priority: 'medium',
    });

    await createNotificationIfNotExists(userId, {
      type: 'profile_incomplete',
      title: 'Complete your profile',
      body: `Your profile is ${completionPercent}% complete. Add ${missingItems} to get more matches!`,
      entityType: 'profile',
    });
  }

  // Check: People waiting (likes received)
  if (pendingLikes > 0) {
    prompts.push({
      type: 'people_waiting',
      title: `${pendingLikes} ${pendingLikes === 1 ? 'person is' : 'people are'} waiting for you`,
      body: `You have ${pendingLikes} ${pendingLikes === 1 ? 'like' : 'likes'} waiting. Check them out!`,
      priority: 'high',
    });

    await createNotificationIfNotExists(userId, {
      type: 'people_waiting',
      title: `${pendingLikes} ${pendingLikes === 1 ? 'person is' : 'people are'} waiting for you`,
      body: `You have ${pendingLikes} ${pendingLikes === 1 ? 'like' : 'likes'} waiting. Check them out!`,
      entityType: 'profile',
    });
  }

  return prompts;
}

/**
 * Create a notification if a similar one doesn't already exist today.
 * Prevents notification spam by checking for same type + same user within the last 24 hours.
 */
async function createNotificationIfNotExists(
  userId: string,
  params: {
    type: NotificationType;
    title: string;
    body: string;
    entityType?: string;
  }
) {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const existing = await db.notification.findFirst({
    where: {
      userId,
      type: params.type,
      createdAt: { gte: twentyFourHoursAgo },
    },
  });

  if (!existing) {
    await createNotification({
      userId,
      type: params.type,
      title: params.title,
      body: params.body,
      entityType: params.entityType,
    });
  }
}

/**
 * Get a human-readable list of missing profile items.
 */
function getMissingProfileItems(profile: ProfileWithPhotos | null): string {
  if (!profile) return 'your profile details';

  const missing: string[] = [];

  if (!profile.bio || profile.bio.trim().length === 0) missing.push('a bio');
  if (!profile.city || profile.city.trim().length === 0) missing.push('your city');
  if (!profile.photos || profile.photos.length < 3) missing.push('more photos');

  try {
    const interests = JSON.parse(profile.interests) as string[];
    if (!Array.isArray(interests) || interests.length === 0) {
      missing.push('interests');
    }
  } catch {
    missing.push('interests');
  }

  if (!profile.relationshipIntent || profile.relationshipIntent.trim().length === 0) {
    missing.push('relationship intent');
  }

  if (missing.length === 0) return 'your profile details';
  if (missing.length === 1) return missing[0];
  if (missing.length === 2) return `${missing[0]} and ${missing[1]}`;
  return `${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]}`;
}

// ─── Date Helpers ──────────────────────────────────────────────────────────

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0]; // YYYY-MM-DD
}
