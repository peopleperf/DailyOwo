/**
 * Net Worth Logic Module
 * Handles all net worth calculations: Assets - Liabilities
 * Includes savings goals tracking as part of liquid assets
 */

import { Transaction, TransactionType } from '@/types/transaction';
import { SavingsGoal, calculateSavingsGoals } from './savings-rate-logic';

export interface NetWorthData {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  assetsByCategory: Record<string, number>;
  liabilitiesByCategory: Record<string, number>;
  assetAllocation: {
    liquid: number; // Cash, checking, savings (includes savings goals)
    investments: number; // Stocks, bonds, crypto
    realEstate: number;
    retirement: number;
    other: number;
  };
  previousNetWorth?: number;
  netWorthGrowth?: number;
  growthPercentage?: number;
  // Savings goals integration
  savingsGoals: SavingsGoal[];
  emergencyFundDetails: {
    currentAmount: number;
    targetAmount: number;
    monthsCovered: number;
    isAdequate: boolean;
  };
}

export interface NetWorthTrend {
  date: Date;
  netWorth: number;
  assets: number;
  liabilities: number;
}

const LIQUID_CATEGORIES = ['cash', 'checking-account', 'savings-account', 'emergency-fund', 'general-savings', 'pension', 'vacation-fund', 'education-fund', 'house-fund', 'car-fund'];
const INVESTMENT_CATEGORIES = ['stocks', 'bonds', 'etf', 'mutual-funds', 'cryptocurrency', 'commodities', 'collectibles'];
const REAL_ESTATE_CATEGORIES = ['real-estate'];
const RETIREMENT_CATEGORIES = ['retirement-401k', 'retirement-ira'];

/**
 * Calculate current net worth from all transactions
 */
export function calculateNetWorth(
  transactions: Transaction[],
  previousPeriodTransactions?: Transaction[],
  monthlyExpenses?: number
): NetWorthData {
  // Filter asset and liability transactions
  const assetTransactions = transactions.filter(t => t.type === 'asset');
  const liabilityTransactions = transactions.filter(t => t.type === 'liability');

  // Calculate total assets
  const totalAssets = assetTransactions.reduce((sum, transaction) => {
    // For assets, use currentPrice * quantity if available, otherwise use amount
    if (transaction.assetDetails?.currentPrice && transaction.assetDetails?.quantity) {
      return sum + (transaction.assetDetails.currentPrice * transaction.assetDetails.quantity);
    }
    return sum + transaction.amount;
  }, 0);

  // Calculate total liabilities
  const totalLiabilities = liabilityTransactions.reduce((sum, transaction) => {
    return sum + transaction.amount;
  }, 0);

  // Net worth calculation
  const netWorth = totalAssets - totalLiabilities;

  // Assets by category
  const assetsByCategory = assetTransactions.reduce((acc, transaction) => {
    const category = transaction.categoryId;
    const value = transaction.assetDetails?.currentPrice && transaction.assetDetails?.quantity
      ? transaction.assetDetails.currentPrice * transaction.assetDetails.quantity
      : transaction.amount;
    
    acc[category] = (acc[category] || 0) + value;
    return acc;
  }, {} as Record<string, number>);

  // Liabilities by category
  const liabilitiesByCategory = liabilityTransactions.reduce((acc, transaction) => {
    const category = transaction.categoryId;
    acc[category] = (acc[category] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  // Asset allocation breakdown
  const assetAllocation = {
    liquid: LIQUID_CATEGORIES.reduce((sum, cat) => sum + (assetsByCategory[cat] || 0), 0),
    investments: INVESTMENT_CATEGORIES.reduce((sum, cat) => sum + (assetsByCategory[cat] || 0), 0),
    realEstate: REAL_ESTATE_CATEGORIES.reduce((sum, cat) => sum + (assetsByCategory[cat] || 0), 0),
    retirement: RETIREMENT_CATEGORIES.reduce((sum, cat) => sum + (assetsByCategory[cat] || 0), 0),
    other: 0
  };

  // Calculate 'other' category
  assetAllocation.other = totalAssets - (
    assetAllocation.liquid + 
    assetAllocation.investments + 
    assetAllocation.realEstate + 
    assetAllocation.retirement
  );

  // Calculate growth if previous period data is provided
  let previousNetWorth: number | undefined;
  let netWorthGrowth: number | undefined;
  let growthPercentage: number | undefined;

  if (previousPeriodTransactions) {
    const previousData = calculateNetWorth(previousPeriodTransactions, undefined, monthlyExpenses);
    previousNetWorth = previousData.netWorth;
    netWorthGrowth = netWorth - previousNetWorth;
    growthPercentage = previousNetWorth !== 0 ? (netWorthGrowth / previousNetWorth) * 100 : 0;
  }

  // Calculate savings goals (simplified implementation)
  const savingsGoals = calculateSavingsGoals(transactions, new Date(), monthlyExpenses || 0);

  // Calculate emergency fund details
  const emergencyFundDetails = calculateEmergencyFundDetails(
    transactions, 
    assetAllocation.liquid, 
    monthlyExpenses || 0
  );

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    assetsByCategory,
    liabilitiesByCategory,
    assetAllocation,
    previousNetWorth,
    netWorthGrowth,
    growthPercentage,
    savingsGoals,
    emergencyFundDetails
  };
}

/**
 * Calculate net worth for a specific date range
 */
export function calculateNetWorthForPeriod(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): NetWorthData {
  const periodTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });

  return calculateNetWorth(periodTransactions);
}

