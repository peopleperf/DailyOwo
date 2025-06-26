# DailyOwo AI Integration Guide

## Overview

DailyOwo now includes a modular AI system that enhances various features with intelligent analysis and insights. The system is designed to be extensible and supports multiple AI providers.

## Architecture

```
lib/ai/
├── ai-service-manager.ts    # Central AI coordinator
├── types/                   # TypeScript interfaces
│   └── index.ts
├── providers/               # AI provider implementations
│   ├── gemini.ts           # Google Gemini (implemented)
│   └── openai.ts           # OpenAI (placeholder)
└── modules/                 # Feature-specific AI modules
    ├── receipt-ai.ts       # Receipt scanning enhancement
    ├── financial-insights.ts # Spending analysis
    ├── budget-ai.ts        # Budget optimization
    └── chat-assistant.ts   # Conversational AI
```

## Quick Start

### 1. Get a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the generated key

### 2. Configure Environment

Create a `.env.local` file in the `dailyowo-web` directory:

```bash
# Copy from env.example
cp env.example .env.local
```

Add your Gemini API key:

```env
GEMINI_API_KEY=your_api_key_here
```

### 3. Enable AI Features

The following flags control AI features:

```env
NEXT_PUBLIC_AI_RECEIPT_ENABLED=true    # AI-enhanced receipt scanning
NEXT_PUBLIC_AI_INSIGHTS_ENABLED=true   # Financial insights
NEXT_PUBLIC_AI_BUDGET_ENABLED=false    # Budget recommendations (coming soon)
NEXT_PUBLIC_AI_CHAT_ENABLED=false      # Chat assistant (coming soon)
```

## Current Features

### 1. AI-Enhanced Receipt Scanning

When enabled, the receipt scanner will:
- Extract more detailed information from receipts
- Categorize items automatically
- Detect merchant categories
- Provide health scores for food items
- Generate money-saving suggestions
- Improve accuracy of OCR results

**How it works:**
1. User uploads a receipt image
2. OCR extracts basic text
3. AI analyzes the image and OCR results
4. Enhanced data is presented for review
5. AI suggestions are displayed

### 2. Financial Insights (Preview)

The financial insights module can:
- Analyze spending patterns
- Detect anomalies
- Provide savings recommendations
- Track spending trends

## API Usage

### Initialize AI Service

```typescript
import { AIServiceManager } from '@/lib/ai/ai-service-manager';

const aiManager = AIServiceManager.getInstance({
  defaultProvider: 'gemini',
  providers: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-1.5-flash'
    }
  },
  modules: {
    receipt: true,
    insights: true,
    budget: false,
    chat: false
  }
});

await aiManager.initialize();
```

### Use Receipt AI Module

```typescript
const receiptAI = aiManager.getModule<ReceiptAIModule>('receipt');

const analysis = await receiptAI.analyzeReceipt(
  imageBase64,
  ocrData // optional
);

console.log(analysis.enhancedData);
console.log(analysis.suggestions);
```

### Generate Financial Insights

```typescript
const insightsAI = aiManager.getModule<FinancialInsightsModule>('insights');

const insights = await insightsAI.analyzeSpending(
  transactions,
  userId
);
```

## Adding New AI Modules

1. Create a new module in `lib/ai/modules/`:

```typescript
export class CustomAIModule implements AIModule {
  id = 'custom';
  name = 'Custom AI Module';
  description = 'Description of your module';
  version = '1.0.0';
  
  constructor(public provider: AIProvider) {}
  
  async initialize(): Promise<void> {
    // Initialization logic
  }
  
  // Add your custom methods
}
```

2. Register in the AI Service Manager
3. Add configuration flags
4. Implement UI components

## Cost Considerations

- **Gemini API**: Free tier includes 15 requests/minute
- **Receipt Scanning**: ~1-2 API calls per receipt
- **Financial Insights**: ~1 API call per analysis

## Security Best Practices

1. **Never expose API keys in client-side code**
2. **Use environment variables for sensitive data**
3. **Implement rate limiting for API calls**
4. **Sanitize user data before sending to AI**
5. **Store AI responses securely**

## Troubleshooting

### AI not working?

1. Check if API key is set correctly
2. Verify feature flags are enabled
3. Check browser console for errors
4. Ensure API quotas aren't exceeded

### Poor AI results?

1. Provide clearer prompts
2. Use higher quality images for receipts
3. Adjust temperature settings
4. Try different AI models

## Future Enhancements

- [ ] Multi-language support for receipts
- [ ] Voice-based expense entry
- [ ] Predictive budgeting
- [ ] Automated categorization
- [ ] Natural language financial queries
- [ ] Investment recommendations
- [ ] Bill negotiation suggestions

## Support

For issues or questions:
1. Check the browser console for errors
2. Review the AI logs in the console
3. Verify your API key is valid
4. Check API usage limits 