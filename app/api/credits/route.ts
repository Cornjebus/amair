import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDatabase } from '@/lib/database';
import { supabaseAdmin } from '@/lib/supabase/server';
import { CreditService } from '@/lib/credits/credit-service';
import { captureError } from '@/lib/monitoring/sentry';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

// =============================================================================
// GET /api/credits - Get user's credit balance and account info
// =============================================================================

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDatabase();

    // Get user from Clerk ID using DAL
    const user = await db.users.findByClerkId(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get credit account using DAL
    let account = await db.credits.getAccount(user.id);

    if (!account) {
      // Account doesn't exist, create one
      account = await db.credits.createAccount(user.id);
      return NextResponse.json({
        balance: account.balance,
        lifetimeCredits: account.lifetimeCredits,
        tier: account.tier ?? 'free',
        createdAt: account.createdAt,
        isNew: true,
      });
    }

    return NextResponse.json({
      balance: account.balance,
      lifetimeCredits: account.lifetimeCredits,
      tier: account.tier ?? 'free',
      createdAt: account.createdAt,
    });
  } catch (error) {
    captureError(error as Error, { action: 'get_credits' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/credits - Deduct credits for an operation
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limit credit operations
    const rateLimitResult = await checkRateLimit(userId, 'apiGeneral');
    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    const { amount, reason, relatedEntityId, relatedEntityType } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Get user from Clerk ID using DAL
    const user = await db.users.findByClerkId(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Still use CreditService for write operations (Phase 3)
    const creditService = new CreditService(supabaseAdmin);

    // Check if user has enough credits
    const hasCredits = await creditService.hasEnoughCredits(user.id, amount);
    if (!hasCredits) {
      const balance = await creditService.getBalance(user.id);
      return NextResponse.json(
        {
          error: 'Insufficient credits',
          required: amount,
          available: balance,
        },
        { status: 402 }
      );
    }

    // Deduct credits
    const result = await creditService.deductCredits({
      userId: user.id,
      amount,
      reason,
      relatedEntityId,
    });

    return NextResponse.json({
      success: true,
      newBalance: result.newBalance,
      amountDeducted: result.amountDeducted,
      transactionId: result.transactionId,
    });
  } catch (error) {
    captureError(error as Error, { action: 'deduct_credits' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
