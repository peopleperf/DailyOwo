/**
 * Financial Dashboard Service
 * Integrates user profile data from onboarding with all financial logic modules
 * Provides a unified view of the user's financial situation
 */

import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';
import { Transaction } from '@/types/transaction';
import { 
  calculateNetWorth,
  calculateIncomeData,
  calculateExpensesData,
  calculateSavingsRateData,
  calculateDebtRatioData,
  calculateFinancialHealthScore
} from '@/lib/financial-logic';
import { budgetService } from '@/lib/firebase/budget-service';

export interface UserFinancialProfile {
  // From onboarding
  monthlyIncome?: number;
  currentSavings?: string;
  currentDebt?: string;
  expenseBreakdown?: Record<string, number>;
  financialGoals?: string[];
  age?: string;
  currency?: string;
  
  // Calculated fields
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyExpenses: number;
  savingsRate: number;
  debtToIncomeRatio: number;
  emergencyFundMonths: number;
}

export interface ComprehensiveFinancialData {
  profile: UserFinancialProfile;
  transactions: Transaction[];
  budget: any;
  metrics: {
    netWorth: any;
    income: any;
    expenses: any;
    savingsRate: any;
    debtRatio: any;
    healthScore: any;
  };
  insights: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
}

export class FinancialDashboardService {
  private db: any = null;

  constructor() {
    this.initializeDb();
  }

  private initializeDb() {
    if (typeof window === 'undefined') return;
    this.db = getFirebaseDb();
  }

  /**
   * Get comprehensive financial data for a user
   * Combines profile data with transaction analysis
   */
  async getComprehensiveFinancialData(
    userId: string,
    transactions: Transaction[]
  ): Promise<ComprehensiveFinancialData> {
    // Get user profile from Firestore
    const profile = await this.getUserFinancialProfile(userId);
    
    // Get or create budget
    const budget = await this.ensureUserHasBudget(userId, profile);
    
    // Calculate date ranges
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // If transactions are from the future (like your June 2025 data), adjust dates
    const latestTransactionDate = transactions.length > 0 
      ? new Date(Math.max(...transactions.map(t => new Date(t.date).getTime())))
      : now;
    
    if (latestTransactionDate > now) {
      // Use transaction date range instead
      monthStart.setFullYear(latestTransactionDate.getFullYear());
      monthStart.setMonth(latestTransactionDate.getMonth());
      monthEnd.setFullYear(latestTransactionDate.getFullYear());
      monthEnd.setMonth(latestTransactionDate.getMonth() + 1);
      monthEnd.setDate(0);
    }

    // Calculate all financial metrics
    const netWorth = calculateNetWorth(transactions, undefined, profile.monthlyExpenses);
    const income = calculateIncomeData(transactions, monthStart, monthEnd);
    const expenses = calculateExpensesData(transactions, monthStart, monthEnd);
    const savingsRate = calculateSavingsRateData(transactions, monthStart, monthEnd);
    const debtRatio = calculateDebtRatioData(transactions, monthStart, monthEnd);
    const healthScore = calculateFinancialHealthScore({
      netWorth: netWorth,
      income: income,
      expenses: expenses,
      savingsRate: savingsRate,
      debtRatio: debtRatio
    });

    // Update profile with calculated values
    profile.totalAssets = netWorth.totalAssets;
    profile.totalLiabilities = netWorth.totalLiabilities;
    profile.netWorth = netWorth.netWorth;
    profile.monthlyExpenses = expenses.monthlyExpenses;
    profile.savingsRate = savingsRate.savingsRate;
    profile.debtToIncomeRatio = debtRatio.debtToIncomeRatio;
    profile.emergencyFundMonths = netWorth.emergencyFundDetails.monthsCovered;

    // Generate comprehensive insights
    const insights = this.generateComprehensiveInsights(profile, {
      netWorth,
      income,
      expenses,
      savingsRate,
      debtRatio,
      healthScore
    });

    return {
      profile,
      transactions,
      budget,
      metrics: {
        netWorth,
        income,
        expenses,
        savingsRate,
        debtRatio,
        healthScore
      },
      insights
    };
  }

  /**
   * Get user financial profile including onboarding data
   */
  private async getUserFinancialProfile(userId: string): Promise<UserFinancialProfile> {
    if (!this.db) throw new Error('Database not initialized');

    const userDoc = await getDoc(doc(this.db, 'users', userId));
    const userData = userDoc.exists() ? userDoc.data() : {};

    // Parse onboarding data
    const monthlyIncome = userData.monthlyIncome || 0;
    const currentSavings = userData.currentSavings || '0';
    const currentDebt = userData.currentDebt || '0';
    const expenseBreakdown = userData.expenseBreakdown || {};
    
    // Calculate monthly expenses from breakdown
    const monthlyExpenses = Object.values(expenseBreakdown)
      .reduce((sum: number, amount: any) => sum + (parseFloat(amount) || 0), 0);

    return {
      monthlyIncome,
      currentSavings,
      currentDebt,
      expenseBreakdown,
      financialGoals: userData.financialGoals || [],
      age: userData.age,
      currency: userData.currency || 'USD',
      totalAssets: 0, // Will be calculated
      totalLiabilities: 0, // Will be calculated
      netWorth: 0, // Will be calculated
      monthlyExpenses,
      savingsRate: 0, // Will be calculated
      debtToIncomeRatio: 0, // Will be calculated
      emergencyFundMonths: 0 // Will be calculated
    };
  }

