# Budget Rebalancing Feature

## Overview

The Budget Rebalancing feature addresses a critical real-world need: when using budget methods like 50-30-20, users often need to adjust individual categories (e.g., housing costs exceed the standard allocation) while maintaining the integrity of their chosen budget method.

## How It Works

### 1. Method-Based Budgets
When using a structured budget method (50-30-20, Zero-Based), the system maintains specific ratios:
- **50-30-20**: 50% Needs, 30% Wants, 20% Savings
- **Zero-Based**: Every dollar allocated, no unallocated funds

### 2. Triggering Rebalancing
Rebalancing is triggered when:
- User edits a category's allocated amount in a method-based budget
- The change would break the method's ratio requirements

### 3. Rebalancing Options

When adjusting a category (e.g., increasing Housing from $875 to $1,200), users are presented with these options:

#### Option 1: Redistribute Within Group
- Spreads the difference across other categories in the same group
- Example: If increasing Housing (a "Need"), reduce other Needs like Food and Transportation proportionally

#### Option 2: Take from Wants
- Reduces discretionary spending to accommodate the change
- Maintains Needs and Savings percentages

#### Option 3: Reduce Savings
- Temporarily lowers savings rate
- Should be used sparingly for financial health

#### Option 4: Custom Distribution
- User selects exactly which categories to adjust
- Provides maximum control while maintaining method integrity

#### Option 5: Switch to Custom Budget
- Converts the budget to a custom method
- Removes ratio constraints permanently
- Keeps all current allocations

## User Experience

### Visual Indicators
- Method-based budgets show a notice explaining rebalancing requirements
- Gold-accented alert box for premium feel
- Clear indication of current budget method

### Rebalancing Modal
- Shows the exact change being made
- Previews how each option would affect other categories
- Uses radio buttons for clear selection
- Shows up to 3 affected categories with "and X more..." for longer lists

### Feedback
- Success messages confirm the rebalancing action taken
- Error handling for edge cases
- Smooth animations following the glassmorphic design system

## Technical Implementation

### Components
1. **BudgetRebalanceModal**: Main UI for rebalancing options
2. **budget-rebalance-logic.ts**: Core logic for calculations and validations
3. **BudgetCategoriesTab**: Integration point for editing categories

### Key Functions
- `requiresRebalancing()`: Checks if budget method requires rebalancing
- `applyBudgetRebalance()`: Applies selected rebalancing option
- `validateBudgetMethod()`: Ensures allocations match method requirements
- `convertToCustomBudget()`: Converts method-based budget to custom

### Data Flow
1. User edits category allocation
2. System checks if rebalancing required
3. If yes, stores pending change and shows modal
4. User selects rebalancing option
5. System applies changes to all affected categories
6. Updates Firebase with new allocations
7. UI refreshes to show updated budget

## Design Philosophy Alignment

### Premium & Sophisticated
- Elegant modal design with glassmorphic effects
- Subtle animations and transitions
- Professional copy without jargon

### User Empowerment
- Multiple options respect different financial situations
- Clear previews prevent surprises
- Ability to switch methods if constraints don't fit

### Real-World Focus
- Acknowledges that standard ratios don't always work
- Provides flexibility within structure
- Maintains financial discipline while adapting to reality

## Best Practices

### For Users
1. Try to redistribute within the same category group first
2. Avoid repeatedly taking from savings
3. Consider switching to custom if adjustments are frequent
4. Review allocations monthly to ensure they match reality

### For Developers
1. Always validate total allocations equal income
2. Ensure no category goes negative
3. Maintain method integrity unless explicitly switching
4. Provide clear feedback for all actions

## Future Enhancements
1. Smart suggestions based on spending history
2. Seasonal adjustment recommendations
3. AI-powered rebalancing suggestions
4. Historical rebalancing analytics 