/**
 * Debt Ratio Logic Module
 * Handles debt-to-income ratio calculations and debt analysis
 */

import { Transaction } from '@/types/transaction';

export interface DebtRatioData {
  debtToIncomeRatio: number; // Percentage
  monthlyDebtPayments: number;
  monthlyIncome: number;
  totalDebtBalance: number; // Current balance after payments
  originalDebtBalance: number; // Original debt amount
  totalDebtPaid: number; // Total amount paid towards debts
  debtServiceRatio: number; // Monthly debt payments / Monthly income
  previousDebtRatio?: number;
  debtRatioChange?: number;
  debtPayoffTime: number; // Estimated months to pay off all debt
  totalInterestCost: number; // Total interest to be paid
  averageInterestRate: number;
  highestInterestDebt: {
    categoryId: string;
    balance: number;
    interestRate: number;
  } | null;
  debtsByCategory: {
    categoryId: string;
    originalBalance: number;
    currentBalance: number;
    totalPaid: number;
    isFullyPaid: boolean;
    lastPaymentDate?: Date;
  }[];
  debtSnowball: DebtPayoffStrategy['payoffOrder'];
  debtAvalanche: DebtPayoffStrategy['payoffOrder'];
}

export interface DebtBreakdown {
  totalDebt: number;
  debtByCategory: Record<string, {
    balance: number;
    minimumPayment: number;
    interestRate: number;
    monthsToPayoff: number;
  }>;
  debtByPriority: {
    category: string;
    balance: number;
    interestRate: number;
    minimumPayment: number;
    avalanchePriority: number; // 1 = highest priority for avalanche method
    snowballPriority: number; // 1 = highest priority for snowball method
  }[];
  totalMinimumPayments: number;
}

export interface DebtPayoffStrategy {
  strategy: 'avalanche' | 'snowball' | 'custom';
  payoffOrder: {
    category: string;
    balance: number;
    interestRate: number;
    minimumPayment: number;
    totalInterestSaved?: number;
    monthsToPayoff: number;
  }[];
  totalPayoffTime: number; // Months
  totalInterestCost: number;
  extraPaymentAllocation: Record<string, number>;
}

export interface DebtRatioTrend {
  date: Date;
  debtToIncomeRatio: number;
  totalDebt: number;
  monthlyIncome: number;
  monthlyDebtPayments: number;
}

/**
 * Calculate debt balances by category after accounting for payments
 */
function calculateDebtBalancesByCategory(
  debtTransactions: Transaction[],
  debtPayments: Transaction[]
): DebtRatioData['debtsByCategory'] {
  const debtsByCategory: Record<string, {
    originalBalance: number;
    currentBalance: number;
    totalPaid: number;
    isFullyPaid: boolean;
    lastPaymentDate?: Date;
  }> = {};

  // Group debts by category and sum original balances
  debtTransactions.forEach(debt => {
    const categoryId = debt.categoryId;
    if (!debtsByCategory[categoryId]) {
      debtsByCategory[categoryId] = {
        originalBalance: 0,
        currentBalance: 0,
        totalPaid: 0,
        isFullyPaid: false
      };
    }
    debtsByCategory[categoryId].originalBalance += debt.amount;
    debtsByCategory[categoryId].currentBalance += debt.amount; // Start with original balance
  });

  // Subtract payments from current balances
  debtPayments.forEach(payment => {
    let targetCategoryId = payment.categoryId;
    
    // If payment has debtId, find the corresponding debt category
    if (payment.debtId) {
      const associatedDebt = debtTransactions.find(d => d.id === payment.debtId);
      if (associatedDebt) {
        targetCategoryId = associatedDebt.categoryId;
      }
    } else if (payment.categoryId === 'debt-payment') {
      // For generic debt payments, try to match by merchant/description
      const matchedDebt = debtTransactions.find(debt => 
        debt.liabilityDetails?.lender === payment.merchant ||
        debt.description.toLowerCase().includes(payment.description.toLowerCase()) ||
        payment.description.toLowerCase().includes(debt.description.toLowerCase())
      );
      if (matchedDebt) {
        targetCategoryId = matchedDebt.categoryId;
      }
    }

    // Apply payment to the target category
    if (debtsByCategory[targetCategoryId]) {
      debtsByCategory[targetCategoryId].totalPaid += payment.amount;
      debtsByCategory[targetCategoryId].currentBalance = Math.max(0, 
        debtsByCategory[targetCategoryId].currentBalance - payment.amount
      );
      
      // Update last payment date
      const paymentDate = new Date(payment.date);
      if (!debtsByCategory[targetCategoryId].lastPaymentDate || 
          paymentDate > (debtsByCategory[targetCategoryId].lastPaymentDate || new Date(0))) {
        debtsByCategory[targetCategoryId].lastPaymentDate = paymentDate;
      }
      
      // Mark as fully paid if balance is zero
      if (debtsByCategory[targetCategoryId].currentBalance <= 0) {
        debtsByCategory[targetCategoryId].isFullyPaid = true;
        debtsByCategory[targetCategoryId].currentBalance = 0;
      }
    }
  });

  // Convert to array format
  return Object.entries(debtsByCategory).map(([categoryId, data]) => ({
    categoryId,
    ...data
  }));
}

