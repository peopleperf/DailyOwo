import { NextRequest, NextResponse } from 'next/server';
import { AIServiceManager } from '@/lib/ai/ai-service-manager';
import { getComprehensiveFinancialContext } from '@/lib/ai/context/financial-context';
import { auth } from '@/lib/firebase/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const session = await auth.verifyIdToken(token).catch(() => null);
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { message, conversationHistory, context: clientContext } = await req.json();

    // Initialize AI Service Manager
    const aiServiceManager = AIServiceManager.getInstance();
    if (!aiServiceManager.isInitialized()) {
      const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!geminiApiKey) {
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 500 }
        );
      }
      
      await aiServiceManager.initialize({
        defaultProvider: 'gemini',
        providers: {
          gemini: { apiKey: geminiApiKey }
        }
      });
    }

    // Get comprehensive financial context with Firebase Admin permissions
    const financialContext = await getComprehensiveFinancialContext(session.uid);

    // Get chat module
    const chatModule = aiServiceManager.getModule('chat');
    if (!chatModule) {
      throw new Error('Chat module not available');
    }

    // Process message - Structure context properly for AI provider
    const structuredContext = {
      ...clientContext,
      financialData: financialContext, // Wrap financial context under financialData key
      userName: clientContext?.userName || 'User',
      contextSource: 'comprehensive'
    };
    
    
    const response = await chatModule.processMessage(message, structuredContext, conversationHistory);

    return NextResponse.json(response);

  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error('[AI Chat Error]:', { message: errorObj.message, stack: errorObj.stack });
    return NextResponse.json(
      { error: 'Failed to process request', details: process.env.NODE_ENV === 'development' ? errorObj.message : undefined },
      { status: 500 }
    );
  }
}
