import { Budget, BudgetPeriod, BudgetData } from './budget-logic';
import { Transaction } from '@/types/transaction';
import { 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  format,
  isSameMonth
} from 'date-fns';

export interface MonthlyBudgetData {
  year: number;
  month: number;
  monthName: string;
  budget: Budget | null;
  actualIncome: number;
  plannedIncome: number;
  totalSpent: number;
  totalAllocated: number;
  savingsRate: number;
  budgetHealth: number;
  isCurrentMonth: boolean;
  hasBudget: boolean;
}

export interface BudgetHistoryData {
  months: MonthlyBudgetData[];
  yearlyOverview: {
    year: number;
    totalIncome: number;
    totalExpenses: number;
    totalSavings: number;
    averageMonthlyIncome: number;
    averageMonthlyExpenses: number;
    averageSavingsRate: number;
  };
}

/**
 * Get budget data for a specific month
 */
export function getMonthlyBudgetData(
  year: number,
  month: number,
  budgets: Budget[],
  transactions: Transaction[]
): MonthlyBudgetData {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  const currentDate = new Date();
  
  // Find budget for this month
  const monthBudget = budgets.find(budget => {
    const budgetStart = new Date(budget.period.startDate);
    return isSameMonth(budgetStart, monthStart);
  });
  
  // Filter transactions for this month
  const monthTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate >= monthStart && tDate <= monthEnd;
  });
  
  // Calculate actual income for the month
  const actualIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate total spent (expenses only)
  const totalSpent = monthTransactions
    .filter(t => t.type === 'expense')
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
  
  // Calculate actual savings from specific asset categories only
  const totalSavings = monthTransactions
    .filter(t => t.type === 'asset' && SAVINGS_CATEGORIES.includes(t.categoryId as any))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const plannedIncome = monthBudget?.period.totalIncome || 0;
  
  // Calculate totalAllocated from budget categories
  const totalAllocated = monthBudget 
    ? monthBudget.categories.reduce((sum, cat) => sum + cat.allocated, 0)
    : 0;
  
  const budgetHealth = monthBudget ? calculateBudgetHealthScore(monthBudget, actualIncome, totalSpent) : 0;
  
  // Savings rate based on actual savings transactions
  const savingsRate = actualIncome > 0 ? (totalSavings / actualIncome) * 100 : 0;
  
  return {
    year,
    month,
    monthName: format(monthStart, 'MMMM yyyy'),
    budget: monthBudget || null,
    actualIncome,
    plannedIncome,
    totalSpent,
    totalAllocated,
    savingsRate,
    budgetHealth,
    isCurrentMonth: isSameMonth(monthStart, currentDate),
    hasBudget: !!monthBudget
  };
}

/**
 * Get budget history for a range of months
 */
export function getBudgetHistory(
  startDate: Date,
  endDate: Date,
  budgets: Budget[],
  transactions: Transaction[]
): BudgetHistoryData {
  const months: MonthlyBudgetData[] = [];
  let currentDate = startOfMonth(startDate);
  
  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-indexed
    
    const monthData = getMonthlyBudgetData(year, month, budgets, transactions);
    months.push(monthData);
    
    currentDate = addMonths(currentDate, 1);
  }
  
  // Calculate yearly overview
  const currentYear = new Date().getFullYear();
  const yearMonths = months.filter(m => m.year === currentYear);
  
  const totalIncome = yearMonths.reduce((sum, m) => sum + m.actualIncome, 0);
  const totalExpenses = yearMonths.reduce((sum, m) => sum + m.totalSpent, 0);
  
  // Calculate actual savings from transactions for the year
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);
  
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
  
  const yearTransactions = transactions.filter(t => {
    const tDate = new Date(t.date);
    return tDate >= yearStart && tDate <= yearEnd;
  });
  
  const totalSavings = yearTransactions
    .filter(t => t.type === 'asset' && SAVINGS_CATEGORIES.includes(t.categoryId as any))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthsWithData = yearMonths.filter(m => m.actualIncome > 0).length || 1;
  
  return {
    months,
    yearlyOverview: {
      year: currentYear,
      totalIncome,
      totalExpenses,
      totalSavings,
      averageMonthlyIncome: totalIncome / monthsWithData,
      averageMonthlyExpenses: totalExpenses / monthsWithData,
      averageSavingsRate: totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0
    }
  };
}

