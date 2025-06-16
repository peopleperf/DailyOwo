# 📚 DailyOwo: All Functions & Logic Documentation

---

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Financial Logic Modules](#financial-logic-modules)
  - [Net Worth Logic](#net-worth-logic)
  - [Income Logic](#income-logic)
  - [Expenses Logic](#expenses-logic)
  - [Savings Rate Logic](#savings-rate-logic)
  - [Debt Ratio Logic](#debt-ratio-logic)
  - [Budget Logic](#budget-logic)
  - [Asset Price Logic](#asset-price-logic)
  - [Financial Health Logic](#financial-health-logic)
- [AI Logic](#ai-logic)
  - [Cloud Functions](#cloud-functions)
  - [Client AI Service](#client-ai-service)

---

## Overview
This document provides a detailed reference for all major functions and the core logic that powers the DailyOwo financial application. It covers every financial calculation module, AI integration, and their key exported functions, with signatures and descriptions.

---

## Architecture
```
lib/financial-logic/
├── networth-logic.ts        # Net worth calculations
├── income-logic.ts          # Income analysis
├── expenses-logic.ts        # Expense tracking & analysis
├── savings-rate-logic.ts    # Savings rate calculations
├── debt-ratio-logic.ts      # Debt analysis & payoff strategies
├── budget-logic.ts          # Budgeting logic
├── asset-price-logic.ts     # Asset price updates & performance
├── financial-health-logic.ts# Overall financial health scoring
```

---

## Financial Logic Modules

### 🏆 Net Worth Logic (`networth-logic.ts`)
**Purpose:** Calculate and track net worth (Assets - Liabilities) with detailed breakdowns.

#### Key Exported Functions
- `calculateNetWorth(transactions, previousPeriodTransactions?, monthlyExpenses?)`
  - Computes net worth, asset/liability breakdowns, allocation, growth, savings goals, and emergency fund details.
- `calculateNetWorthForPeriod(transactions, startDate, endDate)`
  - Net worth for a specific date range.
- `getNetWorthTrend(transactions, periodDays = 30)`
  - Returns an array of net worth snapshots for each day in the period.
- `calculateAssetAllocationPercentages(data)`
  - Returns allocation percentages for liquid, investments, real estate, retirement, other.
- `getEmergencyFundStatus(netWorthData, monthlyExpenses)`
  - Returns emergency fund adequacy and recommendations.

**Example Usage:**
```typescript
import { calculateNetWorth } from '@/lib/financial-logic/networth-logic';
const netWorthData = calculateNetWorth(transactions, previousPeriodTransactions);
console.log(netWorthData.netWorth);
```

---

### 💰 Income Logic (`income-logic.ts`)
**Purpose:** Analyze income sources, stability, and growth patterns.

#### Key Exported Functions
- `calculateIncomeData(transactions, periodStartDate, periodEndDate, previousPeriodTransactions?)`
  - Returns total, monthly, and average income, by category/source, growth, stability, and consistency.
- `getIncomeSources(transactions)`
  - Returns array of income sources with frequency and reliability.
- `getIncomeTrend(transactions, periodDays = 30)`
  - Returns array of income events for trend analysis.
- `getNextExpectedIncome(transactions)`
  - Predicts next expected income from recurring sources.
- `getIncomeInsights(incomeData)`
  - Returns insights, recommendations, and a health score.

**Example Usage:**
```typescript
import { calculateIncomeData, getIncomeInsights } from '@/lib/financial-logic/income-logic';
const incomeData = calculateIncomeData(transactions, startDate, endDate);
const insights = getIncomeInsights(incomeData);
```

---

### 💸 Expenses Logic (`expenses-logic.ts`)
**Purpose:** Track, categorize, and analyze spending patterns for budget optimization.

#### Key Exported Functions
- `calculateExpensesData(transactions, periodStartDate, periodEndDate, previousPeriodTransactions?)`
  - Returns total, monthly, and average expenses, by category/type, growth, trends, and projections.
- `getExpenseCategories(transactions, totalExpenses, previousPeriodTransactions?)`
  - Returns detailed breakdown of expenses by category.
- `getSpendingPatterns(transactions, periodDays = 30)`
  - Returns array of spending patterns for analysis.
- `identifySpendingOutliers(transactions)`
  - Detects unusual transactions and spending spikes.
- `getExpenseInsights(expensesData)`
  - Returns insights, recommendations, and a management score.

**Example Usage:**
```typescript
import { calculateExpensesData, identifySpendingOutliers } from '@/lib/financial-logic/expenses-logic';
const expensesData = calculateExpensesData(transactions, startDate, endDate);
const outliers = identifySpendingOutliers(transactions);
```

---

### 📈 Savings Rate Logic (`savings-rate-logic.ts`)
**Purpose:** Calculate and optimize savings rate: (Income - Expenses) / Income × 100

#### Key Exported Functions
- `calculateSavingsRateData(transactions, periodStartDate, periodEndDate, previousPeriodTransactions?, savingsGoal?)`
  - Returns savings rate, income, expenses, streaks, averages, and goal progress.
- `calculateSavingsBreakdown(transactions, periodStartDate, periodEndDate)`
  - Returns breakdown of forced, active, passive savings, and contributions.
- `calculateSavingsTarget(currentIncome, currentExpenses, targetSavingsRate)`
  - Returns target analysis and time to goal.
- `getSavingsRateTrend(transactions, months = 12)`
  - Returns array of savings rate trends.
- `getSavingsRateInsights(savingsData)`
  - Returns insights, recommendations, and a health score.

**Example Usage:**
```typescript
import { calculateSavingsRateData, getSavingsRateInsights } from '@/lib/financial-logic/savings-rate-logic';
const savingsData = calculateSavingsRateData(transactions, startDate, endDate);
const insights = getSavingsRateInsights(savingsData);
```

---

### 🏦 Debt Ratio Logic (`debt-ratio-logic.ts`)
**Purpose:** Analyze debt-to-income ratios and create payoff strategies.

#### Key Exported Functions
- `calculateDebtRatioData(transactions, periodStartDate, periodEndDate, previousPeriodTransactions?)`
  - Returns debt ratios, balances, payments, payoff time, and interest cost.
- `getDebtBreakdown(transactions)`
  - Returns breakdown of debts by category and priority.
- `calculateDebtPayoffStrategy(debtBreakdown, extraPayment = 0, strategy = 'avalanche')`
  - Returns payoff order, time, cost, and allocation for avalanche/snowball/custom.
- `getDebtRatioTrend(transactions, months = 12)`
  - Returns array of debt ratio trends.
- `getDebtRatioInsights(debtData)`
  - Returns insights, recommendations, and a management score.

**Example Usage:**
```typescript
import { calculateDebtRatioData, calculateDebtPayoffStrategy } from '@/lib/financial-logic/debt-ratio-logic';
const debtData = calculateDebtRatioData(transactions, startDate, endDate);
const strategy = calculateDebtPayoffStrategy(debtBreakdown, extraPayment, 'avalanche');
```

---

### 💡 Budget Logic (`budget-logic.ts`)
**Purpose:** Budget creation, tracking, health scoring, and period management.

#### Key Exported Functions
- `calculateBudgetData(transactions, budget, currentDate = new Date())`
  - Returns budget status, history, alerts, health, and performance.
- `createBudgetFromMethod(method, totalIncome, period, userId)`
  - Creates a budget using 50/30/20, zero-based, or custom method.
- `createBudgetPeriod(frequency, startDate = new Date())`
  - Returns a new budget period object.
- `shouldCreateNewBudgetPeriod(currentPeriod, currentDate = new Date())`
  - Returns true if a new period should be started.
- `rolloverBudgetAmounts(oldBudget, newPeriod)`
  - Rolls over unspent amounts to a new period.
- `formatBudgetAmount(amount, currency = '€')`
  - Formats budget amounts for display.
- `getBudgetUtilizationColor(utilizationPercentage)`
  - Returns a color string for utilization.
- `getBudgetHealthColor(score)`
  - Returns a color string for health score.

**Example Usage:**
```typescript
import { calculateBudgetData, createBudgetFromMethod } from '@/lib/financial-logic/budget-logic';
const budgetData = calculateBudgetData(transactions, budget);
```

---

### 💹 Asset Price Logic (`asset-price-logic.ts`)
**Purpose:** Automatic price updates for cryptocurrencies, stocks, and other assets.

#### Key Exported Functions
- `getCryptoPrices(symbols)`
  - Fetches crypto prices from CoinGecko MCP.
- `getStockPrices(symbols)`
  - Fetches stock prices (planned: Yahoo Finance).
- `updateAssetPrices(transactions)`
  - Updates asset prices for all relevant transactions.
- `applyPriceUpdates(transactions, updates)`
  - Applies price updates to transaction records.
- `getPriceUpdateSummary(updates)`
  - Summarizes update results (gainers, losers, value change).
- `scheduleAutoUpdates(transactions, updateFrequency = 'daily')`
  - Schedules automatic price updates.
- `getAssetPerformance(transactions, symbol, days = 30)`
  - Returns performance and price history for an asset.

**Example Usage:**
```typescript
import { updateAssetPrices, getCryptoPrices } from '@/lib/financial-logic/asset-price-logic';
const updates = await updateAssetPrices(transactions);
```

---

### 🏅 Financial Health Logic (`financial-health-logic.ts`)
**Purpose:** Calculates a comprehensive financial health score (0-100) based on net worth, income, expenses, savings, and debt.

#### Key Exported Functions
- `calculateFinancialHealthScore(transactions, periodStartDate, periodEndDate)`
  - Returns overall score, breakdown, status, insights, and recommendations.

**Example Usage:**
```typescript
import { calculateFinancialHealthScore } from '@/lib/financial-logic/financial-health-logic';
const score = calculateFinancialHealthScore(transactions, startDate, endDate);
```

---

## AI Logic

### 🤖 Cloud Functions (`functions/src/ai-categorization.ts`)
- `categorizeTransaction`: Categorizes a transaction using Gemini AI, with rate limiting, caching, and confidence scoring.
  - **Signature:** `(data: { description: string, amount: number, merchantName?: string, location?: string }, context) => Promise<{ category: string, confidence: number, explanation?: string, subcategory?: string }>`
- **Logic:**
  - Authenticates user, checks rate limits, checks cache, calls Gemini AI, parses and validates response, caches result, logs usage, and returns categorization.

### 🤖 Client AI Service (`lib/services/ai-service.ts`)
- `AIService.getInstance()`: Singleton instance getter.
- `categorizeTransaction(description, amount, merchantName?, location?)`
  - Calls the cloud function to categorize a transaction.
- `generateSpendingInsights(transactions, period = 'month')`
  - Calls the cloud function to generate insights.
- `optimizeBudget(currentBudget, spendingHistory, goals?)`
  - Calls the cloud function to get budget optimization suggestions.
- `detectAnomaly(transaction, userSpendingHistory)`
  - Calls the cloud function to detect anomalous transactions.
- `checkAIAvailability()`
  - Checks if AI features are available and returns usage info.

**Example Usage:**
```typescript
import { AIService } from '@/lib/services/ai-service';
const ai = AIService.getInstance();
const result = await ai.categorizeTransaction('Starbucks coffee', 5.25);
```

---

## References
- See `FINANCIAL_LOGIC_DOCUMENTATION.md` and `GEMINI_AI_INTEGRATION.md` for more details and setup instructions.
- For function signatures and code, see the respective `.ts` files in `lib/financial-logic/` and `lib/services/`. 