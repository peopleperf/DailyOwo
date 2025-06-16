'use client';

import { useMutation, useQuery, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { 
  aiService, 
  TransactionCategorizationResponse, 
  AIInsightsResponse, 
  BudgetOptimizationSuggestion,
  AnomalyDetectionResponse,
  SpendingInsight
} from '@/lib/services/ai-service';
import { useAuth } from '@/lib/firebase/auth-context';

// Hook for transaction categorization
export function useAICategorization(): UseMutationResult<
  TransactionCategorizationResponse,
  Error,
  {
    description: string;
    amount: number;
    merchantName?: string;
    location?: string;
  }
> {
  return useMutation({
    mutationFn: async ({ description, amount, merchantName, location }) => {
      return await aiService.categorizeTransaction(description, amount, merchantName, location);
    },
    mutationKey: ['ai', 'categorization'],
    retry: 2,
    retryDelay: 1000,
  });
}

// Hook for spending insights generation
export function useAIInsights(
  transactions: any[],
  period: string = 'month',
  enabled: boolean = true
): UseQueryResult<AIInsightsResponse, Error> {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai', 'insights', user?.uid, period, transactions.length],
    queryFn: async () => {
      if (!transactions.length) {
        return aiService['generateFallbackInsights'](transactions);
      }
      return await aiService.generateSpendingInsights(transactions, period);
    },
    enabled: enabled && !!user && transactions.length >= 0,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });
}

// Hook for budget optimization
export function useBudgetOptimization(): UseMutationResult<
  BudgetOptimizationSuggestion[],
  Error,
  {
    currentBudget: Record<string, number>;
    spendingHistory: any[];
    goals?: any[];
  }
> {
  return useMutation({
    mutationFn: async ({ currentBudget, spendingHistory, goals }) => {
      return await aiService.optimizeBudget(currentBudget, spendingHistory, goals);
    },
    mutationKey: ['ai', 'budgetOptimization'],
    retry: 1,
  });
}

// Hook for anomaly detection
export function useAnomalyDetection(): UseMutationResult<
  AnomalyDetectionResponse,
  Error,
  {
    transaction: {
      amount: number;
      category: string;
      description: string;
      date: Date;
    };
    userSpendingHistory: any[];
  }
> {
  return useMutation({
    mutationFn: async ({ transaction, userSpendingHistory }) => {
      return await aiService.detectAnomaly(transaction, userSpendingHistory);
    },
    mutationKey: ['ai', 'anomalyDetection'],
    retry: 1,
  });
}

// Hook for AI availability status
export function useAIAvailability(): UseQueryResult<{
  available: boolean;
  featuresEnabled: string[];
  dailyUsage: number;
  dailyLimit: number;
}, Error> {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai', 'availability', user?.uid],
    queryFn: async () => {
      return await aiService.checkAIAvailability();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // Refresh every 10 minutes
  });
}

// Custom hook for smart transaction categorization with auto-retry
export function useSmartCategorization() {
  const categorization = useAICategorization();
  
  const categorizeWithFallback = async (
    description: string,
    amount: number,
    merchantName?: string,
    location?: string
  ): Promise<TransactionCategorizationResponse> => {
    try {
      return await categorization.mutateAsync({
        description,
        amount,
        merchantName,
        location
      });
    } catch (error) {
      console.warn('AI categorization failed, using fallback:', error);
      // Return manual fallback result
      return aiService['fallbackCategorization'](description, amount);
    }
  };

  return {
    categorize: categorizeWithFallback,
    isLoading: categorization.isPending,
    error: categorization.error,
    reset: categorization.reset,
  };
}

