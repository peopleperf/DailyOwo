import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  getDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase/config';
import { Transaction, CreateTransactionData, UpdateTransactionData } from '@/types/transaction';
// TODO: Implement these services
// import { updateBudgetSpending } from './budget-service';
// import { checkGoalProgress } from './goal-service';

// Import new utilities
import { 
  createSecureTransaction,
  getSecureTransaction,
  getSecureTransactions,
  updateSecureTransaction,
  deleteSecureTransaction 
} from '@/lib/services/secure-transaction-service';
import { validateTransaction, ValidationLevel } from '@/lib/utils/input-validation';
import { createAuditEntry } from '@/lib/utils/transaction-audit';
import { updateWithLock, LockableDocument, createTransactionMerger } from '@/lib/utils/optimistic-locking';
import { validateDocumentReferences } from '@/lib/utils/referential-integrity';
import { validateDocument, createSchemaValidationMiddleware } from '@/lib/utils/schema-validation';
import { triggerHistoricalRecalculation } from '@/lib/utils/historical-recalculation';
import { formatCurrency } from '@/lib/utils/currency';

// Extend Transaction type to include locking fields
export interface TransactionWithLocking extends Omit<Transaction, 'lastModifiedBy'>, LockableDocument {}

// Initialize middleware
const schemaMiddleware = createSchemaValidationMiddleware();

// Create conflict resolver for transactions that handles optional base parameter
const transactionMerger = ((current: TransactionWithLocking, incoming: TransactionWithLocking, base?: TransactionWithLocking) => {
  const mergerFunction = createTransactionMerger<TransactionWithLocking>();
  // If base is not provided, use current as base
  return mergerFunction(current, incoming, base || current);
});

