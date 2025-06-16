/**
 * Financial calculation utilities
 */

export interface Asset {
  id: string;
  name: string;
  category: 'cash' | 'investment' | 'property' | 'vehicle' | 'other';
  value: number;
  currency: string;
}

export interface Liability {
  id: string;
  name: string;
  category: 'mortgage' | 'loan' | 'credit_card' | 'other';
  balance: number;
  currency: string;
  interestRate?: number;
  minimumPayment?: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  description?: string;
  recurring?: boolean;
  currency?: string;
}

export interface NetWorthSnapshot {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetsByCategory: Record<string, number>;
  liabilitiesByCategory: Record<string, number>;
  changeFromLastMonth: number;
  changePercentage: number;
}

export interface CashFlowSummary {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  savingsRate: number;
  expensesByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
}

interface MonthlyMetrics {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  topCategory: string | null;
  savingsRate: number;
  currency: string;
  categoryBreakdown: Record<string, number>;
}

/**
 * Calculate net worth from assets and liabilities
 */
export function calculateNetWorth(
  assets: Asset[] = [],
  liabilities: Liability[] = []
): NetWorthSnapshot {
  // Calculate total assets
  const totalAssets = assets.reduce((sum, asset) => sum + asset.value, 0);
  
  // Calculate assets by category
  const assetsByCategory = assets.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + asset.value;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total liabilities
  const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.balance, 0);
  
  // Calculate liabilities by category
  const liabilitiesByCategory = liabilities.reduce((acc, liability) => {
    acc[liability.category] = (acc[liability.category] || 0) + liability.balance;
    return acc;
  }, {} as Record<string, number>);

  // Calculate net worth
  const netWorth = totalAssets - totalLiabilities;

  // TODO: Calculate change from last month (requires historical data)
  const changeFromLastMonth = 0;
  const changePercentage = 0;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    assetsByCategory,
    liabilitiesByCategory,
    changeFromLastMonth,
    changePercentage,
  };
}

/**
 * Calculate cash flow from transactions
 */
export function calculateCashFlow(
  transactions: Transaction[],
  period: 'week' | 'month' | 'year' = 'month'
): CashFlowSummary {
  const now = new Date();
  const startDate = new Date();
  
  // Set start date based on period
  switch (period) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  // Filter transactions within period
  const periodTransactions = transactions.filter(
    t => new Date(t.date) >= startDate && new Date(t.date) <= now
  );

  // Calculate totals
  const totalIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

  // Calculate by category
  const expensesByCategory = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const incomeByCategory = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return {
    totalIncome,
    totalExpenses,
    netCashFlow,
    savingsRate,
    expensesByCategory,
    incomeByCategory,
  };
}

/**
 * Calculate monthly savings needed to reach a goal
 */
export function calculateMonthlySavingsForGoal(
  targetAmount: number,
  currentAmount: number,
  monthsToGoal: number,
  annualReturnRate: number = 0.07 // 7% default
): number {
  if (monthsToGoal <= 0) return 0;
  if (targetAmount <= currentAmount) return 0;

  const monthlyRate = annualReturnRate / 12;
  const futureValueOfCurrent = currentAmount * Math.pow(1 + monthlyRate, monthsToGoal);
  const remainingAmount = targetAmount - futureValueOfCurrent;

  // PMT formula for monthly payment
  if (monthlyRate === 0) {
    return remainingAmount / monthsToGoal;
  }

  return remainingAmount * monthlyRate / (Math.pow(1 + monthlyRate, monthsToGoal) - 1);
}

/**
 * Calculate time to pay off debt
 */
export function calculateDebtPayoffTime(
  balance: number,
  interestRate: number,
  monthlyPayment: number
): { months: number; totalInterest: number } {
  if (monthlyPayment <= 0 || balance <= 0) {
    return { months: 0, totalInterest: 0 };
  }

  const monthlyRate = interestRate / 100 / 12;
  
  // Check if payment covers interest
  const monthlyInterest = balance * monthlyRate;
  if (monthlyPayment <= monthlyInterest) {
    return { months: Infinity, totalInterest: Infinity };
  }

  // Calculate months to payoff
  const months = Math.ceil(
    -Math.log(1 - (balance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate)
  );

  // Calculate total interest
  const totalPaid = monthlyPayment * months;
  const totalInterest = totalPaid - balance;

  return { months, totalInterest };
}

/**
 * Calculate emergency fund target
 */
export function calculateEmergencyFundTarget(
  monthlyExpenses: number,
  jobStability: 'stable' | 'moderate' | 'unstable',
  dependents: number
): { targetMonths: number; targetAmount: number } {
  let baseMonths = 3;

  // Adjust for job stability
  switch (jobStability) {
    case 'stable':
      baseMonths = 3;
      break;
    case 'moderate':
      baseMonths = 6;
      break;
    case 'unstable':
      baseMonths = 9;
      break;
  }

  // Add months for dependents
  const additionalMonths = Math.min(dependents * 1, 3); // Max 3 additional months
  const targetMonths = baseMonths + additionalMonths;
  const targetAmount = monthlyExpenses * targetMonths;

  return { targetMonths, targetAmount };
}

/**
 * Generate mock historical data for charts
 */
export function generateMockHistoricalData(
  months: number = 12,
  startValue: number = 10000,
  volatility: number = 0.1
): Array<{ date: string; value: number }> {
  const data = [];
  let currentValue = startValue;
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    
    // Add some randomness but trend upward
    const change = (Math.random() - 0.4) * volatility * currentValue;
    currentValue = Math.max(0, currentValue + change);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(currentValue),
    });
  }

  return data;
}

export function calculateMonthlyMetrics(transactions: Transaction[]): MonthlyMetrics {
  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryExpenses: Record<string, number> = {};
  let currency = '$';
  
  // Calculate totals and category breakdown
  transactions.forEach(transaction => {
    if (transaction.currency) {
      currency = transaction.currency;
    }
    
    if (transaction.type === 'income') {
      totalIncome += transaction.amount;
    } else {
      totalExpenses += transaction.amount;
      
      const category = transaction.category || 'Uncategorized';
      categoryExpenses[category] = (categoryExpenses[category] || 0) + transaction.amount;
    }
  });
  
  // Find top spending category
  let topCategory: string | null = null;
  let maxCategoryAmount = 0;
  
  Object.entries(categoryExpenses).forEach(([category, amount]) => {
    if (amount > maxCategoryAmount) {
      maxCategoryAmount = amount;
      topCategory = category;
    }
  });
  
  // Calculate savings and savings rate
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 
    ? Math.round((netSavings / totalIncome) * 100) 
    : 0;
  
  return {
    totalIncome,
    totalExpenses,
    netSavings,
    topCategory,
    savingsRate,
    currency,
    categoryBreakdown: categoryExpenses,
  };
} 