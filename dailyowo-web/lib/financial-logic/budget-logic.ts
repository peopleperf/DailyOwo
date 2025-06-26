import { Transaction } from '@/types/transaction';
import { TRANSACTION_CATEGORIES, getCategoryById } from '@/lib/constants/transaction-categories';

// ============= BUDGET INTERFACES =============

export type BudgetCategoryType = 
  | 'income'
  | 'housing'
  | 'utilities' 
  | 'food'
  | 'transportation'
  | 'healthcare'
  | 'insurance'
  | 'entertainment'
  | 'shopping'
  | 'personal-care'
  | 'family'
  | 'education'
  | 'pets'
  | 'travel'
  | 'subscriptions'
  | 'financial'
  | 'debt'
  | 'gifts'
  | 'donations'
  | 'savings'
  | 'investments'
  | 'retirement'
  | 'fitness'
  | 'other';

export interface BudgetCategory {
  id: string;
  name: string;
  type: BudgetCategoryType;
  allocated: number;
  spent: number;
  remaining: number;
  isOverBudget: boolean;
  allowRollover: boolean;
  rolloverAmount: number;
  annualAmount?: number; // For irregular expenses
  isAnnual?: boolean;
  description?: string;
  transactionCategories: string[]; // Transaction category IDs that map to this budget category
}

export interface BudgetPeriod {
  id: string;
  startDate: Date;
  endDate: Date;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annual';
  totalIncome: number;
  totalAllocated: number;
  totalSpent: number;
  totalSavings: number;
  totalRemaining: number;
  isActive: boolean;
}

export interface BudgetMethod {
  type: '50-30-20' | 'zero-based' | 'custom';
  allocations: {
    needs?: number;      // 50/30/20 method
    wants?: number;      // 50/30/20 method
    savings?: number;    // 50/30/20 method
    categories?: { [categoryId: string]: number }; // Custom percentages/amounts
  };
}

