import { Budget, BudgetCategory, BudgetMethod } from './budget-logic';
import { RebalanceOption } from '@/components/budgets/BudgetRebalanceModal';

/**
 * Check if a budget category edit requires rebalancing
 * This is true for method-based budgets (50-30-20, zero-based)
 */
export function requiresRebalancing(budget: Budget): boolean {
  return budget.method.type !== 'custom';
}

/**
 * Apply rebalancing to budget categories based on user selection
 */
export function applyBudgetRebalance(
  budget: Budget,
  originalCategoryId: string,
  newAmount: number,
  rebalanceOption: RebalanceOption
): BudgetCategory[] {
  const categories = [...budget.categories];
  const originalCategory = categories.find(c => c.id === originalCategoryId);
  
  if (!originalCategory) {
    throw new Error('Category not found');
  }

  // Update the original category
  const updatedCategories = categories.map(cat => {
    if (cat.id === originalCategoryId) {
      return {
        ...cat,
        allocated: newAmount,
        remaining: newAmount - cat.spent
      };
    }
    return cat;
  });

  // Apply adjustments based on rebalance option
  if (rebalanceOption.type === 'switch-method') {
    // Just return the updated categories, the calling code should handle method switch
    return updatedCategories;
  }

  // Apply the adjustments to other categories
  rebalanceOption.adjustments.forEach(adjustment => {
    const index = updatedCategories.findIndex(c => c.id === adjustment.categoryId);
    if (index !== -1) {
      const category = updatedCategories[index];
      updatedCategories[index] = {
        ...category,
        allocated: adjustment.newAmount,
        remaining: adjustment.newAmount - category.spent
      };
    }
  });

  return updatedCategories;
}

/**
 * Validate that budget allocations match the method requirements
 */
export function validateBudgetMethod(
  categories: BudgetCategory[],
  method: BudgetMethod,
  totalIncome: number
): { isValid: boolean; message?: string } {
  const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated, 0);
  
  if (method.type === '50-30-20') {
    const needsCategories = categories.filter(c => 
      ['housing', 'utilities', 'food', 'transportation', 'healthcare', 'insurance', 'debt'].includes(c.type)
    );
    const wantsCategories = categories.filter(c => 
      ['entertainment', 'shopping', 'fitness', 'personal-care', 'subscriptions'].includes(c.type)
    );
    const savingsCategories = categories.filter(c => 
      ['savings', 'investments', 'retirement'].includes(c.type)
    );

    const needsTotal = needsCategories.reduce((sum, cat) => sum + cat.allocated, 0);
    const wantsTotal = wantsCategories.reduce((sum, cat) => sum + cat.allocated, 0);
    const savingsTotal = savingsCategories.reduce((sum, cat) => sum + cat.allocated, 0);

    const needsPercentage = (needsTotal / totalIncome) * 100;
    const wantsPercentage = (wantsTotal / totalIncome) * 100;
    const savingsPercentage = (savingsTotal / totalIncome) * 100;

    // Allow for 5% variance
    const variance = 5;
    
    if (Math.abs(needsPercentage - 50) > variance) {
      return {
        isValid: false,
        message: `Needs allocation is ${needsPercentage.toFixed(1)}%, should be around 50%`
      };
    }
    
    if (Math.abs(wantsPercentage - 30) > variance) {
      return {
        isValid: false,
        message: `Wants allocation is ${wantsPercentage.toFixed(1)}%, should be around 30%`
      };
    }
    
    if (Math.abs(savingsPercentage - 20) > variance) {
      return {
        isValid: false,
        message: `Savings allocation is ${savingsPercentage.toFixed(1)}%, should be around 20%`
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Convert a method-based budget to custom budget while preserving allocations
 */
export function convertToCustomBudget(budget: Budget): Budget {
  return {
    ...budget,
    method: {
      type: 'custom',
      allocations: {
        categories: budget.categories.reduce((acc, cat) => {
          acc[cat.id] = cat.allocated;
          return acc;
        }, {} as { [key: string]: number })
      }
    },
    name: budget.name.replace(/50-30-20|zero-based/i, 'Custom')
  };
}

/**
 * Fix budget categories by recalculating remaining values
 * This ensures remaining = allocated - spent for all categories
 */
export function fixBudgetCategoryRemaining(categories: BudgetCategory[]): BudgetCategory[] {
  return categories.map(category => {
    const calculatedRemaining = category.allocated - category.spent;
    
    if (category.remaining !== calculatedRemaining) {
      console.log(`Fixing category ${category.name}: remaining ${category.remaining} → ${calculatedRemaining}`);
      return {
        ...category,
        remaining: calculatedRemaining,
        isOverBudget: category.spent > category.allocated
      };
    }
    
    return category;
  });
} 