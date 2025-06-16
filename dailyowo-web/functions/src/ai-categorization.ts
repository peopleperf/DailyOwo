import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

const genAI = new GoogleGenerativeAI(functions.config().gemini?.api_key || process.env.GEMINI_API_KEY || '');

interface TransactionCategorizationRequest {
  description: string;
  amount: number;
  merchantName?: string;
  location?: string;
}

interface TransactionCategorizationResponse {
  category: string;
  confidence: number;
  explanation?: string;
  subcategory?: string;
}

export const categorizeTransaction = functions.https.onCall(
  async (data: any, context: any) => {
    // Verify authentication
    if (!context?.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated', 
        'User must be authenticated'
      );
    }

    // Validate and extract data
    const description = data?.description;
    const amount = data?.amount;
    const merchantName = data?.merchantName;
    const location = data?.location;
    const userId = context.auth.uid;

    // Validate input
    if (!description || typeof description !== 'string' || description.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'Description is required'
      );
    }

    if (!amount || typeof amount !== 'number') {
      throw new functions.https.HttpsError(
        'invalid-argument', 
        'Amount is required'
      );
    }

    try {
      // Check rate limiting
      const userDoc = await admin.firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (userData?.aiRequestsToday >= 100) {
        throw new functions.https.HttpsError(
          'resource-exhausted', 
          'Daily AI categorization limit reached (100 requests)'
        );
      }

      // Check cache first
      const cacheKey = `${description.toLowerCase().trim()}_${Math.round(amount)}`;
      const cacheRef = admin.firestore()
        .collection('ai_cache')
        .doc(`categorization_${Buffer.from(cacheKey).toString('base64')}`);
      
      const cachedResult = await cacheRef.get();
      if (cachedResult.exists) {
        const cached = cachedResult.data() as TransactionCategorizationResponse;
        console.log('Returning cached categorization:', cached);
        return cached;
      }

      // Use Gemini AI for categorization
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const prompt = `
        Categorize this financial transaction into one of these specific categories:
        
        CATEGORIES:
        - Food & Dining (restaurants, groceries, coffee, delivery)
        - Transportation (gas, public transit, rideshare, parking)
        - Shopping (retail, online purchases, clothing, electronics)
        - Entertainment (movies, games, streaming, events)
        - Bills & Utilities (electricity, water, internet, phone)
        - Healthcare (doctor, pharmacy, insurance, medical)
        - Education (tuition, books, courses, training)
        - Income (salary, freelance, investment returns)
        - Savings (transfers to savings accounts)
        - Investment (stocks, crypto, retirement contributions)
        - Transfer (between accounts, to family/friends)
        - Travel (hotels, flights, vacation expenses)
        - Home & Garden (rent, mortgage, home improvement)
        - Personal Care (haircuts, spa, cosmetics)
        - Other (miscellaneous expenses)
        
        Transaction Details:
        - Description: "${description}"
        - Amount: $${amount}${merchantName ? `\n- Merchant: ${merchantName}` : ''}${location ? `\n- Location: ${location}` : ''}
        
        Please respond with ONLY a JSON object in this exact format:
        {
          "category": "exact category name from list above",
          "confidence": 0.95,
          "explanation": "brief reason for categorization",
          "subcategory": "specific subcategory if applicable"
        }
        
        Rules:
        - Use exact category names from the list
        - Confidence should be 0.0 to 1.0
        - Keep explanation under 30 words
        - Only include subcategory if it adds meaningful detail
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text().trim();
      
      // Parse JSON response
      let categorization: TransactionCategorizationResponse;
      try {
        categorization = JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse AI response:', response);
        // Fallback categorization
        categorization = {
          category: 'Other',
          confidence: 0.5,
          explanation: 'AI categorization failed, manual review needed'
        };
      }

      // Validate categorization
      const validCategories = [
        'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
        'Bills & Utilities', 'Healthcare', 'Education', 'Income',
        'Savings', 'Investment', 'Transfer', 'Travel', 'Home & Garden',
        'Personal Care', 'Other'
      ];

      if (!validCategories.includes(categorization.category)) {
        categorization.category = 'Other';
        categorization.confidence = 0.3;
        categorization.explanation = 'Category not recognized, defaulted to Other';
      }

      // Cache the result
      await cacheRef.set({
        ...categorization,
        cachedAt: admin.firestore.FieldValue.serverTimestamp(),
        originalPrompt: { description, amount, merchantName, location }
      });

      // Update user's request count
      await admin.firestore().collection('users').doc(userId).set({
        aiRequestsToday: admin.firestore.FieldValue.increment(1),
        lastAiRequest: admin.firestore.FieldValue.serverTimestamp(),
        totalAiRequests: admin.firestore.FieldValue.increment(1)
      }, { merge: true });

      // Log usage for analytics
      await admin.firestore().collection('ai_usage_logs').add({
        userId,
        feature: 'categorization',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        success: true,
        confidence: categorization.confidence,
        category: categorization.category
      });

      console.log('Transaction categorized:', categorization);
      return categorization;

    } catch (error) {
      console.error('AI categorization error:', error);
      
      // Log error for monitoring
      await admin.firestore().collection('ai_usage_logs').add({
        userId,
        feature: 'categorization',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });

      // Return fallback categorization instead of throwing
      return {
        category: 'Other',
        confidence: 0.1,
        explanation: 'Automatic categorization unavailable, please categorize manually'
      } as TransactionCategorizationResponse;
    }
  }
);

// Function to reset daily AI limits (runs at midnight UTC)
// TODO: Fix scheduled functions - pubsub.schedule not available in current Firebase Functions setup
/*
export const resetDailyAILimits = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const batch = admin.firestore().batch();
    const usersSnapshot = await admin.firestore().collection('users').get();
    
    usersSnapshot.forEach(doc => {
      batch.update(doc.ref, { aiRequestsToday: 0 });
    });
    
    await batch.commit();
    console.log('Daily AI limits reset for all users');
  });

// Function to clean up old AI cache (runs weekly)
export const cleanupAICache = functions.pubsub
  .schedule('0 2 * * 0')
  .timeZone('UTC')
  .onRun(async () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oldCacheQuery = admin.firestore()
      .collection('ai_cache')
      .where('cachedAt', '<', oneWeekAgo);
    
    const oldCacheSnapshot = await oldCacheQuery.get();
    const batch = admin.firestore().batch();
    
    oldCacheSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleaned up ${oldCacheSnapshot.size} old cache entries`);
  });
*/ 