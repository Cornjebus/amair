import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { CreditService } from '@/lib/credits/credit-service';
import { captureError } from '@/lib/monitoring/sentry';

// =============================================================================
// GET /api/credits/transactions - Get user's transaction history
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // Validate pagination params
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
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

    try {
      const result = await creditService.getTransactionHistory(user.id, {
        page,
        pageSize,
      });

      // Transform transactions for frontend
      // Items are DB records with snake_case, cast to access
      const formattedTransactions = result.items.map((tx: Record<string, unknown>) => ({
        id: tx.id,
        amount: tx.amount,
        type: tx.type,
        reason: tx.description || tx.reason || 'Transaction',
        description: tx.description,
        created_at: tx.created_at,
        createdAt: tx.created_at,
        balanceAfter: tx.balance_after,
        relatedEntityId: tx.related_entity_id,
        relatedEntityType: tx.related_entity_type,
      }));

      return NextResponse.json({
        transactions: formattedTransactions,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          hasMore: result.hasMore,
          totalPages: Math.ceil(result.total / result.pageSize),
        },
      });
    } catch (txError) {
      // If transaction history fails, return empty
      console.warn('Could not fetch transaction history:', txError);
      return NextResponse.json({
        transactions: [],
        pagination: {
          page: 1,
          pageSize,
          total: 0,
          hasMore: false,
          totalPages: 0,
        },
      });
    }
  } catch (error) {
    captureError(error as Error, { action: 'get_transactions' });
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