export interface Budget {
  id: string;
  userId: string;
  name: string;
  method: BudgetMethod;
  period: BudgetPeriod;
  categories: BudgetCategory[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  categoryId: string;
  type: 'approaching-limit' | 'over-budget' | 'goal-achieved';
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  threshold: number;
  currentAmount: number;
  isRead: boolean;
  createdAt: Date;
}

export interface BudgetData {
  currentBudget: Budget | null;
  budgetHistory: Budget[];
  alerts: BudgetAlert[];
  totalIncome: number;
  totalAllocated: number;
  totalExpenseAllocated: number;
  totalSavingsAllocated: number;
  totalSpent: number;
  totalSavings: number;
  cashAtHand: number;
  unallocatedAmount: number;
  budgetHealth: {
    score: number; // 0-100
    status: 'excellent' | 'good' | 'fair' | 'poor';
    suggestions: string[];
  };
  categoryPerformance: {
    categoryId: string;
    name: string;
    budgetUtilization: number; // Percentage of budget used
    trend: 'improving' | 'declining' | 'stable';
  }[];
}

// ============= BUDGET CALCULATION FUNCTIONS =============

export function calculateBudgetData(
  transactions: Transaction[],
  budget: Budget | null,
  currentDate: Date = new Date()
): BudgetData {
  if (!budget) {
    return {
      currentBudget: null,
      budgetHistory: [],
      alerts: [],
      totalIncome: 0,
      totalAllocated: 0,
      totalExpenseAllocated: 0,
      totalSavingsAllocated: 0,
      totalSpent: 0,
      totalSavings: 0,
      cashAtHand: 0,
      unallocatedAmount: 0,
      budgetHealth: {
        score: 0,
        status: 'poor',
        suggestions: ['Create your first budget to get started']
      },
      categoryPerformance: []
    };
  }

  // Debug logging
  console.log('Budget period:', {
    start: budget.period.startDate,
    end: budget.period.endDate,
    frequency: budget.period.frequency
  });

  // Get all transactions dates to determine the actual range
  const transactionDates = transactions.map(t => new Date(t.date));
  const earliestTransaction = transactionDates.length > 0 
    ? new Date(Math.min(...transactionDates.map(d => d.getTime())))
    : budget.period.startDate;
  const latestTransaction = transactionDates.length > 0
    ? new Date(Math.max(...transactionDates.map(d => d.getTime())))
    : budget.period.endDate;

  console.log('Transaction date range:', {
    earliest: earliestTransaction,
    latest: latestTransaction,
    count: transactions.length
  });

  // TEMPORARY FIX: Use all transactions to debug the Total Income/Spent issue
  // Skip strict date filtering for now to ensure we see transaction data
  let periodTransactions = transactions;
  
  console.log(`[Budget] USING ALL TRANSACTIONS FOR DEBUGGING - Total: ${transactions.length}`);
  console.log(`[Budget] Raw transactions data:`, transactions.map(t => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    categoryId: t.categoryId,
    date: t.date,
    description: t.description
  })));
  console.log(`[Budget] Budget period: ${budget.period.startDate} to ${budget.period.endDate}`);
  
  // Log transaction date ranges for debugging
  if (transactions.length > 0) {
    const transactionDates = transactions.map(t => new Date(t.date));
    const earliestTransaction = new Date(Math.min(...transactionDates.map(d => d.getTime())));
    const latestTransaction = new Date(Math.max(...transactionDates.map(d => d.getTime())));
    
    console.log(`[Budget] Transaction date range: ${earliestTransaction} to ${latestTransaction}`);
  }

  console.log(`Filtered ${periodTransactions.length} transactions for budget calculation`);
  console.log('Period transactions:', periodTransactions.map(t => ({ 
    id: t.id, 
    type: t.type, 
    amount: t.amount, 
    date: t.date, 
    description: t.description 
  })));

  // Calculate income
  const totalIncome = calculateTotalIncome(periodTransactions);
  console.log(`[Budget] Income calculation - Found ${periodTransactions.filter(t => t.type === 'income').length} income transactions`);
  console.log(`[Budget] Income transactions:`, periodTransactions.filter(t => t.type === 'income').map(t => ({ amount: t.amount, description: t.description, date: t.date })));
  console.log(`[Budget] Total Income calculated: ${totalIncome}`);

  // Calculate category spending
  const updatedCategories = calculateCategorySpending(budget.categories, periodTransactions);

  // Separate expense categories from savings categories
  const expenseCategories = updatedCategories.filter(cat => 
    cat.type !== 'savings' && cat.type !== 'investments' && cat.type !== 'retirement'
  );
  const savingsCategories = updatedCategories.filter(cat => 
    cat.type === 'savings' || cat.type === 'investments' || cat.type === 'retirement'
  );
  
  // Calculate allocations separately
  const totalExpenseAllocated = expenseCategories.reduce((sum, cat) => sum + cat.allocated, 0);
  const totalSavingsAllocated = savingsCategories.reduce((sum, cat) => sum + cat.allocated, 0);
  const totalAllocated = totalExpenseAllocated + totalSavingsAllocated;
  
  // Calculate actual spending (all transaction types that represent money going out)
  const totalExpenses = periodTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  console.log(`[Budget] Expense calculation - Found ${periodTransactions.filter(t => t.type === 'expense').length} expense transactions`);
  console.log(`[Budget] Expense transactions:`, periodTransactions.filter(t => t.type === 'expense').map(t => ({ amount: t.amount, description: t.description, date: t.date })));
  console.log(`[Budget] Total Expenses calculated: ${totalExpenses}`);
  
  // Debt payments (liability transactions are debt payments)
  const totalDebtPayments = periodTransactions
    .filter(t => t.type === 'liability')
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
  const totalSavings = periodTransactions
    .filter(t => t.type === 'asset' && SAVINGS_CATEGORIES.includes(t.categoryId))
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Total Spent = Expenses + Debt Payments + Savings (all money going out)
  const totalSpent = totalExpenses + totalDebtPayments + totalSavings;
  
  // Cash at hand = Income - Expenses - Savings (not including debt payments in this calculation)
  const cashAtHand = totalIncome - totalExpenses - totalSavings;
  
  const unallocatedAmount = totalIncome - totalAllocated;

  // Generate alerts
  const alerts = generateBudgetAlerts(updatedCategories, budget.id);

  // Calculate budget health
  const budgetHealth = calculateBudgetHealth(updatedCategories, totalIncome, totalAllocated);

  // Calculate category performance
  const categoryPerformance = calculateCategoryPerformance(updatedCategories);

  console.log('Budget calculation results:', {
    totalIncome,
    totalSpent,
    totalAllocated,
    totalExpenses,
    totalDebtPayments,
    totalSavings,
    periodTransactionsCount: periodTransactions.length,
    incomeTransactions: periodTransactions.filter(t => t.type === 'income').length,
    expenseTransactions: periodTransactions.filter(t => t.type === 'expense').length,
    categoriesWithSpending: updatedCategories.filter(c => c.spent > 0).length
  });

  // CRITICAL: Log the exact values being returned
  const finalResult = {
    totalIncome,
    totalAllocated,
    totalExpenseAllocated,
    totalSavingsAllocated,
    totalSpent,
    totalSavings,
    cashAtHand,
    unallocatedAmount
  };
  
  console.log('🚨 FINAL BUDGET DATA VALUES:', finalResult);
  console.log('🚨 These are the values that should appear in the UI:', {
    'Total Income card': totalIncome,
    'Total Spent card': totalSpent,
    'Allocated card': totalAllocated,
    'Cash at Hand card': cashAtHand
  });

  return {
    currentBudget: {
      ...budget,
      categories: updatedCategories,
      period: {
        ...budget.period,
        totalIncome,
        totalAllocated,
        totalSpent,
        totalSavings,
        totalRemaining: cashAtHand
      }
    },
    budgetHistory: [],
    alerts,
    totalIncome,
    totalAllocated,
    totalExpenseAllocated,
    totalSavingsAllocated,
    totalSpent,
    totalSavings,
    cashAtHand,
    unallocatedAmount,
    budgetHealth,
    categoryPerformance
  };
}

