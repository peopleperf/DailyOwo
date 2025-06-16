/**
 * Income Logic Module
 * Handles all income tracking, analysis, and growth calculations
 */

import { Transaction } from '@/types/transaction';
import { 
  FINANCIAL_RATIOS,
  TIME_PERIODS,
  INCOME_CATEGORY_TYPES
} from '../constants/financial-constants';

export interface IncomeData {
  totalIncome: number;
  monthlyIncome: number;
  averageDailyIncome: number;
  incomeByCategory: Record<string, number>;
  incomeBySource: {
    primary: number; // Salary, business
    secondary: number; // Freelance, side income
    passive: number; // Investments, rental
    oneTime: number; // Gifts, refunds
  };
  previousPeriodIncome?: number;
  incomeGrowth?: number;
  growthPercentage?: number;
  projectedAnnualIncome: number;
  isIncomeStable: boolean;
  incomeConsistency: number; // 0-100 score
}

export interface IncomeSource {
  category: string;
  amount: number;
  frequency: 'one-time' | 'irregular' | 'monthly' | 'bi-weekly' | 'weekly';
  isRecurring: boolean;
  reliability: 'high' | 'medium' | 'low';
}

export interface IncomeTrend {
  date: Date;
  amount: number;
  category: string;
  isRecurring: boolean;
}

// Income category mappings - using constants from financial-constants.ts
const PRIMARY_INCOME_CATEGORIES = INCOME_CATEGORY_TYPES.PRIMARY;
const SECONDARY_INCOME_CATEGORIES = INCOME_CATEGORY_TYPES.SECONDARY;
const PASSIVE_INCOME_CATEGORIES = INCOME_CATEGORY_TYPES.PASSIVE;
const ONE_TIME_INCOME_CATEGORIES = INCOME_CATEGORY_TYPES.ONE_TIME;

/**
 * Calculate comprehensive income data from transactions
 */
