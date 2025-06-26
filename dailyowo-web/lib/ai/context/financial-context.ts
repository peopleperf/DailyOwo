import { budgetService } from '@/lib/firebase/budget-service';
import { db as adminDb } from '@/lib/firebase/firebaseAdmin';
import { Transaction } from '@/types/transaction';
import { Goal } from '@/types/goal';
import type { BudgetData } from '@/lib/financial-logic/budget-logic';
import { Asset, Liability } from '@/types';
import { safeToDate } from '@/lib/utils/date-utils';
import { calculateNetWorth } from '@/lib/financial-logic/networth-logic';
import { calculateIncomeData } from '@/lib/financial-logic/income-logic';
import { calculateExpensesData } from '@/lib/financial-logic/expenses-logic';

// ========= INTERFACES =========

export interface ComprehensiveFinancialContext {
  userProfile: any;
  transactions: {
    all: Transaction[];
    byCategory: Record<string, Transaction[]>;
    recent30Days: Transaction[];
    recent90Days: Transaction[];
    recent12Months: Transaction[];
    income: Transaction[];
    expenses: Transaction[];
    savings: Transaction[];
    investments: Transaction[];
    totalCount: number;
    dateRange: { earliest: Date; latest: Date; };
  };
  budgets: {
    current: BudgetData | null;
    history: any[];
    categories: any[];
    health: any;
    performance: any[];
  };
  goals: {
    all: Goal[];
    active: Goal[];
    completed: Goal[];
    overdue: Goal[];
    byPriority: Record<string, Goal[]>;
    totalTargetAmount: number;
    totalCurrentAmount: number;
    overallProgress: number;
  };
  portfolio: any;
  assets: {
    all: Asset[];
    totalValue: number;
    byType: Record<string, number>;
  };
  liabilities: {
    all: Liability[];
    totalBalance: number;
    byType: Record<string, number>;
  };
  metrics: any;
  spendingAnalysis: {
    topCategories: any[];
    monthlyTrends: Record<string, number>;
    unusualSpending: any[];
    averageTransactionSize: number;
    frequentMerchants: any[];
  };
  appContext: any;
  aiInsights: any;
}

// ========= HELPER FUNCTIONS =========

const detectUnusualSpending = (transactionsByCategory: Record<string, Transaction[]>) => {
  const unusualSpending: any[] = [];
  const SIGNIFICANCE_THRESHOLD = 2;

  for (const category in transactionsByCategory) {
    const transactions = transactionsByCategory[category].filter(t => t.amount < 0);
    if (transactions.length < 5) continue;

    const amounts = transactions.map(t => Math.abs(t.amount));
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const mean = totalAmount / amounts.length;
    const stdDev = Math.sqrt(amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / amounts.length);

    transactions.forEach(transaction => {
      const deviation = stdDev > 0 ? Math.abs(Math.abs(transaction.amount) - mean) / stdDev : 0;
      if (deviation > SIGNIFICANCE_THRESHOLD) {
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (deviation > 3.5) severity = 'high';
        else if (deviation > 2.5) severity = 'medium';
        unusualSpending.push({ transaction, reason: `Transaction of ${Math.abs(transaction.amount)} is ${deviation.toFixed(1)}x the average for ${category}.`, severity });
      }
    });
  }
  return unusualSpending;
};

const calculateFrequentMerchants = (transactions: Transaction[]) => {
  const merchantData: Record<string, { frequency: number; totalAmount: number; }> = {};
  transactions.forEach(t => {
    const merchant = t.merchant || 'Unknown Merchant';
    if (merchant === 'Unknown Merchant') return;
    if (!merchantData[merchant]) {
      merchantData[merchant] = { frequency: 0, totalAmount: 0 };
    }
    merchantData[merchant].frequency++;
    merchantData[merchant].totalAmount += Math.abs(t.amount);
  });
  return Object.entries(merchantData).map(([merchant, data]) => ({ merchant, ...data })).sort((a, b) => b.frequency - a.frequency).slice(0, 10);
};

// ========= MAIN FUNCTION =========

