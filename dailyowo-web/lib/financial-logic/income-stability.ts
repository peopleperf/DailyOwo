import { Transaction } from '@/types/transaction';
import { safeDivide, safePercentage } from '@/lib/utils/error-handling';
import { FINANCIAL_CONSTANTS } from '@/lib/constants/financial-constants';

/**
 * Income Stability Analysis
 * Corrected formulas for accurate income stability calculations
 */

export interface IncomeStabilityMetrics {
  stabilityScore: number; // 0-100
  coefficient: number; // Coefficient of variation
  averageIncome: number;
  standardDeviation: number;
  monthlyIncomes: number[];
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: 'low' | 'medium' | 'high';
  consistency: number; // Percentage of months with income
  predictability: number; // How predictable the income is
}

/**
 * Calculate income stability metrics from transaction history
 * Fixed formula: Uses coefficient of variation and consistency
 */
export function calculateIncomeStability(
  transactions: Transaction[],
  monthsToAnalyze: number = 12
): IncomeStabilityMetrics {
  // Filter income transactions
  const incomeTransactions = transactions.filter(t => 
    t.type === 'income' && 
    t.date instanceof Date
  );

  // Group by month
  const monthlyIncomes = new Map<string, number>();
  const now = new Date();
  
  // Initialize all months to 0
  for (let i = 0; i < monthsToAnalyze; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    monthlyIncomes.set(key, 0);
  }

  // Sum income by month
  incomeTransactions.forEach(transaction => {
    const date = transaction.date;
    const monthsAgo = (now.getFullYear() - date.getFullYear()) * 12 + 
                     (now.getMonth() - date.getMonth());
    
    if (monthsAgo < monthsToAnalyze && monthsAgo >= 0) {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      monthlyIncomes.set(key, (monthlyIncomes.get(key) || 0) + transaction.amount);
    }
  });

  // Convert to array and calculate metrics
  const incomes = Array.from(monthlyIncomes.values()).reverse(); // Oldest to newest
  const nonZeroIncomes = incomes.filter(income => income > 0);

  // Calculate average
  const totalIncome = incomes.reduce((sum, income) => sum + income, 0);
  const averageIncome = safeDivide(totalIncome, incomes.length) || 0;

  // Calculate standard deviation
  const variance = incomes.reduce((sum, income) => {
    const diff = income - averageIncome;
    return sum + (diff * diff);
  }, 0) / incomes.length;
  const standardDeviation = Math.sqrt(variance);

  // Calculate coefficient of variation (CV)
  // Lower CV = more stable income
  const coefficient = averageIncome > 0 
    ? safeDivide(standardDeviation, averageIncome) || 0
    : 1; // Max instability if no income

  // Calculate consistency (percentage of months with income)
  const consistency = safePercentage(nonZeroIncomes.length, incomes.length);

  // Calculate trend
  const trend = calculateIncomeTrend(incomes);

  // Calculate volatility based on CV
  const volatility = coefficient <= 0.15 ? 'low' : 
                    coefficient <= 0.35 ? 'medium' : 'high';

  // Calculate predictability (inverse of CV, scaled to 0-100)
  const predictability = Math.max(0, Math.min(100, (1 - coefficient) * 100));

  // Calculate stability score
  // Formula: 40% consistency + 40% predictability + 20% trend bonus
  let stabilityScore = (consistency * 0.4) + (predictability * 0.4);
  
  // Add trend bonus
  if (trend === 'increasing') {
    stabilityScore += 20;
  } else if (trend === 'stable') {
    stabilityScore += 10;
  }

  // Ensure score is between 0 and 100
  stabilityScore = Math.max(0, Math.min(100, stabilityScore));

  return {
    stabilityScore: Math.round(stabilityScore),
    coefficient: Math.round(coefficient * 100) / 100,
    averageIncome: Math.round(averageIncome * 100) / 100,
    standardDeviation: Math.round(standardDeviation * 100) / 100,
    monthlyIncomes: incomes.map(i => Math.round(i * 100) / 100),
    trend,
    volatility,
    consistency: Math.round(consistency),
    predictability: Math.round(predictability),
  };
}