export async function createTransaction(data: CreateTransactionData): Promise<string | null> {
  try {
    const db = getFirebaseDb();
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    
    if (!db || !user) {
      throw new Error('Not authenticated');
    }

    // Validate input
    const validation = validateTransaction({
      amount: data.amount,
      date: data.date,
      type: data.type,
      categoryId: data.categoryId,
      description: data.description,
    }, ValidationLevel.STRICT);

    if (!validation.isValid && validation.errors.length > 0) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Schema validation
    const validatedData = await schemaMiddleware.beforeCreate('transactions', {
      ...data,
      userId: user.uid,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.uid,
      version: 0,
    });

    // Check referential integrity
    const refValidation = await validateDocumentReferences('transactions', 'new', validatedData);
    if (!refValidation.isValid) {
      throw new Error(`Reference validation failed: ${refValidation.errors[0]?.message}`);
    }

    // Extract only the fields needed for CreateTransactionData
    const transactionData: CreateTransactionData = {
      type: data.type,
      amount: data.amount,
      currency: data.currency || 'USD',
      categoryId: data.categoryId,
      categoryType: data.categoryType || 'global',
      description: data.description,
      date: data.date instanceof Date ? data.date : new Date(data.date),
      isRecurring: data.isRecurring || false,
      recurringConfig: data.recurringConfig,
      tags: data.tags,
      attachments: data.attachments,
      location: data.location,
      merchant: data.merchant,
      paymentMethod: data.paymentMethod,
      isPrivate: data.isPrivate,
      debtId: data.debtId,
      assetDetails: data.assetDetails,
      liabilityDetails: data.liabilityDetails,
      userId: user.uid,
      createdBy: user.uid,
      budgetId: data.budgetId,
    };

    // Create transaction with encryption
    const transactionId = await createSecureTransaction(user.uid, transactionData);

    if (transactionId) {
      // Create audit log
      const auditEntry = createAuditEntry(
        'CREATE',
        user.uid,
        transactionId,
        {
          newState: validatedData as Partial<Transaction>,
          metadata: {
            userAgent: navigator.userAgent,
            ip: 'client',
          },
        }
      );

      // Update related entities
      // TODO: Implement budget update
      // if (data.budgetId) {
      //   await updateBudgetSpending(data.budgetId, data.amount);
      // }

      // Check goal progress
      // TODO: Implement goal progress check
      // await checkGoalProgress(user.uid);

      // Trigger historical recalculation
      const createdTransaction: Transaction = {
        id: transactionId,
        ...transactionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await triggerHistoricalRecalculation(user.uid, createdTransaction, 'add');
    }

    return transactionId;
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

export async function updateTransaction(
  transactionId: string, 
  updates: UpdateTransactionData,
  expectedVersion: number
): Promise<boolean> {
  try {
    const db = getFirebaseDb();
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    
    if (!db || !user) {
      throw new Error('Not authenticated');
    }

    // Validate updates
    const validation = validateTransaction(updates, ValidationLevel.PARTIAL);
    if (!validation.isValid && validation.errors.length > 0) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Schema validation for updates
    const validatedUpdates = await schemaMiddleware.beforeUpdate('transactions', {
      ...updates,
      updatedAt: new Date(),
      lastModifiedBy: user.uid,
    });

    // Get current transaction for audit
    const currentTransaction = await getTransaction(transactionId);
    if (!currentTransaction) {
      throw new Error('Transaction not found');
    }

    // Use optimistic locking for update
    const result = await updateWithLock<TransactionWithLocking>(
      'transactions',
      transactionId,
      user.uid,
      validatedUpdates as Partial<TransactionWithLocking>,
      expectedVersion,
      {
        strategy: 'merge',
        resolver: transactionMerger,
      }
    );

    if (!result.success) {
      if (result.conflict) {
        throw new Error(`Update conflict: ${result.conflict.suggestion}`);
      }
      throw new Error(result.error || 'Update failed');
    }

    // Create audit log
    const auditEntry = createAuditEntry(
      'UPDATE',
      user.uid,
      transactionId,
      {
        previousState: currentTransaction as Partial<Transaction>,
        newState: { ...currentTransaction, ...validatedUpdates } as Partial<Transaction>,
        metadata: {
          userAgent: navigator.userAgent,
          reason: result.conflict ? 'Update with conflict resolution: merged' : 'Update without conflicts',
        },
      }
    );

    // Update related entities if amount changed
    // TODO: Implement budget update
    // if (updates.amount !== undefined && currentTransaction.budgetId) {
    //   const amountDiff = updates.amount - currentTransaction.amount;
    //   await updateBudgetSpending(currentTransaction.budgetId, amountDiff);
    // }

    // Trigger historical recalculation
    const updatedTransaction: Transaction = {
      ...currentTransaction,
      ...validatedUpdates,
      id: transactionId,
    } as Transaction;
    await triggerHistoricalRecalculation(user.uid, updatedTransaction, 'edit', currentTransaction.date);

    return true;
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
}

export async function deleteTransaction(transactionId: string): Promise<boolean> {
  try {
    const db = getFirebaseDb();
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    
    if (!db || !user) {
      throw new Error('Not authenticated');
    }

    // Get transaction before deletion
    const transaction = await getTransaction(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Soft delete using secure service
    await deleteSecureTransaction(transactionId, user.uid);
    
    // Create audit log
    const auditEntry = createAuditEntry(
      'DELETE',
      user.uid,
      transactionId,
      {
        previousState: transaction as Partial<Transaction>,
        metadata: {
          userAgent: navigator.userAgent,
        },
      }
    );

    // Update budget if needed
    // TODO: Implement budget update
    // if (transaction.budgetId && transaction.type === 'expense') {
    //   await updateBudgetSpending(transaction.budgetId, -transaction.amount);
    // }

    // Trigger historical recalculation
    await triggerHistoricalRecalculation(user.uid, transaction, 'delete');

    return true;
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
}

export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  try {
    const db = getFirebaseDb();
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    
    if (!db || !user) {
      return null;
    }

    return await getSecureTransaction(transactionId, user.uid);
  } catch (error) {
    console.error('Error getting transaction:', error);
    return null;
  }
}

export async function getUserTransactions(
  userId: string,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    type?: Transaction['type'];
    categoryId?: string;
  }
): Promise<Transaction[]> {
  try {
    const db = getFirebaseDb();
    if (!db) {
      return [];
    }

    // Map filters to match getSecureTransactions expectations
    const secureFilters = filters ? {
      startDate: filters.startDate,
      endDate: filters.endDate,
      // Only pass income/expense types to getSecureTransactions
      type: (filters.type === 'income' || filters.type === 'expense') ? filters.type : undefined,
      category: filters.categoryId, // Map categoryId to category
    } : undefined;

    return await getSecureTransactions(userId, secureFilters);
  } catch (error) {
    console.error('Error getting user transactions:', error);
    return [];
  }
}

// Add real-time listener with conflict monitoring
export function subscribeToTransactions(
  userId: string,
  callback: (transactions: Transaction[], changes?: {
    added: Transaction[];
    modified: Transaction[];
    removed: Transaction[];
  }) => void
): Unsubscribe {
  const db = getFirebaseDb();
  if (!db) {
    return () => {};
  }

  const transactionsRef = collection(db, 'transactions');
  const q = query(
    transactionsRef,
    where('userId', '==', userId),
    where('deleted', '!=', true),
    orderBy('deleted'),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const transactions: Transaction[] = [];
    const changes = {
      added: [] as Transaction[],
      modified: [] as Transaction[],
      removed: [] as Transaction[],
    };

    snapshot.docChanges().forEach((change) => {
      const data = change.doc.data();
      const transaction = {
        id: change.doc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Transaction;

      if (change.type === 'added') {
        changes.added.push(transaction);
      } else if (change.type === 'modified') {
        changes.modified.push(transaction);
      } else if (change.type === 'removed') {
        changes.removed.push(transaction);
      }
    });

    snapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Transaction);
    });

    callback(transactions, changes);
  });
}

// Export formatting utility for UI
export { formatCurrency };

// Add utility to check if transaction can be edited
export async function canEditTransaction(transactionId: string): Promise<{
  canEdit: boolean;
  reason?: string;
  lockedBy?: string;
}> {
  try {
    const db = getFirebaseDb();
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    
    if (!db || !user) {
      return { canEdit: false, reason: 'Not authenticated' };
    }

    const docRef = doc(db, 'transactions', transactionId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return { canEdit: false, reason: 'Transaction not found' };
    }

    const data = docSnap.data() as TransactionWithLocking;

    // Check if locked
    if (data.lockedBy && data.lockedBy !== user.uid) {
      const lockExpiry = data.lockExpiry instanceof Timestamp 
        ? data.lockExpiry.toDate() 
        : data.lockExpiry;
      
      if (lockExpiry && lockExpiry > new Date()) {
        return {
          canEdit: false,
          reason: `Locked by another user until ${lockExpiry.toLocaleString()}`,
          lockedBy: data.lockedBy,
        };
      }
    }

    return { canEdit: true };
  } catch (error) {
    console.error('Error checking edit permission:', error);
    return { canEdit: false, reason: 'Error checking permissions' };
  }
} 