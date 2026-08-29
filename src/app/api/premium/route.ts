import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

// GET /api/premium - Get the authenticated user's premium status
export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  // TODO: Implement premium status check
  return NextResponse.json({
    isPremium: false,
    features: [],
    userId,
    message: 'Premium endpoint - authenticated',
  });
}

// POST /api/premium - Subscribe to premium
export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult;

  try {
    const body = await request.json();
    const { plan } = body;

    if (!plan) {
      return NextResponse.json({ error: 'plan is required' }, { status: 400 });
    }

    // TODO: Implement premium subscription logic
    return NextResponse.json({
      success: true,
      userId,
      plan,
      message: 'Premium subscription - authenticated',
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