function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
}

function calculateCategorySpending(
  categories: BudgetCategory[],
  transactions: Transaction[]
): BudgetCategory[] {
  console.log('calculateCategorySpending called with:', {
    categoriesCount: categories.length,
    transactionsCount: transactions.length
  });

  return categories.map(category => {
    let categorySpent = 0;
    
    if (category.type === 'savings' || category.type === 'investments' || category.type === 'retirement') {
      // For savings/investment categories, "spending" refers to contributions.
      // These are recorded as transactions of type 'asset'.
      categorySpent = transactions
        .filter(t => t.type === 'asset' && category.transactionCategories.includes(t.categoryId))
        .reduce((sum, t) => sum + t.amount, 0);
    } else {
      // For regular expense categories, only count expenses
      const matchingTransactions = transactions.filter(t => {
        if (t.type !== 'expense') return false;
        
        // Check if transaction category is in this budget category's transactionCategories array
        const isInCategory = category.transactionCategories.includes(t.categoryId);
        
        // Fallback: check if the transaction's categoryId directly matches
        const directMatch = t.categoryId === category.id;
        
        return isInCategory || directMatch;
      });

      categorySpent = matchingTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      if (matchingTransactions.length > 0 || category.allocated > 0) {
        console.log(`Category ${category.name} (${category.type}):`, {
          transactionCategories: category.transactionCategories,
          matchingTransactions: matchingTransactions.length,
          spent: categorySpent,
          allocated: category.allocated
        });
      }
    }

    const remaining = category.allocated - categorySpent;
    const isOverBudget = categorySpent > category.allocated;

    // Debug logging for categories with issues
    if (category.name === 'Housing' || (category.allocated > 0 && remaining !== category.allocated)) {
      console.log(`[DEBUG] Category ${category.name}:`, {
        allocated: category.allocated,
        spent: categorySpent,
        remaining: remaining,
        expectedRemaining: category.allocated - categorySpent,
        originalRemaining: category.remaining
      });
    }

    return {
      ...category,
      spent: categorySpent,
      remaining,
      isOverBudget
    };
  });
}

