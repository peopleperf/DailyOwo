'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, QuerySnapshot } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';
import { safeOnSnapshot } from '@/lib/firebase/firestore-helpers';
import { useAuth } from '@/lib/firebase/auth-context';
import { Transaction } from '@/types/transaction';
import { Goal } from '@/types/goal';
import { Asset } from '@/types/asset';
import { Liability } from '@/types/liability';
import { 
  calculateNetWorth, 
  NetWorthData,
  getNetWorthTrend
} from '@/lib/financial-logic/networth-logic';
import { 
  calculateIncomeData, 
  IncomeData,
  getIncomeTrend
} from '@/lib/financial-logic/income-logic';
import { 
  calculateExpensesData, 
  ExpensesData,
  getExpenseInsights
} from '@/lib/financial-logic/expenses-logic';
import { 
  calculateSavingsRateData, 
  SavingsRateData,
  getSavingsRateTrend,
  getSavingsRateInsights
} from '@/lib/financial-logic/savings-rate-logic';
import { 
  calculateDebtRatioData, 
  DebtRatioData,
  getDebtRatioTrend,
  getDebtRatioInsights
} from '@/lib/financial-logic/debt-ratio-logic';
import { 
  calculateFinancialHealthScore, 
  FinancialHealthScore
} from '@/lib/financial-logic/financial-health-logic';

interface FinancialData {
  // Modular financial data
  netWorth: NetWorthData;
  income: IncomeData;
  expenses: ExpensesData;
  savingsRate: SavingsRateData;
  debtRatio: DebtRatioData;
  financialHealthScore: FinancialHealthScore;
  
  // Legacy fields for backward compatibility
  monthlyIncome: number;
  monthlyExpenses: number;
  netIncome: number;
  totalAssets: number;
  totalLiabilities: number;
  netWorthGrowth: number;
  incomeGrowth: number;
  expenseGrowth: number;
  emergencyFundMonths: number;
  
  // Recent transactions and goals
  recentTransactions: Transaction[];
  totalGoalsTarget: number;
  totalGoalsSaved: number;
  activeGoalsCount: number;
  
  // Loading states
  isLoading: boolean;
  error: string | null;

  // Add full transaction list for advanced consumers (AI, analytics)
  allTransactions: Transaction[];
}

