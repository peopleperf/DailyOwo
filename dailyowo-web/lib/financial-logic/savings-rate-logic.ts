/**
 * Savings Rate Logic Module
 * Handles savings rate calculation based on ACTUAL savings behavior
 * 
 * KEY PRINCIPLE: Savings are TRANSFERS, not expenses
 * - When you save $200, you're moving money from checking to savings (transfer)
 * - When you spend $200 on groceries, that money is gone (expense) 
 * - This module correctly treats savings as asset movements, not spending
 * 
 * Formula: Savings Rate = (Actual Savings Transfers + Asset Purchases) / Income * 100
 */

import { Transaction } from '@/types/transaction';
import { SAVINGS_CATEGORIES } from '@/lib/constants/savings-categories';

export interface SavingsRateData {
  savingsRate: number; // Percentage
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number; // Income - Expenses
  monthlySavings: number;
  projectedAnnualSavings: number;
  previousSavingsRate?: number;
  savingsRateChange?: number;
  savingsGoal?: number; // Target savings rate
  goalProgress?: number; // Progress towards goal (0-100%)
  savingsStreak: number; // Consecutive months with positive savings
  averageSavingsRate: number; // Over last 6 months
  // Savings by type
  savingsByType: {
    emergencyFund: number;
    retirement: number;
    investments: number;
    generalSavings: number;
  };
  // Savings goals tracking
  savingsGoals: SavingsGoal[];
}

export interface SavingsBreakdown {
  forcedSavings: number; // Automatic savings, 401k contributions
  activeSavings: number; // Deliberate saving after expenses
  passiveSavings: number; // Income - Expenses (what's left over)
  emergencyFundContribution: number;
  investmentContribution: number;
  retirementContribution: number;
}

export interface SavingsGoal {
  id: string;
  name: string;
  type: 'emergency-fund' | 'retirement' | 'vacation' | 'home' | 'car' | 'education' | 'investment' | 'other';
  targetAmount: number;
  currentAmount: number;
  targetDate?: Date;
  monthlyContribution?: number;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  isCompleted: boolean;
  progress: number; // Percentage 0-100
}

export interface SavingsTarget {
  targetRate: number;
  currentRate: number;
  monthlyIncomeNeeded: number;
  monthlyExpensesReduction: number;
  timeToGoal: number; // Months
  difficulty: 'easy' | 'moderate' | 'challenging' | 'very-challenging';
}

export interface SavingsRateTrend {
  date: Date;
  savingsRate: number;
  income: number;
  expenses: number;
  savings: number;
}

/**
 * Calculate comprehensive savings rate data
 */
