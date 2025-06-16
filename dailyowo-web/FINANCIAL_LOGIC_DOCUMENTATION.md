# 📊 Financial Logic Documentation

## Overview

This document describes the modularized financial logic system that powers the DailyOwo financial application. Each module is responsible for specific financial calculations and provides a clean, testable interface.

## Architecture

```
lib/financial-logic/
├── index.ts                 # Main exports and interfaces
├── networth-logic.ts        # Net worth calculations
├── income-logic.ts          # Income analysis
├── expenses-logic.ts        # Expense tracking & analysis
├── savings-rate-logic.ts    # Savings rate calculations
├── debt-ratio-logic.ts      # Debt analysis & payoff strategies
└── asset-price-logic.ts     # Asset price updates & performance
```

## Modules

### 1. 🏆 Net Worth Logic (`networth-logic.ts`)

**Purpose**: Calculate and track net worth (Assets - Liabilities) with detailed breakdowns.

**Key Functions**:
- `calculateNetWorth()` - Main net worth calculation
- `getNetWorthTrend()` - Historical net worth tracking
- `calculateAssetAllocationPercentages()` - Portfolio allocation analysis
- `getEmergencyFundStatus()` - Emergency fund adequacy check

**Core Formula**: `Net Worth = Total Assets - Total Liabilities`

**Features**:
- Real-time asset price integration
- Asset allocation breakdown (liquid, investments, real estate, retirement)
- Growth tracking and percentage calculations
- Emergency fund analysis (3-6 months of expenses)

**Example Usage**:
```typescript
import { calculateNetWorth } from '@/lib/financial-logic';

const netWorthData = calculateNetWorth(transactions, previousPeriodTransactions);
console.log(`Net Worth: $${netWorthData.netWorth}`);
console.log(`Growth: ${netWorthData.growthPercentage}%`);
```

---

### 2. 💰 Income Logic (`income-logic.ts`)

**Purpose**: Analyze income sources, stability, and growth patterns.

**Key Functions**:
- `calculateIncomeData()` - Comprehensive income analysis
- `getIncomeSources()` - Income source breakdown with reliability scoring
- `getNextExpectedIncome()` - Predict upcoming income from recurring sources
- `getIncomeInsights()` - AI-powered insights and recommendations

**Income Categories**:
- **Primary**: Salary, business income
- **Secondary**: Freelance, side income  
- **Passive**: Investments, rental income
- **One-time**: Gifts, refunds, bonuses

**Features**:
- Income stability scoring (0-100)
- Diversification analysis
- Growth tracking
- Predictive income forecasting
- Reliability scoring per source

**Example Usage**:
```typescript
import { calculateIncomeData, getIncomeInsights } from '@/lib/financial-logic';

const incomeData = calculateIncomeData(transactions, startDate, endDate);
const insights = getIncomeInsights(incomeData);

console.log(`Monthly Income: $${incomeData.monthlyIncome}`);
console.log(`Stability Score: ${incomeData.incomeConsistency}/100`);
```

---

### 3. 💸 Expenses Logic (`expenses-logic.ts`)

**Purpose**: Track, categorize, and analyze spending patterns for budget optimization.

**Key Functions**:
- `calculateExpensesData()` - Comprehensive expense analysis
- `getExpenseCategories()` - Detailed category breakdown with trends
- `identifySpendingOutliers()` - Unusual spending pattern detection
- `getExpenseInsights()` - Spending optimization recommendations

**Expense Classifications**:
- **Fixed**: Housing, insurance, utilities, debt payments
- **Variable**: Food, transportation, personal care
- **Discretionary**: Entertainment, shopping, travel, education
- **Essential**: Housing, food, healthcare, utilities, transportation

**Features**:
- Spending trend analysis (increasing/decreasing/stable)
- Weekly and monthly spending patterns
- Outlier detection (transactions >2 standard deviations)
- Category-wise budget tracking
- Fixed vs. variable expense ratios

**Example Usage**:
```typescript
import { calculateExpensesData, identifySpendingOutliers } from '@/lib/financial-logic';

const expensesData = calculateExpensesData(transactions, startDate, endDate);
const outliers = identifySpendingOutliers(transactions);

console.log(`Monthly Expenses: $${expensesData.monthlyExpenses}`);
console.log(`Unusual Transactions: ${outliers.unusualTransactions.length}`);
```

---

### 4. 📈 Savings Rate Logic (`savings-rate-logic.ts`)

**Purpose**: Calculate and optimize savings rate: (Income - Expenses) / Income × 100

