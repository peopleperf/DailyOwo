import { Transaction } from '@/types/transaction';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';

/**
 * Account Reconciliation System
 * Handles monthly closing, balance verification, and discrepancy detection
 */

export interface ReconciliationRecord {
  id?: string;
  userId: string;
  accountId: string;
  accountName: string;
  period: {
    month: number;
    year: number;
    startDate: Date;
    endDate: Date;
  };
  balances: {
    opening: number;
    closing: number;
    calculated: number;
    stated: number;
    difference: number;
  };
  transactions: {
    count: number;
    totalDebits: number;
    totalCredits: number;
    largestDebit: Transaction | null;
    largestCredit: Transaction | null;
  };
  status: 'pending' | 'reconciled' | 'discrepancy' | 'adjusted';
  discrepancies: ReconciliationDiscrepancy[];
  adjustments: ReconciliationAdjustment[];
  reconciledAt?: Date;
  reconciledBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReconciliationDiscrepancy {
  type: 'missing_transaction' | 'duplicate' | 'amount_mismatch' | 'date_issue' | 'category_error';
  description: string;
  amount?: number;
  transactionId?: string;
  suggestedAction?: string;
}

export interface ReconciliationAdjustment {
  type: 'manual_adjustment' | 'correction' | 'bank_fee' | 'interest' | 'other';
  description: string;
  amount: number;
  appliedAt: Date;
  appliedBy: string;
}

export interface ReconciliationSummary {
  totalAccounts: number;
  reconciledAccounts: number;
  pendingAccounts: number;
  discrepancyAccounts: number;
  totalDiscrepancyAmount: number;
  lastReconciliationDate?: Date;
}

/**
 * Get the period boundaries for a given month/year
 */
function getPeriodBoundaries(month: number, year: number): { startDate: Date; endDate: Date } {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

/**
 * Calculate the expected closing balance based on transactions
 */
async function calculateExpectedBalance(
  accountId: string,
  userId: string,
  openingBalance: number,
  startDate: Date,
  endDate: Date
): Promise<{
  calculatedBalance: number;
  transactionSummary: ReconciliationRecord['transactions'];
}> {
  const db = await getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not initialized');
  }

  const transactionsQuery = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    where('accountId', '==', accountId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(transactionsQuery);
  
  let totalDebits = 0;
  let totalCredits = 0;
  let largestDebit: Transaction | null = null;
  let largestCredit: Transaction | null = null;

  snapshot.forEach((doc) => {
    const transaction = { id: doc.id, ...doc.data() } as Transaction;
    
    if (transaction.type === 'expense') {
      totalDebits += transaction.amount;
      if (!largestDebit || transaction.amount > largestDebit.amount) {
        largestDebit = transaction;
      }
    } else if (transaction.type === 'income') {
      totalCredits += transaction.amount;
      if (!largestCredit || transaction.amount > largestCredit.amount) {
        largestCredit = transaction;
      }
    }
  });

  const calculatedBalance = openingBalance + totalCredits - totalDebits;

  return {
    calculatedBalance,
    transactionSummary: {
      count: snapshot.size,
      totalDebits,
      totalCredits,
      largestDebit,
      largestCredit,
    },
  };
}

/**
 * Detect common reconciliation discrepancies
 */
async function detectDiscrepancies(
  accountId: string,
  userId: string,
  period: { startDate: Date; endDate: Date },
  balanceDifference: number
): Promise<ReconciliationDiscrepancy[]> {
  const db = await getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not initialized');
  }

  const discrepancies: ReconciliationDiscrepancy[] = [];

  // Check for balance difference
  if (Math.abs(balanceDifference) > 0.01) {
    discrepancies.push({
      type: 'amount_mismatch',
      description: `Balance difference of ${Math.abs(balanceDifference).toFixed(2)}`,
      amount: balanceDifference,
      suggestedAction: balanceDifference > 0 
        ? 'Check for missing expense transactions'
        : 'Check for missing income transactions or duplicate expenses',
    });
  }

  // Check for duplicate transactions
  const duplicatesQuery = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    where('accountId', '==', accountId),
    where('date', '>=', period.startDate),
    where('date', '<=', period.endDate)
  );

  const transactions = await getDocs(duplicatesQuery);
  const transactionMap = new Map<string, Transaction[]>();