export function calculateSavingsRateData(
  transactions: Transaction[],
  periodStartDate: Date,
  periodEndDate: Date,
  previousPeriodTransactions?: Transaction[],
  savingsGoal?: number
): SavingsRateData {
  // Filter transactions for the period
  const periodTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= periodStartDate && transactionDate <= periodEndDate;
  });

  // Calculate totals
  const totalIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate actual savings from specific asset categories only
  const totalSavings = periodTransactions
    .filter(t => t.type === 'asset' && SAVINGS_CATEGORIES.includes(t.categoryId as any))
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate savings rate using actual savings transactions
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  // Calculate period length for monthly projection
  const periodLengthDays = Math.ceil(
    (periodEndDate.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const monthlyMultiplier = 30 / periodLengthDays;
  const monthlySavings = totalSavings * monthlyMultiplier;
  const projectedAnnualSavings = monthlySavings * 12;

  // Calculate previous period comparison
  let previousSavingsRate: number | undefined;
  let savingsRateChange: number | undefined;

  if (previousPeriodTransactions) {
    const previousStartDate = new Date(periodStartDate);
    previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    const previousEndDate = new Date(periodEndDate);
    previousEndDate.setMonth(previousEndDate.getMonth() - 1);

    const previousData = calculateSavingsRateData(
      previousPeriodTransactions,
      previousStartDate,
      previousEndDate
    );
    
    previousSavingsRate = previousData.savingsRate;
    savingsRateChange = savingsRate - previousSavingsRate;
  }

  // Calculate goal progress
  let goalProgress: number | undefined;
  if (savingsGoal) {
    goalProgress = Math.min(100, Math.max(0, (savingsRate / savingsGoal) * 100));
  }

  // Calculate savings streak (consecutive months with positive savings)
  const savingsStreak = calculateSavingsStreak(transactions, periodEndDate);

  // Calculate average savings rate over last 6 months
  const averageSavingsRate = calculateAverageSavingsRate(transactions, periodEndDate, 6);

  // Calculate savings by type
  const savingsByType = calculateSavingsByType(periodTransactions);

  // Calculate savings goals (simplified for now - in real app would come from database)
  const savingsGoals = calculateSavingsGoals(transactions, periodEndDate);

  return {
    savingsRate: Math.round(savingsRate * 10) / 10, // Round to 1 decimal
    totalIncome,
    totalExpenses,
    totalSavings,
    monthlySavings,
    projectedAnnualSavings,
    previousSavingsRate,
    savingsRateChange: savingsRateChange ? Math.round(savingsRateChange * 10) / 10 : undefined,
    savingsGoal,
    goalProgress,
    savingsStreak,
    averageSavingsRate: Math.round(averageSavingsRate * 10) / 10,
    savingsByType,
    savingsGoals
  };
}

/**
 * Calculate savings streak (consecutive months with positive savings)
 */
function calculateSavingsStreak(transactions: Transaction[], endDate: Date): number {
  let streak = 0;
  const currentDate = new Date(endDate);

  for (let i = 0; i < 24; i++) { // Check up to 2 years back
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

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
    const monthSavings = monthTransactions
      .filter(t => t.type === 'asset' && SAVINGS_CATEGORIES.includes(t.categoryId as any))
      .reduce((sum, t) => sum + t.amount, 0);

    if (monthSavings > 0) {
      streak++;
    } else {
      break; // Streak broken
    }
  }

  return streak;
}

/**
 * Calculate average savings rate over specified number of months
 */
function calculateAverageSavingsRate(transactions: Transaction[], endDate: Date, months: number): number {
  const rates: number[] = [];
  const currentDate = new Date(endDate);

  for (let i = 0; i < months; i++) {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);

    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    const monthIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

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
    const monthSavings = monthTransactions
      .filter(t => t.type === 'asset' && SAVINGS_CATEGORIES.includes(t.categoryId as any))
      .reduce((sum, t) => sum + t.amount, 0);

    if (monthIncome > 0) {
      const monthSavingsRate = (monthSavings / monthIncome) * 100;
      rates.push(monthSavingsRate);
    }
  }

  return rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
}

/**
 * Analyze savings breakdown by type
 */
export function calculateSavingsBreakdown(
  transactions: Transaction[],
  periodStartDate: Date,
  periodEndDate: Date
): SavingsBreakdown {
  const periodTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= periodStartDate && transactionDate <= periodEndDate;
  });

  const totalIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Passive savings (what's left over)
  const passiveSavings = Math.max(0, totalIncome - totalExpenses);

  // Calculate forced savings (retirement contributions, automatic savings)
  const retirementContribution = periodTransactions
    .filter(t => t.type === 'expense' && t.categoryId === 'savings' && 
             (t.description?.toLowerCase().includes('401k') || 
              t.description?.toLowerCase().includes('retirement') ||
              t.description?.toLowerCase().includes('ira')))
    .reduce((sum, t) => sum + t.amount, 0);

  const emergencyFundContribution = periodTransactions
    .filter(t => t.type === 'expense' && t.categoryId === 'savings' &&
             t.description?.toLowerCase().includes('emergency'))
    .reduce((sum, t) => sum + t.amount, 0);

  const investmentContribution = periodTransactions
    .filter(t => t.type === 'asset' || 
             (t.type === 'expense' && t.categoryId === 'savings' &&
              !t.description?.toLowerCase().includes('emergency') &&
              !t.description?.toLowerCase().includes('401k') &&
              !t.description?.toLowerCase().includes('retirement')))
    .reduce((sum, t) => sum + t.amount, 0);

  const forcedSavings = retirementContribution + emergencyFundContribution + investmentContribution;
  const activeSavings = passiveSavings; // For now, treating passive as active

  return {
    forcedSavings,
    activeSavings,
    passiveSavings,
    emergencyFundContribution,
    investmentContribution,
    retirementContribution
  };
}

/**
 * Calculate savings targets and recommendations
 */