export async function getComprehensiveFinancialContext(userId: string): Promise<ComprehensiveFinancialContext> {
  try {
    if (!adminDb) {
      console.error('[AI Context] CRITICAL: Firebase Admin DB not available. Cannot fetch context.');
      throw new Error('Admin database connection failed');
    }

    // Step 1: Fetch User Profile
    let userProfileData: any = {};
    try {
      const userProfileRef = adminDb.collection('users').doc(userId);
      const userProfileSnap = await userProfileRef.get();
      userProfileData = userProfileSnap.exists ? userProfileSnap.data() : {};
    } catch (e) {
      console.error('[AI Context] ERROR fetching user profile:', e);
      throw e;
    }

    // Step 2: Fetch Transactions
    let allTransactions: Transaction[] = [];
    try {
      const transactionsRef = adminDb.collection('users').doc(userId).collection('transactions');
      const transactionsSnapshot = await transactionsRef.orderBy('date', 'desc').get();
      allTransactions = transactionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: safeToDate(data.date) || new Date(), // Fallback to now if date is invalid
        } as Transaction;
      });
    } catch (e) {
      console.error('[AI Context] ERROR fetching transactions:', e);
      throw e;
    }

    // Step 3: Fetch Budgets (using Admin SDK directly)
    let budgetData: any = null;
    try {
      const budgetsRef = adminDb.collection('users').doc(userId).collection('budgets');
      const budgetSnapshot = await budgetsRef.where('isActive', '==', true).limit(1).get();
      if (!budgetSnapshot.empty) {
        budgetData = { currentBudget: budgetSnapshot.docs[0].data() };
      }
    } catch (e) {
      console.warn('[AI Context] Could not fetch budget data, continuing without budget info');
      budgetData = null;
    }

    // Step 4: Fetch Goals
    let allGoals: Goal[] = [];
    try {
      const goalsRef = adminDb.collection('users').doc(userId).collection('goals');
      const goalsSnapshot = await goalsRef.orderBy('targetDate', 'desc').get();
      allGoals = goalsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          targetDate: safeToDate(data.targetDate) || new Date(),
        } as Goal;
      });
    } catch (e) {
      console.error('[AI Context] ERROR fetching goals:', e);
      // Continue without goals
    }

    // Step 5: Process and structure the data
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const transactionsByCategory = allTransactions.reduce((acc, t) => {
      const category = t.categoryId || 'uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);

    const totalIncome = allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    // Use existing financial logic calculations
    const netWorthData = calculateNetWorth(allTransactions);
    const incomeData = calculateIncomeData(allTransactions, new Date(Date.now() - 30*24*60*60*1000), new Date());
    const expensesData = calculateExpensesData(allTransactions, new Date(Date.now() - 30*24*60*60*1000), new Date());
    
    // Legacy calculations for backward compatibility
    const finalTotalIncome = allTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const finalTotalExpenses = allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    

    // Return the complete and structured context
    return {
      userProfile: userProfileData,
      transactions: {
        all: allTransactions,
        byCategory: transactionsByCategory,
        recent30Days: allTransactions.filter(t => t.date > thirtyDaysAgo),
        recent90Days: allTransactions.filter(t => t.date > ninetyDaysAgo),
        recent12Months: allTransactions.filter(t => t.date > twelveMonthsAgo),
        income: allTransactions.filter(t => t.type === 'income'),
        expenses: allTransactions.filter(t => t.type === 'expense'),
        savings: allTransactions.filter(t => (t as any).categoryType === 'savings'),
        investments: allTransactions.filter(t => (t as any).categoryType === 'investment'),
        totalCount: allTransactions.length,
        dateRange: {
          earliest: allTransactions.length > 0 ? allTransactions[allTransactions.length - 1].date : new Date(),
          latest: allTransactions.length > 0 ? allTransactions[0].date : new Date(),
        }
      },
      budgets: {
        current: budgetData,
        history: [], // Placeholder for historical budget data
        categories: budgetData?.currentBudget?.categories || [],
        health: budgetData?.budgetHealth || { score: 0, status: 'poor', suggestions: [] },
        performance: [], // Placeholder for budget performance data
      },
      goals: {
        all: allGoals,
        active: allGoals.filter(g => g.status === 'active'),
        completed: allGoals.filter(g => g.status === 'completed'),
        overdue: allGoals.filter(g => g.status === 'active' && g.targetDate < now),
        byPriority: allGoals.reduce((acc, g) => {
          const priority = g.priority || 'medium';
          if (!acc[priority]) {
            acc[priority] = [];
          }
          acc[priority].push(g);
          return acc;
        }, {} as Record<string, Goal[]>),
        totalTargetAmount: allGoals.reduce((sum, g) => sum + g.targetAmount, 0),
        totalCurrentAmount: allGoals.reduce((sum, g) => sum + g.currentAmount, 0),
        overallProgress: allGoals.reduce((sum, g) => sum + g.currentAmount, 0) / allGoals.reduce((sum, g) => sum + g.targetAmount, 1),
      },
      portfolio: {}, // Placeholder for portfolio data
      assets: { all: [], totalValue: 0, byType: {} }, // Placeholder for asset data
      liabilities: { all: [], totalBalance: 0, byType: {} }, // Placeholder for liability data
      metrics: {
        netWorth: { 
          current: netWorthData.netWorth, 
          trend: 'stable', 
          monthlyChange: netWorthData.netWorthGrowth || 0, 
          yearOverYear: 0 
        },
        cashFlow: {
          monthly: { 
            income: incomeData.monthlyIncome, 
            expenses: expensesData.monthlyExpenses, 
            savings: incomeData.monthlyIncome - expensesData.monthlyExpenses, 
            netFlow: incomeData.monthlyIncome - expensesData.monthlyExpenses 
          },
          yearly: { 
            income: incomeData.totalIncome, 
            expenses: expensesData.totalExpenses, 
            savings: incomeData.totalIncome - expensesData.totalExpenses, 
            netFlow: incomeData.totalIncome - expensesData.totalExpenses 
          }
        },
        savingsRate: { 
          current: incomeData.totalIncome > 0 ? ((incomeData.totalIncome - expensesData.totalExpenses) / incomeData.totalIncome * 100) : 0, 
          target: 20, 
          trend: 'stable', 
          last6Months: [] 
        },
        debtToIncome: { ratio: 0, monthlyDebtPayments: 0, status: 'healthy' },
        emergencyFund: netWorthData.emergencyFundDetails,
        financialHealth: { overallScore: 50, scores: { budgeting: 0, saving: 0, investing: 0, debtManagement: 0, emergencyPreparedness: 0 }, recommendations: [] }
      },
      spendingAnalysis: {
        topCategories: Object.entries(transactionsByCategory).sort(([, a], [, b]) => b.length - a.length).slice(0, 5).map(([category]) => category),
        monthlyTrends: {}, // Placeholder for monthly trend data
        unusualSpending: detectUnusualSpending(transactionsByCategory),
        averageTransactionSize: allTransactions.length > 0 ? allTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / allTransactions.length : 0,
        frequentMerchants: calculateFrequentMerchants(allTransactions),
      },
      appContext: {
        memberSince: safeToDate(userProfileData.createdAt) || new Date(),
        lastActive: safeToDate(userProfileData.lastActive) || new Date(),
        transactionCount: allTransactions.length,
        budgetCount: budgetData.currentBudget ? 1 : 0,
        goalCount: allGoals.length,
        featuresUsed: [],
        onboardingCompleted: userProfileData.onboardingCompleted || false,
        premiumStatus: userProfileData.premiumStatus || false,
        familyMembers: 0,
      },
      aiInsights: {
        lastGeneratedAt: new Date(),
        confidence: 0.8,
        dataQuality: allTransactions.length > 10 ? 'good' : 'poor',
        dataCompleteness: Math.min(1, allTransactions.length / 50),
        recommendedActions: []
      }
    };
  } catch (error) {
    console.error('[AI Context] CRITICAL FAILURE: Could not build financial context. Returning fallback.', error);
    return {
      userProfile: { monthlyIncome: 0, currentSavings: 0, currentDebt: 0, age: 'unknown', currency: 'USD', region: 'US', financialGoals: [], expenseBreakdown: {}, riskTolerance: 'moderate', investmentExperience: 'beginner' },
      transactions: { all: [], byCategory: {}, recent30Days: [], recent90Days: [], recent12Months: [], income: [], expenses: [], savings: [], investments: [], totalCount: 0, dateRange: { earliest: new Date(), latest: new Date() } },
      budgets: { current: null, history: [], categories: [], health: { score: 0, status: 'poor', suggestions: ['No budget data available'] }, performance: [] },
      goals: { all: [], active: [], completed: [], overdue: [], byPriority: {}, totalTargetAmount: 0, totalCurrentAmount: 0, overallProgress: 0 },
      portfolio: { totalValue: 0, totalCost: 0, totalReturn: 0, totalReturnPercentage: 0, holdings: [], assetAllocation: {}, diversificationScore: 0 },
      assets: { all: [], totalValue: 0, byType: {} },
      liabilities: { all: [], totalBalance: 0, byType: {} },
      metrics: { netWorth: { current: 0, trend: 'stable', monthlyChange: 0, yearOverYear: 0 }, cashFlow: { monthly: { income: 0, expenses: 0, savings: 0, netFlow: 0 }, yearly: { income: 0, expenses: 0, savings: 0, netFlow: 0 } }, savingsRate: { current: 0, target: 20, trend: 'stable', last6Months: [] }, debtToIncome: { ratio: 0, monthlyDebtPayments: 0, status: 'healthy' }, emergencyFund: { currentAmount: 0, monthsOfExpensesCovered: 0, recommendedAmount: 0, isAdequate: false }, financialHealth: { overallScore: 50, scores: { budgeting: 0, saving: 0, investing: 0, debtManagement: 0, emergencyPreparedness: 0 }, recommendations: ['Complete your financial setup to get personalized insights'] } },
      spendingAnalysis: { topCategories: [], monthlyTrends: {}, unusualSpending: [], averageTransactionSize: 0, frequentMerchants: [] },
      appContext: { memberSince: new Date(), lastActive: new Date(), transactionCount: 0, budgetCount: 0, goalCount: 0, featuresUsed: [], onboardingCompleted: false, premiumStatus: false, familyMembers: 0 },
      aiInsights: { lastGeneratedAt: new Date(), confidence: 0.3, dataQuality: 'poor', dataCompleteness: 0, recommendedActions: ['Add transactions to get better insights', 'Complete onboarding', 'Set up budget'] },
    };
  }
}

