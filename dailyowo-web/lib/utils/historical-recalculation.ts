import { Transaction } from '@/types/transaction';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  Timestamp,
  limit
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';

/**
 * Historical Recalculation System
 * Recalculates all financial metrics when past transactions are modified
 */

export interface HistoricalSnapshot {
  id?: string;
  userId: string;
  date: Date;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  metrics: {
    netWorth: number;
    totalAssets: number;
    totalLiabilities: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    savingsRate: number;
    financialHealthScore: number;
    emergencyFundMonths: number;
    debtToIncomeRatio: number;
  };
  accounts: {
    [accountId: string]: {
      balance: number;
      transactionCount: number;
    };
  };
  categories: {
    income: { [category: string]: number };
    expenses: { [category: string]: number };
  };
  calculatedAt: Date;
  version: number;
}

export interface RecalculationJob {
  id?: string;
  userId: string;
  triggerType: 'transaction_edit' | 'transaction_delete' | 'transaction_add' | 'manual';
  affectedDateRange: {
    start: Date;
    end: Date;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    total: number;
    completed: number;
    currentDate?: Date;
  };
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

/**
 * Determine the date range that needs recalculation
 */
export function getAffectedDateRange(
  transaction: Transaction,
  previousDate?: Date
): { start: Date; end: Date } {
  const dates = [transaction.date];
  if (previousDate) {
    dates.push(previousDate);
  }

  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const today = new Date();

  // Start from the beginning of the month of the earliest affected date
  const start = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
  
  // End at the end of the current month
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  return { start, end };
}

/**
 * Create a recalculation job
 */
export async function createRecalculationJob(
  userId: string,
  triggerType: RecalculationJob['triggerType'],
  affectedDateRange: { start: Date; end: Date }
): Promise<string> {
  const db = await getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not initialized');
  }

  const job: RecalculationJob = {
    userId,
    triggerType,
    affectedDateRange,
    status: 'pending',
    progress: {
      total: 0,
      completed: 0,
    },
    createdAt: new Date(),
  };

  const docRef = await addDoc(collection(db, 'recalculationJobs'), {
    ...job,
    createdAt: serverTimestamp(),
  });

  // Start processing the job
  processRecalculationJob(docRef.id, userId, affectedDateRange);

  return docRef.id;
}

/**
 * Process a recalculation job
 */
async function processRecalculationJob(
  jobId: string,
  userId: string,
  dateRange: { start: Date; end: Date }
): Promise<void> {
  const db = await getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not initialized');
  }

  try {
    // Update job status to processing
    const jobRef = doc(db, 'recalculationJobs', jobId);
    await updateDoc(jobRef, {
      status: 'processing',
      startedAt: serverTimestamp(),
    });

    // Get all transactions in the affected date range
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      where('date', '>=', dateRange.start),
      where('date', '<=', dateRange.end),
      orderBy('date', 'asc')
    );

    const transactionsSnapshot = await getDocs(transactionsQuery);
    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as Transaction));

    // Get all accounts for the user
    const accountsQuery = query(
      collection(db, 'accounts'),
      where('userId', '==', userId)
    );
    const accountsSnapshot = await getDocs(accountsQuery);
    const accounts = accountsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Calculate daily snapshots
    const dailySnapshots = await calculateDailySnapshots(
      userId,
      transactions,
      accounts,
      dateRange
    );

    // Calculate monthly snapshots
    const monthlySnapshots = calculateMonthlySnapshots(dailySnapshots);

    // Save all snapshots in a batch
    const batch = writeBatch(db);
    
    [...dailySnapshots, ...monthlySnapshots].forEach(snapshot => {
      const snapshotRef = doc(collection(db, 'historicalSnapshots'));
      batch.set(snapshotRef, {
        ...snapshot,
        calculatedAt: serverTimestamp(),
      });
    });

    await batch.commit();

    // Update job status to completed
    await updateDoc(jobRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      progress: {
        total: dailySnapshots.length + monthlySnapshots.length,
        completed: dailySnapshots.length + monthlySnapshots.length,
      },
    });
  } catch (error) {
    // Update job status to failed
    const jobRef = doc(db, 'recalculationJobs', jobId);
    await updateDoc(jobRef, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      completedAt: serverTimestamp(),
    });
    throw error;
  }
}

/**
 * Calculate daily snapshots for a date range
 */