/**
 * Calculate comprehensive debt ratio data
 */
export function calculateDebtRatioData(
  transactions: Transaction[],
  periodStartDate: Date,
  periodEndDate: Date,
  previousPeriodTransactions?: Transaction[]
): DebtRatioData {
  // Filter transactions for the period
  const periodTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= periodStartDate && transactionDate <= periodEndDate;
  });

  // Calculate monthly income
  const monthlyIncome = periodTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  // Get all liability (debt) transactions to calculate original debt balances
  const debtTransactions = transactions.filter(t => t.type === 'liability');
  const originalDebtBalance = debtTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Get all debt payment transactions (expense transactions with debt_payment category or specified debtId)
  const allDebtPayments = transactions.filter(t => 
    t.type === 'expense' && 
    (t.categoryId === 'debt-payment' || t.debtId) // debtId links payment to specific debt
  );

  // Calculate debt balances after payments by category
  const debtsByCategory = calculateDebtBalancesByCategory(debtTransactions, allDebtPayments);
  
  // Calculate current total debt balance (after payments)
  const totalDebtBalance = debtsByCategory.reduce((sum, debt) => sum + debt.currentBalance, 0);
  
  // Calculate total amount paid towards debts
  const totalDebtPaid = debtsByCategory.reduce((sum, debt) => sum + debt.totalPaid, 0);

  // Calculate monthly debt payments (for the current period)
  const monthlyDebtPayments = periodTransactions.filter(t => 
    t.type === 'expense' && (t.categoryId === 'debt-payment' || t.debtId)
  ).reduce((sum, t) => sum + t.amount, 0);

  // Calculate debt-to-income ratio (annual debt / annual income)
  const annualIncome = monthlyIncome * 12;
  const debtToIncomeRatio = annualIncome > 0 ? (totalDebtBalance / annualIncome) * 100 : 0;

  // Calculate debt service ratio (monthly payments / monthly income)
  const debtServiceRatio = monthlyIncome > 0 ? (monthlyDebtPayments / monthlyIncome) * 100 : 0;

  // Calculate previous period comparison
  let previousDebtRatio: number | undefined;
  let debtRatioChange: number | undefined;

  if (previousPeriodTransactions) {
    const previousStartDate = new Date(periodStartDate);
    previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    const previousEndDate = new Date(periodEndDate);
    previousEndDate.setMonth(previousEndDate.getMonth() - 1);

    const previousData = calculateDebtRatioData(
      previousPeriodTransactions,
      previousStartDate,
      previousEndDate
    );
    
    previousDebtRatio = previousData.debtToIncomeRatio;
    debtRatioChange = debtToIncomeRatio - previousDebtRatio;
  }

  // Calculate debt metrics
  const debtTransactionsWithInterest = debtTransactions
    .filter(t => t.type === 'liability' && t.liabilityDetails?.interestRate);
  
  const highestInterestDebt = debtTransactionsWithInterest.length > 0
    ? debtTransactionsWithInterest.sort((a, b) => (b.liabilityDetails?.interestRate ?? 0) - (a.liabilityDetails?.interestRate ?? 0))[0]
    : null;

  const debtBreakdown = getDebtBreakdown(transactions);
  const debtSnowball = calculateDebtPayoffStrategy(debtBreakdown, 0, 'snowball').payoffOrder;
  const debtAvalanche = calculateDebtPayoffStrategy(debtBreakdown, 0, 'avalanche').payoffOrder;

  return {
    debtToIncomeRatio,
    monthlyDebtPayments,
    monthlyIncome,
    totalDebtBalance,
    originalDebtBalance,
    totalDebtPaid,
    debtServiceRatio,
    previousDebtRatio,
    debtRatioChange,
    debtPayoffTime: 0, // Placeholder
    totalInterestCost: 0, // Placeholder
    averageInterestRate: 0, // Placeholder
    highestInterestDebt: highestInterestDebt ? {
      categoryId: highestInterestDebt.categoryId,
      balance: highestInterestDebt.amount,
      interestRate: highestInterestDebt.liabilityDetails!.interestRate!
    } : null,
    debtsByCategory,
    debtSnowball,
    debtAvalanche
  };
}

