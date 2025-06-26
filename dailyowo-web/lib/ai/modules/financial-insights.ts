/**
 * Financial Insights AI Module
 * Provides AI-powered financial analysis and recommendations
 */

import {
  AIModule,
  AIProvider,
  AIFinancialInsight,
  AIError,
  AIErrorCode,
} from '../types';
import { Transaction } from '@/types/transaction';
import { BudgetData } from '@/lib/financial-logic/budget-logic';
import { Goal } from '@/types/goal';
import { InvestmentPortfolio } from '@/types/investment';

export interface FinancialInsight {
  id: string;
  type: 'advice' | 'warning' | 'opportunity' | 'achievement' | 'trend';
  category: 'spending' | 'saving' | 'investing' | 'budget' | 'goals' | 'general';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  actions?: {
    label: string;
    type: 'navigate' | 'adjust' | 'create';
    target?: string;
    params?: any;
  }[];
  metrics?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
  }[];
  confidence: number;
  generatedAt: Date;
}

export interface DashboardInsights {
  summary: string;
  insights: FinancialInsight[];
  metrics: {
    financialHealthScore: number;
    savingsRate: number;
    spendingTrend: 'increasing' | 'decreasing' | 'stable';
    budgetAdherence: number;
  };
}

export interface GoalInsights {
  summary: string;
  insights: FinancialInsight[];
  recommendations: {
    goalId: string;
    adjustmentType: 'increase-contribution' | 'extend-deadline' | 'reduce-target';
    reasoning: string;
    suggestedValue: number;
  }[];
}

export interface PortfolioInsights {
  summary: string;
  insights: FinancialInsight[];
  analysis: {
    diversificationScore: number;
    riskLevel: 'conservative' | 'moderate' | 'aggressive';
    performanceRating: 'excellent' | 'good' | 'fair' | 'poor';
    rebalancingNeeded: boolean;
  };
}

export class FinancialInsightsModule implements AIModule {
  id = 'insights';
  name = 'Financial Insights Module';
  description = 'Provides AI-powered financial analysis and recommendations';
  version = '1.0.0';
  
  constructor(public provider: AIProvider) {}

  async initialize(): Promise<void> {
    console.log('[AI] Initializing Financial Insights Module...');
  }

  /**
   * Analyze spending patterns and generate insights
   */
  async analyzeSpending(
    transactions: any[],
    userId: string
  ): Promise<AIFinancialInsight[]> {
    // Placeholder implementation
    const insights: AIFinancialInsight[] = [];
    
    try {
      const prompt = `Analyze the following spending data and provide 3-5 actionable financial insights:
      ${JSON.stringify(transactions.slice(0, 10))}
      
      Format your response as a JSON array of insights with the following structure:
      [{
        "type": "spending|saving|budget|anomaly",
        "title": "Brief title",
        "description": "Detailed description",
        "severity": "info|warning|critical|positive",
        "recommendations": ["recommendation 1", "recommendation 2"]
      }]`;

      const response = await this.provider.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 1000,
        format: 'json',
      });

      const parsed = JSON.parse(response);
      