async function calculateDailySnapshots(
  userId: string,
  transactions: Transaction[],
  accounts: any[],
  dateRange: { start: Date; end: Date }
): Promise<HistoricalSnapshot[]> {
  const snapshots: HistoricalSnapshot[] = [];
  const currentDate = new Date(dateRange.start);

  while (currentDate <= dateRange.end) {
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Filter transactions up to this date
    const transactionsToDate = transactions.filter(
      t => t.date <= dayEnd
    );

    // Calculate metrics for this date
    const metrics = await calculateMetricsForDate(
      userId,
      transactionsToDate,
      accounts,
      dayEnd
    );

    snapshots.push({
      userId,
      date: new Date(currentDate),
      type: 'daily',
      metrics,
      accounts: calculateAccountBalances(transactionsToDate, accounts),
      categories: calculateCategoryTotals(transactionsToDate, currentDate),
      calculatedAt: new Date(),
      version: 1,
    });

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return snapshots;
}

/**
 * Calculate monthly snapshots from daily snapshots
 */
function calculateMonthlySnapshots(
  dailySnapshots: HistoricalSnapshot[]
): HistoricalSnapshot[] {
  const monthlySnapshots: HistoricalSnapshot[] = [];
  const snapshotsByMonth = new Map<string, HistoricalSnapshot[]>();

  // Group daily snapshots by month
  dailySnapshots.forEach(snapshot => {
    const monthKey = `${snapshot.date.getFullYear()}-${snapshot.date.getMonth()}`;
    if (!snapshotsByMonth.has(monthKey)) {
      snapshotsByMonth.set(monthKey, []);
    }
    snapshotsByMonth.get(monthKey)!.push(snapshot);
  });

  // Calculate monthly averages
  snapshotsByMonth.forEach((snapshots, monthKey) => {
    const lastSnapshot = snapshots[snapshots.length - 1];
    const [year, month] = monthKey.split('-').map(Number);

    // Use the last day's snapshot for end-of-month values
    monthlySnapshots.push({
      userId: lastSnapshot.userId,
      date: new Date(year, month + 1, 0), // Last day of month
      type: 'monthly',
      metrics: lastSnapshot.metrics,
      accounts: lastSnapshot.accounts,
      categories: aggregateCategoriesForMonth(snapshots),
      calculatedAt: new Date(),
      version: 1,
    });
  });

  return monthlySnapshots;
}

/**
 * Calculate financial metrics for a specific date
 */
async function calculateMetricsForDate(
  userId: string,
  transactions: Transaction[],
  accounts: any[],
  date: Date
): Promise<HistoricalSnapshot['metrics']> {
  // Get transactions for the current month
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  const monthlyTransactions = transactions.filter(
    t => t.date >= monthStart && t.date <= monthEnd
  );

  // Calculate monthly income and expenses
  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate account balances up to this date
  const accountBalances = calculateAccountBalances(transactions, accounts);
  
  // Calculate total assets and liabilities
  const totalAssets = Object.values(accountBalances).reduce(
    (sum, account) => sum + Math.max(0, account.balance),
    0
  );

  const totalLiabilities = Math.abs(
    Object.values(accountBalances).reduce(
      (sum, account) => sum + Math.min(0, account.balance),
      0
    )
  );

  const netWorth = totalAssets - totalLiabilities;

  // Define which asset categories count as savings
  const SAVINGS_CATEGORIES = [
    'savings-account', 
    'general-savings', 
    'emergency-fund',
    'pension',
    'mutual-funds',
    'cryptocurrency',
    'retirement-401k',
    'retirement-ira'
  ];
  
  // Calculate actual savings from asset transactions
  const monthlySavings = monthlyTransactions
    .filter(t => t.type === 'asset' && SAVINGS_CATEGORIES.includes(t.categoryId as any))
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate other metrics
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
  const debtToIncomeRatio = monthlyIncome > 0 ? totalLiabilities / (monthlyIncome * 12) : 0;
  const emergencyFundMonths = monthlyExpenses > 0 ? totalAssets / monthlyExpenses : 0;

  // Calculate financial health score using simplified logic
  // Since we don't have the full complex data structures, we'll calculate a simplified score
  const netWorthScore = netWorth > 0 ? Math.min(100, (netWorth / totalAssets) * 100) : 0;
  const incomeScore = monthlyIncome > 10000 ? 100 : monthlyIncome > 5000 ? 80 : monthlyIncome > 2500 ? 60 : 40;
  const expenseScore = monthlyIncome > 0 ? Math.max(0, 100 - (monthlyExpenses / monthlyIncome) * 100) : 0;
  const savingsScore = savingsRate >= 20 ? 100 : savingsRate >= 15 ? 80 : savingsRate >= 10 ? 60 : savingsRate >= 5 ? 40 : 20;
  const debtScore = debtToIncomeRatio === 0 ? 100 : debtToIncomeRatio <= 0.36 ? 75 : debtToIncomeRatio <= 0.50 ? 50 : 25;
  
  // Use the same weights from financial constants
  const financialHealthScore = Math.round(
    netWorthScore * 0.30 +
    incomeScore * 0.25 +
    expenseScore * 0.20 +
    savingsScore * 0.15 +
    debtScore * 0.10
  );

  return {
    netWorth,
    totalAssets,
    totalLiabilities,
    monthlyIncome,
    monthlyExpenses,
    savingsRate,
    financialHealthScore,
    emergencyFundMonths,
    debtToIncomeRatio,
  };
}

/**
 * Calculate account balances based on transactions
 */
function calculateAccountBalances(
  transactions: Transaction[],
  accounts: any[]
): HistoricalSnapshot['accounts'] {
  const balances: HistoricalSnapshot['accounts'] = {};

  // Initialize with account starting balances
  accounts.forEach(account => {
    balances[account.id] = {
      balance: account.initialBalance || 0,
      transactionCount: 0,
    };
  });

  // Apply transactions
  // Note: Transaction type doesn't have accountId field, so we'll use a simplified calculation
  // In a real implementation, you'd need to extend the Transaction type or use a mapping
  transactions.forEach(transaction => {
    // For now, we'll track all transactions in a single "default" account
    const accountId = 'default';
    if (!balances[accountId]) {
      balances[accountId] = { balance: 0, transactionCount: 0 };
    }
    
    if (transaction.type === 'income') {
      balances[accountId].balance += transaction.amount;
    } else if (transaction.type === 'expense') {
      balances[accountId].balance -= transaction.amount;
    }
    balances[accountId].transactionCount++;
  });

  return balances;
}

/**
 * Calculate category totals for a specific date
 */
function calculateCategoryTotals(
  transactions: Transaction[],
  date: Date
): HistoricalSnapshot['categories'] {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  const monthlyTransactions = transactions.filter(
    t => t.date >= monthStart && t.date <= monthEnd
  );

  const categories: HistoricalSnapshot['categories'] = {
    income: {},
    expenses: {},
  };

  monthlyTransactions.forEach(transaction => {
    const categoryMap = transaction.type === 'income' ? categories.income : categories.expenses;
    const category = transaction.categoryId || 'Uncategorized';
    
    if (!categoryMap[category]) {
      categoryMap[category] = 0;
    }
    categoryMap[category] += transaction.amount;
  });

  return categories;
}

/**
 * Aggregate categories for monthly snapshot
 */
function aggregateCategoriesForMonth(
  dailySnapshots: HistoricalSnapshot[]
): HistoricalSnapshot['categories'] {
  // Use the last daily snapshot's categories for the month
  return dailySnapshots[dailySnapshots.length - 1].categories;
}

/**
 * Get historical snapshots for a date range
 */
export async function getHistoricalSnapshots(
  userId: string,
  startDate: Date,
  endDate: Date,
  type: HistoricalSnapshot['type'] = 'daily'
): Promise<HistoricalSnapshot[]> {
  const db = await getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not initialized');
  }

  const snapshotsQuery = query(
    collection(db, 'historicalSnapshots'),
    where('userId', '==', userId),
    where('type', '==', type),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(snapshotsQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate() || new Date(),
    calculatedAt: doc.data().calculatedAt?.toDate() || new Date(),
  } as HistoricalSnapshot));
}

/**
 * Trigger recalculation when a transaction is modified
 */
export async function triggerHistoricalRecalculation(
  userId: string,
  transaction: Transaction,
  triggerType: 'add' | 'edit' | 'delete',
  previousDate?: Date
): Promise<void> {
  const dateRange = getAffectedDateRange(transaction, previousDate);
  
  await createRecalculationJob(
    userId,
    `transaction_${triggerType}` as RecalculationJob['triggerType'],
    dateRange
  );
}

/**
 * Get the latest recalculation job status
 */
export async function getRecalculationStatus(
  userId: string
): Promise<RecalculationJob | null> {
  const db = await getFirebaseDb();
  if (!db) {
    throw new Error('Firebase is not initialized');
  }

  const jobsQuery = query(
    collection(db, 'recalculationJobs'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(jobsQuery);
  
  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    startedAt: doc.data().startedAt?.toDate(),
    completedAt: doc.data().completedAt?.toDate(),
  } as RecalculationJob;
}