// Hook for real-time insights with periodic updates
export function useRealTimeInsights(
  transactions: any[],
  updateInterval: number = 1000 * 60 * 15 // 15 minutes
) {
  const { user, userProfile } = useAuth();
  const aiEnabled = userProfile?.aiSettings?.enabled ?? true;
  const insightsEnabled = userProfile?.aiSettings?.features?.insights ?? true;

  return useQuery({
    queryKey: ['ai', 'realTimeInsights', user?.uid, transactions.length],
    queryFn: async () => {
      if (!aiEnabled || !insightsEnabled) {
        return {
          insights: [{
            id: 'disabled',
            type: 'recommendation' as const,
            title: 'AI Insights Disabled',
            description: 'Enable AI insights in your profile settings to get personalized recommendations.',
            confidence: 1.0,
            actionable: true,
            suggestedAction: 'Go to Profile > AI Settings',
            impact: 'medium' as const
          }],
          budgetOptimizations: [],
          summary: 'AI insights are currently disabled.',
          generatedAt: new Date()
        } as AIInsightsResponse;
      }

      return await aiService.generateSpendingInsights(transactions, 'month');
    },
    enabled: !!user && transactions.length > 0,
    staleTime: updateInterval,
    refetchInterval: updateInterval,
    refetchOnWindowFocus: false,
  });
}

// Hook for batch processing multiple transactions
export function useBatchCategorization() {
  return useMutation({
    mutationFn: async (transactions: Array<{
      id: string;
      description: string;
      amount: number;
      merchantName?: string;
      location?: string;
    }>) => {
      const results = [];
      
      // Process in batches of 5 to avoid overwhelming the API
      for (let i = 0; i < transactions.length; i += 5) {
        const batch = transactions.slice(i, i + 5);
        const batchPromises = batch.map(async (transaction) => {
          try {
            const result = await aiService.categorizeTransaction(
              transaction.description,
              transaction.amount,
              transaction.merchantName,
              transaction.location
            );
            return { ...transaction, categorization: result };
          } catch (error) {
            const fallback = aiService['fallbackCategorization'](
              transaction.description,
              transaction.amount
            );
            return { ...transaction, categorization: fallback };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Small delay between batches
        if (i + 5 < transactions.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      return results;
    },
    mutationKey: ['ai', 'batchCategorization'],
  });
}

// Hook for AI-powered goal suggestions
export function useAIGoalSuggestions(
  userProfile: any,
  spendingHistory: any[]
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['ai', 'goalSuggestions', user?.uid, spendingHistory.length],
    queryFn: async () => {
      // This would call a goal suggestion function
      // For now, return mock data
      return [
        {
          type: 'emergency_fund',
          title: 'Build Emergency Fund',
          description: 'Based on your spending, aim for $12,000 emergency fund',
          targetAmount: 12000,
          suggestedMonthlyContribution: 500,
          reasoning: 'Covers 6 months of expenses based on your spending pattern',
          priority: 'high' as const,
          timeline: '24 months'
        },
        {
          type: 'debt_payoff',
          title: 'Accelerate Debt Payoff',
          description: 'Pay off high-interest debt faster',
          targetAmount: 5000,
          suggestedMonthlyContribution: 300,
          reasoning: 'Free up $150/month in interest payments',
          priority: 'medium' as const,
          timeline: '18 months'
        }
      ];
    },
    enabled: !!user && spendingHistory.length > 10,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}

// Custom hook for AI settings management
export function useAISettings() {
  const { userProfile, updateUserProfile } = useAuth();
  
  const updateAISetting = async (
    settingPath: string,
    value: any
  ) => {
    const currentSettings = userProfile?.aiSettings || {
      enabled: true,
      features: {
        insights: true,
        categorization: true,
        predictions: true,
        recommendations: true,
        optimization: true,
      },
      privacy: {
        dataSharing: 'standard' as const,
        retentionPeriod: '1y' as const,
        allowPersonalization: true,
      },
      transparency: {
        showConfidenceScores: true,
        explainRecommendations: true,
        allowCorrections: true,
      },
      performance: {
        analysisFrequency: 'daily' as const,
        autoApply: false,
      }
    };

    const updatedSettings = { ...currentSettings };
    const pathParts = settingPath.split('.');
    let current: any = updatedSettings;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;

    await updateUserProfile({ aiSettings: updatedSettings });
  };

  return {
    settings: userProfile?.aiSettings,
    updateSetting: updateAISetting,
    isAIEnabled: userProfile?.aiSettings?.enabled ?? true,
  };
} 