  transactions.forEach((doc) => {
    const transaction = { id: doc.id, ...doc.data() } as Transaction;
    const key = `${transaction.amount}-${transaction.date.getTime()}-${transaction.description}`;
    
    if (!transactionMap.has(key)) {
      transactionMap.set(key, []);
    }
    transactionMap.get(key)!.push(transaction);
  });

  // Find potential duplicates
  transactionMap.forEach((transactions, key) => {
    if (transactions.length > 1) {
      discrepancies.push({
        type: 'duplicate',
        description: `Potential duplicate transactions: ${transactions[0].description}`,
        amount: transactions[0].amount,
        transactionId: transactions.map(t => t.id).join(', '),
        suggestedAction: 'Review and merge duplicate transactions',
      });
    }
  });

  // Check for uncategorized transactions
  const uncategorizedQuery = query(
    collection(db, 'transactions'),
    where('userId', '==', userId),
    where('accountId', '==', accountId),
    where('date', '>=', period.startDate),
    where('date', '<=', period.endDate),
    where('category', '==', '')
  );

  const uncategorized = await getDocs(uncategorizedQuery);
  if (!uncategorized.empty) {
    discrepancies.push({
      type: 'category_error',
      description: `${uncategorized.size} uncategorized transactions found`,
      suggestedAction: 'Categorize all transactions for accurate reporting',
    });
  }

  return discrepancies;
}

/**
 * Create a reconciliation record for an account
 */