**Key Functions**:
- `calculateSavingsRateData()` - Main savings rate calculation
- `calculateSavingsTarget()` - Goal setting and achievement tracking
- `getSavingsRateTrend()` - Historical savings rate tracking
- `getSavingsRateInsights()` - Personalized savings recommendations

**Core Formula**: `Savings Rate = (Income - Expenses) / Income × 100`

**Savings Categories**:
- **Forced**: Automatic 401k, retirement contributions
- **Active**: Deliberate saving after expenses
- **Passive**: What's left over (Income - Expenses)

**Features**:
- Savings streak tracking (consecutive positive months)
- Target achievement progress
- Benchmark comparisons (10%, 20%, 30%+ rates)
- Difficulty assessment for targets
- Personalized improvement strategies

**Benchmarks**:
- 🔥 **Excellent**: 30%+ (Early retirement track)
- ✅ **Good**: 20-29% (Above recommended)
- 📊 **Fair**: 10-19% (Basic recommendation)
- ⚠️ **Poor**: 0-9% (Below recommended)
- 🚨 **Critical**: Negative (Spending > Income)

**Example Usage**:
```typescript
import { calculateSavingsRateData, getSavingsRateInsights } from '@/lib/financial-logic';

const savingsData = calculateSavingsRateData(transactions, startDate, endDate);
const insights = getSavingsRateInsights(savingsData);

console.log(`Savings Rate: ${savingsData.savingsRate}%`);
console.log(`Status: ${insights.status}`);
```

---

### 5. 🏦 Debt Ratio Logic (`debt-ratio-logic.ts`)

**Purpose**: Analyze debt-to-income ratios and create payoff strategies.

**Key Functions**:
- `calculateDebtRatioData()` - Debt ratio and payment analysis
- `getDebtBreakdown()` - Detailed debt categorization
- `calculateDebtPayoffStrategy()` - Avalanche/Snowball strategy optimization
- `getDebtRatioInsights()` - Debt management recommendations

**Core Formulas**:
- `Debt-to-Income Ratio = Total Debt / Annual Income × 100`
- `Debt Service Ratio = Monthly Debt Payments / Monthly Income × 100`

**Payoff Strategies**:
- **Avalanche**: Pay highest interest rate first (mathematically optimal)
- **Snowball**: Pay lowest balance first (psychological wins)
- **Custom**: User-defined priority order

**Debt Categories**:
- Credit cards, personal loans, auto loans, mortgages, student loans, business loans, lines of credit

**Features**:
- Interest rate analysis and prioritization
- Payoff timeline calculations
- Total interest cost projections
- Strategy comparison (avalanche vs snowball)
- Extra payment optimization

**Benchmarks**:
- 🎯 **Excellent**: 0% (Debt-free) or ≤20%
- ✅ **Good**: 21-36% (Manageable)
- ⚠️ **Fair**: 37-50% (Needs attention)
- 🚨 **Concerning**: 51-75% (High risk)
- 💀 **Critical**: >75% (Immediate action needed)

**Example Usage**:
```typescript
import { calculateDebtRatioData, calculateDebtPayoffStrategy } from '@/lib/financial-logic';

const debtData = calculateDebtRatioData(transactions, startDate, endDate);
const strategy = calculateDebtPayoffStrategy(debtBreakdown, extraPayment, 'avalanche');

console.log(`Debt-to-Income: ${debtData.debtToIncomeRatio}%`);
console.log(`Payoff Time: ${strategy.totalPayoffTime} months`);
```

---

### 6. 📊 Asset Price Logic (`asset-price-logic.ts`)

**Purpose**: Automatic price updates for cryptocurrencies, stocks, and other assets.

**Key Functions**:
- `getCryptoPrices()` - CoinGecko MCP integration for crypto prices
- `getStockPrices()` - Stock price updates (Yahoo Finance planned)
- `updateAssetPrices()` - Batch price updates for all assets
- `getAssetPerformance()` - Portfolio performance tracking

