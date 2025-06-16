'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Shuffle } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { formatCurrency } from '@/lib/utils/format';
import { BudgetCategory, BudgetMethod } from '@/lib/financial-logic/budget-logic';

interface BudgetRebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rebalanceOption: RebalanceOption) => void;
  originalCategory: BudgetCategory;
  newAmount: number;
  budgetMethod: BudgetMethod;
  allCategories: BudgetCategory[];
  currency: string;
}

export type RebalanceOption = {
  type: 'within-group' | 'from-wants' | 'from-savings' | 'custom' | 'switch-method';
  adjustments: Array<{
    categoryId: string;
    newAmount: number;
    difference: number;
  }>;
};

export function BudgetRebalanceModal({
  isOpen,
  onClose,
  onConfirm,
  originalCategory,
  newAmount,
  budgetMethod,
  allCategories,
  currency
}: BudgetRebalanceModalProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customAdjustments, setCustomAdjustments] = useState<Map<string, number>>(new Map());
  
  const difference = newAmount - originalCategory.allocated;
  const isIncrease = difference > 0;
  
  // Group categories by type
  const needsCategories = allCategories.filter(c => 
    ['housing', 'utilities', 'food', 'transportation', 'healthcare', 'insurance', 'debt'].includes(c.type)
  );
  const wantsCategories = allCategories.filter(c => 
    ['entertainment', 'shopping', 'fitness', 'personal-care', 'subscriptions'].includes(c.type)
  );
  const savingsCategories = allCategories.filter(c => 
    ['savings', 'investments', 'retirement'].includes(c.type)
  );

  // Calculate redistribution options
  const calculateRedistribution = (categories: BudgetCategory[], amount: number) => {
    const eligibleCategories = categories.filter(c => 
      c.id !== originalCategory.id && c.allocated > 0
    );
    
    if (eligibleCategories.length === 0) return [];
    
    const adjustmentPerCategory = amount / eligibleCategories.length;
    
    return eligibleCategories.map(cat => ({
      categoryId: cat.id,
      categoryName: cat.name,
      currentAmount: cat.allocated,
      newAmount: Math.max(0, cat.allocated - adjustmentPerCategory),
      difference: -adjustmentPerCategory
    }));
  };

  const rebalanceOptions = [
    {
      id: 'within-group',
      title: `Redistribute within ${originalCategory.type === 'housing' ? 'Needs' : originalCategory.type}`,
      description: 'Balance the change across similar categories',
      adjustments: calculateRedistribution(
        needsCategories.includes(originalCategory) ? needsCategories : 
        wantsCategories.includes(originalCategory) ? wantsCategories : 
        savingsCategories,
        difference
      ),
      available: true
    },
    {
      id: 'from-wants',
      title: 'Take from Wants category',
      description: 'Reduce discretionary spending',
      adjustments: calculateRedistribution(wantsCategories, difference),
      available: wantsCategories.some(c => c.allocated > 0)
    },
    {
      id: 'from-savings',
      title: 'Reduce Savings allocation',
      description: 'Lower your savings rate temporarily',
      adjustments: calculateRedistribution(savingsCategories, difference),
      available: savingsCategories.some(c => c.allocated > 0)
    },
    {
      id: 'custom',
      title: 'Custom distribution',
      description: 'Choose exactly which categories to adjust',
      adjustments: [],
      available: true
    },
    {
      id: 'switch-method',
      title: 'Switch to Custom Budget',
      description: 'Keep your adjustments without method constraints',
      adjustments: [],
      available: true
    }
  ];

  const handleConfirm = () => {
    const option = rebalanceOptions.find(o => o.id === selectedOption);
    if (!option) return;

    if (selectedOption === 'custom') {
      // Convert custom adjustments to the expected format
      const adjustments = Array.from(customAdjustments.entries()).map(([categoryId, newAmount]) => {
        const category = allCategories.find(c => c.id === categoryId)!;
        return {
          categoryId,
          newAmount,
          difference: newAmount - category.allocated
        };
      });
      
      onConfirm({
        type: 'custom',
        adjustments
      });
    } else {
      onConfirm({
        type: selectedOption as RebalanceOption['type'],
        adjustments: option.adjustments.map(adj => ({
          categoryId: adj.categoryId,
          newAmount: adj.newAmount,
          difference: adj.difference
        }))
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl"
        >
          <GlassContainer className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-light text-primary mb-2">
                  Adjust Budget Balance
                </h2>
                <p className="text-sm text-primary/60">
                  Maintain your {budgetMethod.type} budget method integrity
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-primary/40" />
              </button>
            </div>

            {/* Change Summary */}
            <div className="mb-6 p-4 bg-gold/5 border border-gold/20 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-5 h-5 text-gold" />
                <p className="text-sm font-medium text-primary">
                  Budget Adjustment Required
                </p>
              </div>
              <p className="text-sm text-primary/70">
                {originalCategory.name}: {formatCurrency(originalCategory.allocated, { currency })} → {formatCurrency(newAmount, { currency })} 
                <span className={`ml-2 font-medium ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
                  ({isIncrease ? '+' : ''}{formatCurrency(Math.abs(difference), { currency })})
                </span>
              </p>
            </div>

            {/* Rebalance Options */}
            <div className="space-y-3 mb-6">
              <p className="text-sm font-light text-primary/60 uppercase tracking-wide mb-4">
                How would you like to balance this?
              </p>
              
              {rebalanceOptions.filter(o => o.available).map((option) => (
                <motion.div
                  key={option.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedOption(option.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedOption === option.id
                      ? 'border-gold bg-gold/5'
                      : 'border-gray-200 hover:border-gold/30'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="radio"
                      checked={selectedOption === option.id}
                      onChange={() => setSelectedOption(option.id)}
                      className="mt-1 text-gold focus:ring-gold"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-primary mb-1">
                        {option.title}
                      </h3>
                      <p className="text-sm text-primary/60 mb-2">
                        {option.description}
                      </p>
                      
                      {/* Show adjustment preview */}
                      {option.adjustments.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {option.adjustments.slice(0, 3).map((adj) => (
                            <div key={adj.categoryId} className="flex items-center justify-between text-xs">
                              <span className="text-primary/60">{adj.categoryName}:</span>
                              <span className="text-primary/80">
                                {formatCurrency(adj.currentAmount, { currency })} → {formatCurrency(adj.newAmount, { currency })}
                                <span className="text-red-600 ml-1">
                                  ({formatCurrency(adj.difference, { currency })})
                                </span>
                              </span>
                            </div>
                          ))}
                          {option.adjustments.length > 3 && (
                            <p className="text-xs text-primary/40">
                              And {option.adjustments.length - 3} more categories...
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <GlassButton
                onClick={onClose}
                variant="secondary"
                size="sm"
              >
                Cancel
              </GlassButton>
              <GlassButton
                onClick={handleConfirm}
                goldBorder
                size="sm"
                disabled={!selectedOption}
              >
                Confirm Adjustment
              </GlassButton>
            </div>
          </GlassContainer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 