/**
 * Calculate income trend using linear regression
 */
function calculateIncomeTrend(incomes: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (incomes.length < 3) return 'stable';

  // Simple linear regression
  const n = incomes.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  incomes.forEach((income, index) => {
    sumX += index;
    sumY += income;
    sumXY += index * income;
    sumX2 += index * index;
  });

  const slope = safeDivide(
    (n * sumXY - sumX * sumY),
    (n * sumX2 - sumX * sumX)
  ) || 0;

  // Calculate slope as percentage of average
  const avgIncome = safeDivide(sumY, n) || 0;
  const slopePercentage = avgIncome > 0 
    ? safeDivide(slope, avgIncome) || 0
    : 0;

  // Determine trend based on slope
  if (slopePercentage > 0.05) return 'increasing';
  if (slopePercentage < -0.05) return 'decreasing';
  return 'stable';
}

/**
 * Calculate projected income for next month
 */
export function projectNextMonthIncome(
  transactions: Transaction[],
  monthsToAnalyze: number = 6
): {
  projected: number;
  confidence: number;
  range: { min: number; max: number };
} {
  const stability = calculateIncomeStability(transactions, monthsToAnalyze);
  
  // Base projection on average
  let projected = stability.averageIncome;
  
  // Adjust for trend
  if (stability.trend === 'increasing' && stability.monthlyIncomes.length >= 3) {
    // Calculate recent growth rate
    const recent = stability.monthlyIncomes.slice(-3);
    const growthRate = recent.length >= 2 
      ? safeDivide(recent[recent.length - 1] - recent[0], recent[0]) || 0
      : 0;
    projected *= (1 + Math.min(0.1, Math.max(-0.1, growthRate))); // Cap at ±10%
  } else if (stability.trend === 'decreasing') {
    // Be conservative with decreasing trend
    projected *= 0.95;
  }

  // Calculate confidence based on stability
  const confidence = stability.stabilityScore;

  // Calculate range based on standard deviation
  const range = {
    min: Math.max(0, projected - stability.standardDeviation),
    max: projected + stability.standardDeviation,
  };

  return {
    projected: Math.round(projected * 100) / 100,
    confidence: Math.round(confidence),
    range: {
      min: Math.round(range.min * 100) / 100,
      max: Math.round(range.max * 100) / 100,
    },
  };
}

/**
 * Get income stability insights
 */
export function getIncomeStabilityInsights(
  metrics: IncomeStabilityMetrics
): {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  message: string;
  recommendations: string[];
} {
  let level: 'excellent' | 'good' | 'fair' | 'poor';
  let message: string;
  const recommendations: string[] = [];

  if (metrics.stabilityScore >= 80) {
    level = 'excellent';
    message = 'Your income is very stable and predictable';
  } else if (metrics.stabilityScore >= 60) {
    level = 'good';
    message = 'Your income shows good stability';
  } else if (metrics.stabilityScore >= 40) {
    level = 'fair';
    message = 'Your income has moderate stability';
  } else {
    level = 'poor';
    message = 'Your income shows low stability';
  }

  // Add specific recommendations
  if (metrics.consistency < 75) {
    recommendations.push('Try to establish more consistent income sources');
  }

  if (metrics.volatility === 'high') {
    recommendations.push('Consider building a larger emergency fund to handle income fluctuations');
  }

  if (metrics.trend === 'decreasing') {
    recommendations.push('Look for opportunities to stabilize or increase your income');
  }

  if (metrics.coefficient > 0.5) {
    recommendations.push('Your income varies significantly month-to-month. Consider budgeting based on your lowest income months');
  }

  return { level, message, recommendations };
} 