export function calculateSavingsTarget(
  currentIncome: number,
  currentExpenses: number,
  targetSavingsRate: number
): SavingsTarget {
  const currentSavings = currentIncome - currentExpenses;
  const currentRate = currentIncome > 0 ? (currentSavings / currentIncome) * 100 : 0;

  // Calculate required savings amount
  const requiredSavings = (targetSavingsRate / 100) * currentIncome;
  const savingsGap = requiredSavings - currentSavings;

  // Two paths to reach target: increase income or reduce expenses
  const monthlyIncomeNeeded = savingsGap > 0 ? savingsGap / (1 - targetSavingsRate / 100) : 0;
  const monthlyExpensesReduction = Math.max(0, savingsGap);

  // Estimate time to goal (simplified - assumes linear progress)
  let timeToGoal = 0;
  if (savingsGap > 0) {
    // Assume 5% improvement per month
    const monthlyImprovement = Math.max(currentIncome * 0.02, currentExpenses * 0.02);
    timeToGoal = Math.ceil(savingsGap / monthlyImprovement);
  }

  // Determine difficulty
  let difficulty: SavingsTarget['difficulty'] = 'easy';
  const improvementNeeded = Math.abs(targetSavingsRate - currentRate);
  
  if (improvementNeeded <= 5) difficulty = 'easy';
  else if (improvementNeeded <= 15) difficulty = 'moderate';
  else if (improvementNeeded <= 30) difficulty = 'challenging';
  else difficulty = 'very-challenging';

  return {
    targetRate: targetSavingsRate,
    currentRate: Math.round(currentRate * 10) / 10,
    monthlyIncomeNeeded,
    monthlyExpensesReduction,
    timeToGoal,
    difficulty
  };
}

/**
 * Get savings rate trend over time
 */
export function getSavingsRateTrend(
  transactions: Transaction[],
  months: number = 12
): SavingsRateTrend[] {
  const trends: SavingsRateTrend[] = [];
  const endDate = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
    const monthEnd = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 0);

    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    trends.push({
      date: new Date(monthStart),
      savingsRate: Math.round(savingsRate * 10) / 10,
      income,
      expenses,
      savings
    });
  }

  return trends;
}

/**
 * Get savings rate insights and recommendations
 */
export function getSavingsRateInsights(savingsData: SavingsRateData): {
  insights: string[];
  recommendations: string[];
  score: number; // Overall savings health score 0-100
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
} {
  const insights: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical' = 'critical';

  const { savingsRate, savingsRateChange, savingsStreak, averageSavingsRate } = savingsData;

  // Savings rate analysis
  if (savingsRate >= 30) {
    insights.push(`Excellent savings rate of ${savingsRate}% - you're on track for early retirement`);
    score += 40;
    status = 'excellent';
  } else if (savingsRate >= 20) {
    insights.push(`Good savings rate of ${savingsRate}% - above recommended minimum`);
    score += 30;
    status = 'good';
  } else if (savingsRate >= 10) {
    insights.push(`Fair savings rate of ${savingsRate}% - meets basic recommendations`);
    score += 20;
    status = 'fair';
    recommendations.push('Try to increase savings rate to 20% for better financial security');
  } else if (savingsRate >= 0) {
    insights.push(`Low savings rate of ${savingsRate}% - below recommended levels`);
    score += 10;
    status = 'poor';
    recommendations.push('Focus on increasing income or reducing expenses to save more');
  } else {
    insights.push(`Negative savings rate of ${savingsRate}% - spending exceeds income`);
    status = 'critical';
    recommendations.push('Immediate action needed: expenses exceed income');
  }

  // Trend analysis
  if (savingsRateChange && savingsRateChange > 0) {
    insights.push(`Savings rate improved by ${savingsRateChange}% from last period`);
    score += 15;
  } else if (savingsRateChange && savingsRateChange < -2) {
    insights.push(`Savings rate declined by ${Math.abs(savingsRateChange)}% - monitor spending`);
    recommendations.push('Review recent expenses to identify spending increases');
  }

  // Consistency analysis
  if (savingsStreak >= 6) {
    insights.push(`${savingsStreak} consecutive months of positive savings - excellent consistency`);
    score += 20;
  } else if (savingsStreak >= 3) {
    insights.push(`${savingsStreak} consecutive months of positive savings - good progress`);
    score += 10;
  } else if (savingsStreak === 0) {
    insights.push('No recent positive savings months - focus on consistency');
    recommendations.push('Aim for consistent monthly savings, even small amounts');
  }

  // Average performance
  if (averageSavingsRate > savingsRate + 5) {
    insights.push('Current savings rate is below your recent average - temporary setback?');
    recommendations.push('Review what changed to bring savings rate back to normal levels');
  } else if (averageSavingsRate < savingsRate - 5) {
    insights.push('Current savings rate exceeds your recent average - great improvement!');
    score += 10;
  }

  // Goal progress
  if (savingsData.goalProgress && savingsData.goalProgress >= 100) {
    insights.push('Savings goal achieved! Consider setting a higher target');
    score += 15;
  } else if (savingsData.goalProgress && savingsData.goalProgress >= 80) {
    insights.push(`${savingsData.goalProgress.toFixed(1)}% of savings goal achieved - almost there!`);
    score += 10;
  }

  return {
    insights,
    recommendations,
    score: Math.min(100, Math.round(score)),
    status
  };
}