function generateBudgetAlerts(categories: BudgetCategory[], budgetId: string): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];

  categories.forEach(category => {
    const utilizationPercentage = (category.spent / category.allocated) * 100;

    // Over budget alert
    if (category.isOverBudget) {
      alerts.push({
        id: `${budgetId}-${category.id}-over`,
        budgetId,
        categoryId: category.id,
        type: 'over-budget',
        message: `You're over budget in ${category.name}. Spent €${category.spent.toFixed(2)} of €${category.allocated.toFixed(2)}`,
        severity: 'error',
        threshold: category.allocated,
        currentAmount: category.spent,
        isRead: false,
        createdAt: new Date()
      });
    }
    // Approaching limit alert (80% threshold)
    else if (utilizationPercentage >= 80) {
      alerts.push({
        id: `${budgetId}-${category.id}-approaching`,
        budgetId,
        categoryId: category.id,
        type: 'approaching-limit',
        message: `You've used ${utilizationPercentage.toFixed(0)}% of your ${category.name} budget`,
        severity: 'warning',
        threshold: category.allocated * 0.8,
        currentAmount: category.spent,
        isRead: false,
        createdAt: new Date()
      });
    }
  });

  return alerts;
}

function calculateBudgetHealth(
  categories: BudgetCategory[],
  totalIncome: number,
  totalAllocated: number
): BudgetData['budgetHealth'] {
  let score = 100;
  const suggestions: string[] = [];

  // Check allocation efficiency
  const allocationPercentage = (totalAllocated / totalIncome) * 100;
  if (allocationPercentage < 80) {
    score -= 20;
    suggestions.push('Allocate more of your income to specific categories');
  } else if (allocationPercentage > 100) {
    score -= 30;
    suggestions.push('You\'ve allocated more than your income. Review your budget');
  }

  // Check over-budget categories
  const overBudgetCategories = categories.filter(c => c.isOverBudget);
  if (overBudgetCategories.length > 0) {
    score -= overBudgetCategories.length * 15;
    suggestions.push(`${overBudgetCategories.length} categories are over budget`);
  }

  // Check savings allocation
  const savingsCategories = categories.filter(c => 
    c.type === 'savings' || c.type === 'investments' || c.type === 'retirement'
  );
  const totalSavingsAllocated = savingsCategories.reduce((sum, c) => sum + c.allocated, 0);
  const savingsPercentage = (totalSavingsAllocated / totalIncome) * 100;
  
  if (savingsPercentage < 10) {
    score -= 15;
    suggestions.push('Consider allocating at least 10% to savings');
  }

  // Determine status
  let status: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 90) status = 'excellent';
  else if (score >= 70) status = 'good';
  else if (score >= 50) status = 'fair';
  else status = 'poor';

  return { score: Math.max(0, score), status, suggestions };
}

function calculateCategoryPerformance(categories: BudgetCategory[]): BudgetData['categoryPerformance'] {
  return categories.map(category => ({
    categoryId: category.id,
    name: category.name,
    budgetUtilization: category.allocated > 0 ? (category.spent / category.allocated) * 100 : 0,
    trend: 'stable' as const // TODO: Calculate trend based on historical data
  }));
}

// ============= BUDGET CREATION FUNCTIONS =============

