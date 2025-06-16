'use client';

import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { app } from '@/lib/firebase/config';

// Types for AI service responses
export interface TransactionCategorizationResponse {
  category: string;
  confidence: number;
  explanation?: string;
  subcategory?: string;
}

export interface SpendingInsight {
  id: string;
  type: 'pattern' | 'recommendation' | 'warning' | 'achievement';
  title: string;
  description: string;
  confidence: number;
  actionable?: boolean;
  suggestedAction?: string;
  impact?: 'low' | 'medium' | 'high';
}

export interface BudgetOptimizationSuggestion {
  category: string;
  currentAmount: number;
  suggestedAmount: number;
  reasoning: string;
  potentialSavings: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
}

export interface AIInsightsResponse {
  insights: SpendingInsight[];
  budgetOptimizations: BudgetOptimizationSuggestion[];
  summary: string;
  generatedAt: Date;
}

export interface AnomalyDetectionResponse {
  isAnomalous: boolean;
  confidence: number;
  reason?: string;
  severity: 'low' | 'medium' | 'high';
  suggestedAction?: string;
}

export class AIService {
  private static instance: AIService;
  private functions = getFunctions(app || undefined);
  
  // Callable functions
  private categorizeTransactionFn = httpsCallable(this.functions, 'categorizeTransaction');
  private generateInsightsFn = httpsCallable(this.functions, 'generateSpendingInsights');
  private optimizeBudgetFn = httpsCallable(this.functions, 'optimizeBudget');
  private detectAnomalyFn = httpsCallable(this.functions, 'detectAnomaly');

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  /**
   * Categorize a transaction using AI
   */
  async categorizeTransaction(
    description: string, 
    amount: number,
    merchantName?: string,
    location?: string
  ): Promise<TransactionCategorizationResponse> {
    try {
      const result = await this.categorizeTransactionFn({
        description: description.trim(),
        amount,
        merchantName,
        location
      }) as HttpsCallableResult<TransactionCategorizationResponse>;

      return result.data;
    } catch (error) {
      console.error('AI categorization failed:', error);
      
      // Fallback to basic rule-based categorization
      return this.fallbackCategorization(description, amount);
    }
  }