**Price Sources**:
- **CoinGecko MCP**: Real-time cryptocurrency prices ([https://mcp.api.coingecko.com/](https://mcp.api.coingecko.com/))
- **Yahoo Finance**: Stock and ETF prices (planned)
- **Manual**: User-entered values for real estate, collectibles

**Update Frequencies**:
- **Cryptocurrency**: Every hour
- **Stocks/ETFs**: Daily (market hours)
- **Real Estate**: Manual/quarterly
- **Collectibles**: Manual/as needed

**Features**:
- Automatic price updates based on asset type
- Portfolio performance tracking
- Price change notifications
- Historical price trend analysis
- Batch processing for efficiency

**Supported Assets**:
- Bitcoin, Ethereum, and 1000+ cryptocurrencies
- US stocks, ETFs, mutual funds (planned)
- Real estate (manual valuation)
- Collectibles and commodities (manual)

**Example Usage**:
```typescript
import { updateAssetPrices, getPriceUpdateSummary } from '@/lib/financial-logic';

const updates = await updateAssetPrices(transactions);
const summary = getPriceUpdateSummary(updates);

console.log(`Updated ${summary.successfulUpdates}/${summary.totalUpdates} assets`);
console.log(`Total Value Change: $${summary.totalValueChange}`);
```

---

## Integration & Usage

### Comprehensive Financial Analysis

```typescript
import {
  calculateNetWorth,
  calculateIncomeData,
  calculateExpensesData,
  calculateSavingsRateData,
  calculateDebtRatioData,
  calculateFinancialHealthScore,
  type ComprehensiveFinancialData
} from '@/lib/financial-logic';

export function useComprehensiveFinancialData(
  transactions: Transaction[]
): ComprehensiveFinancialData {
  const currentDate = new Date();
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // Calculate all financial metrics
  const netWorth = calculateNetWorth(transactions);
  const income = calculateIncomeData(transactions, monthStart, monthEnd);
  const expenses = calculateExpensesData(transactions, monthStart, monthEnd);
  const savingsRate = calculateSavingsRateData(transactions, monthStart, monthEnd);
  const debtRatio = calculateDebtRatioData(transactions, monthStart, monthEnd);

  // Calculate overall financial health
  const healthScore = calculateFinancialHealthScore(
    income,
    expenses,
    savingsRate,
    debtRatio,
    netWorth
  );

  return {
    netWorth,
    income,
    expenses,
    savingsRate,
    debtRatio,
    healthScore,
    isLoading: false,
    error: null,
    lastUpdated: new Date()
  };
}
```

### Dashboard Integration

```typescript
// In dashboard component
const financialData = useComprehensiveFinancialData(transactions);

// Display key metrics
<div className="grid grid-cols-4 gap-4">
  <MetricCard 
    title="Net Worth" 
    value={formatCurrency(financialData.netWorth.netWorth)}
    change={financialData.netWorth.growthPercentage}
  />
  <MetricCard 
    title="Monthly Income" 
    value={formatCurrency(financialData.income.monthlyIncome)}
  />
  <MetricCard 
    title="Savings Rate" 
    value={`${financialData.savingsRate.savingsRate}%`}
    status={financialData.savingsRate.status}
  />
  <MetricCard 
    title="Debt Ratio" 
    value={`${financialData.debtRatio.debtToIncomeRatio}%`}
  />
</div>
```

## Testing

Each module includes comprehensive unit tests:

```typescript
// Example test structure
describe('Income Logic', () => {
  it('should calculate monthly income correctly', () => {
    const transactions = [/* test data */];
    const result = calculateIncomeData(transactions, startDate, endDate);
    expect(result.monthlyIncome).toBe(5000);
  });

  it('should identify income stability', () => {
    const transactions = [/* recurring income data */];
    const result = calculateIncomeData(transactions, startDate, endDate);
    expect(result.isIncomeStable).toBe(true);
  });
});
```

## Performance Considerations

1. **Caching**: Results are cached based on transaction data hash
2. **Lazy Loading**: Heavy calculations only run when needed
3. **Batch Processing**: Asset price updates run in batches
4. **Incremental Updates**: Only recalculate when data changes

## Future Enhancements

1. **Machine Learning**: Predictive analytics for spending and income
2. **Real-time Updates**: WebSocket integration for live market data
3. **Advanced Strategies**: Monte Carlo simulations for retirement planning
4. **Tax Optimization**: Tax-efficient investment and withdrawal strategies
5. **Goal Tracking**: Automated progress tracking for financial goals

## Contributing

When adding new financial logic:

1. Create a separate module in `/lib/financial-logic/`
2. Export functions and types in `index.ts`
3. Include comprehensive TypeScript types
4. Add unit tests for all functions
5. Update this documentation
6. Follow the established patterns for consistency

## API Reference

For detailed function signatures and examples, see the TypeScript definitions in each module file. All functions are strongly typed and include JSDoc documentation.

---

*This documentation is automatically updated with each release. Last updated: 2024* 