export function createBudgetFromMethod(
  method: BudgetMethod,
  totalIncome: number,
  period: BudgetPeriod,
  userId: string
): Budget {
  let categories: BudgetCategory[] = [];

  switch (method.type) {
    case '50-30-20':
      categories = create50_30_20Budget(totalIncome);
      break;
    case 'zero-based':
      categories = createZeroBasedBudget(totalIncome);
      break;
    case 'custom':
      categories = createCustomBudget(method.allocations.categories || {}, totalIncome);
      break;
  }

  // Calculate total allocated from categories
  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated, 0);
  
  console.log('Budget creation - Total allocated:', totalAllocated);
  console.log('Budget creation - Total income:', totalIncome);
  console.log('Budget creation - Categories:', categories.map(c => ({ name: c.name, allocated: c.allocated })));
  
  // Update period with calculated totals
  const updatedPeriod = {
    ...period,
    totalAllocated,
    totalIncome: totalIncome
  };

  return {
    id: `budget-${Date.now()}`,
    userId,
    name: `${method.type} Budget - ${period.startDate.toLocaleDateString()}`,
    method,
    period: updatedPeriod,
    categories,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

function create50_30_20Budget(totalIncome: number): BudgetCategory[] {
  const needsAmount = totalIncome * 0.5;
  const wantsAmount = totalIncome * 0.3;
  const savingsAmount = totalIncome * 0.2;
  
  console.log('Creating 50-30-20 budget with income:', totalIncome);
  console.log('Needs (50%):', needsAmount);
  console.log('Wants (30%):', wantsAmount);
  console.log('Savings (20%):', savingsAmount);

  return [
    // NEEDS (50%) - Enhanced with more categories
    {
      id: 'needs-housing',
      name: 'Housing',
      type: 'housing',
      allocated: needsAmount * 0.35, // 17.5% of total income
      spent: 0,
      remaining: needsAmount * 0.35, // Always allocated - spent (which is 0 initially)
      isOverBudget: false,
      allowRollover: false,
      rolloverAmount: 0,
      transactionCategories: ['rent', 'mortgage', 'home-maintenance', 'home-improvement', 'home-insurance']
    },
    {
      id: 'needs-utilities',
      name: 'Utilities',
      type: 'utilities',
      allocated: needsAmount * 0.15, // 7.5% of total income
      spent: 0,
      remaining: needsAmount * 0.15,
      isOverBudget: false,
      allowRollover: true,
      rolloverAmount: 0,
      transactionCategories: ['electricity', 'gas', 'water', 'internet', 'phone', 'cable-tv']
    },
    {
      id: 'needs-food',
      name: 'Food & Groceries',
      type: 'food',
      allocated: needsAmount * 0.25, // 12.5% of total income
      spent: 0,
      remaining: needsAmount * 0.25,
      isOverBudget: false,
      allowRollover: true,
      rolloverAmount: 0,
      transactionCategories: ['groceries', 'dining-out', 'coffee-shops', 'fast-food', 'alcohol']
    },
    {
      id: 'needs-transportation',
      name: 'Transportation',
      type: 'transportation',
      allocated: needsAmount * 0.15, // 7.5% of total income
      spent: 0,
      remaining: needsAmount * 0.15,
      isOverBudget: false,
      allowRollover: true,
      rolloverAmount: 0,
      transactionCategories: ['fuel', 'public-transport', 'taxi-uber', 'car-maintenance', 'parking', 'flights']
    },
    {
      id: 'needs-healthcare',
      name: 'Healthcare',
      type: 'healthcare',
      allocated: needsAmount * 0.05, // 2.5% of total income
      spent: 0,
      remaining: needsAmount * 0.05,
      isOverBudget: false,
      allowRollover: true,
      rolloverAmount: 0,
      transactionCategories: ['medical-visits', 'prescriptions', 'dental', 'vision']
    },
    {
      id: 'needs-insurance',
      name: 'Insurance',
      type: 'insurance',
      allocated: needsAmount * 0.05, // 2.5% of total income
      spent: 0,
      remaining: needsAmount * 0.05,
      isOverBudget: false,
      allowRollover: false,
      rolloverAmount: 0,
      transactionCategories: ['car-insurance', 'health-insurance', 'life-insurance', 'disability-insurance']
    },
    {
      id: 'needs-debt',
      name: 'Debt Payments',
      type: 'debt',
      allocated: 0, // Will be set based on user's actual debt
      spent: 0,
      remaining: 0,
      isOverBudget: false,
      allowRollover: false,
      rolloverAmount: 0,
      transactionCategories: ['credit-card-payment', 'personal-loan', 'student-loan', 'car-loan', 'other-debt']
    },

    // WANTS (30%) - Enhanced categories
    {
      id: 'wants-entertainment',
      name: 'Entertainment',
      type: 'entertainment',
      allocated: wantsAmount * 0.3, // 9% of total income
      spent: 0,
      remaining: wantsAmount * 0.3,
      isOverBudget: false,
      allowRollover: true,
      rolloverAmount: 0,
      transactionCategories: ['movies', 'games', 'music', 'sports', 'hobbies', 'streaming-services']
    },
    {
      id: 'wants-shopping',
      name: 'Shopping & Personal',
      type: 'shopping',
      allocated: wantsAmount * 0.3, // 9% of total income
      spent: 0,
      remaining: wantsAmount * 0.3,
      isOverBudget: false,
      allowRollover: true,
      rolloverAmount: 0,
      transactionCategories: ['clothing', 'household-items', 'electronics', 'personal-care', 'gifts-given']
    },
    {
      id: 'wants-fitness',
      name: 'Fitness & Wellness',
      type: 'fitness',
      allocated: wantsAmount * 0.15, // 4.5% of total income
      spent: 0,
      remaining: wantsAmount * 0.15,
      isOverBudget: false,
      allowRollover: true,
      rolloverAmount: 0,
      transactionCategories: ['gym']
    },
    {
      id: 'wants-travel',
      name: 'Travel & Vacation',
      type: 'travel',
      allocated: wantsAmount * 0.15, // 4.5% of total income
      spent: 0,
      remaining: wantsAmount * 0.15,
      isOverBudget: false,
      allowRollover: true,
      rolloverAmount: 0,
      transactionCategories: ['vacation', 'travel', 'hotels']
    },
    {
      id: 'wants-other',
      name: 'Other Expenses',
      type: 'other',
      allocated: wantsAmount * 0.1, // 3% of total income
      spent: 0,
      remaining: wantsAmount * 0.1,
      isOverBudget: false,
      allowRollover: true,
      rolloverAmount: 0,
      transactionCategories: ['subscriptions', 'other-expense', 'pets', 'pet-supplies', 'family-activities', 'childcare', 'school-fees', 'donations', 'bank-fees']
    },

    // SAVINGS (20%) - Enhanced categories
    {
      id: 'savings-emergency',
      name: 'Emergency Fund',
      type: 'savings',
      allocated: savingsAmount * 0.4, // 8% of total income
      spent: 0,
      remaining: savingsAmount * 0.4,
      isOverBudget: false,
      allowRollover: true,
      rolloverAmount: 0,
      transactionCategories: ['emergency-fund', 'savings-account', 'general-savings']
    },
    {
      id: 'savings-retirement',
      name: 'Retirement & Investments',
      type: 'retirement',
      allocated: savingsAmount * 0.4, // 8% of total income
      spent: 0,
      remaining: savingsAmount * 0.4,
      isOverBudget: false,
      allowRollover: true,
      rolloverAmount: 0,
      transactionCategories: ['retirement-401k', 'retirement-ira', 'pension', 'stocks', 'etf', 'mutual-funds', 'cryptocurrency', 'bonds', 'real-estate']
    },
    {
      id: 'savings-debt',
      name: 'Debt Payments',
      type: 'debt',
      allocated: savingsAmount * 0.2, // 4% of total income
      spent: 0,
      remaining: savingsAmount * 0.2,
      isOverBudget: false,
      allowRollover: false,
      rolloverAmount: 0,
      transactionCategories: ['credit-card-payment', 'loan-payment', 'student-loan', 'personal-loan', 'auto-loan', 'other-debt']
    }
  ];
}

function createZeroBasedBudget(totalIncome: number): BudgetCategory[] {
  // Start with essential categories, user will customize
  return [
    {
      id: 'zb-housing',
      name: 'Housing',
      type: 'housing',
      allocated: 0,
      spent: 0,
      remaining: 0,
      isOverBudget: false,
      allowRollover: false,
      rolloverAmount: 0,
      transactionCategories: ['rent', 'mortgage', 'home-maintenance']
    },
    {
      id: 'zb-food',
      name: 'Food',
      type: 'food',
      allocated: 0,
      spent: 0,
      remaining: 0,
      isOverBudget: false,
      allowRollover: false,
      rolloverAmount: 0,
      transactionCategories: ['groceries', 'dining-out']
    },
    {
      id: 'zb-transportation',
      name: 'Transportation',
      type: 'transportation',
      allocated: 0,
      spent: 0,
      remaining: 0,
      isOverBudget: false,
      allowRollover: false,
      rolloverAmount: 0,
      transactionCategories: ['fuel', 'public-transport', 'car-maintenance']
    },
    {
      id: 'zb-savings',
      name: 'Savings',
      type: 'savings',
      allocated: 0,
      spent: 0,
      remaining: 0,
      isOverBudget: false,
      allowRollover: true,
      rolloverAmount: 0,
      transactionCategories: ['emergency-fund', 'general-savings']
    }
  ];
}

function createCustomBudget(customAllocations: { [categoryId: string]: number }, totalIncome: number): BudgetCategory[] {
  return Object.entries(customAllocations).map(([categoryType, amount]) => ({
    id: `custom-${categoryType}`,
    name: categoryType.charAt(0).toUpperCase() + categoryType.slice(1),
    type: categoryType as BudgetCategoryType,
    allocated: amount,
    spent: 0,
    remaining: amount,
    isOverBudget: false,
    allowRollover: true,
    rolloverAmount: 0,
    transactionCategories: [] // User will map these
  }));
}

// ============= TRANSACTION-BUDGET MAPPING =============

export function mapTransactionToBudgetCategory(transaction: Transaction): string | null {
  const transactionCategory = getCategoryById(transaction.categoryId);
  return transactionCategory?.budgetCategory || null;
}

export function getUnmappedTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.filter(t => !mapTransactionToBudgetCategory(t));
}