export async function getBasicUserFinancialData(userId: string): Promise<{ userProfile: any; transactions: any[]; totalTransactions: number; monthlyIncome: number; hasData: boolean; }> {
  try {
    if (!adminDb) return { userProfile: {}, transactions: [], totalTransactions: 0, monthlyIncome: 0, hasData: false };
    const userRef = adminDb.collection('users').doc(userId);
    const userSnap = await userRef.get();
    const userProfileData = userSnap.exists ? userSnap.data() : {};
    const transactionsRef = adminDb.collection('users').doc(userId).collection('transactions');
    const transactionsSnapshot = await transactionsRef.get();
    const allTransactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const monthlyIncome = parseFloat(userProfileData?.monthlyIncome) || 0;
    const hasData = allTransactions.length > 0 || monthlyIncome > 0;
    return { userProfile: userProfileData, transactions: allTransactions, totalTransactions: allTransactions.length, monthlyIncome, hasData };
  } catch (error) {
    console.error('[AI Context] Error fetching basic user data:', error);
    return { userProfile: {}, transactions: [], totalTransactions: 0, monthlyIncome: 0, hasData: false };
  }
}

export async function getFinancialContext(userId: string): Promise<any> {
  try {
    const comprehensive = await getComprehensiveFinancialContext(userId);
    return {
      budgets: comprehensive.budgets.categories.map((cat: any) => ({ id: cat.id, name: cat.name, type: cat.type, allocated: cat.allocated, spent: cat.spent, remaining: cat.remaining, isOverBudget: cat.isOverBudget })),
      transactions: comprehensive.transactions.recent30Days.map((t: any) => ({ amount: t.amount, category: t.categoryId || 'uncategorized', date: t.date?.toISOString() || new Date().toISOString(), description: t.description || '' })),
      netWorth: comprehensive.metrics.netWorth.current,
      cashFlow: { income: comprehensive.metrics.cashFlow.monthly.income, expenses: comprehensive.metrics.cashFlow.monthly.expenses, savings: comprehensive.metrics.cashFlow.monthly.savings },
    };
  } catch (error) {
    console.error('Failed to get legacy financial context:', error);
    return { budgets: [], transactions: [], netWorth: 0, cashFlow: { income: 0, expenses: 0, savings: 0 } };
  }
}