  /**
   * Ensure user has a budget, create one if not
   */
  private async ensureUserHasBudget(userId: string, profile: UserFinancialProfile): Promise<any> {
    try {
      // Check for existing budget
      let budget = await budgetService.getActiveBudget(userId);
      
      if (!budget) {
        // Create budget using profile data
        budget = await budgetService.initializeUserBudget(
          userId,
          profile.monthlyIncome,
          '50-30-20' // Default to 50-30-20 method
        );
      }

      // Get budget data with transactions
      const budgetData = await budgetService.getBudgetData(userId);
      return budgetData;
    } catch (error) {
      console.error('Error ensuring budget:', error);
      return null;
    }
  }

  /**
   * Generate comprehensive insights based on all financial data
   */
  private generateComprehensiveInsights(
    profile: UserFinancialProfile,
    metrics: any
  ): ComprehensiveFinancialData['insights'] {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const recommendations: string[] = [];

    // Analyze strengths
    if (metrics.savingsRate.savingsRate >= 20) {
      strengths.push(`Excellent savings rate of ${metrics.savingsRate.savingsRate.toFixed(1)}%`);
    }
    if (profile.emergencyFundMonths >= 3) {
      strengths.push(`Good emergency fund coverage (${profile.emergencyFundMonths.toFixed(1)} months)`);
    }
    if (metrics.debtRatio.debtToIncomeRatio <= 36) {
      strengths.push('Healthy debt-to-income ratio');
    }
    if (metrics.healthScore.overall >= 70) {
      strengths.push(`Strong financial health score (${metrics.healthScore.overall}/100)`);
    }

    // Identify areas for improvement
    if (metrics.savingsRate.savingsRate < 10) {
      improvements.push('Low savings rate - aim for at least 10-20%');
      recommendations.push('Set up automatic transfers to savings account');
    }
    if (profile.emergencyFundMonths < 3) {
      improvements.push('Build emergency fund to 3-6 months of expenses');
      const currentSavings = profile.currentSavings ? parseFloat(profile.currentSavings) : 0;
      recommendations.push(`Save ${(3 * profile.monthlyExpenses - currentSavings).toFixed(0)} to reach 3-month emergency fund`);
    }
    if (metrics.debtRatio.debtToIncomeRatio > 50) {
      improvements.push('High debt burden - focus on debt reduction');
      recommendations.push('Consider debt consolidation or avalanche method');
    }

    // Budget-specific insights
    if (metrics.expenses.totalExpenses > metrics.income.totalIncome) {
      improvements.push('Expenses exceed income - immediate action needed');
      recommendations.push('Review and cut non-essential expenses');
    }

    // Age-specific recommendations
    const age = parseInt(profile.age || '30');
    if (age < 30 && metrics.savingsRate.savingsRate < 15) {
      recommendations.push('At your age, aim for 15-20% savings rate for long-term wealth');
    }
    if (age > 50 && profile.emergencyFundMonths < 6) {
      recommendations.push('Consider building 6-12 months emergency fund as you approach retirement');
    }

    return {
      strengths,
      improvements,
      recommendations
    };
  }

  /**
   * Sync onboarding expense breakdown with actual transaction data
   */
  async syncExpenseBreakdownWithTransactions(
    userId: string,
    transactions: Transaction[]
  ): Promise<Record<string, number>> {
    const profile = await this.getUserFinancialProfile(userId);
    const actualExpenses = calculateExpensesData(
      transactions,
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    );

    // Compare onboarding estimates with actual spending
    const syncedBreakdown: Record<string, number> = {};
    
    // Map actual expenses to onboarding categories
    Object.entries(actualExpenses.expensesByCategory).forEach(([category, amount]) => {
      // Map transaction categories to expense breakdown categories
      const mappedCategory = this.mapTransactionCategoryToExpenseBreakdown(category);
      if (mappedCategory) {
        syncedBreakdown[mappedCategory] = (syncedBreakdown[mappedCategory] || 0) + amount;
      }
    });

    return syncedBreakdown;
  }

  /**
   * Map transaction categories to expense breakdown categories
   */
  private mapTransactionCategoryToExpenseBreakdown(transactionCategory: string): string {
    const mapping: Record<string, string> = {
      'rent': 'Rent/Mortgage',
      'mortgage': 'Rent/Mortgage',
      'groceries': 'Food',
      'dining-out': 'Food',
      'fuel': 'Transportation',
      'public-transport': 'Transportation',
      'electricity': 'Utilities',
      'gas': 'Utilities',
      'water': 'Utilities',
      'internet': 'Utilities',
      'streaming-services': 'Entertainment',
      'movies': 'Entertainment',
      'gym': 'Health/Fitness',
      'medical-visits': 'Healthcare',
      'prescriptions': 'Healthcare'
    };

    return mapping[transactionCategory] || 'Other';
  }
}

// Create singleton instance
export const financialDashboardService = new FinancialDashboardService(); 