export function useFinancialData(): FinancialData {
  const { user } = useAuth();

  // Individual state for each data type
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  
  const [data, setData] = useState<FinancialData>({
    // Modular financial data - initialize with empty/default values
    netWorth: {
      totalAssets: 0,
      totalLiabilities: 0,
      netWorth: 0,
      assetsByCategory: {},
      liabilitiesByCategory: {},
      assetAllocation: {
        liquid: 0,
        investments: 0,
        realEstate: 0,
        retirement: 0,
        other: 0
      },
      savingsGoals: [],
      emergencyFundDetails: {
        currentAmount: 0,
        targetAmount: 0,
        monthsCovered: 0,
        isAdequate: false
      }
    },
    income: {
      totalIncome: 0,
      monthlyIncome: 0,
      averageDailyIncome: 0,
      incomeByCategory: {},
      incomeBySource: {
        primary: 0,
        secondary: 0,
        passive: 0,
        oneTime: 0
      },
      projectedAnnualIncome: 0,
      isIncomeStable: false,
      incomeConsistency: 0
    },
    expenses: {
      totalExpenses: 0,
      monthlyExpenses: 0,
      averageDailyExpenses: 0,
      expensesByCategory: {},
      expensesByType: {
        fixed: 0,
        variable: 0,
        discretionary: 0,
        essential: 0
      },
      projectedAnnualExpenses: 0,
      averageTransactionSize: 0,
      largestExpenseCategory: '',
      spendingTrends: {
        isIncreasing: false,
        weeklyPattern: new Array(7).fill(0),
        monthlyPattern: new Array(31).fill(0)
      }
    },
    savingsRate: {
      savingsRate: 0,
      totalIncome: 0,
      totalExpenses: 0,
      totalSavings: 0,
      monthlySavings: 0,
      projectedAnnualSavings: 0,
      savingsStreak: 0,
      averageSavingsRate: 0,
      savingsByType: {
        emergencyFund: 0,
        retirement: 0,
        investments: 0,
        generalSavings: 0
      },
      savingsGoals: []
    },
    debtRatio: {
      debtToIncomeRatio: 0,
      monthlyDebtPayments: 0,
      monthlyIncome: 0,
      totalDebtBalance: 0,
      originalDebtBalance: 0,
      totalDebtPaid: 0,
      debtServiceRatio: 0,
      debtPayoffTime: 0,
      totalInterestCost: 0,
      averageInterestRate: 0,
      highestInterestDebt: null,
      debtsByCategory: [],
      debtSnowball: [],
      debtAvalanche: []
    },
    financialHealthScore: {
      score: 0,
      rating: 'critical',
      summary: '',
      recommendations: [],
      componentScores: {
        netWorth: 0,
        savings: 0,
        debt: 0,
        income: 0,
        spending: 0
      }
    },
    // Legacy fields
    monthlyIncome: 0,
    monthlyExpenses: 0,
    netIncome: 0,
    totalAssets: 0,
    totalLiabilities: 0,
    netWorthGrowth: 0,
    incomeGrowth: 0,
    expenseGrowth: 0,
    emergencyFundMonths: 0,
    recentTransactions: [],
    totalGoalsTarget: 0,
    totalGoalsSaved: 0,
    activeGoalsCount: 0,
    isLoading: true,
    error: null,
    allTransactions: [] // Initialize with empty array
  });

  // Effect for fetching data when user changes
  useEffect(() => {
    if (!user) {
      // Reset all states when user logs out
      setTransactions([]);
      setGoals([]);
      setAssets([]);
      setLiabilities([]);
      setData({
        netWorth: {
          totalAssets: 0,
          totalLiabilities: 0,
          netWorth: 0,
          assetsByCategory: {},
          liabilitiesByCategory: {},
          assetAllocation: {
            liquid: 0,
            investments: 0,
            realEstate: 0,
            retirement: 0,
            other: 0
          },
          savingsGoals: [],
          emergencyFundDetails: {
            currentAmount: 0,
            targetAmount: 0,
            monthsCovered: 0,
            isAdequate: false
          }
        },
        income: {
          totalIncome: 0,
          monthlyIncome: 0,
          averageDailyIncome: 0,
          incomeByCategory: {},
          incomeBySource: {
            primary: 0,
            secondary: 0,
            passive: 0,
            oneTime: 0
          },
          projectedAnnualIncome: 0,
          isIncomeStable: false,
          incomeConsistency: 0
        },
        expenses: {
          totalExpenses: 0,
          monthlyExpenses: 0,
          averageDailyExpenses: 0,
          expensesByCategory: {},
          expensesByType: {
            fixed: 0,
            variable: 0,
            discretionary: 0,
            essential: 0
          },
          projectedAnnualExpenses: 0,
          averageTransactionSize: 0,
          largestExpenseCategory: '',
          spendingTrends: {
            isIncreasing: false,
            weeklyPattern: new Array(7).fill(0),
            monthlyPattern: new Array(31).fill(0)
          }
        },
        savingsRate: {
          savingsRate: 0,
          totalIncome: 0,
          totalExpenses: 0,
          totalSavings: 0,
          monthlySavings: 0,
          projectedAnnualSavings: 0,
          savingsStreak: 0,
          averageSavingsRate: 0,
          savingsByType: {
            emergencyFund: 0,
            retirement: 0,
            investments: 0,
            generalSavings: 0
          },
          savingsGoals: []
        },
        debtRatio: {
          debtToIncomeRatio: 0,
          monthlyDebtPayments: 0,
          monthlyIncome: 0,
          totalDebtBalance: 0,
          originalDebtBalance: 0,
          totalDebtPaid: 0,
          debtServiceRatio: 0,
          debtPayoffTime: 0,
          totalInterestCost: 0,
          averageInterestRate: 0,
          highestInterestDebt: null,
          debtsByCategory: [],
          debtSnowball: [],
          debtAvalanche: []
        },
        financialHealthScore: {
          score: 0,
          rating: 'critical',
          summary: '',
          recommendations: [],
          componentScores: {
            netWorth: 0,
            savings: 0,
            debt: 0,
            income: 0,
            spending: 0
          }
        },
        monthlyIncome: 0,
        monthlyExpenses: 0,
        netIncome: 0,
        totalAssets: 0,
        totalLiabilities: 0,
        netWorthGrowth: 0,
        incomeGrowth: 0,
        expenseGrowth: 0,
        emergencyFundMonths: 0,
        recentTransactions: [],
        totalGoalsTarget: 0,
        totalGoalsSaved: 0,
        activeGoalsCount: 0,
        isLoading: false,
        error: null,
        allTransactions: [] // Reset on logout
      });
      return;
    }

    const initializeDb = async () => {
      const db = await getFirebaseDb();
      if (!db) {
        setData(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Database not initialized' 
        }));
        return;
      }

      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // Set up queries
      const transactionsRef = collection(db, 'users', user.uid, 'transactions');
      const transactionsQuery = query(
        transactionsRef,
        orderBy('date', 'desc'),
        limit(1000)
      );

      const goalsRef = collection(db, 'users', user.uid, 'goals');
      const assetsRef = collection(db, 'users', user.uid, 'assets');
      const liabilitiesRef = collection(db, 'users', user.uid, 'liabilities');

      // Set up listeners with safe wrapper
      const unsubscribeTransactions = safeOnSnapshot(
        transactionsQuery,
        `financial-data-transactions-${user.uid}`,
        (snapshot) => {
          const querySnapshot = snapshot as QuerySnapshot;
          const transactionData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
            updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : new Date()
          })) as Transaction[];
          
          setTransactions(transactionData);
        },
        (error) => {
          console.error('Error fetching transactions:', error);
          setData(prev => ({ ...prev, error: error.message }));
        }
      );

      const unsubscribeGoals = safeOnSnapshot(
        goalsRef,
        `financial-data-goals-${user.uid}`,
        (snapshot) => {
          const querySnapshot = snapshot as QuerySnapshot;
          const goalsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Goal[];
          
          setGoals(goalsData);
        }
      );

      const unsubscribeAssets = safeOnSnapshot(
        assetsRef,
        `financial-data-assets-${user.uid}`,
        (snapshot) => {
          const querySnapshot = snapshot as QuerySnapshot;
          const assetsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Asset[];
          
          setAssets(assetsData);
        }
      );

      const unsubscribeLiabilities = safeOnSnapshot(
        liabilitiesRef,
        `financial-data-liabilities-${user.uid}`,
        (snapshot) => {
          const querySnapshot = snapshot as QuerySnapshot;
          const liabilitiesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Liability[];
          
          setLiabilities(liabilitiesData);
        }
      );

      // Cleanup function
      return () => {
        unsubscribeTransactions();
        unsubscribeGoals();
        unsubscribeAssets();
        unsubscribeLiabilities();
      };
    };

    initializeDb().catch(err => {
      console.error('Error initializing database:', err);
      setData(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Failed to initialize database' 
      }));
    });

    return () => {
      // Cleanup will be handled inside initializeDb
    };

    // This block has been moved inside initializeDb function above
  }, [user]);

  // Effect for calculating financial data when dependencies change
  useEffect(() => {
    if (!user) return;

    setData(prev => ({ ...prev, isLoading: true }));

    // Get current month and previous month date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Filter transactions for current and previous periods
    const currentPeriodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= currentMonthStart && transactionDate <= currentMonthEnd;
    });

    const previousPeriodTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= previousMonthStart && transactionDate <= previousMonthEnd;
    });

    // Perform calculations using correct argument types and signatures
    const netWorthData = calculateNetWorth(transactions, previousPeriodTransactions);
    const incomeData = calculateIncomeData(transactions, currentMonthStart, currentMonthEnd, previousPeriodTransactions);
    const expensesData = calculateExpensesData(transactions, currentMonthStart, currentMonthEnd, previousPeriodTransactions);
    // Calculate current month savings rate
    const currentMonthSavingsRate = calculateSavingsRateData(transactions, currentMonthStart, currentMonthEnd, previousPeriodTransactions);
    
    // Calculate overall (all-time) savings rate for dashboard
    const allTimeIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
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
    
    const allTimeSavings = transactions
      .filter(t => t.type === 'asset' && SAVINGS_CATEGORIES.includes(t.categoryId))
      .reduce((sum, t) => sum + t.amount, 0);
      
    // Use overall savings rate for dashboard
    const savingsRateData = {
      ...currentMonthSavingsRate,
      savingsRate: allTimeIncome > 0 ? (allTimeSavings / allTimeIncome) * 100 : 0,
      totalIncome: allTimeIncome,
      totalSavings: allTimeSavings
    };
    const debtRatioData = calculateDebtRatioData(transactions, currentMonthStart, currentMonthEnd, previousPeriodTransactions);
    
    // Calculate financial health score using the new modular approach
    const financialHealthScore = calculateFinancialHealthScore({
      netWorth: netWorthData,
      income: incomeData,
      expenses: expensesData,
      savingsRate: savingsRateData,
      debtRatio: debtRatioData
    });

    const totalGoalsTarget = goals.reduce((acc, goal) => acc + goal.targetAmount, 0);
    const totalGoalsSaved = goals.reduce((acc, goal) => acc + goal.currentAmount, 0);
    const activeGoalsCount = goals.filter(g => g.status === 'active').length;

    setData({
      netWorth: netWorthData,
      income: incomeData,
      expenses: expensesData,
      savingsRate: savingsRateData,
      debtRatio: debtRatioData,
      financialHealthScore,
      monthlyIncome: incomeData.monthlyIncome,
      monthlyExpenses: expensesData.monthlyExpenses,
      netIncome: incomeData.totalIncome - expensesData.totalExpenses,
      totalAssets: netWorthData.totalAssets,
      totalLiabilities: netWorthData.totalLiabilities,
      netWorthGrowth: netWorthData.growthPercentage || 0,
      incomeGrowth: incomeData.growthPercentage || 0,
      expenseGrowth: expensesData.growthPercentage || 0,
      emergencyFundMonths: expensesData.monthlyExpenses > 0 
        ? Math.max(0, Math.round(netWorthData.assetAllocation.liquid / expensesData.monthlyExpenses * 10) / 10)
        : 0,
      recentTransactions: transactions.slice(0, 5),
      totalGoalsTarget,
      totalGoalsSaved,
      activeGoalsCount,
      isLoading: false,
      error: null,
      allTransactions: transactions // <-- expose full transaction list
    });

  }, [user, transactions, goals, assets, liabilities]);

  return {
    ...data,
    allTransactions: transactions // <-- expose full transaction list
  };
}
