import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { 
  getTransaction, 
  updateTransaction, 
  deleteTransaction,
  canEditTransaction 
} from '@/services/transaction-service';
import { UpdateTransactionData } from '@/types/transaction';
import { validateTransaction, ValidationLevel } from '@/lib/utils/input-validation';
import { rateLimiter } from '@/lib/utils/rate-limiter';

// Rate limiting configuration
const RATE_LIMITS = {
  GET: { requests: 200, window: 60000 }, // 200 requests per minute
  PUT: { requests: 30, window: 60000 },  // 30 updates per minute
  DELETE: { requests: 10, window: 60000 }, // 10 deletes per minute
};

/**
 * GET /api/transactions/[id]
 * Get a specific transaction by ID
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = await rateLimiter.checkLimit(clientId, 'transaction-get', RATE_LIMITS.GET);
    
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

    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Get transaction
    const transaction = await getTransaction(id);
    
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check ownership
    if (transaction.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check edit permissions
    const editCheck = await canEditTransaction(id);

    return NextResponse.json({
      transaction,
      editPermissions: editCheck,
      rateLimitRemaining: rateLimitResult.remaining
    });

  } catch (error) {
    console.error('[API] Error getting transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/transactions/[id]
 * Update a specific transaction
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = await rateLimiter.checkLimit(clientId, 'transaction-put', RATE_LIMITS.PUT);
    
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

    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate updates
    const validation = validateTransaction(body, ValidationLevel.PARTIAL);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          validationErrors: validation.errors 
        },
        { status: 400 }
      );
    }

    // Check if transaction exists and user owns it
    const existingTransaction = await getTransaction(id);
    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (existingTransaction.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check edit permissions
    const editCheck = await canEditTransaction(id);
    if (!editCheck.canEdit) {
      return NextResponse.json(
        { 
          error: 'Cannot edit transaction',
          reason: editCheck.reason 
        },
        { status: 423 } // Locked
      );
    }

    // Prepare update data
    const updateData: UpdateTransactionData = {
      ...body,
      lastModifiedBy: user.uid,
    };

    // Convert date if provided
    if (body.date) {
      updateData.date = new Date(body.date);
    }

    // Get expected version for optimistic locking
    const expectedVersion = body.expectedVersion || 0;

    // Update transaction
    const success = await updateTransaction(id, updateData, expectedVersion);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction updated successfully'
    });

  } catch (error) {
    console.error('[API] Error updating transaction:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Update conflict')) {
        return NextResponse.json(
          { 
            error: 'Conflict detected',
            message: error.message 
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes('Validation failed')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions/[id]
 * Delete a specific transaction
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
    const rateLimitResult = await rateLimiter.checkLimit(clientId, 'transaction-delete', RATE_LIMITS.DELETE);
    
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

    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Check if transaction exists and user owns it
    const existingTransaction = await getTransaction(id);
    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (existingTransaction.userId !== user.uid) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check edit permissions
    const editCheck = await canEditTransaction(id);
    if (!editCheck.canEdit) {
      return NextResponse.json(
        { 
          error: 'Cannot delete transaction',
          reason: editCheck.reason 
        },
        { status: 423 } // Locked
      );
    }

    // Delete transaction
    const success = await deleteTransaction(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('[API] Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}