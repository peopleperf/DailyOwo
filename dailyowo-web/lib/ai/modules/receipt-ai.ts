/**
 * Receipt AI Module
 * Enhances receipt scanning with AI-powered analysis and insights
 */

import {
  AIModule,
  AIProvider,
  AIReceiptAnalysis,
  AIEnhancedReceiptData,
  AIReceiptItem,
  AIReceiptSuggestion,
  AIError,
  AIErrorCode,
} from '../types';
import { ExtractedReceiptData } from '@/types/receipt';

export class ReceiptAIModule implements AIModule {
  id = 'receipt';
  name = 'Receipt AI Module';
  description = 'Enhances receipt scanning with AI-powered analysis and insights';
  version = '1.0.0';
  
  constructor(public provider: AIProvider) {}

  async initialize(): Promise<void> {
    console.log('[AI] Initializing Receipt AI Module...');
    // Any specific initialization for receipt module
  }

  /**
   * Analyze a receipt image and extract enhanced data
   */
  async analyzeReceipt(
    imageBase64: string,
    ocrData?: ExtractedReceiptData
  ): Promise<AIReceiptAnalysis> {
    const startTime = Date.now();

    try {
      // Create a comprehensive prompt for receipt analysis
      const prompt = this.createReceiptAnalysisPrompt(ocrData);
      
      // Analyze the image with AI
      const result = await this.provider.analyzeImage!(imageBase64, prompt);
      
      // Parse the AI response
      const enhancedData = await this.parseAIResponse(result.text || '', ocrData);
      
      // Generate suggestions based on the analysis
      const suggestions = await this.generateSuggestions(enhancedData);

      return {
        enhancedData,
        suggestions,
        confidence: result.confidence,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[AI] Receipt analysis error:', error);
      throw new AIError(
        'Failed to analyze receipt',
        AIErrorCode.PROCESSING_ERROR,
        this.provider.name,
        error
      );
    }
  }

  /**
   * Create a comprehensive prompt for receipt analysis
   */
  private createReceiptAnalysisPrompt(ocrData?: ExtractedReceiptData): string {
    let prompt = `Analyze this receipt image and extract the following information in JSON format:
{
  "merchantName": "string",
  "merchantCategory": "string (e.g., grocery, restaurant, pharmacy, etc.)",
  "merchantAddress": "string",
  "date": "ISO date string",
  "receiptNumber": "string",
  "cashierName": "string",
  "items": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "totalPrice": number,
      "category": "string (e.g., food, beverage, household, etc.)",
      "brand": "string (if identifiable)",
      "healthScore": number (1-10, for food items based on nutritional value)
    }
  ],
  "subtotal": number,
  "tax": number,
  "tip": number,
  "total": number,
  "currency": "string",
  "paymentMethod": "string",
  "confidence": number (0-1)
}

Important guidelines:
1. Extract ALL items with their prices, even if partially visible
2. Calculate subtotal by adding up all item prices (quantity × unit price)
3. Ensure subtotal = sum of all item totals
4. total = subtotal + tax + tip
5. Double-check all calculations for accuracy
6. Identify merchant category based on items and merchant name
7. For food items, estimate a health score (1-10) based on the item description
8. Detect the currency from symbols or text
9. Identify payment method if visible (cash, card, etc.)

CRITICAL: The subtotal MUST equal the sum of all item prices. If the receipt shows a different subtotal, trust the calculated value from items.
`;

    // If we have OCR data, include it to help the AI
    if (ocrData) {
      prompt += `\n\nOCR has already extracted this text from the receipt:\n${ocrData.rawText}\n\nUse this to help with your analysis but also look for any additional details in the image.`;
    }

    return prompt;
  }

  /**
   * Parse the AI response into structured data
   */
  private async parseAIResponse(
    aiResponse: string,
    ocrData?: ExtractedReceiptData
  ): Promise<AIEnhancedReceiptData> {
    try {
      // Try to parse JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Merge with OCR data if available, preferring AI data
      const enhancedData: AIEnhancedReceiptData = {
        merchantName: parsed.merchantName || ocrData?.merchantName || 'Unknown Merchant',
        merchantCategory: parsed.merchantCategory,
        merchantAddress: parsed.merchantAddress,
        date: parsed.date ? new Date(parsed.date) : (ocrData?.date || new Date()),
        items: this.enhanceItems(parsed.items || [], ocrData?.items || []),
        subtotal: parsed.subtotal || ocrData?.subtotal || 0,
        tax: parsed.tax || ocrData?.tax || 0,
        tip: parsed.tip || ocrData?.tip || 0,
        total: parsed.total || ocrData?.total || 0,
        currency: parsed.currency || ocrData?.currency || 'EUR',
        paymentMethod: parsed.paymentMethod || ocrData?.paymentMethod,
        receiptNumber: parsed.receiptNumber,
        cashierName: parsed.cashierName,
      };

      // Validate and fix totals if needed
      this.validateTotals(enhancedData);

      return enhancedData;
    } catch (error) {
      console.error('[AI] Failed to parse AI response:', error);
      
      // Fallback to OCR data if available
      if (ocrData) {
        return this.convertOCRToEnhanced(ocrData);
      }
      
      throw error;
    }
  }

  /**
   * Enhance items by merging AI and OCR data
   */
  private enhanceItems(aiItems: any[], ocrItems: any[]): AIReceiptItem[] {
    const enhancedItems: AIReceiptItem[] = [];
    
    // Start with AI items as they're likely more accurate
    for (const aiItem of aiItems) {
      enhancedItems.push({
        description: aiItem.description || '',
        quantity: aiItem.quantity || 1,
        unitPrice: aiItem.unitPrice || 0,
        totalPrice: aiItem.totalPrice || 0,
        category: aiItem.category,
        brand: aiItem.brand,
        healthScore: aiItem.healthScore,
      });
    }

    // Add any OCR items not found in AI items
    for (const ocrItem of ocrItems) {
      const found = enhancedItems.some(
        item => item.description.toLowerCase() === ocrItem.description?.toLowerCase()
      );
      
      if (!found) {
        enhancedItems.push({
          description: ocrItem.description || '',
          quantity: ocrItem.quantity || 1,
          unitPrice: ocrItem.unitPrice || 0,
          totalPrice: ocrItem.totalPrice || 0,
        });
      }
    }

    return enhancedItems;
  }

  /**
   * Convert OCR data to enhanced format
   */
  private convertOCRToEnhanced(ocrData: ExtractedReceiptData): AIEnhancedReceiptData {
    return {
      merchantName: ocrData.merchantName || 'Unknown Merchant',
      date: ocrData.date || new Date(),
      items: ocrData.items.map(item => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
      })),
      subtotal: ocrData.subtotal || 0,
      tax: ocrData.tax || 0,
      tip: ocrData.tip || 0,
      total: ocrData.total || 0,
      currency: ocrData.currency || 'EUR',
      paymentMethod: ocrData.paymentMethod,
    };
  }

  /**
   * Validate and fix totals
   */
  private validateTotals(data: AIEnhancedReceiptData): void {
    // First, ensure each item's total price is correct
    data.items.forEach(item => {
      const expectedTotal = item.quantity * item.unitPrice;
      if (Math.abs(item.totalPrice - expectedTotal) > 0.01) {
        item.totalPrice = Math.round(expectedTotal * 100) / 100; // Round to 2 decimals
      }
    });

    // Calculate expected subtotal from items
    const itemsTotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const roundedItemsTotal = Math.round(itemsTotal * 100) / 100;
    
    // If subtotal is missing or significantly off, use calculated value
    if (!data.subtotal || Math.abs(data.subtotal - roundedItemsTotal) > 0.50) {
      console.log('[AI] Correcting subtotal:', data.subtotal, '->', roundedItemsTotal);
      data.subtotal = roundedItemsTotal;
    }

    // Ensure tax and tip are not negative
    data.tax = Math.max(0, data.tax || 0);
    data.tip = Math.max(0, data.tip || 0);

    // Validate total
    const expectedTotal = data.subtotal + data.tax + data.tip;
    const roundedExpectedTotal = Math.round(expectedTotal * 100) / 100;
    
    if (!data.total || Math.abs(data.total - roundedExpectedTotal) > 0.50) {
      console.log('[AI] Correcting total:', data.total, '->', roundedExpectedTotal);
      data.total = roundedExpectedTotal;
    }
  }

  /**
   * Generate AI-powered suggestions based on the receipt
   */
  async generateSuggestions(data: AIEnhancedReceiptData): Promise<AIReceiptSuggestion[]> {
    const suggestions: AIReceiptSuggestion[] = [];

    try {
      // Generate category suggestions
      if (!data.merchantCategory) {
        const categoryPrompt = `Based on these items: ${data.items.map(i => i.description).join(', ')}, what category would this merchant be? Respond with just the category name.`;
        const category = await this.provider.generateText(categoryPrompt, {
          temperature: 0.3,
          maxTokens: 50,
        });
        
        suggestions.push({
          type: 'category',
          message: `Suggested category: ${category.trim()}`,
          confidence: 0.8,
          actionable: true,
        });
      }

      // Generate savings suggestions for expensive items
      const expensiveItems = data.items.filter(item => item.totalPrice > 20);
      if (expensiveItems.length > 0) {
        const savingsPrompt = `For these items: ${expensiveItems.map(i => `${i.description} (${data.currency}${i.totalPrice})`).join(', ')}, suggest one brief money-saving tip.`;
        const savingsTip = await this.provider.generateText(savingsPrompt, {
          temperature: 0.7,
          maxTokens: 100,
        });
        
        suggestions.push({
          type: 'savings',
          message: savingsTip.trim(),
          confidence: 0.7,
          actionable: true,
        });
      }

      // Health insights for food items
      const foodItems = data.items.filter(item => item.healthScore !== undefined);
      if (foodItems.length > 0) {
        const unhealthyItems = foodItems.filter(item => item.healthScore! < 5);
        if (unhealthyItems.length > 0) {
          suggestions.push({
            type: 'insight',
            message: `Consider healthier alternatives for: ${unhealthyItems.map(i => i.description).join(', ')}`,
            confidence: 0.8,
            actionable: false,
          });
        }
      }

      // Spending pattern insight
      if (data.total > 100) {
        suggestions.push({
          type: 'insight',
          message: `This is a large purchase. Consider tracking spending in the ${data.merchantCategory || 'shopping'} category.`,
          confidence: 0.9,
          actionable: true,
        });
      }

    } catch (error) {
      console.error('[AI] Failed to generate suggestions:', error);
    }

    return suggestions;
  }

  /**
   * Categorize items using AI
   */
  async categorizeItems(items: string[]): Promise<Record<string, string>> {
    try {
      const prompt = `Categorize these items into standard expense categories. Return a JSON object with item names as keys and categories as values. Categories should be: Food & Dining, Groceries, Transportation, Healthcare, Entertainment, Shopping, Utilities, or Other.\n\nItems: ${items.join(', ')}`;
      
      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 500,
        format: 'json',
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('[AI] Failed to categorize items:', error);
      return {};
    }
  }

  /**
   * Get merchant insights
   */
  async getMerchantInsights(merchantName: string): Promise<string> {
    try {
      const prompt = `Provide a brief insight about "${merchantName}" including typical spending amounts and money-saving tips. Keep it under 50 words.`;
      
      return await this.provider.generateText(prompt, {
        temperature: 0.5,
        maxTokens: 100,
      });
    } catch (error) {
      console.error('[AI] Failed to get merchant insights:', error);
      return '';
    }
  }
}

// Export factory function
export function createReceiptAIModule(provider: AIProvider): ReceiptAIModule {
  return new ReceiptAIModule(provider);
} 