export function suggestBudgetCategoryForTransaction(transaction: Transaction): BudgetCategoryType[] {
  const transactionCategory = getCategoryById(transaction.categoryId);
  if (transactionCategory?.budgetCategory) {
    return [transactionCategory.budgetCategory as BudgetCategoryType];
  }

  // Smart suggestions based on description/merchant
  const description = transaction.description.toLowerCase();
  const suggestions: BudgetCategoryType[] = [];

  if (description.includes('grocery') || description.includes('food')) {
    suggestions.push('food');
  }
  if (description.includes('gas') || description.includes('fuel')) {
    suggestions.push('transportation');
  }
  if (description.includes('restaurant') || description.includes('coffee')) {
    suggestions.push('food');
  }
  if (description.includes('netflix') || description.includes('spotify')) {
    suggestions.push('subscriptions');
  }

  return suggestions.length > 0 ? suggestions : ['other'];
}

// ============= BUDGET PERIOD MANAGEMENT =============

export function createBudgetPeriod(
  frequency: BudgetPeriod['frequency'],
  startDate: Date = new Date()
): BudgetPeriod {
  // For monthly budgets, start from the beginning of the current month
  const adjustedStartDate = new Date(startDate);
  
  if (frequency === 'monthly') {
    adjustedStartDate.setDate(1); // Set to first day of month
    adjustedStartDate.setHours(0, 0, 0, 0); // Reset time to midnight
  }
  
  const endDate = new Date(adjustedStartDate);
  
  switch (frequency) {
    case 'weekly':
      endDate.setDate(adjustedStartDate.getDate() + 7);
      break;
    case 'bi-weekly':
      endDate.setDate(adjustedStartDate.getDate() + 14);
      break;
    case 'monthly':
      endDate.setMonth(adjustedStartDate.getMonth() + 1);
      endDate.setDate(0); // Last day of the month
      break;
    case 'quarterly':
      endDate.setMonth(adjustedStartDate.getMonth() + 3);
      break;
    case 'annual':
      endDate.setFullYear(adjustedStartDate.getFullYear() + 1);
      break;
  }

  return {
    id: `period-${Date.now()}`,
    startDate: adjustedStartDate,
    endDate,
    frequency,
    totalIncome: 0,
    totalAllocated: 0,
    totalSpent: 0,
    totalSavings: 0,
    totalRemaining: 0,
    isActive: true
  };
}

