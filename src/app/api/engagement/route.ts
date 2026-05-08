import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  updateStreak,
  getEngagementSummary,
  checkAndCreatePromptNotifications,
  recordAction,
} from '@/lib/engagement';

// ─── GET /api/engagement ──────────────────────────────────────────────────
// Returns engagement summary including streak, profile completion,
// unread notifications, pending likes, people waiting, and prompts.
// Also calls updateStreak and checkAndCreatePromptNotifications.

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  try {
    // Update streak (marks today as active)
    const streak = await updateStreak(userId);

    // Record login action
    await recordAction(userId, 'login').catch(() => {
      // Don't fail the whole request if action recording fails
    });

    // Get engagement summary
    const summary = await getEngagementSummary(userId);

    // Update with fresh streak data
    summary.streak = streak;

    // Check and create prompt notifications
    const prompts = await checkAndCreatePromptNotifications(userId);
    summary.prompts = prompts;

    return NextResponse.json(summary);
  } catch (error) {
    console.error('[GET /api/engagement] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch engagement summary' },
      { status: 500 }
    );
  }
}
