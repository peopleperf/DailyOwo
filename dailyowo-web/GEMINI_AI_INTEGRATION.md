# 🤖 GEMINI AI INTEGRATION GUIDE FOR DAILYOWO (NEXT.JS)
====================================================

## Overview
This guide details the integration of Google's Gemini AI into the DailyOwo Next.js PWA application using Firebase Cloud Functions for secure API management.

## Why Firebase Cloud Functions?

1. **Secure API Key Management**: Keys never exposed to client
2. **Rate Limiting**: Server-side control per user
3. **Cost Control**: Monitor and limit usage
4. **Edge Functions**: Deploy close to users globally
5. **Firebase Integration**: Seamless with Auth and Firestore

## Architecture Overview

```
Client (Next.js) → Firebase Cloud Function → Gemini AI API
                ↓
            Firestore (cache/logs)
```

## Setup Steps

### 1. Firebase Functions Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize functions in your project
firebase init functions

# Choose TypeScript and install dependencies
cd functions
npm install @google/generative-ai
```

### 2. Create AI Service Cloud Function

```typescript
// functions/src/ai-service.ts
import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as admin from 'firebase-admin';

admin.initializeApp();

const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key);

export const categorizeTransaction = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { description, amount } = data;
  
  // Rate limiting check
  const userId = context.auth.uid;
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  const userData = userDoc.data();
  
  if (userData?.aiRequestsToday >= 100) {
    throw new functions.https.HttpsError('resource-exhausted', 'Daily AI limit reached');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = `
      Categorize this financial transaction into one of these categories:
      Food & Dining, Transportation, Shopping, Entertainment, Bills & Utilities,
      Healthcare, Education, Income, Savings, Investment, Transfer, Other
      
      Transaction: ${description}
      Amount: ${amount}
      
      Respond with only the category name.
    `;

    const result = await model.generateContent(prompt);
    const category = result.response.text().trim();

    // Update user's request count
    await admin.firestore().collection('users').doc(userId).update({
      aiRequestsToday: admin.firestore.FieldValue.increment(1),
      lastAiRequest: admin.firestore.FieldValue.serverTimestamp()
    });

    // Cache result
    await admin.firestore().collection('ai_cache').add({
      userId,
      description,
      category,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { category };
  } catch (error) {
    console.error('AI categorization error:', error);
    throw new functions.https.HttpsError('internal', 'Failed to categorize transaction');
  }
});

export const generateInsights = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { transactions, period } = data;
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
    Analyze these financial transactions and provide 3 actionable insights:
    
    Period: ${period}
    Transactions: ${JSON.stringify(transactions)}
    
    Format your response as:
    1. [Insight about spending patterns]
    2. [Suggestion for improvement]
    3. [Encouragement or positive observation]
    
    Keep each insight under 50 words and practical.
  `;

  const result = await model.generateContent(prompt);
  const insights = result.response.text();

  return { insights: insights.split('\n').filter(line => line.trim()) };
});
```

### 3. Environment Configuration

```bash
# Set Gemini API key in Firebase config
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# Deploy functions
firebase deploy --only functions
```

### 4. Next.js Client Integration

```typescript
// src/services/ai.service.ts
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

const functions = getFunctions(app);

export class AIService {
  private static instance: AIService;
  private categorizeTransactionFn = httpsCallable(functions, 'categorizeTransaction');
  private generateInsightsFn = httpsCallable(functions, 'generateInsights');

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async categorizeTransaction(description: string, amount: number): Promise<string> {
    try {
      const result = await this.categorizeTransactionFn({ description, amount });
      return result.data.category;
    } catch (error) {
      console.error('Categorization failed:', error);
      return 'Other'; // Fallback category
    }
  }

  async generateInsights(transactions: any[], period: string): Promise<string[]> {
    try {
      const result = await this.generateInsightsFn({ transactions, period });
      return result.data.insights;
    } catch (error) {
      console.error('Insights generation failed:', error);
      return ['Unable to generate insights at this time.'];
    }
  }
}
```

### 5. React Hook for AI Features

```typescript
// src/hooks/useAI.ts
import { useMutation, useQuery } from '@tanstack/react-query';
import { AIService } from '@/services/ai.service';

const aiService = AIService.getInstance();

export function useAICategorization() {
  return useMutation({
    mutationFn: ({ description, amount }: { description: string; amount: number }) =>
      aiService.categorizeTransaction(description, amount),
    mutationKey: ['ai', 'categorize']
  });
}

export function useAIInsights(transactions: any[], period: string) {
  return useQuery({
    queryKey: ['ai', 'insights', period],
    queryFn: () => aiService.generateInsights(transactions, period),
    enabled: transactions.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}
```