      return parsed.map((insight: any, index: number) => ({
        id: `insight-${Date.now()}-${index}`,
        type: insight.type || 'spending',
        title: insight.title,
        description: insight.description,
        severity: insight.severity || 'info',
        recommendations: insight.recommendations || [],
        confidence: 0.85,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('[AI] Failed to generate insights:', error);
      return insights;
    }
  }

  /**
   * Generate comprehensive dashboard insights
   */
  async generateDashboardInsights(
    transactions: Transaction[],
    budget: BudgetData | null,
    goals: Goal[],
    userContext?: {
      userName: string;
      userProfile: any;
      contextSource: string;
      totalTransactions: number;
    }
  ): Promise<DashboardInsights> {
    const userName = userContext?.userName || 'User';
    
    // CRITICAL DEBUGGING: Log what data the AI module receives
    // Consider both transaction data AND profile income data from onboarding
    const hasTransactionData = (userContext?.totalTransactions || 0) > 0;
    const hasProfileIncome = userContext?.userProfile?.monthlyIncome > 0;
    const hasProfileSavings = userContext?.userProfile?.currentSavings > 0;
    const hasProfileDebt = userContext?.userProfile?.currentDebt > 0;
    const hasOnboardingData = hasProfileIncome || hasProfileSavings || hasProfileDebt;
    const hasAnyData = hasTransactionData || hasOnboardingData;
    
    // Even if they have no data, provide encouraging and helpful guidance
    
    const prompt = `
You are Owo, a helpful personal financial advisor for DailyOwo. You're creating personalized insights for ${userName}.

CORE PRINCIPLE: Work with whatever data is available. NEVER demand more data. ALWAYS provide immediate value.

TONE: Encouraging, supportive, and practical. Celebrate any progress, no matter how small.

YOUR APPROACH:
- Analyze whatever data exists (even if minimal)
- Provide actionable insights based on current information
- Offer practical next steps without being demanding
- Focus on building confidence and momentum
- Be helpful and encouraging, not critical or pushy

${hasAnyData ? 
  `${userName} has shared some financial information - excellent! Analyze what's available and provide helpful insights. ${hasOnboardingData && !hasTransactionData ? 
    `They've shared income/savings/debt info - that's a great start! Provide insights based on this foundation.` : 
    ''
  }` :
  `${userName} is new to financial tracking - perfect! Provide foundational financial wisdom and gentle guidance.`
}

USER: ${userName}
TOTAL TRANSACTIONS: ${userContext?.totalTransactions || 0}
DATA SOURCE: ${userContext?.contextSource || 'limited'}

TRANSACTIONS (Last 30 days):
${this.summarizeTransactions(transactions)}

BUDGET STATUS:
${budget ? this.summarizeBudget(budget) : 'No active budget'}

${userContext?.userProfile ? `
USER PROFILE:
- Monthly Income: ${userContext.userProfile.monthlyIncome || 'Not set'}
- Current Savings: ${userContext.userProfile.currentSavings || 'Not set'}  
- Current Debt: ${userContext.userProfile.currentDebt || 'Not set'}
- Financial Goals: ${userContext.userProfile.financialGoals?.join(', ') || 'Not set'}
` : ''}

GOALS:
${goals.map(g => `- ${g.name}: ${g.currentAmount}/${g.targetAmount} (${Math.round((g.currentAmount/g.targetAmount)*100)}%)`).join('\n')}

IMPORTANT: Address ${userName} directly and personally. Use "you" and "your" language.

WHAT TO PROVIDE:
1. An encouraging summary (2-3 sentences) that acknowledges ${userName}'s current situation positively
2. 3-5 practical insights that are immediately useful:
   - With transactions: Analyze patterns, highlight wins, suggest optimizations
   - With profile data only: Work with income/savings ratios, suggest realistic next steps
   - With minimal data: Share foundational wisdom, simple first actions, confidence building
   - ALWAYS find something positive to highlight and build on
3. Realistic metrics and simple explanations in everyday language

IMPORTANT RULES:
- NEVER say "you need to add more data" or similar demanding language
- NEVER mention completing onboarding as a requirement 
- NEVER focus on what's missing - focus on what's there
- ALWAYS provide value with current information
- Keep explanations simple and actionable

Format as JSON with the structure:
{
  "summary": "string",
  "insights": [
    {
      "type": "advice|warning|opportunity|achievement|trend",
      "category": "spending|saving|investing|budget|goals|general",
      "title": "string",
      "description": "string",
      "explanation": "simple layman explanation of what this means and why it matters",
      "impact": "high|medium|low",
      "actionable": boolean,
      "actions": [{"label": "string", "type": "navigate|adjust|create", "target": "string"}],
      "metrics": [{"label": "string", "value": "string|number", "trend": "up|down|stable", "explanation": "what this number means in simple terms"}],
      "confidence": 0-1
    }
  ],
  "metrics": {
    "financialHealthScore": 0-100,
    "savingsRate": 0-100,
    "spendingTrend": "increasing|decreasing|stable",
    "budgetAdherence": 0-100
  },
  "explanations": {
    "financialHealthScore": "simple explanation of what financial health score means",
    "savingsRate": "simple explanation of what savings rate means",
    "spendingTrend": "simple explanation of what the spending trend indicates",
    "budgetAdherence": "simple explanation of what budget adherence means"
  }
}
`;

    try {
      const response = await this.provider.generateText(prompt);
      // Strip Markdown code block markers if present
      const cleaned = response
        .replace(/^```json[\r\n]*/i, '')
        .replace(/^```[\r\n]*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const parsed = JSON.parse(cleaned);
      // Add IDs and timestamps
      parsed.insights = parsed.insights.map((insight: any) => ({
        ...insight,
        id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        generatedAt: new Date()
      }));
      return parsed;
    } catch (error) {
      console.error('Error generating dashboard insights:', error);
      return this.getDefaultDashboardInsights();
    }
  }

  /**
   * Generate goal-specific insights
   */
  async generateGoalInsights(
    goals: Goal[],
    transactions: Transaction[],
    currentIncome: number
  ): Promise<GoalInsights> {
    const prompt = `
Analyze these financial goals and provide strategic recommendations:

GOALS:
${goals.map(g => `
- Name: ${g.name}
- Target: ${g.targetAmount}
- Current: ${g.currentAmount}
- Deadline: ${g.targetDate}
- Monthly Contribution: ${g.monthlyContribution || 0}
- Priority: ${g.priority}
`).join('\n')}

MONTHLY INCOME: ${currentIncome}

RECENT SAVINGS TRANSACTIONS:
${this.summarizeSavingsTransactions(transactions)}

Provide:
1. A summary of overall goal progress
2. 3-5 specific insights about goal achievement
3. Recommendations for adjusting goals (contribution amounts, deadlines, etc.)

Focus on:
- Which goals are on track vs at risk
- Opportunities to accelerate progress
- Realistic adjustments based on income
- Priority-based resource allocation

Format as JSON matching the GoalInsights interface.`;

    try {
      const response = await this.provider.generateText(prompt);
      const parsed = JSON.parse(response);
      
      parsed.insights = parsed.insights.map((insight: any) => ({
        ...insight,
        id: `goal-insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        generatedAt: new Date()
      }));

      return parsed;
    } catch (error) {
      console.error('Error generating goal insights:', error);
      return this.getDefaultGoalInsights();
    }
  }

  /**
   * Generate portfolio insights
   */
  async generatePortfolioInsights(
    portfolio: InvestmentPortfolio,
    marketData?: any
  ): Promise<PortfolioInsights> {
    const prompt = `
Analyze this investment portfolio and provide expert insights:

PORTFOLIO:
Total Value: ${portfolio.totalValue}
Total Cost: ${portfolio.totalCost}
Total Return: ${portfolio.totalReturn} (${portfolio.totalReturnPercentage}%)

HOLDINGS:
${portfolio.holdings.map((h: any) => `
- ${h.symbol}: ${h.quantity} shares @ ${h.currentPrice} (${h.unrealizedGainPercentage}% return)
  Allocation: ${h.allocation}%
`).join('\n')}

ASSET ALLOCATION:
${Object.entries(portfolio.assetAllocation).map(([asset, percent]) => `- ${asset}: ${percent}%`).join('\n')}

Provide:
1. Portfolio health summary
2. 3-5 specific insights about:
   - Diversification quality
   - Risk assessment
   - Performance analysis
   - Rebalancing opportunities
3. Analysis metrics

Format as JSON matching the PortfolioInsights interface.`;

    try {
      const response = await this.provider.generateText(prompt);
      const parsed = JSON.parse(response);
      
      parsed.insights = parsed.insights.map((insight: any) => ({
        ...insight,
        id: `portfolio-insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        generatedAt: new Date()
      }));

      return parsed;
    } catch (error) {
      console.error('Error generating portfolio insights:', error);
      return this.getDefaultPortfolioInsights();
    }
  }

  /**
   * Generate general financial advisory
   */
  async generateGeneralAdvisory(
    transactions: Transaction[],
    budget: BudgetData | null,
    goals: Goal[],
    portfolio?: InvestmentPortfolio,
    userPreferences?: any
  ): Promise<{
    advisory: string;
    topPriorities: FinancialInsight[];
    actionPlan: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
  }> {
    const prompt = `
As a financial advisor, analyze this comprehensive financial data and provide personalized advice:

FINANCIAL OVERVIEW:
- Monthly Income: ${budget?.totalIncome || 'Unknown'}
- Monthly Expenses: ${this.calculateMonthlyExpenses(transactions)}
- Savings Rate: ${this.calculateSavingsRate(transactions, budget?.totalIncome || 0)}%
- Active Goals: ${goals.length}
- Portfolio Value: ${portfolio?.totalValue || 0}

SPENDING PATTERNS:
${this.analyzeSpendingPatterns(transactions)}

GOAL PROGRESS:
${goals.map(g => `${g.name}: ${Math.round((g.currentAmount/g.targetAmount)*100)}% complete`).join(', ')}

Provide:
1. A comprehensive financial advisory (3-4 paragraphs)
2. Top 5 priority areas needing attention
3. A concrete action plan with immediate (this week), short-term (this month), and long-term (3-6 months) steps

Focus on practical, achievable recommendations tailored to the user's situation.`;

    try {
      const response = await this.provider.generateText(prompt);
      const parsed = JSON.parse(response);
      
      parsed.topPriorities = parsed.topPriorities.map((insight: any) => ({
        ...insight,
        id: `priority-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        generatedAt: new Date()
      }));

      return parsed;
    } catch (error) {
      console.error('Error generating general advisory:', error);
      return this.getDefaultGeneralAdvisory();
    }
  }

  // Helper methods
  private summarizeTransactions(transactions: Transaction[]): string {
    const last30Days = transactions.filter(t => {
      const daysDiff = (new Date().getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30;
    });

    const income = last30Days.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = last30Days.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    const topCategories = this.getTopSpendingCategories(last30Days.filter(t => t.type === 'expense'));

    return `
Total Income: ${income}
Total Expenses: ${expenses}
Net: ${income - expenses}
Top Spending: ${topCategories.slice(0, 3).map(c => `${c.category} (${c.amount})`).join(', ')}
Transaction Count: ${last30Days.length}
    `;
  }

  private summarizeBudget(budget: BudgetData): string {
    const budgetHealthScore = budget.budgetHealth?.score || 0;
    const budgetHealthStatus = budget.budgetHealth?.status || 'unknown';
    
    return `
Budget Health: ${budgetHealthScore}/100 (${budgetHealthStatus})
Allocated: ${budget.totalAllocated}/${budget.totalIncome}
Spent: ${budget.totalSpent}
Categories Over Budget: ${budget.currentBudget?.categories.filter(c => c.isOverBudget).length || 0}
    `;
  }

  private summarizeSavingsTransactions(transactions: Transaction[]): string {
    const savings = transactions.filter(t => 
      t.categoryId.includes('savings') || 
      t.categoryId.includes('investment') ||
      t.categoryId.includes('emergency')
    );
    
    const last3Months = savings.filter(t => {
      const daysDiff = (new Date().getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 90;
    });

    const totalSaved = last3Months.reduce((sum, t) => sum + t.amount, 0);
    const avgMonthlySavings = totalSaved / 3;

    return `Total saved (3 months): ${totalSaved}, Average monthly: ${avgMonthlySavings}`;
  }

  private calculateMonthlyExpenses(transactions: Transaction[]): number {
    const last30Days = transactions.filter(t => {
      const daysDiff = (new Date().getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 30 && t.type === 'expense';
    });

    return last30Days.reduce((sum, t) => sum + t.amount, 0);
  }

  private calculateSavingsRate(transactions: Transaction[], income: number): number {
    if (income === 0) return 0;
    
    const expenses = this.calculateMonthlyExpenses(transactions);
    const savings = income - expenses;
    
    return Math.round((savings / income) * 100);
  }

  private analyzeSpendingPatterns(transactions: Transaction[]): string {
    const categories = this.getTopSpendingCategories(transactions.filter(t => t.type === 'expense'));
    return categories.slice(0, 5).map(c => `${c.category}: ${c.amount} (${c.percentage}%)`).join('\n');
  }

  private getTopSpendingCategories(expenses: Transaction[]): Array<{category: string, amount: number, percentage: number}> {
    const categoryTotals: Record<string, number> = {};
    const total = expenses.reduce((sum, t) => {
      categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
      return sum + t.amount;
    }, 0);

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / total) * 100)
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // Default responses for error cases
  private getDefaultDashboardInsights(): DashboardInsights {
    return {
      summary: "Unable to generate AI insights at this time. Please check your AI configuration.",
      insights: [],
      metrics: {
        financialHealthScore: 0,
        savingsRate: 0,
        spendingTrend: 'stable',
        budgetAdherence: 0
      }
    };
  }

  private getDefaultGoalInsights(): GoalInsights {
    return {
      summary: "Unable to analyze goals at this time.",
      insights: [],
      recommendations: []
    };
  }

  private getDefaultPortfolioInsights(): PortfolioInsights {
    return {
      summary: "Unable to analyze portfolio at this time.",
      insights: [],
      analysis: {
        diversificationScore: 0,
        riskLevel: 'moderate',
        performanceRating: 'fair',
        rebalancingNeeded: false
      }
    };
  }

  private getDefaultGeneralAdvisory(): any {
    return {
      advisory: "Unable to generate personalized advice at this time.",
      topPriorities: [],
      actionPlan: {
        immediate: [],
        shortTerm: [],
        longTerm: []
      }
    };
  }
}

export function createFinancialInsightsModule(provider: AIProvider): FinancialInsightsModule {
  return new FinancialInsightsModule(provider);
}