/**
 * Calculate debt metrics like payoff time and interest costs
 */
function calculateDebtMetrics(
  debtTransactions: Transaction[],
  monthlyPayments: number
): {
  debtPayoffTime: number;
  totalInterestCost: number;
  averageInterestRate: number;
  highestInterestDebt: DebtRatioData['highestInterestDebt'];
} {
  if (debtTransactions.length === 0) {
    return {
      debtPayoffTime: 0,
      totalInterestCost: 0,
      averageInterestRate: 0,
      highestInterestDebt: null
    };
  }

  let totalBalance = 0;
  let weightedInterestRate = 0;
  let highestInterestDebt: DebtRatioData['highestInterestDebt'] = null;
  let totalInterestCost = 0;

  debtTransactions.forEach(debt => {
    const balance = debt.amount;
    const interestRate = debt.liabilityDetails?.interestRate || 0;
    
    totalBalance += balance;
    weightedInterestRate += balance * interestRate;

    if (interestRate > 0 && (!highestInterestDebt || interestRate > highestInterestDebt.interestRate)) {
      highestInterestDebt = {
        categoryId: debt.categoryId,
        balance,
        interestRate
      };
    }

    // Simple interest calculation for individual debt
    if (interestRate > 0 && monthlyPayments > 0) {
      const monthlyRate = interestRate / 100 / 12;
      const months = Math.log(1 + (balance * monthlyRate) / monthlyPayments) / Math.log(1 + monthlyRate);
      totalInterestCost += (monthlyPayments * months) - balance;
    }
  });

  const averageInterestRate = totalBalance > 0 ? weightedInterestRate / totalBalance : 0;

  // Estimate overall payoff time
  let debtPayoffTime = 0;
  if (monthlyPayments > 0 && totalBalance > 0) {
    if (averageInterestRate > 0) {
      const monthlyRate = averageInterestRate / 100 / 12;
      debtPayoffTime = Math.log(1 + (totalBalance * monthlyRate) / monthlyPayments) / Math.log(1 + monthlyRate);
    } else {
      debtPayoffTime = totalBalance / monthlyPayments;
    }
  }

  return {
    debtPayoffTime: Math.round(debtPayoffTime),
    totalInterestCost: Math.round(totalInterestCost),
    averageInterestRate: Math.round(averageInterestRate * 100) / 100,
    highestInterestDebt: highestInterestDebt
  };
}

/**
 * Get detailed debt breakdown by category
 */
export function getDebtBreakdown(transactions: Transaction[]): DebtBreakdown {
  const debtTransactions = transactions.filter(t => t.type === 'liability');
  
  if (debtTransactions.length === 0) {
    return {
      totalDebt: 0,
      debtByCategory: {},
      debtByPriority: [],
      totalMinimumPayments: 0
    };
  }

  const debtByCategory: DebtBreakdown['debtByCategory'] = {};
  let totalDebt = 0;
  let totalMinimumPayments = 0;

  // Group by category and calculate metrics
  debtTransactions.forEach(debt => {
    const categoryId = debt.categoryId;
    const balance = debt.amount;
    const interestRate = debt.liabilityDetails?.interestRate ?? 0;
    const minimumPayment = debt.liabilityDetails?.minimumPayment ?? 0;
    
    totalDebt += balance;
    totalMinimumPayments += minimumPayment;

    if (!debtByCategory[categoryId]) {
      debtByCategory[categoryId] = {
        balance: 0,
        minimumPayment: 0,
        interestRate: 0,
        monthsToPayoff: 0
      };
    }

    debtByCategory[categoryId].balance += balance;
    debtByCategory[categoryId].minimumPayment += minimumPayment;
    debtByCategory[categoryId].interestRate = Math.max(debtByCategory[categoryId].interestRate, interestRate);
    
    // Calculate months to payoff
    if (minimumPayment > 0 && balance > 0) {
      if (interestRate > 0) {
        const monthlyRate = interestRate / 100 / 12;
        const monthsToPayoff = Math.log(1 + (balance * monthlyRate) / minimumPayment) / Math.log(1 + monthlyRate);
        debtByCategory[categoryId].monthsToPayoff = Math.max(debtByCategory[categoryId].monthsToPayoff, monthsToPayoff);
      } else {
        debtByCategory[categoryId].monthsToPayoff = Math.max(debtByCategory[categoryId].monthsToPayoff, balance / minimumPayment);
      }
    }
  });

  // Create priority arrays for debt payoff strategies
  const debtByPriority = Object.entries(debtByCategory).map(([category, data]) => ({
    category,
    balance: data.balance,
    interestRate: data.interestRate,
    minimumPayment: data.minimumPayment,
    avalanchePriority: 0,
    snowballPriority: 0
  }));

  // Sort for avalanche method (highest interest rate first)
  const avalancheOrder = [...debtByPriority].sort((a, b) => b.interestRate - a.interestRate);
  avalancheOrder.forEach((debt, index) => {
    const originalDebt = debtByPriority.find(d => d.category === debt.category);
    if (originalDebt) originalDebt.avalanchePriority = index + 1;
  });

  // Sort for snowball method (lowest balance first)
  const snowballOrder = [...debtByPriority].sort((a, b) => a.balance - b.balance);
  snowballOrder.forEach((debt, index) => {
    const originalDebt = debtByPriority.find(d => d.category === debt.category);
    if (originalDebt) originalDebt.snowballPriority = index + 1;
  });

  return {
    totalDebt,
    debtByCategory,
    debtByPriority,
    totalMinimumPayments
  };
}