/**
 * Get net worth trend over time
 */
export function getNetWorthTrend(
  transactions: Transaction[],
  periodDays: number = 30
): NetWorthTrend[] {
  const trends: NetWorthTrend[] = [];
  const endDate = new Date();
  
  for (let i = periodDays; i >= 0; i--) {
    const date = new Date();
    date.setDate(endDate.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    
    // Get transactions up to this date
    const transactionsUpToDate = transactions.filter(t => 
      new Date(t.date) <= nextDate
    );
    
    const data = calculateNetWorth(transactionsUpToDate);
    
    trends.push({
      date,
      netWorth: data.netWorth,
      assets: data.totalAssets,
      liabilities: data.totalLiabilities
    });
  }
  
  return trends;
}

/**
 * Calculate asset allocation percentages
 */
export function calculateAssetAllocationPercentages(data: NetWorthData): Record<string, number> {
  const { assetAllocation, totalAssets } = data;
  
  if (totalAssets === 0) {
    return {
      liquid: 0,
      investments: 0,
      realEstate: 0,
      retirement: 0,
      other: 0
    };
  }
  
  return {
    liquid: (assetAllocation.liquid / totalAssets) * 100,
    investments: (assetAllocation.investments / totalAssets) * 100,
    realEstate: (assetAllocation.realEstate / totalAssets) * 100,
    retirement: (assetAllocation.retirement / totalAssets) * 100,
    other: (assetAllocation.other / totalAssets) * 100
  };
}

/**
 * Get emergency fund status based on liquid assets and monthly expenses
 */
export function getEmergencyFundStatus(
  netWorthData: NetWorthData,
  monthlyExpenses: number
): {
  emergencyFund: number;
  monthsCovered: number;
  isAdequate: boolean;
  recommendation: string;
} {
  const emergencyFund = netWorthData.assetAllocation.liquid;
  const monthsCovered = monthlyExpenses > 0 ? emergencyFund / monthlyExpenses : 0;
  const isAdequate = monthsCovered >= 3; // 3-6 months is recommended
  
  let recommendation = '';
  if (monthsCovered < 1) {
    recommendation = 'Build emergency fund immediately - aim for 1 month of expenses';
  } else if (monthsCovered < 3) {
    recommendation = 'Good start! Aim for 3-6 months of expenses';
  } else if (monthsCovered < 6) {
    recommendation = 'Great! Consider building to 6 months for optimal security';
  } else {
    recommendation = 'Excellent emergency fund coverage';
  }
  
  return {
    emergencyFund,
    monthsCovered: Math.round(monthsCovered * 10) / 10,
    isAdequate,
    recommendation
  };
}

/**
 * Calculate emergency fund details for net worth
 */
function calculateEmergencyFundDetails(
  transactions: Transaction[],
  liquidAssets: number,
  monthlyExpenses: number
): NetWorthData['emergencyFundDetails'] {
  // Find emergency fund specific savings
  const emergencyFundTransactions = transactions.filter(t => 
    ((t.type === 'expense' && t.categoryId === 'savings') || t.type === 'asset') &&
    t.description?.toLowerCase().includes('emergency')
  );

  const emergencyFundAmount = emergencyFundTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  // Target is 6 months of expenses, minimum 5000
  const targetAmount = Math.max(5000, monthlyExpenses * 6);
  
  const monthsCovered = monthlyExpenses > 0 ? emergencyFundAmount / monthlyExpenses : 0;
  const isAdequate = monthsCovered >= 3; // 3+ months is considered adequate

  return {
    currentAmount: emergencyFundAmount,
    targetAmount,
    monthsCovered: Math.round(monthsCovered * 10) / 10,
    isAdequate
  };
}