export function calculateIncomeData(
  transactions: Transaction[],
  periodStartDate: Date,
  periodEndDate: Date,
  previousPeriodTransactions?: Transaction[]
): IncomeData {
  // Filter income transactions for the period
  const incomeTransactions = transactions.filter(t => 
    t.type === 'income' && 
    new Date(t.date) >= periodStartDate && 
    new Date(t.date) <= periodEndDate
  );

  // Calculate total income
  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Calculate period length in days
  const periodLengthDays = Math.ceil(
    (periodEndDate.getTime() - periodStartDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Calculate averages
  const averageDailyIncome = totalIncome / Math.max(periodLengthDays, 1);
  const monthlyIncome = averageDailyIncome * TIME_PERIODS.DAYS_IN_MONTH; // Standardized monthly calculation

  // Income by category
  const incomeByCategory = incomeTransactions.reduce((acc, transaction) => {
    const category = transaction.categoryId;
    acc[category] = (acc[category] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  // Income by source type
  const incomeBySource = {
    primary: PRIMARY_INCOME_CATEGORIES.reduce((sum, cat) => sum + (incomeByCategory[cat] || 0), 0),
    secondary: SECONDARY_INCOME_CATEGORIES.reduce((sum, cat) => sum + (incomeByCategory[cat] || 0), 0),
    passive: PASSIVE_INCOME_CATEGORIES.reduce((sum, cat) => sum + (incomeByCategory[cat] || 0), 0),
    oneTime: ONE_TIME_INCOME_CATEGORIES.reduce((sum, cat) => sum + (incomeByCategory[cat] || 0), 0)
  };

  // Calculate growth if previous period data provided
  let previousPeriodIncome: number | undefined;
  let incomeGrowth: number | undefined;
  let growthPercentage: number | undefined;

  if (previousPeriodTransactions) {
    const previousStartDate = new Date(periodStartDate);
    previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    const previousEndDate = new Date(periodEndDate);
    previousEndDate.setMonth(previousEndDate.getMonth() - 1);

    const previousData = calculateIncomeData(
      previousPeriodTransactions,
      previousStartDate,
      previousEndDate
    );
    
    previousPeriodIncome = previousData.totalIncome;
    incomeGrowth = totalIncome - previousPeriodIncome;
    growthPercentage = previousPeriodIncome !== 0 ? (incomeGrowth / previousPeriodIncome) * 100 : 0;
  }

  // Project annual income
  const projectedAnnualIncome = monthlyIncome * TIME_PERIODS.MONTHS_IN_YEAR;

  // Calculate income stability and consistency
  const recurringTransactions = incomeTransactions.filter(t => t.isRecurring);
  const recurringIncome = recurringTransactions.reduce((sum, t) => sum + t.amount, 0);
  const isIncomeStable = totalIncome > 0 
    ? (recurringIncome / totalIncome) >= FINANCIAL_RATIOS.INCOME_STABILITY_THRESHOLD 
    : false;

  // Income consistency score (based on regularity and predictability)
  const incomeConsistency = calculateIncomeConsistency(incomeTransactions);

  return {
    totalIncome,
    monthlyIncome,
    averageDailyIncome,
    incomeByCategory,
    incomeBySource,
    previousPeriodIncome,
    incomeGrowth,
    growthPercentage,
    projectedAnnualIncome,
    isIncomeStable,
    incomeConsistency
  };
}

/**
 * Calculate income consistency score (0-100)
 */
function calculateIncomeConsistency(incomeTransactions: Transaction[]): number {
  if (incomeTransactions.length === 0) return 0;

  const recurringCount = incomeTransactions.filter(t => t.isRecurring).length;
  const totalCount = incomeTransactions.length;
  
  // Base score from recurring percentage
  const recurringScore = (recurringCount / totalCount) * 50;
  
  // Additional score from income distribution (penalty for highly variable amounts)
  const amounts = incomeTransactions.map(t => t.amount);
  const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
  
  const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
  const coefficientOfVariation = avgAmount > 0 ? Math.sqrt(variance) / avgAmount : 1;
  
  // Lower variation = higher consistency
  const variationScore = Math.max(0, 50 - (coefficientOfVariation * 25));
  
  return Math.round(recurringScore + variationScore);
}

/**
 * Get income sources with analysis
 */
export function getIncomeSources(transactions: Transaction[]): IncomeSource[] {
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const sourceMap = new Map<string, { amount: number; transactions: Transaction[] }>();

  // Group by category
  incomeTransactions.forEach(transaction => {
    const category = transaction.categoryId;
    if (!sourceMap.has(category)) {
      sourceMap.set(category, { amount: 0, transactions: [] });
    }
    const source = sourceMap.get(category)!;
    source.amount += transaction.amount;
    source.transactions.push(transaction);
  });

  // Convert to IncomeSource array with analysis
  return Array.from(sourceMap.entries()).map(([category, data]) => {
    const { amount, transactions: categoryTransactions } = data;
    
    // Determine frequency
    const recurringTransactions = categoryTransactions.filter(t => t.isRecurring);
    const isRecurring = recurringTransactions.length > 0;
    
    let frequency: IncomeSource['frequency'] = 'one-time';
    if (isRecurring && recurringTransactions[0].recurringConfig) {
      const config = recurringTransactions[0].recurringConfig;
      frequency = config.frequency === 'monthly' ? 'monthly' :
                 config.frequency === 'weekly' ? 'weekly' :
                 config.frequency === 'daily' ? 'weekly' : // Daily treated as weekly for analysis
                 'irregular';
    } else if (categoryTransactions.length > 1) {
      frequency = 'irregular';
    }

    // Determine reliability
    let reliability: IncomeSource['reliability'] = 'low';
    if (PRIMARY_INCOME_CATEGORIES.includes(category as any)) {
      reliability = 'high';
    } else if (PASSIVE_INCOME_CATEGORIES.includes(category as any) || 
               SECONDARY_INCOME_CATEGORIES.includes(category as any)) {
      reliability = 'medium';
    }

    return {
      category,
      amount,
      frequency,
      isRecurring,
      reliability
    };
  }).sort((a, b) => b.amount - a.amount); // Sort by amount descending
}

/**
 * Get income trend over time
 */
export function getIncomeTrend(
  transactions: Transaction[],
  periodDays: number = 30
): IncomeTrend[] {
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - periodDays);

  return incomeTransactions
    .filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    })
    .map(t => ({
      date: new Date(t.date),
      amount: t.amount,
      category: t.categoryId,
      isRecurring: t.isRecurring
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate next expected income based on recurring transactions
 */
export function getNextExpectedIncome(transactions: Transaction[]): {
  amount: number;
  date: Date | null;
  sources: { category: string; amount: number; date: Date }[];
} {
  const recurringIncomeTransactions = transactions.filter(t => 
    t.type === 'income' && 
    t.isRecurring && 
    t.recurringConfig
  );

  const upcomingIncomes = recurringIncomeTransactions
    .map(transaction => {
      const config = transaction.recurringConfig!;
      let nextDate = config.nextDate ? new Date(config.nextDate) : new Date();
      
      // If no nextDate, calculate based on frequency
      if (!config.nextDate) {
        const lastDate = new Date(transaction.date);
        switch (config.frequency) {
          case 'daily':
            nextDate.setDate(lastDate.getDate() + 1);
            break;
          case 'weekly':
            nextDate.setDate(lastDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(lastDate.getMonth() + 1);
            break;
          case 'yearly':
            nextDate.setFullYear(lastDate.getFullYear() + 1);
            break;
        }
      }

      return {
        category: transaction.categoryId,
        amount: transaction.amount,
        date: nextDate
      };
    })
    .filter(income => income.date > new Date()) // Only future incomes
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const totalAmount = upcomingIncomes.reduce((sum, income) => sum + income.amount, 0);
  const nextDate = upcomingIncomes.length > 0 ? upcomingIncomes[0].date : null;

  return {
    amount: totalAmount,
    date: nextDate,
    sources: upcomingIncomes
  };
}

/**
 * Get income insights and recommendations
 */
export function getIncomeInsights(incomeData: IncomeData): {
  insights: string[];
  recommendations: string[];
  score: number; // Overall income health score 0-100
} {
  const insights: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // Income stability insights
  if (incomeData.isIncomeStable) {
    insights.push('Your income is stable with regular recurring payments');
    score += 30;
  } else {
    insights.push('Your income is variable - consider building emergency savings');
    recommendations.push('Focus on creating more predictable income streams');
  }

  // Growth insights
  if (incomeData.growthPercentage && incomeData.growthPercentage > 0) {
    insights.push(`Income grew by ${incomeData.growthPercentage.toFixed(1)}% last period`);
    score += 20;
  } else if (incomeData.growthPercentage && incomeData.growthPercentage < -5) {
    insights.push('Income declined significantly - monitor trends closely');
    recommendations.push('Consider strategies to stabilize or increase income');
  }

  // Diversification insights
  const sourceCount = Object.values(incomeData.incomeBySource).filter(amount => amount > 0).length;
  if (sourceCount >= 3) {
    insights.push('Good income diversification across multiple sources');
    score += 25;
  } else if (sourceCount === 2) {
    insights.push('Moderate income diversification');
    score += 15;
    recommendations.push('Consider adding additional income streams for security');
  } else {
    insights.push('Income depends heavily on a single source');
    recommendations.push('Diversify income sources to reduce risk');
  }

  // Passive income insights
  if (incomeData.incomeBySource.passive > 0) {
    const passivePercentage = (incomeData.incomeBySource.passive / incomeData.totalIncome) * 100;
    insights.push(`${passivePercentage.toFixed(1)}% of income is passive`);
    score += Math.min(25, passivePercentage);
  } else {
    recommendations.push('Consider building passive income streams');
  }

  return {
    insights,
    recommendations,
    score: Math.round(score)
  };
} 