/**
 * Expenses Logic Module
 * Handles all expense tracking, categorization, and spending analysis
 */

import { Transaction } from '@/types/transaction';

export interface ExpensesData {
  totalExpenses: number;
  monthlyExpenses: number;
  averageDailyExpenses: number;
  expensesByCategory: Record<string, number>;
  expensesByType: {
    fixed: number; // Housing, insurance, utilities
    variable: number; // Food, entertainment, shopping
    discretionary: number; // Entertainment, travel, shopping
    essential: number; // Housing, food, healthcare, utilities
  };
  previousPeriodExpenses?: number;
  expensesGrowth?: number;
  growthPercentage?: number;
  projectedAnnualExpenses: number;
  averageTransactionSize: number;
  largestExpenseCategory: string;
  spendingTrends: {
    isIncreasing: boolean;
    weeklyPattern: number[]; // Spending by day of week
    monthlyPattern: number[]; // Spending by day of month
  };
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
  averageAmount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  isEssential: boolean;
  budgetStatus: 'under' | 'over' | 'ontrack' | 'no-budget';
}

export interface SpendingPattern {
  date: Date;
  amount: number;
  category: string;
  isRecurring: boolean;
  dayOfWeek: number;
  dayOfMonth: number;
}

export interface BudgetAnalysis {
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  utilizationPercentage: number;
  categoryBreakdown: {
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
    utilizationPercentage: number;
    status: 'under' | 'over' | 'ontrack';
  }[];
}

// Expense category mappings
const FIXED_EXPENSE_CATEGORIES = ['housing', 'insurance', 'utilities', 'debt-payment'];
const VARIABLE_EXPENSE_CATEGORIES = ['food', 'transportation', 'personal'];
const DISCRETIONARY_EXPENSE_CATEGORIES = ['entertainment', 'shopping', 'travel', 'education'];
const ESSENTIAL_EXPENSE_CATEGORIES = ['housing', 'food', 'healthcare', 'utilities', 'transportation'];

/**
 * Calculate comprehensive expenses data from transactions
 */
