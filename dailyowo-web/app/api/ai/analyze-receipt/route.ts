import { NextRequest, NextResponse } from 'next/server';
import { AIServiceManager } from '@/lib/ai/ai-service-manager';
import { ReceiptAIModule } from '@/lib/ai/modules/receipt-ai';

let aiManager: AIServiceManager | null = null;
let receiptAI: ReceiptAIModule | null | undefined = null;

async function initializeAI() {
  if (!aiManager && process.env.GEMINI_API_KEY) {
    console.log('[API] Initializing AI service...');
    try {
      aiManager = AIServiceManager.getInstance();
      
      await aiManager.initialize({
        defaultProvider: 'gemini',
        providers: {
          gemini: {
            apiKey: process.env.GEMINI_API_KEY,
            model: 'gemini-1.5-flash'
          }
        }
      });
      receiptAI = aiManager.getModule<ReceiptAIModule>('receipt');
      console.log('[API] AI service initialized successfully');
    } catch (error) {
      console.error('[API] Failed to initialize AI:', error);
      throw error;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if AI is enabled
    if (process.env.NEXT_PUBLIC_AI_RECEIPT_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'AI receipt analysis is disabled' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('[API] No Gemini API key found');
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // Initialize AI if needed
    await initializeAI();

    if (!receiptAI) {
      return NextResponse.json(
        { error: 'AI service not available' },
        { status: 500 }
      );
    }

    // Get request data
    const body = await request.json();
    const { imageBase64, ocrData } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    console.log('[API] Analyzing receipt with AI...');
    
    // Analyze the receipt
    const analysis = await receiptAI.analyzeReceipt(imageBase64, ocrData);
    
    console.log('[API] Analysis complete:', {
      confidence: analysis.confidence,
      hasEnhancedData: !!analysis.enhancedData,
      suggestionCount: analysis.suggestions?.length || 0
    });

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error('[API] Receipt analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze receipt',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 