### 6. Component Integration

```tsx
// src/components/TransactionForm.tsx
import { useAICategorization } from '@/hooks/useAI';

export function TransactionForm() {
  const { mutate: categorize, isLoading } = useAICategorization();
  const [category, setCategory] = useState('');

  const handleDescriptionBlur = async (description: string, amount: number) => {
    if (description.length > 3) {
      categorize(
        { description, amount },
        {
          onSuccess: (result) => {
            setCategory(result);
            // Show subtle animation
          }
        }
      );
    }
  };

  return (
    <form className="space-y-4">
      <input 
        type="text"
        placeholder="Description"
        onBlur={(e) => handleDescriptionBlur(e.target.value, amount)}
        className="glass-input"
      />
      
      {isLoading && (
        <div className="text-sm text-gold-500 animate-pulse">
          ✨ Categorizing...
        </div>
      )}
      
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {/* Category options */}
      </select>
    </form>
  );
}
```

## Best Practices

### 1. Caching Strategy

```typescript
// Use React Query for client-side caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// Firestore caching for repeated queries
const getCachedCategory = async (description: string) => {
  const cache = await firestore
    .collection('ai_cache')
    .where('description', '==', description)
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();
    
  if (!cache.empty) {
    return cache.docs[0].data().category;
  }
  return null;
};
```

### 2. Rate Limiting

```typescript
// Reset daily limits with scheduled function
export const resetDailyLimits = functions.pubsub
  .schedule('every day 00:00')
  .timeZone('UTC')
  .onRun(async () => {
    const batch = admin.firestore().batch();
    const users = await admin.firestore().collection('users').get();
    
    users.forEach(doc => {
      batch.update(doc.ref, { aiRequestsToday: 0 });
    });
    
    await batch.commit();
  });
```

### 3. Error Handling

```typescript
// Graceful degradation
export function useSmartCategorization() {
  const { mutate: aiCategorize } = useAICategorization();
  
  const categorize = async (description: string, amount: number) => {
    try {
      // Try AI first
      return await aiCategorize({ description, amount });
    } catch (error) {
      // Fallback to rule-based categorization
      return fallbackCategorization(description);
    }
  };
  
  return { categorize };
}
```

### 4. Security Considerations

```typescript
// Validate and sanitize inputs
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS
    .substring(0, 200); // Limit length
};

// Add request validation in Cloud Function
if (!description || typeof description !== 'string' || description.length > 200) {
  throw new functions.https.HttpsError('invalid-argument', 'Invalid description');
}
```

## Cost Optimization

1. **Model Selection**:
   - `gemini-2.0-flash`: Best for categorization (fastest, cheapest)
   - `gemini-2.0-pro`: For complex analysis only

2. **Prompt Optimization**:
   - Keep prompts concise
   - Use system instructions effectively
   - Batch similar requests when possible

3. **Caching**:
   - Cache common categorizations
   - Store insights for time periods
   - Use client-side caching aggressively

## Monitoring & Analytics

```typescript
// Track AI usage
export const trackAIUsage = async (
  userId: string,
  feature: string,
  success: boolean
) => {
  await analytics.logEvent('ai_usage', {
    user_id: userId,
    feature,
    success,
    timestamp: new Date().toISOString()
  });
};

// Monitor costs
export const getAIUsageStats = functions.https.onCall(async (data, context) => {
  // Admin only
  if (!context.auth?.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }
  
  const stats = await admin.firestore()
    .collection('ai_usage')
    .where('timestamp', '>=', data.startDate)
    .get();
    
  return {
    totalRequests: stats.size,
    uniqueUsers: new Set(stats.docs.map(d => d.data().userId)).size,
    costEstimate: stats.size * 0.001 // Adjust based on actual pricing
  };
});
```

## Testing

```typescript
// Mock AI service for tests
export class MockAIService implements IAIService {
  async categorizeTransaction(description: string): Promise<string> {
    const mapping: Record<string, string> = {
      'coffee': 'Food & Dining',
      'uber': 'Transportation',
      'salary': 'Income'
    };
    
    const key = Object.keys(mapping).find(k => 
      description.toLowerCase().includes(k)
    );
    
    return mapping[key] || 'Other';
  }
}
```

## UI/UX Integration

- Never show "AI" or "Gemini" to users
- Use terms like "Smart categorization" or "Intelligent insights"
- Show subtle animations (sparkle ✨) when AI is working
- Provide immediate feedback with loading states
- Allow manual override of AI suggestions

## Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Gemini API Documentation](https://ai.google.dev/api/rest)
- [Next.js Firebase Integration](https://firebase.google.com/docs/web/setup)
- [React Query Documentation](https://tanstack.com/query/latest) 