/**
 * Calculate debt payoff strategy
 */
export function calculateDebtPayoffStrategy(
  debtBreakdown: DebtBreakdown,
  extraPayment: number = 0,
  strategy: 'avalanche' | 'snowball' | 'custom' = 'avalanche'
): DebtPayoffStrategy {
  const { debtByPriority, totalMinimumPayments } = debtBreakdown;
  
  if (debtByPriority.length === 0) {
    return {
      strategy,
      payoffOrder: [],
      totalPayoffTime: 0,
      totalInterestCost: 0,
      extraPaymentAllocation: {}
    };
  }

  // Sort debts based on strategy
  let sortedDebts = [...debtByPriority];
  if (strategy === 'avalanche') {
    sortedDebts.sort((a, b) => b.interestRate - a.interestRate);
  } else if (strategy === 'snowball') {
    sortedDebts.sort((a, b) => a.balance - b.balance);
  }

  // Calculate payoff order and metrics
  const payoffOrder = sortedDebts.map((debt, index) => ({
    category: debt.category,
    balance: debt.balance,
    interestRate: debt.interestRate,
    minimumPayment: debt.minimumPayment,
    monthsToPayoff: 0,
    totalInterestSaved: 0
  }));

  // Simulate payoff with extra payments
  const extraPaymentAllocation: Record<string, number> = {};
  let totalPayoffTime = 0;
  let totalInterestCost = 0;

  // Simple allocation: all extra payment goes to highest priority debt
  if (extraPayment > 0 && payoffOrder.length > 0) {
    extraPaymentAllocation[payoffOrder[0].category] = extraPayment;
    
    // Recalculate payoff time with extra payment
    const enhancedPayment = payoffOrder[0].minimumPayment + extraPayment;
    if (payoffOrder[0].interestRate > 0) {
      const monthlyRate = payoffOrder[0].interestRate / 100 / 12;
      payoffOrder[0].monthsToPayoff = Math.log(1 + (payoffOrder[0].balance * monthlyRate) / enhancedPayment) / Math.log(1 + monthlyRate);
    } else {
      payoffOrder[0].monthsToPayoff = payoffOrder[0].balance / enhancedPayment;
    }
  }

  // Calculate total metrics (simplified)
  totalPayoffTime = Math.max(...payoffOrder.map(debt => debt.monthsToPayoff));
  totalInterestCost = payoffOrder.reduce((sum, debt) => {
    const monthlyRate = debt.interestRate / 100 / 12;
    const payment = debt.minimumPayment + (extraPaymentAllocation[debt.category] || 0);
    if (monthlyRate > 0 && payment > 0) {
      return sum + (payment * debt.monthsToPayoff) - debt.balance;
    }
    return sum;
  }, 0);

  return {
    strategy,
    payoffOrder,
    totalPayoffTime: Math.round(totalPayoffTime),
    totalInterestCost: Math.round(totalInterestCost),
    extraPaymentAllocation
  };
}

/**
 * Get debt ratio trend over time
 */
