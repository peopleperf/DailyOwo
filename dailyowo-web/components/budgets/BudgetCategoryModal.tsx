'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, DollarSign } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { BudgetCategory, BudgetCategoryType } from '@/lib/financial-logic/budget-logic';

interface BudgetCategoryModalProps {
  mode: 'add' | 'edit';
  category: BudgetCategory | null;
  onClose: () => void;
  onSave: (category: Partial<BudgetCategory>) => void;
}

const categoryTypes = [
  { value: 'housing', label: 'Housing & Utilities' },
  { value: 'food', label: 'Food & Dining' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'shopping', label: 'Shopping & Personal' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'savings', label: 'Savings & Investments' },
  { value: 'other', label: 'Other' },
];

export function BudgetCategoryModal({ mode, category, onClose, onSave }: BudgetCategoryModalProps) {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    type: category?.type || 'other' as BudgetCategoryType,
    allocated: category?.allocated || 0,
    allowRollover: category?.allowRollover ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    if (formData.allocated < 0) {
      newErrors.allocated = 'Budget amount must be positive';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Only include id if it exists (edit mode)
    const categoryData: Partial<BudgetCategory> = {
      ...formData,
    };
    
    if (category?.id) {
      categoryData.id = category.id;
    }

    onSave(categoryData);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <GlassContainer className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-light text-primary">
                {mode === 'add' ? 'Add Category' : 'Edit Category'}
              </h3>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-primary/60" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                  placeholder="e.g., Groceries"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Category Type */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Category Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as BudgetCategoryType })}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                >
                  {categoryTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget Amount */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Monthly Budget
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="w-4 h-4 text-primary/40" />
                  </div>
                  <input
                    type="number"
                    value={formData.allocated}
                    onChange={(e) => setFormData({ ...formData, allocated: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50"
                    placeholder="0.00"
                    step="0.01"
                  />
                </div>
                {errors.allocated && (
                  <p className="text-xs text-red-500 mt-1">{errors.allocated}</p>
                )}
              </div>

              {/* Allow Rollover */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-primary">Allow Rollover</p>
                  <p className="text-xs text-primary/60">Carry unused budget to next month</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowRollover}
                    onChange={(e) => setFormData({ ...formData, allowRollover: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold"></div>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <GlassButton
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  type="submit"
                  goldBorder
                  className="flex-1"
                >
                  {mode === 'add' ? 'Add Category' : 'Save Changes'}
                </GlassButton>
              </div>
            </form>
          </GlassContainer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 