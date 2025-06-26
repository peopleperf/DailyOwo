import { createWorker, Worker } from 'tesseract.js';
import { 
  ExtractedReceiptData, 
  ReceiptLineItem, 
  ReceiptScanResult, 
  ReceiptImage,
  ProcessedReceipt 
} from '@/types/receipt';
import { RECEIPT_CONFIG, RECEIPT_PATTERNS } from '@/lib/constants/receipt-notification-config';
import { getFirebaseDb } from '@/lib/firebase/config';
import { collection, doc, setDoc, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export class ReceiptScannerService {
  private worker: Worker | null = null;
  private isInitialized = false;
  private useMockOCR = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_OCR === 'true';
  private useAIFirst = process.env.NEXT_PUBLIC_AI_RECEIPT_ENABLED === 'true' && process.env.NEXT_PUBLIC_AI_FIRST_SCANNING !== 'false';

  async initialize(): Promise<void> {
    if (this.isInitialized && this.worker) {
      console.log('[OCR] Already initialized, skipping');
      return;
    }

    try {
      console.log('[OCR] Initializing Tesseract worker...');
      this.worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          // Only log important messages
          if (m.status === 'initialized' || m.status === 'error') {
            console.log('[OCR]', m);
          }
        }
      });
      
      this.isInitialized = true;
      console.log('[OCR] Tesseract initialized successfully');
    } catch (error) {
      console.error('[OCR] Failed to initialize Tesseract:', error);
      this.isInitialized = false;
      this.worker = null;
      throw error;
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
    }
  }

  /**
   * Process image before OCR for better results
   * Note: Simplified for client-side compatibility
   */
  async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    // For now, just return the original buffer
    // Image preprocessing can be done using Canvas API if needed
    return imageBuffer;
  }

  /**
   * Extract text from image using OCR
   */
  async extractText(imageBuffer: Buffer): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    const { data: { text } } = await this.worker.recognize(imageBuffer);
    
    return text;
  }

  /**
   * Parse extracted text to structured receipt data
   */
  parseReceiptText(text: string): ExtractedReceiptData {
    const lines = text.split('\n').filter(line => line.trim());
    
    // Extract basic fields
    const merchantName = this.extractMerchantName(lines);
    const date = this.extractDate(text);
    const total = this.extractTotal(text);
    const tax = this.extractTax(text);
    const tip = this.extractTip(text);
    const subtotal = this.extractSubtotal(text) || (total - tax - tip);
    const items = this.extractLineItems(lines);
    const paymentMethod = this.extractPaymentMethod(text);
    
    // Calculate confidence scores
    const confidence = {
      overall: 0,
      merchantName: merchantName ? 0.8 : 0.3,
      date: date ? 0.9 : 0.2,
      total: total > 0 ? 0.9 : 0.1,
      items: items.length > 0 ? 0.7 : 0.3
    };
    
    confidence.overall = (
      confidence.merchantName + 
      confidence.date + 
      confidence.total + 
      confidence.items
    ) / 4;

    return {
      merchantName: merchantName || 'Unknown Merchant',
      date: date || new Date(),
      items,
      subtotal,
      tax,
      tip,
      total,
      paymentMethod,
      currency: this.extractCurrency(text),
      rawText: text,
      confidence
    };
  }

  /**
   * Extract merchant name from receipt
   */
  private extractMerchantName(lines: string[]): string {
    // Usually the merchant name is in the first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      // Skip empty lines and common receipt headers
      if (line && !line.match(/receipt|invoice|bill/i) && line.length > 3) {
        return line;
      }
    }
    return '';
  }

  /**
   * Extract date from receipt text
   */
  private extractDate(text: string): Date | null {
    for (const pattern of RECEIPT_PATTERNS.DATE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        try {
          return new Date(match[0]);
        } catch (e) {
          continue;
        }
      }
    }
    
    // Try keyword-based extraction
    const dateMatch = text.match(RECEIPT_PATTERNS.KEYWORDS.DATE);
    if (dateMatch && dateMatch[1]) {
      try {
        return new Date(dateMatch[1]);
      } catch (e) {
        return null;
      }
    }
    
    return null;
  }

  /**
   * Extract monetary amounts
   */
  private extractAmount(text: string, pattern: RegExp): number {
    const match = text.match(pattern);
    if (match && match[1]) {
      const amountStr = match[1].replace(/[,$]/g, '');
      const amount = parseFloat(amountStr);
      return isNaN(amount) ? 0 : amount;
    }
    return 0;
  }

  private extractTotal(text: string): number {
    return this.extractAmount(text, RECEIPT_PATTERNS.KEYWORDS.TOTAL) || 
           this.extractAmount(text, /total[\s:]*(\d+\.?\d*)/i);
  }

  private extractTax(text: string): number {
    return this.extractAmount(text, RECEIPT_PATTERNS.KEYWORDS.TAX);
  }

  private extractSubtotal(text: string): number {
    return this.extractAmount(text, RECEIPT_PATTERNS.KEYWORDS.SUBTOTAL);
  }

  private extractTip(text: string): number {
    return this.extractAmount(text, RECEIPT_PATTERNS.KEYWORDS.TIP);
  }

  /**
   * Extract line items from receipt
   */
  private extractLineItems(lines: string[]): ReceiptLineItem[] {
    const items: ReceiptLineItem[] = [];
    const itemPattern = /(.+?)\s+(\d+)\s*[@x]\s*(\d+\.?\d*)\s+(\d+\.?\d*)/i;
    const simpleItemPattern = /(.+?)\s+(\d+\.?\d*)$/;

    lines.forEach((line, index) => {
      // Try detailed pattern first (with quantity and unit price)
      let match = line.match(itemPattern);
      if (match) {
        items.push({
          id: `item-${index}`,
          description: match[1].trim(),
          quantity: parseInt(match[2]),
          unitPrice: parseFloat(match[3]),
          totalPrice: parseFloat(match[4]),
          confidence: 0.8
        });
        return;
      }

      // Try simple pattern (description and price only)
      match = line.match(simpleItemPattern);
      if (match && !match[1].match(/total|tax|subtotal|tip|change|cash|card/i)) {
        const price = parseFloat(match[2]);
        if (price > 0 && price < 10000) { // Reasonable price range
          items.push({
            id: `item-${index}`,
            description: match[1].trim(),
            quantity: 1,
            unitPrice: price,
            totalPrice: price,
            confidence: 0.6
          });
        }
      }
    });

    return items;
  }

  /**
   * Extract payment method
   */
  private extractPaymentMethod(text: string): string | undefined {
    const match = text.match(RECEIPT_PATTERNS.KEYWORDS.PAYMENT);
    if (match && match[1]) {
      return match[1].trim();
    }
    
    // Look for card endings
    const cardMatch = text.match(/\*{3,}(\d{4})/);
    if (cardMatch) {
      return `Card ending in ${cardMatch[1]}`;
    }
    
    if (text.toLowerCase().includes('cash')) {
      return 'Cash';
    }
    
    return undefined;
  }

  /**
   * Extract currency from text
   */
  private extractCurrency(text: string): string {
    if (text.includes('$')) return 'USD';
    if (text.includes('€')) return 'EUR';
    if (text.includes('£')) return 'GBP';
    if (text.includes('₦')) return 'NGN';
    if (text.includes('¥')) return 'JPY';
    
    // Check for currency codes
    const currencyMatch = text.match(/\b(USD|EUR|GBP|NGN|JPY|CAD|AUD)\b/);
    if (currencyMatch) {
      return currencyMatch[1];
    }
    
    return 'USD'; // Default
  }

  /**
   * Main scanning function
   */
  async scanReceipt(
    imageBuffer: Buffer,
    userId: string,
    mimeType: string
  ): Promise<ReceiptScanResult> {
    const startTime = Date.now();
    
    try {
      // Validate image
      if (imageBuffer.length > RECEIPT_CONFIG.maxImageSize) {
        throw new Error('Image size exceeds maximum allowed size');
      }

      // TEMPORARY: Force demo mode until CORS is configured
      // TODO: Remove this after CORS is set up
      const forceDemo = false;
      
      if (forceDemo) {
        console.log('[OCR] Using demo mode (CORS not configured yet)');
        const mockData = this.generateMockReceiptData();
        
        return {
          success: true,
          data: mockData,
          processingTime: Date.now() - startTime,
          warnings: ['This is demo data. Configure Firebase Storage CORS for real receipt scanning.']
        };
      }

      // Try AI-first approach if enabled
      if (this.useAIFirst) {
        try {
          console.log('[AI] Using AI-first receipt scanning via API...');
          
          // Convert buffer to base64 for AI analysis
          const imageBase64 = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
          
          // Call the API endpoint
          const response = await fetch('/api/ai/analyze-receipt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageBase64,
              ocrData: null // No OCR data for AI-first approach
            })
          });

          if (!response.ok) {
            const error = await response.json();
            console.error('[AI] API error:', error);
            throw new Error(error.error || 'AI analysis failed');
          }

          const { analysis: aiAnalysis } = await response.json();
          
          if (aiAnalysis && aiAnalysis.enhancedData && aiAnalysis.confidence > 0.6) {
            console.log('[AI] AI analysis successful with confidence:', aiAnalysis.confidence);
            
            // Convert AI data to ExtractedReceiptData format
            const extractedData: ExtractedReceiptData = {
              merchantName: aiAnalysis.enhancedData.merchantName,
              merchantCategory: aiAnalysis.enhancedData.merchantCategory,
              merchantAddress: aiAnalysis.enhancedData.merchantAddress,
              date: new Date(aiAnalysis.enhancedData.date),
              items: aiAnalysis.enhancedData.items.map((item: any, idx: number) => ({
                id: `item-${idx}`,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                confidence: 0.9,
                category: item.category,
                brand: item.brand,
                healthScore: item.healthScore
              })),
              subtotal: aiAnalysis.enhancedData.subtotal,
              tax: aiAnalysis.enhancedData.tax,
              tip: aiAnalysis.enhancedData.tip,
              total: aiAnalysis.enhancedData.total,
              currency: aiAnalysis.enhancedData.currency,
              paymentMethod: aiAnalysis.enhancedData.paymentMethod,
              receiptNumber: aiAnalysis.enhancedData.receiptNumber,
              cashierName: aiAnalysis.enhancedData.cashierName,
              rawText: '', // AI doesn't provide raw text
              confidence: {
                overall: aiAnalysis.confidence,
                merchantName: 0.9,
                date: 0.9,
                total: 0.95,
                items: 0.9
              }
            };
            
            // Store the receipt
            const receipt = await this.storeReceipt(
              imageBuffer,
              mimeType,
              extractedData,
              userId
            );
            
            const warnings = this.generateWarnings(extractedData);
            if (aiAnalysis.suggestions && aiAnalysis.suggestions.length > 0) {
              warnings.push(`AI Insights: ${aiAnalysis.suggestions.map((s: any) => s.message).join('; ')}`);
            }
            
            return {
              success: true,
              data: extractedData,
              processingTime: Date.now() - startTime,
              warnings
            };
          }
        } catch (aiError) {
          console.error('[AI] AI-first scanning failed, falling back to OCR:', aiError);
          // Continue to OCR fallback
        }
      }

      // Fallback to OCR approach
      console.log('[OCR] Using traditional OCR approach...');
      try {
        // Extract text
        console.log('[OCR] Starting text extraction...');
        const text = await this.extractText(imageBuffer);
        
        console.log('[OCR] Extracted text:', text?.substring(0, 200) + '...'); // Log first 200 chars
        
        if (!text || text.trim().length < 10) {
          throw new Error('No text could be extracted from the image');
        }

        // Parse receipt data
        const extractedData = this.parseReceiptText(text);
        console.log('[OCR] Parsed data:', extractedData);
        
        // Store the receipt image and data
        const receipt = await this.storeReceipt(
          imageBuffer,
          mimeType,
          extractedData,
          userId
        );

        const warnings = this.generateWarnings(extractedData);

        return {
          success: true,
          data: extractedData,
          processingTime: Date.now() - startTime,
          warnings
        };
      } catch (ocrError) {
        console.error('OCR scanning failed:', ocrError);
        
        return {
          success: false,
          error: ocrError instanceof Error ? ocrError.message : 'Unknown error occurred',
          processingTime: Date.now() - startTime
        };
      }
    } catch (error) {
      console.error('Receipt scanning failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Store receipt image and data in Firebase
   */
  private async storeReceipt(
    imageBuffer: Buffer,
    mimeType: string,
    extractedData: ExtractedReceiptData,
    userId: string
  ): Promise<ProcessedReceipt> {
    const db = await getFirebaseDb();
    const storage = getStorage();
    
    if (!db) throw new Error('Database not initialized');

    // Upload image to Firebase Storage
    const imageId = `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const storageRef = ref(storage, `receipts/${userId}/${imageId}`);
    
    const uploadResult = await uploadBytes(storageRef, imageBuffer, {
      contentType: mimeType
    });
    
    const imageUrl = await getDownloadURL(uploadResult.ref);

    // For image dimensions, we'll use placeholder values for now
    // In a real implementation, you could use the Canvas API to get dimensions
    const receiptImage: ReceiptImage = {
      id: imageId,
      url: imageUrl,
      mimeType,
      size: imageBuffer.length,
      width: 0, // Placeholder
      height: 0 // Placeholder
    };

    // Clean extracted data to remove undefined values
    const cleanExtractedData: ExtractedReceiptData = {
      merchantName: extractedData.merchantName || '',
      total: extractedData.total || 0,
      subtotal: extractedData.subtotal || 0,
      tax: extractedData.tax || 0,
      tip: extractedData.tip || 0, // Use extracted tip value or default to 0
      currency: extractedData.currency || 'EUR',
      date: extractedData.date || new Date(),
      items: extractedData.items || [],
      rawText: extractedData.rawText || '',
      paymentMethod: extractedData.paymentMethod || undefined, // Keep undefined if not present
      confidence: extractedData.confidence
    };

    // Store in Firestore
    const receipt: ProcessedReceipt = {
      id: `receipt-${Date.now()}`,
      userId,
      image: receiptImage,
      extractedData: cleanExtractedData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: cleanExtractedData.confidence.overall > 0.7 ? 'completed' : 'partial'
    };
    
    const receiptRef = doc(db, 'users', userId, 'receipts', receipt.id);
    
    // Create document data, removing undefined values
    const docData: any = {
      ...receipt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Remove undefined values from nested objects
    if (docData.extractedData && docData.extractedData.paymentMethod === undefined) {
      delete docData.extractedData.paymentMethod;
    }
    
    await setDoc(receiptRef, docData);

    return receipt;
  }

  /**
   * Generate warnings for low confidence fields
   */
  private generateWarnings(data: ExtractedReceiptData): string[] {
    const warnings: string[] = [];
    
    if (data.confidence.merchantName < 0.6) {
      warnings.push('Merchant name may be incorrect');
    }
    if (data.confidence.date < 0.6) {
      warnings.push('Date may be incorrect');
    }
    if (data.confidence.total < 0.6) {
      warnings.push('Total amount may be incorrect');
    }
    if (data.items.length === 0) {
      warnings.push('No line items could be extracted');
    }
    
    return warnings;
  }

  /**
   * Generate mock receipt data for testing
   */
  private generateMockReceiptData(): ExtractedReceiptData {
    const items: ReceiptLineItem[] = [
      {
        id: 'item-1',
        description: 'Bread',
        quantity: 1,
        unitPrice: 1.19,
        totalPrice: 1.19,
        confidence: 0.9
      },
      {
        id: 'item-2',
        description: 'Ham',
        quantity: 1,
        unitPrice: 2.72,
        totalPrice: 2.72,
        confidence: 0.85
      },
      {
        id: 'item-3',
        description: 'Lettuce',
        quantity: 1,
        unitPrice: 1.14,
        totalPrice: 1.14,
        confidence: 0.88
      },
      {
        id: 'item-4',
        description: 'Potatoes 3kg',
        quantity: 1,
        unitPrice: 3.48,
        totalPrice: 3.48,
        confidence: 0.92
      },
      {
        id: 'item-5',
        description: 'Olive Oil',
        quantity: 1,
        unitPrice: 6.25,
        totalPrice: 6.25,
        confidence: 0.87
      },
      {
        id: 'item-6',
        description: 'Milk Semidesnat',
        quantity: 1,
        unitPrice: 1.05,
        totalPrice: 1.05,
        confidence: 0.91
      },
      {
        id: 'item-7',
        description: 'Natural Yogurt',
        quantity: 2,
        unitPrice: 1.60,
        totalPrice: 1.60,
        confidence: 0.86
      },
      {
        id: 'item-8',
        description: 'Champignon Laminas',
        quantity: 1,
        unitPrice: 1.45,
        totalPrice: 1.45,
        confidence: 0.84
      }
    ];

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.1; // 10% tax
    const tip = 0; // Add tip field
    const total = subtotal + tax + tip;

    return {
      merchantName: 'MERCADONA',
      date: new Date(),
      items,
      subtotal,
      tax,
      tip, // Include tip field
      total,
      paymentMethod: 'Cash',
      currency: 'EUR',
      rawText: 'MERCADONA\nAVDA. DE LA FUENTE, S/N\nDOS HERMANAS (SEVILLA)\n\nTICKET SIMPLIFICADO\n...',
      confidence: {
        overall: 0.85,
        merchantName: 0.95,
        date: 0.9,
        total: 0.95,
        items: 0.87
      }
    };
  }
}

// Singleton instance
export const receiptScanner = new ReceiptScannerService();