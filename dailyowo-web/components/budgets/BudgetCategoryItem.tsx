'use client';

import { motion } from 'framer-motion';
import { Edit2, Trash2, ChevronRight } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { BudgetCategory } from '@/lib/financial-logic/budget-logic';
import { formatCurrency } from '@/lib/utils/format';

interface BudgetCategoryItemProps {
  category: BudgetCategory;
  currency: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCategoryItem({ category, currency, onEdit, onDelete }: BudgetCategoryItemProps) {
  const percentage = category.allocated > 0 
    ? Math.min((category.spent / category.allocated) * 100, 100)
    : 0;
  
  const getProgressColor = () => {
    if (category.isOverBudget) return 'bg-red-500';
    if (percentage >= 90) return 'bg-yellow-500';
    if (percentage >= 75) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <GlassContainer className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h5 className="text-sm font-medium text-primary">{category.name}</h5>
            {category.isOverBudget && (
              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
                Over
              </span>
            )}
          </div>
          <p className="text-xs text-primary/60">
            {formatCurrency(category.spent, { currency })} of {formatCurrency(category.allocated, { currency })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Edit category"
          >
            <Edit2 className="w-4 h-4 text-primary/60" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete category"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5 }}
            className={`h-full ${getProgressColor()} rounded-full`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="text-primary/50">
          {percentage.toFixed(0)}% used
        </span>
        <span className="text-primary/50">
          {category.remaining >= 0 
            ? `${formatCurrency(category.remaining, { currency })} left`
            : `${formatCurrency(Math.abs(category.remaining), { currency })} over`
          }
        </span>
      </div>
    </GlassContainer>
  );
} 