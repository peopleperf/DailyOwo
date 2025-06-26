import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { createTransaction, getUserTransactions } from '@/services/transaction-service';
import { CreateTransactionData } from '@/types/transaction';
import { validateTransaction, ValidationLevel } from '@/lib/utils/input-validation';
import { rateLimiter } from '@/lib/utils/rate-limiter';

// Rate limiting configuration
const RATE_LIMITS = {
  GET: { requests: 100, window: 60000 }, // 100 requests per minute
  POST: { requests: 20, window: 60000 }, // 20 creates per minute
};

/**
 * GET /api/transactions
 * Get user transactions with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = await rateLimiter.checkLimit(clientId, 'transactions-get', RATE_LIMITS.GET);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
          }
        }
      );
    }

    // Authentication
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate parameters
    if (limit > 100) {
      return NextResponse.json(
        { error: 'Limit cannot exceed 100' },
        { status: 400 }
      );
    }

    // Build filters
    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (type && ['income', 'expense', 'asset', 'liability'].includes(type)) {
      filters.type = type;
    }
    if (categoryId) filters.categoryId = categoryId;

    // Get transactions
    const transactions = await getUserTransactions(user.uid, filters);
    
    // Apply pagination
    const paginatedTransactions = transactions.slice(offset, offset + limit);
    const hasMore = transactions.length > offset + limit;

    return NextResponse.json({
      transactions: paginatedTransactions,
      pagination: {
        limit,
        offset,
        total: transactions.length,
        hasMore
      },
      rateLimitRemaining: rateLimitResult.remaining
    });

  } catch (error) {
    console.error('[API] Error getting transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = await rateLimiter.checkLimit(clientId, 'transactions-post', RATE_LIMITS.POST);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
          }
        }
      );
    }

    // Authentication
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['type', 'amount', 'categoryId', 'description', 'date'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missingFields 
        },
        { status: 400 }
      );
    }

    // Validate transaction data
    const validation = validateTransaction(body, ValidationLevel.STRICT);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          validationErrors: validation.errors 
        },
        { status: 400 }
      );
    }

    // Prepare transaction data
    const transactionData: CreateTransactionData = {
      ...body,
      userId: user.uid,
      createdBy: user.uid,
      date: new Date(body.date),
      currency: body.currency || 'USD',
      categoryType: body.categoryType || 'global',
      isRecurring: body.isRecurring || false,
    };

    // Create transaction
    const transactionId = await createTransaction(transactionData);

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Failed to create transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        transactionId,
        message: 'Transaction created successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('[API] Error creating transaction:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Validation failed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
      
      if (error.message.includes('Not authenticated')) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}