/**
 * Create or update budget for a specific month based on actual income
 */
export async function createMonthlyBudget(
  userId: string,
  year: number,
  month: number,
  monthlyIncome: number,
  method: 'income-based' | 'fixed' | 'previous-month' = 'income-based'
): Promise<Budget> {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(new Date(year, month - 1));
  
  // Create budget period
  const period: BudgetPeriod = {
    id: `period-${year}-${month}`,
    startDate: monthStart,
    endDate: monthEnd,
    frequency: 'monthly',
    totalIncome: monthlyIncome,
    totalAllocated: 0,
    totalSpent: 0,
    totalSavings: 0,
    totalRemaining: 0,
    isActive: isSameMonth(monthStart, new Date())
  };
  
  // Import the budget creation function
  const { createBudgetFromMethod } = await import('./budget-logic');
  
  // Create budget with appropriate method
  const budgetMethod = {
    type: '50-30-20' as const,
    allocations: {}
  };
  
  const budget = createBudgetFromMethod(budgetMethod, monthlyIncome, period, userId);
  budget.name = `${format(monthStart, 'MMMM yyyy')} Budget`;
  
  return budget;
}

/**
 * Calculate budget health score for a specific month
 */
function calculateBudgetHealthScore(
  budget: Budget,
  actualIncome: number,
  totalSpent: number
): number {
  let score = 100;
  
  // Check if spending exceeded income
  if (totalSpent > actualIncome && actualIncome > 0) {
    score -= 30;
  }
  
  // Check category overspending
  const overBudgetCategories = budget.categories.filter(c => c.isOverBudget);
  score -= overBudgetCategories.length * 10;
  
  // Check if income matches planned
  const incomeVariance = Math.abs(actualIncome - budget.period.totalIncome) / budget.period.totalIncome;
  if (incomeVariance > 0.2) {
    score -= 20;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Get recommendations for budget adjustments based on income patterns
 */
export function getBudgetRecommendations(
  history: BudgetHistoryData,
  currentMonthIncome: number
): string[] {
  const recommendations: string[] = [];
  const { averageMonthlyIncome, averageSavingsRate } = history.yearlyOverview;
  
  // Income variability check
  const incomeVariance = Math.abs(currentMonthIncome - averageMonthlyIncome) / averageMonthlyIncome;
  if (incomeVariance > 0.3) {
    if (currentMonthIncome < averageMonthlyIncome) {
      recommendations.push(`Your income this month is ${Math.round(incomeVariance * 100)}% below average. Consider reducing discretionary spending.`);
    } else {
      recommendations.push(`Your income this month is ${Math.round(incomeVariance * 100)}% above average. Great opportunity to boost savings!`);
    }
  }
  
  // Savings rate check
  if (averageSavingsRate < 10) {
    recommendations.push('Your average savings rate is below 10%. Try to allocate more to savings.');
  }
  
  // No income warning
  if (currentMonthIncome === 0) {
    recommendations.push('No income recorded this month. Budget allocations should be adjusted to essential expenses only.');
  }
  
  return recommendations;
}

/**
 * Check if a new budget period should be created
 */
export function shouldCreateNewMonthlyBudget(
  currentDate: Date = new Date(),
  existingBudgets: Budget[]
): boolean {
  const currentMonth = startOfMonth(currentDate);
  
  // Check if budget exists for current month
  const currentMonthBudget = existingBudgets.find(budget => {
    const budgetStart = new Date(budget.period.startDate);
    return isSameMonth(budgetStart, currentMonth);
  });
  
  return !currentMonthBudget;
} 