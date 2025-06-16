# Savings Rate Calculation Documentation

## Overview
The savings rate is a key financial metric that measures what percentage of income is being saved. In DailyOwo, we calculate this using **actual savings transactions**, not just the difference between income and expenses.

## Formula
```
Savings Rate = (Total Savings / Total Income) × 100
```

Where:
- **Total Savings** = Sum of all asset transactions with savings categories
- **Total Income** = Sum of all income transactions

## Savings Categories
The following asset categories count as savings:
- `savings-account`
- `general-savings`
- `emergency-fund`
- `pension`
- `mutual-funds`
- `cryptocurrency`
- `retirement-401k`
- `retirement-ira`

These are defined in `/lib/constants/savings-categories.ts`.

## Why Not Income - Expenses?
The traditional formula `(Income - Expenses) / Income` doesn't accurately reflect savings behavior because:

1. **Cash can accumulate** - Not all unspent money is saved
2. **Debt payments aren't savings** - They reduce liabilities but don't build assets
3. **Intentionality matters** - Actual transfers to savings accounts show deliberate saving

## Implementation
The savings rate calculation is implemented consistently across:

1. **Main Calculation** (`/lib/financial-logic/savings-rate-logic.ts`)
   - `calculateSavingsRateData()` - Uses actual savings transactions ✓

2. **Budget Views** (`/components/budgets/BudgetOverviewTab.tsx`)
   - Displays rate based on actual savings ✓

3. **Historical Data** (`/lib/utils/historical-recalculation.ts`)
   - Recalculates historical rates using actual savings ✓

4. **Budget History** (`/lib/financial-logic/budget-period-logic.ts`)
   - Monthly and yearly averages use actual savings ✓

## Transaction Flow
1. User records income → Type: `income`
2. User pays expenses → Type: `expense`
3. User saves money → Type: `asset` with savings category
4. User pays debt → Type: `liability`

Only step 3 counts toward savings rate.

## Example
- Monthly Income: $5,000
- Monthly Expenses: $3,500
- Transfer to Savings: $1,000
- Debt Payment: $300

**Savings Rate** = ($1,000 / $5,000) × 100 = **20%**

Note: The $300 debt payment and $200 remaining cash don't count as savings. 