export async function createReconciliation(
  userId: string,
  accountId: string,
  accountName: string,
  month: number,
  year: number,
  statedBalance: number,
  openingBalance: number
): Promise<ReconciliationRecord> {
  try {
    const db = await getFirebaseDb();
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    const { startDate, endDate } = getPeriodBoundaries(month, year);
    
    // Calculate expected balance
    const { calculatedBalance, transactionSummary } = await calculateExpectedBalance(
      accountId,
      userId,
      openingBalance,
      startDate,
      endDate
    );

    const balanceDifference = statedBalance - calculatedBalance;

    // Detect discrepancies
    const discrepancies = await detectDiscrepancies(
      accountId,
      userId,
      { startDate, endDate },
      balanceDifference
    );

    const reconciliation: ReconciliationRecord = {
      userId,
      accountId,
      accountName,
      period: {
        month,
        year,
        startDate,
        endDate,
      },
      balances: {
        opening: openingBalance,
        closing: statedBalance,
        calculated: calculatedBalance,
        stated: statedBalance,
        difference: balanceDifference,
      },
      transactions: transactionSummary,
      status: Math.abs(balanceDifference) < 0.01 ? 'reconciled' : 'discrepancy',
      discrepancies,
      adjustments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to Firestore
    const docRef = await addDoc(collection(db, 'reconciliations'), {
      ...reconciliation,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { ...reconciliation, id: docRef.id };
  } catch (error) {
    console.error('Error creating reconciliation:', error);
    throw error;
  }
}

/**
 * Mark a reconciliation as complete
 */
export async function completeReconciliation(
  reconciliationId: string,
  userId: string,
  adjustments?: ReconciliationAdjustment[]
): Promise<void> {
  try {
    const db = await getFirebaseDb();
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    const updates: any = {
      status: 'reconciled',
      reconciledAt: serverTimestamp(),
      reconciledBy: userId,
      updatedAt: serverTimestamp(),
    };

    if (adjustments && adjustments.length > 0) {
      updates.adjustments = adjustments;
      updates.status = 'adjusted';
    }

    await updateDoc(doc(db, 'reconciliations', reconciliationId), updates);
  } catch (error) {
    console.error('Error completing reconciliation:', error);
    throw error;
  }
}

/**
 * Get reconciliation history for an account
 */
export async function getReconciliationHistory(
  accountId: string,
  userId: string,
  maxResults?: number
): Promise<ReconciliationRecord[]> {
  try {
    const db = await getFirebaseDb();
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    let reconciliationQuery = query(
      collection(db, 'reconciliations'),
      where('userId', '==', userId),
      where('accountId', '==', accountId),
      orderBy('period.year', 'desc'),
      orderBy('period.month', 'desc')
    );

    if (maxResults) {
      reconciliationQuery = query(reconciliationQuery, limit(maxResults));
    }

    const snapshot = await getDocs(reconciliationQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      reconciledAt: doc.data().reconciledAt?.toDate(),
    } as ReconciliationRecord));
  } catch (error) {
    console.error('Error getting reconciliation history:', error);
    throw error;
  }
}

/**
 * Get reconciliation summary for all accounts
 */
export async function getReconciliationSummary(
  userId: string,
  month: number,
  year: number
): Promise<ReconciliationSummary> {
  try {
    const db = await getFirebaseDb();
    if (!db) {
      throw new Error('Firebase is not initialized');
    }

    const reconciliationsQuery = query(
      collection(db, 'reconciliations'),
      where('userId', '==', userId),
      where('period.month', '==', month),
      where('period.year', '==', year)
    );

    const snapshot = await getDocs(reconciliationsQuery);
    
    let totalAccounts = 0;
    let reconciledAccounts = 0;
    let pendingAccounts = 0;
    let discrepancyAccounts = 0;
    let totalDiscrepancyAmount = 0;
    let lastReconciliationDate: Date | undefined;

    snapshot.forEach((doc) => {
      const record = doc.data() as ReconciliationRecord;
      totalAccounts++;

      switch (record.status) {
        case 'reconciled':
        case 'adjusted':
          reconciledAccounts++;
          break;
        case 'pending':
          pendingAccounts++;
          break;
        case 'discrepancy':
          discrepancyAccounts++;
          totalDiscrepancyAmount += Math.abs(record.balances.difference);
          break;
      }

      if (record.reconciledAt) {
        const reconciledDate = record.reconciledAt;
        if (!lastReconciliationDate || reconciledDate > lastReconciliationDate) {
          lastReconciliationDate = reconciledDate;
        }
      }
    });

    return {
      totalAccounts,
      reconciledAccounts,
      pendingAccounts,
      discrepancyAccounts,
      totalDiscrepancyAmount,
      lastReconciliationDate,
    };
  } catch (error) {
    console.error('Error getting reconciliation summary:', error);
    throw error;
  }
}

/**
 * Auto-reconcile accounts with matching balances
 */
export async function autoReconcile(
  userId: string,
  accounts: Array<{ id: string; name: string; balance: number }>,
  month: number,
  year: number
): Promise<{
  successful: number;
  failed: number;
  results: Array<{ accountId: string; status: string; error?: string }>;
}> {
  const results: Array<{ accountId: string; status: string; error?: string }> = [];
  let successful = 0;
  let failed = 0;

  for (const account of accounts) {
    try {
      // Get last reconciliation to find opening balance
      const lastReconciliation = await getLastReconciliation(account.id, userId, month, year);
      const openingBalance = lastReconciliation?.balances.closing || 0;

      const reconciliation = await createReconciliation(
        userId,
        account.id,
        account.name,
        month,
        year,
        account.balance,
        openingBalance
      );

      if (reconciliation.status === 'reconciled') {
        await completeReconciliation(reconciliation.id!, userId);
        successful++;
        results.push({ accountId: account.id, status: 'reconciled' });
      } else {
        results.push({ 
          accountId: account.id, 
          status: 'discrepancy',
          error: `Balance difference: ${reconciliation.balances.difference.toFixed(2)}` 
        });
      }
    } catch (error) {
      failed++;
      results.push({ 
        accountId: account.id, 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  return { successful, failed, results };
}

/**
 * Get the last reconciliation for opening balance
 */
async function getLastReconciliation(
  accountId: string,
  userId: string,
  currentMonth: number,
  currentYear: number
): Promise<ReconciliationRecord | null> {
  const db = await getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not initialized');
  }

  // Calculate previous month
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  
  if (prevMonth === 0) {
    prevMonth = 12;
    prevYear--;
  }

  const lastReconciliationQuery = query(
    collection(db, 'reconciliations'),
    where('userId', '==', userId),
    where('accountId', '==', accountId),
    where('period.month', '==', prevMonth),
    where('period.year', '==', prevYear),
    limit(1)
  );

  const snapshot = await getDocs(lastReconciliationQuery);
  
  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    reconciledAt: doc.data().reconciledAt?.toDate(),
  } as ReconciliationRecord;
}
