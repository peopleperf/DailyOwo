'use client';

import { BudgetCategory } from '@/lib/financial-logic/budget-logic';
import { formatCurrency } from '@/lib/utils/format';

interface BudgetAllocationChartProps {
  categories: BudgetCategory[];
  currency: string;
}

export function BudgetAllocationChart({ categories, currency }: BudgetAllocationChartProps) {
  const maxAllocated = Math.max(...categories.map(c => c.allocated));

  // Debug logging
  console.log('BudgetAllocationChart categories:', categories.map(cat => ({
    name: cat.name,
    allocated: cat.allocated,
    spent: cat.spent,
    remaining: cat.remaining,
    calculatedRemaining: cat.allocated - cat.spent
  })));

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const percentage = category.allocated > 0 ? (category.spent / category.allocated) * 100 : 0;
        const isOverBudget = percentage > 100;
        
        return (
          <div key={category.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary font-medium">{category.name}</span>
              <span className="text-primary/60">
                {formatCurrency(category.spent, { currency })} / {formatCurrency(category.allocated, { currency })}
              </span>
            </div>
            
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                  isOverBudget ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
              {isOverBudget && (
                <div className="absolute right-0 top-0 h-full bg-red-600 animate-pulse" 
                  style={{ width: '4px' }}
                />
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs text-primary/60">
              <span>{percentage.toFixed(0)}% used</span>
              <span>{formatCurrency(category.remaining, { currency })} remaining</span>
            </div>
          </div>
        );
      })}
    </div>
  );
} 