export function shouldCreateNewBudgetPeriod(currentPeriod: BudgetPeriod, currentDate: Date = new Date()): boolean {
  return currentDate > currentPeriod.endDate;
}

export function rolloverBudgetAmounts(oldBudget: Budget, newPeriod: BudgetPeriod): Budget {
  const newCategories = oldBudget.categories.map(category => {
    let rolloverAmount = 0;
    
    if (category.allowRollover && category.remaining > 0) {
      rolloverAmount = category.remaining;
    }

    return {
      ...category,
      spent: 0,
      remaining: category.allocated + rolloverAmount,
      isOverBudget: false,
      rolloverAmount
    };
  });

  return {
    ...oldBudget,
    id: `budget-${Date.now()}`,
    period: newPeriod,
    categories: newCategories,
    updatedAt: new Date()
  };
}

// ============= HELPER FUNCTIONS =============

export function formatBudgetAmount(amount: number, currency: string = '€'): string {
  return `${currency}${amount.toFixed(2)}`;
}

export function getBudgetUtilizationColor(utilizationPercentage: number): string {
  if (utilizationPercentage >= 100) return 'text-red-600';
  if (utilizationPercentage >= 80) return 'text-yellow-600';
  if (utilizationPercentage >= 60) return 'text-blue-600';
  return 'text-green-600';
}

export function getBudgetHealthColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
} 