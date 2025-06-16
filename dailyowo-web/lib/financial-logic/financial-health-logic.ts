/**
 * Financial Health Score Logic Module
 * Comprehensive financial wellness calculation
 * Unlike net worth (assets - liabilities), this considers multiple factors
 */

import { Transaction } from '../../types/transaction';
import { NetWorthData } from './networth-logic';
import { IncomeData } from './income-logic';
import { ExpensesData } from './expenses-logic';
import { SavingsRateData } from './savings-rate-logic';
import { DebtRatioData } from './debt-ratio-logic';
import { 
  FINANCIAL_HEALTH_WEIGHTS, 
  SCORE_THRESHOLDS,
  FINANCIAL_RATIOS,
  FINANCIAL_LIMITS 
} from '../constants/financial-constants';

export interface FinancialHealthScore {
  score: number;
  rating: 'excellent' | 'good' | 'fair' | 'needs-improvement' | 'critical';
  summary: string;
  recommendations: string[];
  componentScores: {
    savings: number;
    debt: number;
    income: number;
    spending: number;
    netWorth: number;
  };
}

export interface FinancialHealthData {
  totalIncome: number;
  totalExpenses: number;
  totalAssets: number;
  totalLiabilities: number;
  liquidAssets: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  isIncomeStable: boolean;
  emergencyFundMonths: number;
}

interface FinancialHealthInput {
  netWorth: NetWorthData;
  income: IncomeData;
  expenses: ExpensesData;
  savingsRate: SavingsRateData;
  debtRatio: DebtRatioData;
}

function convertInputToHealthData(input: FinancialHealthInput): FinancialHealthData {
  return {
    totalIncome: input.income.totalIncome,
    totalExpenses: input.expenses.totalExpenses,
    totalAssets: input.netWorth.totalAssets,
    totalLiabilities: input.netWorth.totalLiabilities,
    liquidAssets: input.netWorth.assetAllocation.liquid,
    monthlyIncome: input.income.monthlyIncome,
    monthlyExpenses: input.expenses.monthlyExpenses,
    savingsRate: input.savingsRate.savingsRate,
    debtToIncomeRatio: input.debtRatio.debtToIncomeRatio,
    isIncomeStable: input.income.isIncomeStable,
    emergencyFundMonths: input.netWorth.emergencyFundDetails.monthsCovered,
  };
}

function generateSummary(score: number, rating: FinancialHealthScore['rating']): string {
  if (rating === 'excellent') return `Excellent! Your score of ${score} reflects strong financial habits.`;
  if (rating === 'good') return `Good job! Your score of ${score} shows you're on the right track.`;
  if (rating === 'fair') return `You're making progress. Your score of ${score} is a solid foundation.`;
  if (rating === 'needs-improvement') return `There's room to improve. Your score is ${score}. Let's focus on key areas.`;
  return `Critical financial situation. Your score is ${score}. Immediate action is recommended.`;
}

export function calculateFinancialHealthScore(data: FinancialHealthInput): FinancialHealthScore {
  const healthData = convertInputToHealthData(data);

  const netWorthScore = calculateNetWorthScore(healthData);
  const incomeScore = calculateIncomeScore(healthData);
  const expenseScore = calculateExpenseScore(healthData);
  const savingsScore = calculateSavingsScore(healthData);
  const debtScore = calculateDebtScore(healthData);

  const componentScores = {
    netWorth: netWorthScore,
    income: incomeScore,
    spending: expenseScore,
    savings: savingsScore,
    debt: debtScore,
  };

  const score = Math.round(
    componentScores.netWorth * FINANCIAL_HEALTH_WEIGHTS.NET_WORTH +
    componentScores.income * FINANCIAL_HEALTH_WEIGHTS.INCOME +
    componentScores.spending * FINANCIAL_HEALTH_WEIGHTS.SPENDING +
    componentScores.savings * FINANCIAL_HEALTH_WEIGHTS.SAVINGS +
    componentScores.debt * FINANCIAL_HEALTH_WEIGHTS.DEBT
  );

  let rating: FinancialHealthScore['rating'] = 'critical';
  if (score >= SCORE_THRESHOLDS.EXCELLENT) rating = 'excellent';
  else if (score >= SCORE_THRESHOLDS.GOOD) rating = 'good';
  else if (score >= SCORE_THRESHOLDS.FAIR) rating = 'fair';
  else if (score >= SCORE_THRESHOLDS.NEEDS_IMPROVEMENT) rating = 'needs-improvement';

  const summary = generateSummary(score, rating);
  const recommendations = generateRecommendations(healthData, componentScores, score);

  return {
    score,
    rating,
    summary,
    recommendations,
    componentScores,
  };
}

function calculateNetWorthScore(data: FinancialHealthData): number {
  const netWorth = data.totalAssets - data.totalLiabilities;
  const totalAssets = data.totalAssets;

  if (totalAssets === 0) {
    // No assets means worst score, but not zero to differentiate from error
    return 10;
  }

  const ratio = netWorth / totalAssets;

  if (ratio >= FINANCIAL_RATIOS.NET_WORTH_EXCELLENT) {
    return 100;
  } else if (ratio >= FINANCIAL_RATIOS.NET_WORTH_GOOD) {
    return 80;
  } else if (ratio >= FINANCIAL_RATIOS.NET_WORTH_FAIR) {
    return 60;
  } else if (ratio > 0) {
    return 40;
  } else {
    return 10;
  }
}

