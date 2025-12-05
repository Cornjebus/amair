import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { CreditService } from '@/lib/credits/credit-service';
import { captureError } from '@/lib/monitoring/sentry';
import { rateLimiters } from '@/lib/rate-limit';

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

    // Get user from Clerk ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const creditService = new CreditService(supabaseAdmin);

    try {
      const balance = await creditService.getBalance(user.id);

      // Get full account info
      const { data: account } = await supabaseAdmin
        .from('credit_accounts')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return NextResponse.json({
        balance,
        lifetimeCredits: account?.lifetime_credits ?? 0,
        tier: account?.tier ?? 'free',
        createdAt: account?.created_at,
      });
    } catch {
      // Account doesn't exist, create one
      const newAccount = await creditService.createAccount(user.id);
      // Cast to DB record type which uses snake_case
      const dbAccount = newAccount as unknown as Record<string, unknown>;

      return NextResponse.json({
        balance: dbAccount.balance ?? 10,
        lifetimeCredits: dbAccount.lifetime_credits ?? 10,
        tier: dbAccount.tier ?? 'free',
        createdAt: dbAccount.created_at ?? new Date().toISOString(),
        isNew: true,
      });
    }
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
    const rateLimitResult = await rateLimiters.apiGeneral.limit(userId);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
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

    // Get user from Clerk ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

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