export function calculateExpensesData(
  transactions: Transaction[],
  periodStartDate: Date,
  periodEndDate: Date,
  previousPeriodTransactions?: Transaction[]
): ExpensesData {
  // Filter expense transactions for the period
  const expenseTransactions = transactions.filter(t => 
    t.type === 'expense' && 
    new Date(t.date) >= periodStartDate && 
    new Date(t.date) <= periodEndDate
  );

  // Calculate total expenses
  const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Calculate period length in days
  const periodLengthDays = Math.ceil(
    (periodEndDate.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate averages
  const averageDailyExpenses = totalExpenses / Math.max(periodLengthDays, 1);
  const monthlyExpenses = averageDailyExpenses * 30; // Standardized monthly calculation
  const averageTransactionSize = expenseTransactions.length > 0 ? totalExpenses / expenseTransactions.length : 0;

  // Expenses by category
  const expensesByCategory = expenseTransactions.reduce((acc, transaction) => {
    const category = transaction.categoryId;
    acc[category] = (acc[category] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  // Expenses by type
  const expensesByType = {
    fixed: FIXED_EXPENSE_CATEGORIES.reduce((sum, cat) => sum + (expensesByCategory[cat] || 0), 0),
    variable: VARIABLE_EXPENSE_CATEGORIES.reduce((sum, cat) => sum + (expensesByCategory[cat] || 0), 0),
    discretionary: DISCRETIONARY_EXPENSE_CATEGORIES.reduce((sum, cat) => sum + (expensesByCategory[cat] || 0), 0),
    essential: ESSENTIAL_EXPENSE_CATEGORIES.reduce((sum, cat) => sum + (expensesByCategory[cat] || 0), 0)
  };

  // Calculate growth if previous period data provided
  let previousPeriodExpenses: number | undefined;
  let expensesGrowth: number | undefined;
  let growthPercentage: number | undefined;

  if (previousPeriodTransactions) {
    const previousStartDate = new Date(periodStartDate);
    previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    const previousEndDate = new Date(periodEndDate);
    previousEndDate.setMonth(previousEndDate.getMonth() - 1);

    const previousData = calculateExpensesData(
      previousPeriodTransactions,
      previousStartDate,
      previousEndDate
    );
    
    previousPeriodExpenses = previousData.totalExpenses;
    expensesGrowth = totalExpenses - previousPeriodExpenses;
    growthPercentage = previousPeriodExpenses !== 0 ? (expensesGrowth / previousPeriodExpenses) * 100 : 0;
  }

  // Project annual expenses
  const projectedAnnualExpenses = monthlyExpenses * 12;

  // Find largest expense category
  const largestExpenseCategory = Object.entries(expensesByCategory)
    .reduce((largest, [category, amount]) => 
      amount > (expensesByCategory[largest] || 0) ? category : largest, 
      Object.keys(expensesByCategory)[0] || 'none'
    );

  // Calculate spending trends
  const spendingTrends = calculateSpendingTrends(expenseTransactions);

  return {
    totalExpenses,
    monthlyExpenses,
    averageDailyExpenses,
    expensesByCategory,
    expensesByType,
    previousPeriodExpenses,
    expensesGrowth,
    growthPercentage,
    projectedAnnualExpenses,
    averageTransactionSize,
    largestExpenseCategory,
    spendingTrends
  };
}

/**
 * Calculate spending trends and patterns
 */
function calculateSpendingTrends(expenseTransactions: Transaction[]): ExpensesData['spendingTrends'] {
  if (expenseTransactions.length === 0) {
    return {
      isIncreasing: false,
      weeklyPattern: new Array(7).fill(0),
      monthlyPattern: new Array(31).fill(0)
    };
  }

  // Sort transactions by date
  const sortedTransactions = [...expenseTransactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Calculate if spending is increasing (compare first half vs second half)
  const midPoint = Math.floor(sortedTransactions.length / 2);
  const firstHalfAvg = sortedTransactions.slice(0, midPoint)
    .reduce((sum, t) => sum + t.amount, 0) / midPoint;
  const secondHalfAvg = sortedTransactions.slice(midPoint)
    .reduce((sum, t) => sum + t.amount, 0) / (sortedTransactions.length - midPoint);
  
  const isIncreasing = secondHalfAvg > firstHalfAvg;

  // Weekly pattern (0 = Sunday, 6 = Saturday)
  const weeklyPattern = new Array(7).fill(0);
  const weeklyCounts = new Array(7).fill(0);
  
  expenseTransactions.forEach(transaction => {
    const dayOfWeek = new Date(transaction.date).getDay();
    weeklyPattern[dayOfWeek] += transaction.amount;
    weeklyCounts[dayOfWeek]++;
  });

  // Convert to averages
  weeklyPattern.forEach((total, index) => {
    weeklyPattern[index] = weeklyCounts[index] > 0 ? total / weeklyCounts[index] : 0;
  });

  // Monthly pattern (1-31)
  const monthlyPattern = new Array(31).fill(0);
  const monthlyCounts = new Array(31).fill(0);
  
  expenseTransactions.forEach(transaction => {
    const dayOfMonth = new Date(transaction.date).getDate() - 1; // 0-indexed
    if (dayOfMonth < 31) {
      monthlyPattern[dayOfMonth] += transaction.amount;
      monthlyCounts[dayOfMonth]++;
    }
  });

  // Convert to averages
  monthlyPattern.forEach((total, index) => {
    monthlyPattern[index] = monthlyCounts[index] > 0 ? total / monthlyCounts[index] : 0;
  });

  return {
    isIncreasing,
    weeklyPattern,
    monthlyPattern
  };
}

/**
 * Get detailed expense categories with analysis
 */
export function getExpenseCategories(
  transactions: Transaction[],
  totalExpenses: number,
  previousPeriodTransactions?: Transaction[]
): ExpenseCategory[] {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const categoryMap = new Map<string, { amount: number; transactions: Transaction[] }>();

  // Group by category
  expenseTransactions.forEach(transaction => {
    const category = transaction.categoryId;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { amount: 0, transactions: [] });
    }
    const categoryData = categoryMap.get(category)!;
    categoryData.amount += transaction.amount;
    categoryData.transactions.push(transaction);
  });

  // Calculate previous period data for trends
  const previousCategoryAmounts = new Map<string, number>();
  if (previousPeriodTransactions) {
    const previousExpenseTransactions = previousPeriodTransactions.filter(t => t.type === 'expense');
    previousExpenseTransactions.forEach(transaction => {
      const category = transaction.categoryId;
      previousCategoryAmounts.set(category, (previousCategoryAmounts.get(category) || 0) + transaction.amount);
    });
  }

  // Convert to ExpenseCategory array with analysis
  return Array.from(categoryMap.entries()).map(([category, data]) => {
    const { amount, transactions: categoryTransactions } = data;
    const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
    const transactionCount = categoryTransactions.length;
    const averageAmount = amount / transactionCount;
    
    // Calculate trend
    let trend: ExpenseCategory['trend'] = 'stable';
    const previousAmount = previousCategoryAmounts.get(category) || 0;
    if (previousAmount > 0) {
      const changePercentage = ((amount - previousAmount) / previousAmount) * 100;
      if (changePercentage > 10) trend = 'increasing';
      else if (changePercentage < -10) trend = 'decreasing';
    }

    // Determine if essential
    const isEssential = ESSENTIAL_EXPENSE_CATEGORIES.includes(category);

    return {
      category,
      amount,
      percentage,
      transactionCount,
      averageAmount,
      trend,
      isEssential,
      budgetStatus: 'no-budget' as const // TODO: Integrate with budget system when available
    };
  }).sort((a, b) => b.amount - a.amount); // Sort by amount descending
}

/**
 * Get spending patterns over time
 */
export function getSpendingPatterns(
  transactions: Transaction[],
  periodDays: number = 30
): SpendingPattern[] {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - periodDays);

  return expenseTransactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    })
    .map(t => {
      const date = new Date(t.date);
      return {
        date,
        amount: t.amount,
        category: t.categoryId,
        isRecurring: t.isRecurring,
        dayOfWeek: date.getDay(),
        dayOfMonth: date.getDate()
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Identify unusual spending patterns and outliers
 */
export function identifySpendingOutliers(transactions: Transaction[]): {
  unusualTransactions: Transaction[];
  spendingSpikes: { date: Date; amount: number; category: string }[];
  recommendations: string[];
} {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  if (expenseTransactions.length === 0) {
    return {
      unusualTransactions: [],
      spendingSpikes: [],
      recommendations: []
    };
  }

  // Calculate average and standard deviation
  const amounts = expenseTransactions.map(t => t.amount);
  const average = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - average, 2), 0) / amounts.length;
  const standardDeviation = Math.sqrt(variance);

  // Find outliers (transactions > 2 standard deviations from mean)
  const threshold = average + (2 * standardDeviation);
  const unusualTransactions = expenseTransactions.filter(t => t.amount > threshold);

  // Group by date and find spending spikes
  const dailySpending = new Map<string, { total: number; transactions: Transaction[] }>();
  expenseTransactions.forEach(transaction => {
    const dateKey = new Date(transaction.date).toDateString();
    if (!dailySpending.has(dateKey)) {
      dailySpending.set(dateKey, { total: 0, transactions: [] });
    }
    const day = dailySpending.get(dateKey)!;
    day.total += transaction.amount;
    day.transactions.push(transaction);
  });

  const dailyAmounts = Array.from(dailySpending.values()).map(day => day.total);
  const dailyAverage = dailyAmounts.reduce((sum, amt) => sum + amt, 0) / dailyAmounts.length;
  const dailyThreshold = dailyAverage * 2; // Days with 2x average spending

  const spendingSpikes = Array.from(dailySpending.entries())
    .filter(([_, day]) => day.total > dailyThreshold)
    .map(([dateString, day]) => ({
      date: new Date(dateString),
      amount: day.total,
      category: day.transactions.reduce((largest, t) => 
        t.amount > largest.amount ? t : largest
      ).categoryId
    }))
    .sort((a, b) => b.amount - a.amount);

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (unusualTransactions.length > 0) {
    recommendations.push(`You have ${unusualTransactions.length} unusually large transactions this period`);
  }
  
  if (spendingSpikes.length > 0) {
    recommendations.push(`${spendingSpikes.length} days had significantly higher spending than average`);
  }

  return {
    unusualTransactions,
    spendingSpikes,
    recommendations
  };
}

/**
 * Get expense insights and recommendations
 */
export function getExpenseInsights(expensesData: ExpensesData): {
  insights: string[];
  recommendations: string[];
  score: number; // Overall expense management score 0-100
} {
  const insights: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // Fixed vs variable expense analysis
  const totalExpenses = expensesData.totalExpenses;
  const fixedPercentage = totalExpenses > 0 ? (expensesData.expensesByType.fixed / totalExpenses) * 100 : 0;
  const discretionaryPercentage = totalExpenses > 0 ? (expensesData.expensesByType.discretionary / totalExpenses) * 100 : 0;

  if (fixedPercentage < 50) {
    insights.push(`${fixedPercentage.toFixed(1)}% of expenses are fixed - good flexibility`);
    score += 25;
  } else if (fixedPercentage > 70) {
    insights.push(`${fixedPercentage.toFixed(1)}% of expenses are fixed - limited flexibility`);
    recommendations.push('Consider reducing fixed costs where possible');
  } else {
    score += 15;
  }

  // Discretionary spending analysis
  if (discretionaryPercentage < 20) {
    insights.push('Low discretionary spending - very disciplined approach');
    score += 30;
  } else if (discretionaryPercentage > 40) {
    insights.push('High discretionary spending - room for optimization');
    recommendations.push('Review discretionary expenses for potential savings');
  } else {
    insights.push('Moderate discretionary spending');
    score += 20;
  }

  // Growth analysis
  if (expensesData.growthPercentage && expensesData.growthPercentage < 0) {
    insights.push(`Expenses decreased by ${Math.abs(expensesData.growthPercentage).toFixed(1)}% - excellent control`);
    score += 25;
  } else if (expensesData.growthPercentage && expensesData.growthPercentage > 10) {
    insights.push(`Expenses increased by ${expensesData.growthPercentage.toFixed(1)}% - monitor trends`);
    recommendations.push('Analyze expense growth and implement cost controls');
  }

  // Spending trend analysis
  if (expensesData.spendingTrends.isIncreasing) {
    insights.push('Spending trend is increasing - monitor closely');
    recommendations.push('Review recent spending patterns and set spending limits');
  } else {
    insights.push('Spending trend is stable or decreasing');
    score += 20;
  }

  return {
    insights,
    recommendations,
    score: Math.round(score)
  };
} 