/**
 * Calculate savings by type (emergency fund, retirement, etc.)
 */
function calculateSavingsByType(transactions: Transaction[]): {
  emergencyFund: number;
  retirement: number;
  investments: number;
  generalSavings: number;
} {
  const emergencyFund = transactions
    .filter(t => (t.type === 'expense' && t.categoryId === 'savings' && 
                  t.description?.toLowerCase().includes('emergency')) ||
                 (t.type === 'asset' && t.description?.toLowerCase().includes('emergency')))
    .reduce((sum, t) => sum + t.amount, 0);

  const retirement = transactions
    .filter(t => (t.type === 'expense' && t.categoryId === 'savings' && 
                  (t.description?.toLowerCase().includes('401k') || 
                   t.description?.toLowerCase().includes('retirement') ||
                   t.description?.toLowerCase().includes('ira'))) ||
                 (t.type === 'asset' && 
                  (t.categoryId === 'retirement-401k' || t.categoryId === 'retirement-ira')))
    .reduce((sum, t) => sum + t.amount, 0);

  const investments = transactions
    .filter(t => t.type === 'asset' && 
                 !t.description?.toLowerCase().includes('emergency') &&
                 t.categoryId !== 'retirement-401k' && 
                 t.categoryId !== 'retirement-ira' &&
                 !['cash', 'checking-account', 'savings-account'].includes(t.categoryId))
    .reduce((sum, t) => sum + t.amount, 0);

  const generalSavings = transactions
    .filter(t => (t.type === 'expense' && t.categoryId === 'savings' &&
                  !t.description?.toLowerCase().includes('emergency') &&
                  !t.description?.toLowerCase().includes('401k') &&
                  !t.description?.toLowerCase().includes('retirement') &&
                  !t.description?.toLowerCase().includes('ira')) ||
                 (t.type === 'asset' && 
                  ['cash', 'checking-account', 'savings-account'].includes(t.categoryId)))
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    emergencyFund,
    retirement,
    investments,
    generalSavings
  };
}

/**
 * Calculate savings goals from transactions (simplified implementation)
 * In a real app, this would come from a dedicated goals database
 */
function calculateSavingsGoals(transactions: Transaction[], asOfDate: Date): SavingsGoal[] {
  // This is a simplified implementation that infers goals from transaction patterns
  // In a real app, users would explicitly create goals in the UI
  
  const goals: SavingsGoal[] = [];

  // Emergency fund goal
  const emergencyFundTransactions = transactions.filter(t => 
    ((t.type === 'expense' && t.categoryId === 'savings') || t.type === 'asset') &&
    t.description?.toLowerCase().includes('emergency')
  );

  if (emergencyFundTransactions.length > 0) {
    const currentAmount = emergencyFundTransactions.reduce((sum, t) => sum + t.amount, 0);
    goals.push({
      id: 'emergency-fund',
      name: 'Emergency Fund',
      type: 'emergency-fund',
      targetAmount: 10000, // Simplified: assume €10k target
      currentAmount,
      priority: 'high',
      isCompleted: currentAmount >= 10000,
      progress: Math.min(100, (currentAmount / 10000) * 100)
    });
  }

  // Retirement goal
  const retirementTransactions = transactions.filter(t => 
    ((t.type === 'expense' && t.categoryId === 'savings') || t.type === 'asset') &&
    (t.description?.toLowerCase().includes('retirement') ||
     t.description?.toLowerCase().includes('401k') ||
     t.description?.toLowerCase().includes('ira') ||
     t.categoryId === 'retirement-401k' ||
     t.categoryId === 'retirement-ira')
  );

  if (retirementTransactions.length > 0) {
    const currentAmount = retirementTransactions.reduce((sum, t) => sum + t.amount, 0);
    goals.push({
      id: 'retirement',
      name: 'Retirement Savings',
      type: 'retirement',
      targetAmount: 100000, // Simplified: assume €100k target
      currentAmount,
      priority: 'high',
      isCompleted: currentAmount >= 100000,
      progress: Math.min(100, (currentAmount / 100000) * 100)
    });
  }

  return goals;
}