function calculateIncomeScore(data: FinancialHealthData): number {
  let score = 0;

  if (data.isIncomeStable) {
    score += 50;
  } else {
    score += 10;
  }

  if (data.monthlyIncome >= FINANCIAL_LIMITS.HIGH_INCOME_THRESHOLD) {
    score += 50;
  } else if (data.monthlyIncome >= FINANCIAL_LIMITS.MEDIUM_INCOME_THRESHOLD) {
    score += 40;
  } else if (data.monthlyIncome >= FINANCIAL_LIMITS.LOW_INCOME_THRESHOLD) {
    score += 30;
  } else if (data.monthlyIncome >= FINANCIAL_LIMITS.MINIMUM_INCOME_THRESHOLD) {
    score += 20;
  } else {
    score += 10;
  }

  return Math.min(score, 100);
}

function calculateExpenseScore(data: FinancialHealthData): number {
  // Handle zero income case
  if (data.totalIncome === 0) {
    // If no income but also no expenses, that's neutral
    if (data.totalExpenses === 0) return 50;
    // If expenses but no income, that's problematic
    return 10;
  }
  
  const expenseRatio = data.totalExpenses / data.totalIncome;

  if (expenseRatio <= 0.5) {
    return 100;
  } else if (expenseRatio <= 0.7) {
    return 80;
  } else if (expenseRatio <= 0.9) {
    return 60;
  } else {
    return 30;
  }
}

function calculateSavingsScore(data: FinancialHealthData): number {
  const savingsRate = data.savingsRate;

  if (savingsRate >= FINANCIAL_RATIOS.SAVINGS_RATE_EXCELLENT * 100) {
    return 100;
  } else if (savingsRate >= FINANCIAL_RATIOS.SAVINGS_RATE_GOOD * 100) {
    return 80;
  } else if (savingsRate >= FINANCIAL_RATIOS.SAVINGS_RATE_FAIR * 100) {
    return 55;
  } else if (savingsRate >= FINANCIAL_RATIOS.SAVINGS_RATE_MINIMUM * 100) {
    return 40;
  } else if (savingsRate >= 0) {
    return 25;
  } else {
    return 0;
  }
}

function calculateDebtScore(data: FinancialHealthData): number {
  const debtRatio = data.debtToIncomeRatio;

  if (debtRatio === 0) {
    return 100;
  } else if (debtRatio <= FINANCIAL_RATIOS.DEBT_TO_INCOME_EXCELLENT * 100) {
    return 90;
  } else if (debtRatio <= FINANCIAL_RATIOS.DEBT_TO_INCOME_GOOD * 100) {
    return 75;
  } else if (debtRatio <= FINANCIAL_RATIOS.DEBT_TO_INCOME_FAIR * 100) {
    return 50;
  } else if (debtRatio <= FINANCIAL_RATIOS.DEBT_TO_INCOME_CONCERNING * 100) {
    return 25;
  } else {
    return 10;
  }
}

function generateRecommendations(
  data: FinancialHealthData,
  componentScores: FinancialHealthScore['componentScores'],
  overall: number
): string[] {
  const recommendations: string[] = [];

  if (data.emergencyFundMonths < FINANCIAL_RATIOS.EMERGENCY_FUND_MINIMUM_MONTHS) {
    recommendations.push(`Priority: Build emergency fund to ${FINANCIAL_RATIOS.EMERGENCY_FUND_MINIMUM_MONTHS}-${FINANCIAL_RATIOS.EMERGENCY_FUND_RECOMMENDED_MONTHS} months of expenses`);
  }

  if (data.debtToIncomeRatio > FINANCIAL_RATIOS.DEBT_TO_INCOME_GOOD * 100) {
    recommendations.push(`Focus on debt reduction - aim for debt-to-income ratio below ${FINANCIAL_RATIOS.DEBT_TO_INCOME_GOOD * 100}%`);
  }

  if (data.savingsRate < FINANCIAL_RATIOS.SAVINGS_RATE_GOOD * 100) {
    recommendations.push(`Increase savings rate - aim for at least ${FINANCIAL_RATIOS.SAVINGS_RATE_GOOD * 100}-${FINANCIAL_RATIOS.SAVINGS_RATE_EXCELLENT * 100}% of income`);
  }

  if (!data.isIncomeStable) {
    recommendations.push('Work on creating more predictable income streams');
  }

  if (overall < SCORE_THRESHOLDS.NEEDS_IMPROVEMENT) {
    recommendations.unshift('Focus on financial basics: emergency fund and debt reduction');
  } else if (overall < SCORE_THRESHOLDS.FAIR) {
    recommendations.unshift('Build on your foundation with increased savings and income optimization');
  } else if (overall < SCORE_THRESHOLDS.GOOD) {
    recommendations.unshift('Consider investment diversification and long-term wealth building');
  } else {
    recommendations.push('Maintain your excellent financial habits and consider advanced strategies');
  }

  return recommendations;
}