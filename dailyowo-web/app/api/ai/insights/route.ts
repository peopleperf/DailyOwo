import { NextRequest, NextResponse } from 'next/server';
import { AIServiceManager } from '@/lib/ai/ai-service-manager';
import { getComprehensiveFinancialContext, getBasicUserFinancialData } from '@/lib/ai/context/financial-context';
import { auth } from '@/lib/firebase/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Check Firebase Admin availability
    if (!auth) {
      return NextResponse.json(
        { error: 'Firebase Admin not available' },
        { status: 501 }
      );
    }
    
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const session = await auth.verifyIdToken(token).catch(() => null);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Initialize AI service
    const aiManager = AIServiceManager.getInstance();
    if (!aiManager.isInitialized()) {
      const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!geminiApiKey) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 500 }
        );
      }
      
      await aiManager.initialize({
        defaultProvider: 'gemini',
        providers: {
          gemini: { apiKey: geminiApiKey }
        }
      });
    }

    // Get comprehensive financial context with Firebase Admin permissions
    let financialContext;
    let contextSource = 'comprehensive';
    
    try {
      financialContext = await getComprehensiveFinancialContext(session.uid);
    } catch (contextError) {
      console.warn('Comprehensive context failed for insights. Falling back to basic data.', {
        error: contextError instanceof Error ? {
          message: contextError.message,
          stack: contextError.stack,
          name: contextError.name
        } : {
          message: String(contextError)
        }
      });
      
      try {
        const basicData = await getBasicUserFinancialData(session.uid);
        contextSource = 'basic';
        
        financialContext = {
          transactions: { 
            all: basicData.transactions 
          },
          budgets: { 
            current: null 
          },
          goals: { 
            all: [] 
          },
          userProfile: {
            monthlyIncome: basicData.monthlyIncome
          },
          totalTransactions: basicData.totalTransactions,
          hasData: basicData.hasData
        };
        
        console.log(`Basic data for insights: ${basicData.totalTransactions} transactions`);
      } catch (basicError) {
        console.error('Basic data fetch failed for insights, using minimal fallback:', basicError);
        contextSource = 'minimal';
        
        financialContext = {
          transactions: { all: [] },
          budgets: { current: null },
          goals: { all: [] },
          userProfile: { monthlyIncome: 0 },
          totalTransactions: 0,
          hasData: false
        };
      }
    }
    
    

    const insightsModule = aiManager.getModule('insights');
    if (!insightsModule) {
      return NextResponse.json(
        { error: 'Insights module not available' },
        { status: 501 }
      );
    }

    const cache = aiManager.getCache();
    const cacheKey = `insights-${session.uid}`;
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    let insights;
    let fromCache = false;

    if (cache.has(cacheKey)) {
      insights = cache.get(cacheKey);
      fromCache = true;
      console.log(`[AI] Insights served from cache for user: ${session.uid}`);
    } else {
      // Generate dashboard insights using comprehensive context with user info
      insights = await insightsModule.generateDashboardInsights(
        financialContext.transactions.all || [],
        financialContext.budgets.current,
        financialContext.goals.all || [],
        {
          userName: session.name || 'User',
          userProfile: financialContext.userProfile,
          contextSource,
          totalTransactions: financialContext.transactions?.all?.length || 0
        }
      );
      cache.set(cacheKey, insights, CACHE_TTL);
      console.log(`[AI] Insights generated and cached for user: ${session.uid}`);
    }

    return NextResponse.json({
      success: true,
      insights,
      contextSource,
      fromCache,
      financialSummary: {
        totalTransactions: financialContext.transactions?.all?.length || 0,
        monthlyIncome: financialContext.userProfile?.monthlyIncome || 0,
        netWorth: financialContext.metrics?.netWorth?.current || 0,
        dataQuality: (financialContext.aiInsights && financialContext.aiInsights.dataQuality) ? financialContext.aiInsights.dataQuality : ((financialContext as any).hasData ? 'good' : 'poor'),
        budgetCategories: financialContext.budgets?.categories?.length || 0,
        activeGoals: financialContext.goals?.active?.length || 0,
        hasData: (financialContext as any).hasData || false
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error('[AI Insights Error]:', errorObj.message, errorObj.stack);
    
    return NextResponse.json(
      {
        error: 'Failed to generate insights',
        details: process.env.NODE_ENV === 'development' ? {
          message: errorObj.message,
          stack: errorObj.stack,
          name: errorObj.name
        } : undefined
      },
      { status: 500 }
    );
  }
}