export function getDebtRatioTrend(
  transactions: Transaction[],
  months: number = 12
): DebtRatioTrend[] {
  const trends: DebtRatioTrend[] = [];
  const endDate = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
    const monthEnd = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 0);

    const data = calculateDebtRatioData(transactions, monthStart, monthEnd);

    trends.push({
      date: new Date(monthStart),
      debtToIncomeRatio: data.debtToIncomeRatio,
      totalDebt: data.totalDebtBalance,
      monthlyIncome: data.monthlyIncome,
      monthlyDebtPayments: data.monthlyDebtPayments
    });
  }

  return trends;
}

/**
 * Get debt ratio insights and recommendations
 */
export function getDebtRatioInsights(debtData: DebtRatioData): {
  insights: string[];
  recommendations: string[];
  score: number; // Overall debt management score 0-100
  status: 'excellent' | 'good' | 'fair' | 'concerning' | 'critical';
} {
  const insights: string[] = [];
  const recommendations: string[] = [];
  let score = 0;
  let status: 'excellent' | 'good' | 'fair' | 'concerning' | 'critical' = 'critical';

  const { debtToIncomeRatio, debtServiceRatio, debtRatioChange, totalDebtBalance } = debtData;

  // Debt-to-income ratio analysis
  if (totalDebtBalance === 0) {
    insights.push('Debt-free! Excellent financial position');
    score += 40;
    status = 'excellent';
  } else if (debtToIncomeRatio <= 20) {
    insights.push(`Low debt-to-income ratio of ${debtToIncomeRatio}% - manageable debt level`);
    score += 35;
    status = 'excellent';
  } else if (debtToIncomeRatio <= 36) {
    insights.push(`Moderate debt-to-income ratio of ${debtToIncomeRatio}% - within acceptable range`);
    score += 25;
    status = 'good';
  } else if (debtToIncomeRatio <= 50) {
    insights.push(`High debt-to-income ratio of ${debtToIncomeRatio}% - consider debt reduction`);
    score += 15;
    status = 'fair';
    recommendations.push('Focus on paying down high-interest debt to improve ratio');
  } else if (debtToIncomeRatio <= 75) {
    insights.push(`Very high debt-to-income ratio of ${debtToIncomeRatio}% - requires attention`);
    score += 5;
    status = 'concerning';
    recommendations.push('Prioritize debt reduction and consider debt consolidation');
  } else {
    insights.push(`Critical debt-to-income ratio of ${debtToIncomeRatio}% - immediate action needed`);
    status = 'critical';
    recommendations.push('Seek debt counseling and create aggressive payoff plan');
  }

  // Debt service ratio analysis
  if (debtServiceRatio <= 20) {
    insights.push(`Healthy debt service ratio of ${debtServiceRatio}% - good payment capacity`);
    score += 25;
  } else if (debtServiceRatio <= 36) {
    insights.push(`Moderate debt service ratio of ${debtServiceRatio}% - manageable payments`);
    score += 15;
  } else {
    insights.push(`High debt service ratio of ${debtServiceRatio}% - payments consume significant income`);
    recommendations.push('Consider refinancing or loan modification to reduce monthly payments');
  }

  // Trend analysis
  if (debtRatioChange && debtRatioChange < -2) {
    insights.push(`Debt ratio improved by ${Math.abs(debtRatioChange)}% - excellent progress`);
    score += 15;
  } else if (debtRatioChange && debtRatioChange > 5) {
    insights.push(`Debt ratio increased by ${debtRatioChange}% - monitor debt growth`);
    recommendations.push('Review recent borrowing and focus on debt reduction');
  }

  // Interest rate analysis
  if (debtData.highestInterestDebt && debtData.highestInterestDebt.interestRate > 15) {
    recommendations.push(`Prioritize paying off ${debtData.highestInterestDebt.categoryId} debt at ${debtData.highestInterestDebt.interestRate}% interest`);
  }

  // Payoff time analysis
  if (debtData.debtPayoffTime > 0) {
    if (debtData.debtPayoffTime <= 24) {
      insights.push(`On track to be debt-free in ${debtData.debtPayoffTime} months`);
      score += 10;
    } else if (debtData.debtPayoffTime <= 60) {
      insights.push(`Current payoff timeline: ${debtData.debtPayoffTime} months`);
      recommendations.push('Consider increasing payments to reduce payoff time');
    } else {
      insights.push(`Long payoff timeline: ${debtData.debtPayoffTime} months`);
      recommendations.push('Explore debt consolidation or refinancing options');
    }
  }

  return {
    insights,
    recommendations,
    score: Math.min(100, Math.round(score)),
    status
  };
} 