  /**
   * Generate spending insights based on transaction history
   */
  async generateSpendingInsights(
    transactions: any[],
    period: string = 'month'
  ): Promise<AIInsightsResponse> {
    try {
      const result = await this.generateInsightsFn({
        transactions: transactions.slice(0, 100), // Limit to recent 100 transactions
        period,
        userId: 'current-user' // This will be handled by Firebase Auth context
      }) as HttpsCallableResult<AIInsightsResponse>;

      return {
        ...result.data,
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('AI insights generation failed:', error);
      
      // Return fallback insights
      return this.generateFallbackInsights(transactions);
    }
  }

  /**
   * Get budget optimization suggestions
   */
  async optimizeBudget(
    currentBudget: Record<string, number>,
    spendingHistory: any[],
    goals?: any[]
  ): Promise<BudgetOptimizationSuggestion[]> {
    try {
      const result = await this.optimizeBudgetFn({
        currentBudget,
        spendingHistory: spendingHistory.slice(0, 200),
        goals
      }) as HttpsCallableResult<BudgetOptimizationSuggestion[]>;

      return result.data;
    } catch (error) {
      console.error('Budget optimization failed:', error);
      return this.generateFallbackBudgetSuggestions(currentBudget, spendingHistory);
    }
  }

  /**
   * Detect anomalous transactions
   */
  async detectAnomaly(
    transaction: {
      amount: number;
      category: string;
      description: string;
      date: Date;
    },
    userSpendingHistory: any[]
  ): Promise<AnomalyDetectionResponse> {
    try {
      const result = await this.detectAnomalyFn({
        transaction,
        spendingHistory: userSpendingHistory.slice(0, 100)
      }) as HttpsCallableResult<AnomalyDetectionResponse>;

      return result.data;
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return this.fallbackAnomalyDetection(transaction, userSpendingHistory);
    }
  }

  /**
   * Check if AI features are available
   */
  async checkAIAvailability(): Promise<{
    available: boolean;
    featuresEnabled: string[];
    dailyUsage: number;
    dailyLimit: number;
  }> {
    try {
      // This would call a status function if implemented
      return {
        available: true,
        featuresEnabled: ['categorization', 'insights', 'budgetOptimization', 'anomalyDetection'],
        dailyUsage: 0,
        dailyLimit: 100
      };
    } catch (error) {
      return {
        available: false,
        featuresEnabled: [],
        dailyUsage: 0,
        dailyLimit: 0
      };
    }
  }

  // Fallback methods for when AI is unavailable

  private fallbackCategorization(
    description: string, 
    amount: number
  ): TransactionCategorizationResponse {
    const desc = description.toLowerCase();
    
    // Simple rule-based categorization
    const rules: Array<{ keywords: string[]; category: string }> = [
      { keywords: ['starbucks', 'coffee', 'restaurant', 'food', 'grocery', 'uber eats', 'doordash'], category: 'Food & Dining' },
      { keywords: ['gas', 'uber', 'lyft', 'taxi', 'transit', 'bus'], category: 'Transportation' },
      { keywords: ['amazon', 'walmart', 'target', 'shopping', 'store'], category: 'Shopping' },
      { keywords: ['netflix', 'spotify', 'movie', 'cinema', 'game'], category: 'Entertainment' },
      { keywords: ['electric', 'gas bill', 'water', 'internet', 'phone'], category: 'Bills & Utilities' },
      { keywords: ['doctor', 'pharmacy', 'hospital', 'medical'], category: 'Healthcare' },
      { keywords: ['salary', 'paycheck', 'income', 'deposit'], category: 'Income' },
      { keywords: ['transfer', 'savings'], category: 'Transfer' },
    ];

    for (const rule of rules) {
      if (rule.keywords.some(keyword => desc.includes(keyword))) {
        return {
          category: rule.category,
          confidence: 0.7,
          explanation: 'Categorized using basic rules (AI unavailable)'
        };
      }
    }

    return {
      category: 'Other',
      confidence: 0.3,
      explanation: 'Unable to categorize automatically'
    };
  }

  private generateFallbackInsights(transactions: any[]): AIInsightsResponse {
    const insights: SpendingInsight[] = [
      {
        id: 'fallback-1',
        type: 'recommendation',
        title: 'AI Insights Unavailable',
        description: 'Connect to the internet to get personalized spending insights powered by AI.',
        confidence: 1.0,
        actionable: false,
        impact: 'low'
      }
    ];

    if (transactions.length > 0) {
      insights.push({
        id: 'fallback-2',
        type: 'pattern',
        title: 'Transaction Activity',
        description: `You have ${transactions.length} transactions to analyze. Enable AI features for detailed insights.`,
        confidence: 1.0,
        actionable: true,
        suggestedAction: 'Enable AI features in settings',
        impact: 'medium'
      });
    }

    return {
      insights,
      budgetOptimizations: [],
      summary: 'Basic insights available. Enable AI for advanced analysis.',
      generatedAt: new Date()
    };
  }

  private generateFallbackBudgetSuggestions(
    currentBudget: Record<string, number>,
    spendingHistory: any[]
  ): BudgetOptimizationSuggestion[] {
    // Simple 50/30/20 rule suggestions
    const totalBudget = Object.values(currentBudget).reduce((sum, amount) => sum + amount, 0);
    
    return [
      {
        category: 'Overall Budget',
        currentAmount: totalBudget,
        suggestedAmount: totalBudget,
        reasoning: 'Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings',
        potentialSavings: 0,
        difficulty: 'easy'
      }
    ];
  }

  private fallbackAnomalyDetection(
    transaction: any,
    spendingHistory: any[]
  ): AnomalyDetectionResponse {
    // Simple amount-based anomaly detection
    const amounts = spendingHistory
      .filter(t => t.category === transaction.category)
      .map(t => Math.abs(t.amount));
    
    if (amounts.length === 0) {
      return {
        isAnomalous: false,
        confidence: 0.3,
        severity: 'low',
        reason: 'No spending history for comparison'
      };
    }

    const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
    const isLarge = Math.abs(transaction.amount) > avgAmount * 3;

    return {
      isAnomalous: isLarge,
      confidence: isLarge ? 0.6 : 0.4,
      severity: isLarge ? 'medium' : 'low',
      reason: isLarge ? 'Transaction amount is unusually large' : 'Transaction appears normal',
      suggestedAction: isLarge ? 'Review transaction details' : undefined
    };
  }
}

// Export singleton instance
export const aiService = AIService.getInstance(); 