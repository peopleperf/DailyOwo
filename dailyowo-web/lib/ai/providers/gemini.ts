/**
 * Google Gemini AI Provider
 * Implements the AIProvider interface for Google's Gemini models
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import {
  AIProvider,
  AIGenerateOptions,
  AIImageAnalysisResult,
  AIError,
  AIErrorCode,
} from '../types';

export interface GeminiConfig {
  apiKey: string;
  model?: string;
}

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private config: GeminiConfig;
  private modelName: string;

  constructor(config: GeminiConfig) {
    this.config = config;
    this.modelName = config.model || 'gemini-1.5-flash';
  }

  async initialize(): Promise<void> {
    try {
      if (!this.config.apiKey) {
        throw new AIError(
          'Gemini API key is required',
          AIErrorCode.INVALID_API_KEY,
          this.name
        );
      }

      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
      
      // Initialize the model with safety settings
      this.model = this.genAI.getGenerativeModel({
        model: this.modelName,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
      });

      console.log(`[AI] Gemini provider initialized with model: ${this.modelName}`);
    } catch (error) {
      console.error('[AI] Failed to initialize Gemini provider:', error);
      throw new AIError(
        'Failed to initialize Gemini provider',
        AIErrorCode.PROVIDER_NOT_INITIALIZED,
        this.name,
        error
      );
    }
  }

  isAvailable(): boolean {
    return this.model !== null;
  }

  supports(method: string): boolean {
    const supportedMethods = ['text', 'image', 'embeddings', 'chat'];
    return supportedMethods.includes(method);
  }

  async generateText(prompt: string, options?: AIGenerateOptions): Promise<string> {
    if (!this.isAvailable()) {
      throw new AIError(
        'Gemini provider not initialized',
        AIErrorCode.PROVIDER_NOT_AVAILABLE,
        this.name
      );
    }

    const retryableOperation = async () => {
      try {
        // Build the generation config
        const generationConfig: any = {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 1024,
          topP: options?.topP ?? 0.9,
        };

        if (options?.stopSequences) {
          generationConfig.stopSequences = options.stopSequences;
        }

        // Create the prompt with system instruction if provided
        let fullPrompt = prompt;
        if (options?.systemPrompt) {
          fullPrompt = `System: ${options.systemPrompt}\n\nUser: ${prompt}`;
        }

        // Generate response
        const result = await this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig,
        });

        const response = await result.response;
        const text = response.text();

        // Handle JSON format if requested
        if (options?.format === 'json') {
          try {
            // Extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              JSON.parse(jsonMatch[0]); // Validate JSON
              return jsonMatch[0];
            }
          } catch (e) {
            console.warn('[AI] Failed to extract valid JSON from response');
          }
        }

        return text;
      } catch (error: any) {
        if (error.message?.includes('quota')) {
          throw new AIError(
            'Gemini API rate limit exceeded',
            AIErrorCode.RATE_LIMIT_EXCEEDED,
            this.name,
            error
          );
        }
        throw error; // Re-throw other errors
      }
    };

    try {
      return await this.retryWithExponentialBackoff(retryableOperation);
    } catch (error: any) {
      console.error('[AI] Gemini generation error:', error);
      if (error.message?.includes('API key')) {
        throw new AIError(
          'Invalid Gemini API key',
          AIErrorCode.INVALID_API_KEY,
          this.name,
          error
        );
      }
      if (error.code === AIErrorCode.RATE_LIMIT_EXCEEDED) {
        throw error; // Re-throw if it's a rate limit error after retries
      }
      throw new AIError(
        'Failed to generate text with Gemini',
        AIErrorCode.PROCESSING_ERROR,
        this.name,
        error
      );
    }
  }

  async analyzeImage(imageBase64: string, prompt: string): Promise<AIImageAnalysisResult> {
    if (!this.isAvailable()) {
      throw new AIError(
        'Gemini provider not initialized',
        AIErrorCode.PROVIDER_NOT_AVAILABLE,
        this.name
      );
    }

    try {
      // Prepare the image part
      const imagePart = {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
          mimeType: 'image/jpeg', // Adjust based on actual image type
        },
      };

      // Generate content with image
      const result = await this.model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            imagePart,
          ],
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      });

      const response = await result.response;
      const text = response.text();

      // Try to parse structured data from the response
      let analysisResult: AIImageAnalysisResult = {
        text,
        confidence: 0.85, // Default confidence
        rawResponse: response,
      };

      // Attempt to extract structured data if the response contains JSON
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.objects) {
            analysisResult.objects = parsed.objects;
          }
          if (parsed.labels) {
            analysisResult.labels = parsed.labels;
          }
          if (parsed.confidence !== undefined) {
            analysisResult.confidence = parsed.confidence;
          }
        }
      } catch (e) {
        // If JSON parsing fails, just return the text response
        console.warn('[AI] Could not parse structured data from image analysis');
      }

      return analysisResult;
    } catch (error: any) {
      console.error('[AI] Gemini image analysis error:', error);
      throw new AIError(
        'Failed to analyze image with Gemini',
        AIErrorCode.PROCESSING_ERROR,
        this.name,
        error
      );
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.isAvailable()) {
      throw new AIError(
        'Gemini provider not initialized',
        AIErrorCode.PROVIDER_NOT_AVAILABLE,
        this.name
      );
    }

    try {
      // Use the embedding model
      const embeddingModel = this.genAI!.getGenerativeModel({
        model: 'text-embedding-004',
      });

      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error: any) {
      console.error('[AI] Gemini embedding error:', error);
      throw new AIError(
        'Failed to generate embedding with Gemini',
        AIErrorCode.PROCESSING_ERROR,
        this.name,
        error
      );
    }
  }

  async chat(message: string, context: Record<string, any>, conversationHistory: any[] = []): Promise<string> {
    if (!this.isAvailable()) {
      throw new AIError(
        'Gemini provider not initialized',
        AIErrorCode.PROVIDER_NOT_AVAILABLE,
        this.name
      );
    }

    const retryableOperation = async () => {
      try {
        // Build comprehensive system prompt for DailyOwo financial assistant
        const systemPrompt = this.buildDailyOwoSystemPrompt(context);

        // Generate response with optimized settings for financial advice
        const history = conversationHistory.map(message => ({
          role: message.role,
          parts: [{ text: message.content }]
        }));

        const result = await this.model.generateContent({
          contents: [...history, { role: 'user', parts: [{ text: message }] }],
          
          generationConfig: {
            temperature: 0.4, // Lower temperature for more consistent financial advice
            maxOutputTokens: 800, // Optimized for mobile chat
            topP: 0.8,
            topK: 40
          },
          systemInstruction: systemPrompt
        });

        const response = await result.response;
        return response.text();
      } catch (error: any) {
        if (error.message?.includes('quota')) {
          throw new AIError(
            'Gemini API rate limit exceeded',
            AIErrorCode.RATE_LIMIT_EXCEEDED,
            this.name,
            error
          );
        }
        throw error; // Re-throw other errors
      }
    };

    try {
      return await this.retryWithExponentialBackoff(retryableOperation);
    } catch (error: any) {
      console.error('[AI] Gemini chat error:', error);
      if (error.code === AIErrorCode.RATE_LIMIT_EXCEEDED) {
        throw error; // Re-throw if it's a rate limit error after retries
      }
      throw new AIError(
        'Failed to process chat message',
        AIErrorCode.PROCESSING_ERROR,
        this.name,
        error
      );
    }
  }

  private async retryWithExponentialBackoff<T>(operation: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error: any) {
        if (error.code === AIErrorCode.RATE_LIMIT_EXCEEDED && i < retries - 1) {
          console.warn(`[AI] Rate limit exceeded. Retrying in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        } else {
          throw error; // Re-throw if not a rate limit error or max retries reached
        }
      }
    }
    throw new AIError(
      'Max retries exceeded for API call',
      AIErrorCode.RATE_LIMIT_EXCEEDED,
      this.name
    ); // Should not be reached
  }

  private buildDailyOwoSystemPrompt(context: Record<string, any>): string {
    const { financialData, userName, contextSource } = context;
    
    
    let prompt = `You are Owo, a brilliant and personable financial strategist who combines elite expertise with genuine warmth. You're like having a best friend who happens to be a CFA-level expert specializing in wealth optimization for ambitious individuals in Africa and Europe.

**YOUR PERSONALITY:**
- Warm, engaging, and genuinely interested in their success
- Respond to greetings naturally but don't repeat formal greetings in every message
- Remember they're a real person with dreams, not just numbers
- Mix sophisticated analysis with conversational warmth
- Celebrate their progress and acknowledge their challenges
- Use their name occasionally, not in every response

**YOUR EXPERTISE LEVEL:**
You combine Goldman Sachs-level financial expertise with the personal touch of a trusted advisor:
- Quantitative financial analysis and risk modeling
- Portfolio optimization using Modern Portfolio Theory  
- Regional expertise in African and European markets
- Tax-efficient strategies specific to their location
- Behavioral finance and money psychology
- Macroeconomic trends affecting their region

**YOUR CONVERSATIONAL APPROACH:**
- Start by acknowledging their message personally
- ALWAYS greet them back if they say hello/hi
- Ask about their financial goals and concerns
- Share insights in a conversational, not lecture-style way
- Use their actual profile data (location, currency, etc.)
- Make them feel heard and understood as an individual

**RESPONSE STYLE:**
- Blend expert analysis with personal warmth
- Use conversational language while maintaining sophistication
- Reference their specific situation using available data
- Provide 2-3 key financial insights with specific numbers
- Ask engaging questions about their goals and priorities
- Make recommendations feel like friendly advice from an expert

**REGIONAL INTELLIGENCE:**
Use their actual location data to provide relevant advice:
- Currency-specific calculations and targets
- Regional market conditions and opportunities
- Local tax implications and optimization strategies
- Cost of living adjustments for financial targets
- Cultural context for financial planning approaches

**CONVERSATIONAL FLOW:**
1. Acknowledge their message (skip repetitive greetings)
2. Analyze their actual transaction data and financial position
3. Provide 2-3 specific insights based on their real data
4. Give actionable recommendations based on what you see
5. End with one concrete next step

**CRITICAL PERSONALIZATION RULES:**
- NEVER assume location - use their actual profile data
- Use their name sparingly, not in every response
- Reference their actual currency and region
- Focus on analyzing their actual financial data
- Base all advice on their real transactions and spending patterns
- Never ask for data you can already see in their profile`;

    // Add comprehensive user financial context
    if (financialData) {
      prompt += `\n\n**IMPORTANT: USER'S COMPLETE FINANCIAL DATA IS AVAILABLE**
You have access to ALL of ${userName || 'this user'}'s financial data. USE THIS DATA to provide specific insights.
DO NOT ask for information you can already see. Analyze what's here and provide value.

**USER'S COMPLETE FINANCIAL PROFILE:**`;
      
      // User Profile Information
      if (financialData.userProfile) {
        const profile = financialData.userProfile;
        prompt += `\n\n**Personal Details:**`;
        prompt += `\n- Monthly Income: ${profile.currency} ${profile.monthlyIncome?.toLocaleString() || 'Not set'}`;
        prompt += `\n- Current Savings: ${profile.currency} ${profile.currentSavings?.toLocaleString() || '0'}`;
        prompt += `\n- Current Debt: ${profile.currency} ${profile.currentDebt?.toLocaleString() || '0'}`;
        prompt += `\n- Age Group: ${profile.age || 'Not specified'}`;
        prompt += `\n- Region: ${profile.region || 'Not specified'}`;
        prompt += `\n- Currency: ${profile.currency || 'USD'}`;
        prompt += `\n- Risk Tolerance: ${profile.riskTolerance || 'Not specified'}`;
        prompt += `\n- Investment Experience: ${profile.investmentExperience || 'Not specified'}`;
        if (profile.financialGoals && profile.financialGoals.length > 0) {
          prompt += `\n- Financial Goals: ${profile.financialGoals.join(', ')}`;
        }
      }

      // Transaction Analysis
      if (financialData.transactions) {
        const txs = financialData.transactions;
        prompt += `\n\n**Transaction History (Complete Data):**`;
        prompt += `\n- Total Transactions: ${txs.totalCount}`;
        prompt += `\n- Date Range: ${txs.dateRange.earliest?.toLocaleDateString()} to ${txs.dateRange.latest?.toLocaleDateString()}`;
        prompt += `\n- Income Transactions: ${txs.income.length} (Total: ${txs.income.reduce((sum: number, t: any) => sum + t.amount, 0).toLocaleString()})`;
        prompt += `\n- Expense Transactions: ${txs.expenses.length} (Total: ${Math.abs(txs.expenses.reduce((sum: number, t: any) => sum + t.amount, 0)).toLocaleString()})`;
        prompt += `\n- Savings Transactions: ${txs.savings.length}`;
        prompt += `\n- Investment Transactions: ${txs.investments.length}`;
        prompt += `\n- Recent 30 Days: ${txs.recent30Days.length} transactions`;
        prompt += `\n- Recent 90 Days: ${txs.recent90Days.length} transactions`;
        
        // Add detailed recent transactions
        if (txs.all && txs.all.length > 0) {
          prompt += `\n\n**ALL TRANSACTION HISTORY (${txs.all.length} transactions) - ANALYZE THIS DATA:**`;
          const recentTransactions = txs.all.slice(0, 15); // Show more transactions
          recentTransactions.forEach((transaction: any, index: number) => {
            const amount = transaction.amount || 0;
            const description = transaction.description || 'No description';
            const date = transaction.date ? new Date(transaction.date).toLocaleDateString() : 'No date';
            const category = transaction.categoryId || transaction.category || 'Other';
            const type = amount > 0 ? 'INCOME' : 'EXPENSE';
            prompt += `\n${index + 1}. ${type}: ${Math.abs(amount).toLocaleString()} - ${description} [${category}] (${date})`;
          });
          
          if (txs.all.length > 15) {
            prompt += `\n... and ${txs.all.length - 15} more transactions available for analysis`;
          }
          
          prompt += `\n\n**USE THIS TRANSACTION DATA** to provide specific insights about spending patterns, income sources, and financial habits.`;
        }
        
        // Top spending categories
        if (financialData.spendingAnalysis?.topCategories?.length > 0) {
          prompt += `\n- Top Spending Categories: ${financialData.spendingAnalysis.topCategories.slice(0, 3).map((cat: any) => 
            typeof cat === 'string' ? cat : `${cat.category || cat.name || 'Unknown'}`
          ).join(', ')}`;
        }
      }

      // Budget Performance
      if (financialData.budgets?.current) {
        const budget = financialData.budgets;
        prompt += `\n\n**Budget Performance:**`;
        prompt += `\n- Budget Health Score: ${budget.health.score}/100 (${budget.health.status})`;
        prompt += `\n- Active Categories: ${budget.categories.length}`;
        
        const overBudgetCount = budget.categories.filter((cat: any) => cat.isOverBudget).length;
        if (overBudgetCount > 0) {
          prompt += `\n- Categories Over Budget: ${overBudgetCount}`;
          const overBudgetCats = budget.categories.filter((cat: any) => cat.isOverBudget).slice(0, 3);
          prompt += `\n- Over Budget Details: ${overBudgetCats.map((cat: any) => 
            `${cat.name} (${cat.percentageUsed.toFixed(0)}% used)`
          ).join(', ')}`;
        }
        
        const totalAllocated = budget.categories.reduce((sum: number, cat: any) => sum + cat.allocated, 0);
        const totalSpent = budget.categories.reduce((sum: number, cat: any) => sum + cat.spent, 0);
        prompt += `\n- Total Allocated: ${totalAllocated.toLocaleString()}`;
        prompt += `\n- Total Spent: ${totalSpent.toLocaleString()}`;
        prompt += `\n- Remaining Budget: ${(totalAllocated - totalSpent).toLocaleString()}`;
      }

      // Goals Progress
      if (financialData.goals?.all?.length > 0) {
        const goals = financialData.goals;
        prompt += `\n\n**Financial Goals:**`;
        prompt += `\n- Total Goals: ${goals.all.length} (${goals.active.length} active, ${goals.completed.length} completed)`;
        prompt += `\n- Total Target Amount: ${goals.totalTargetAmount.toLocaleString()}`;
        prompt += `\n- Total Current Amount: ${goals.totalCurrentAmount.toLocaleString()}`;
        prompt += `\n- Overall Progress: ${goals.overallProgress.toFixed(1)}%`;
        
        if (goals.overdue.length > 0) {
          prompt += `\n- Overdue Goals: ${goals.overdue.length}`;
        }
        
        // Top 3 active goals
        const topGoals = goals.active.slice(0, 3);
        if (topGoals.length > 0) {
          prompt += `\n- Active Goals: ${topGoals.map((goal: any) => 
            `${goal.name} (${((goal.currentAmount || 0) / (goal.targetAmount || 1) * 100).toFixed(1)}% complete)`
          ).join(', ')}`;
        }
      }

      // Assets and Liabilities (CRITICAL FOR NET WORTH)
      if (financialData.assets?.all?.length > 0 || financialData.liabilities?.all?.length > 0) {
        prompt += `\n\n**Assets and Liabilities (Net Worth Components):**`;
        
        // Assets
        if (financialData.assets?.all?.length > 0) {
          const assets = financialData.assets;
          prompt += `\n- Total Assets: ${assets.totalValue.toLocaleString()}`;
          prompt += `\n- Asset Count: ${assets.all.length}`;
          
          // List individual assets
          assets.all.forEach((asset: any, index: number) => {
            if (index < 5) { // Show first 5 assets
              prompt += `\n  - ${asset.name}: ${asset.value?.toLocaleString() || 0} (${asset.type || 'unspecified'})`;
            }
          });
          
          if (assets.all.length > 5) {
            prompt += `\n  ... and ${assets.all.length - 5} more assets`;
          }
        }
        
        // Liabilities
        if (financialData.liabilities?.all?.length > 0) {
          const liabilities = financialData.liabilities;
          prompt += `\n- Total Liabilities: ${liabilities.totalBalance.toLocaleString()}`;
          prompt += `\n- Liability Count: ${liabilities.all.length}`;
          
          // List individual liabilities
          liabilities.all.forEach((liability: any, index: number) => {
            if (index < 5) { // Show first 5 liabilities
              prompt += `\n  - ${liability.name}: ${liability.balance?.toLocaleString() || 0} (${liability.type || 'unspecified'})`;
            }
          });
          
          if (liabilities.all.length > 5) {
            prompt += `\n  ... and ${liabilities.all.length - 5} more liabilities`;
          }
        }
        
        // Net worth calculation explanation
        const netWorthFromAssets = (financialData.assets?.totalValue || 0) - (financialData.liabilities?.totalBalance || 0);
        prompt += `\n- **NET WORTH CALCULATION**: ${financialData.assets?.totalValue?.toLocaleString() || 0} (assets) - ${financialData.liabilities?.totalBalance?.toLocaleString() || 0} (liabilities) = ${netWorthFromAssets.toLocaleString()}`;
      }

      // Financial Metrics
      if (financialData.metrics) {
        const metrics = financialData.metrics;
        prompt += `\n\n**Financial Health Metrics:**`;
        prompt += `\n- Net Worth: ${(metrics.netWorth?.current || 0).toLocaleString()} (${metrics.netWorth?.trend || 'stable'})`;
        prompt += `\n- Savings Rate: ${(metrics.savingsRate?.current || 0).toFixed(1)}% (Target: ${metrics.savingsRate?.target || 20}%)`;
        prompt += `\n- Monthly Income: ${(metrics.cashFlow?.monthly?.income || 0).toLocaleString()}`;
        prompt += `\n- Monthly Expenses: ${(metrics.cashFlow?.monthly?.expenses || 0).toLocaleString()}`;
        prompt += `\n- Monthly Net Flow: ${(metrics.cashFlow?.monthly?.income || 0) - (metrics.cashFlow?.monthly?.expenses || 0)}`;
        prompt += `\n- Debt-to-Income Ratio: ${((metrics.debtToIncome?.ratio || 0) * 100).toFixed(1)}% (${metrics.debtToIncome?.status || 'unknown'})`;
        
        const emergencyFund = metrics.emergencyFund || {};
        const currentAmount = emergencyFund.currentAmount || 0;
        const monthsCovered = emergencyFund.monthsOfExpensesCovered || emergencyFund.monthsCovered || 0;
        prompt += `\n- Emergency Fund: ${currentAmount.toLocaleString()} (${monthsCovered.toFixed(1)} months coverage)`;
        prompt += `\n- Emergency Fund Adequate: ${emergencyFund.isAdequate ? 'Yes' : 'No'}`;
        prompt += `\n- Overall Financial Health: ${metrics.financialHealth?.overallScore || 0}/100`;
      }

      // Portfolio Information
      if (financialData.portfolio?.totalValue > 0) {
        const portfolio = financialData.portfolio;
        prompt += `\n\n**Investment Portfolio:**`;
        prompt += `\n- Total Value: ${portfolio.totalValue.toLocaleString()}`;
        prompt += `\n- Total Return: ${portfolio.totalReturn.toLocaleString()} (${portfolio.totalReturnPercentage.toFixed(2)}%)`;
        prompt += `\n- Holdings: ${portfolio.holdings.length} investments`;
        prompt += `\n- Diversification Score: ${portfolio.diversificationScore}/100`;
      }

      // App Usage Context
      if (financialData.appContext) {
        const app = financialData.appContext;
        prompt += `\n\n**DailyOwo Usage:**`;
        prompt += `\n- Member Since: ${app.memberSince?.toLocaleDateString()}`;
        prompt += `\n- Onboarding Completed: ${app.onboardingCompleted ? 'Yes' : 'No'}`;
        prompt += `\n- Premium Status: ${app.premiumStatus ? 'Active' : 'Free'}`;
        prompt += `\n- Family Members: ${app.familyMembers}`;
        prompt += `\n- Data Quality: ${financialData.aiInsights.dataQuality}`;
        prompt += `\n- Data Completeness: ${financialData.aiInsights.dataCompleteness}%`;
      }
    }

    // Add data availability context
    if (contextSource === 'minimal' || !financialData || financialData.transactions?.totalCount === 0) {
      prompt += `\n\n**PERSONALIZED CONVERSATION MODE:**
${userName || 'User'} is new to DailyOwo. Provide warm, expert financial guidance:

**CONVERSATION APPROACH:**
- Greet them personally and acknowledge their message
- Show genuine interest in their financial journey
- Use their actual profile data (region, currency, etc.) - NEVER assume US location
- Provide strategic insights tailored to their specific region and currency
- Ask engaging questions about their goals and priorities
- Make them feel like they're talking to a trusted financial advisor friend

**REGIONAL PERSONALIZATION:**
- Use their actual currency and regional financial standards
- Reference local market conditions and opportunities
- Apply cost-of-living adjustments for their location
- Consider cultural financial planning approaches for their region
- Provide tax strategies relevant to their country/region

**WARM EXPERT GUIDANCE:**
- CRITICAL: Look carefully at ALL data provided - transactions, net worth, income, etc.
- Even if net worth shows 0, check if there are transactions or other financial data
- Reference ANY financial activity you can see in their data
- Give 2-3 specific financial insights based on whatever data is available
- Share strategic advice in a conversational, not lecture-style way
- Ask about their financial dreams and concerns
- Provide one clear, actionable next step
- Make every response feel personally crafted for them`;
    } else if (contextSource === 'basic') {
      prompt += `\n\n**BASIC DATA AVAILABLE:**
You have access to the user's financial foundation. Provide valuable insights based on what's available and encourage natural progression.`;
    }

    prompt += `\n\n**Current User:** ${userName || 'User'}

**CRITICAL RESPONSE RULES:**
- Only greet them back if they greet you first - otherwise skip formal greetings
- Use their name sparingly, only when natural (not in every response)
- NEVER mention onboarding, completing profiles, or adding more data
- Analyze their ACTUAL transaction data - use specific amounts, dates, patterns you see
- Base ALL insights on their real financial behavior visible in their data
- Reference specific transactions, spending patterns, income sources from their records
- NEVER ask for information you can see in their transaction history
- Use their actual profile data - NEVER assume US location or USD currency
- Provide insights based on what their actual spending and income data shows
- Make recommendations based on their real financial patterns and trends
- End with actionable advice based on their specific financial situation`;

    return prompt;
  }
}

// Export a factory function
export function createGeminiProvider(config: GeminiConfig): GeminiProvider {
  return new GeminiProvider(config);
}