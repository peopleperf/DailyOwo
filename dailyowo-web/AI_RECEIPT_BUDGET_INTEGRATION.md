# AI Receipt-to-Budget Integration Guide

## Overview

The DailyOwo app now features intelligent receipt scanning that automatically categorizes expenses and reflects them in your budget in real-time. When you scan a receipt, the AI analyzes it and creates transactions that immediately update your budget tracking.

## How It Works

### 1. Receipt Scanning Process
```
Receipt Image → AI Analysis → Category Mapping → Transaction Creation → Budget Update
```

### 2. AI Category Mapping

The system uses a sophisticated category mapping algorithm that:
- Analyzes the merchant type detected by AI (e.g., "restaurant", "grocery store")
- Maps it to the appropriate transaction category
- Suggests up to 3 categories with confidence scores
- Automatically selects the highest confidence match

**Example Mappings:**
- "Restaurant" → Dining Out
- "Grocery Store" → Groceries  
- "Gas Station" → Fuel
- "Pharmacy" → Medications

### 3. Budget Impact Preview

Before saving a receipt, you'll see:
- Which budget categories will be affected
- Current usage percentage for each category
- Warnings if you're approaching or exceeding limits
- Suggestions for alternative categories if over budget

### 4. Real-Time Budget Sync

When a receipt is saved:
1. Transaction is created with the selected category
2. Budget spending is immediately updated
3. Email alerts are sent if thresholds are exceeded
4. Dashboard reflects new spending instantly

## Features

### AI-Enhanced Data Storage
Each receipt transaction stores:
- Merchant name and category
- Individual line items with categories
- Receipt/cashier details
- AI confidence scores
- Category suggestions history

### Smart Category Suggestions
- Primary suggestion based on merchant type
- Secondary suggestions from item analysis
- Confidence scores for transparency
- One-click category switching

### Budget Protection
- Real-time impact calculations
- Over-budget warnings
- Alternative category suggestions
- Spending trend insights

## User Benefits

1. **Automatic Categorization**: No manual category selection needed
2. **Accurate Budget Tracking**: Every receipt immediately reflects in budgets
3. **Spending Insights**: AI insights help identify savings opportunities
4. **Time Savings**: Scan and save in seconds vs. manual entry

## Technical Implementation

### Key Components:
- `AICategoryMapper`: Maps AI categories to transaction categories
- `TransactionBudgetSync`: Handles real-time budget updates
- `ReceiptReviewModal`: UI for reviewing and confirming receipts

### Data Flow:
```javascript
// 1. AI analyzes receipt
const aiData = await analyzeReceipt(image);

// 2. Map to transaction categories
const suggestions = AICategoryMapper.suggestCategories(
  aiData.merchantCategory,
  aiData.items,
  aiData.merchantName
);

// 3. Preview budget impact
const impact = await transactionBudgetSync.previewBudgetImpact(
  transaction,
  userId
);

// 4. Save and sync
await transactionBudgetSync.syncTransactionWithBudget(
  transaction,
  'create'
);
```

## Configuration

Enable AI receipt scanning in your `.env.local`:
```
GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_AI_RECEIPT_ENABLED=true
NEXT_PUBLIC_AI_FIRST_SCANNING=true
```

## Future Enhancements

- Multi-receipt batch processing
- Recurring expense detection
- Merchant-specific insights
- Category learning from user corrections
- Split transactions for shared expenses 