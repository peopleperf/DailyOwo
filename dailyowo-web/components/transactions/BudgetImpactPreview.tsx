'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingDown, Info, CheckCircle } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { transactionBudgetSync, BudgetImpact } from '@/lib/services/transaction-budget-sync';
import { Transaction } from '@/types/transaction';
import { useAuth } from '@/lib/firebase/auth-context';

interface BudgetImpactPreviewProps {
  transaction: Partial<Transaction>;
  onAccept?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
}

export function BudgetImpactPreview({ 
  transaction, 
  onAccept, 
  onCancel,
  showActions = false 
}: BudgetImpactPreviewProps) {
  const { user } = useAuth();
  const [impacts, setImpacts] = useState<BudgetImpact[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBudgetImpact = async () => {
      if (!user?.uid || !transaction.amount || transaction.type !== 'expense') {
        setImpacts([]);
        setWarnings([]);
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const preview = await transactionBudgetSync.previewBudgetImpact(
          transaction,
          user.uid
        );
        
        setImpacts(preview.impacts);
        setWarnings(preview.warnings);
        setSuggestions(preview.suggestions);
      } catch (error) {
        console.error('Error fetching budget impact:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgetImpact();
  }, [transaction, user]);

  if (!transaction.type || transaction.type !== 'expense' || impacts.length === 0) {
    return null;
  }

  const hasOverBudget = impacts.some(impact => impact.isOverBudget);
  const hasWarnings = warnings.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GlassContainer className={`p-4 ${hasOverBudget ? 'border-red-500/20' : hasWarnings ? 'border-yellow-500/20' : 'border-green-500/20'}`}>
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            {hasOverBudget ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : hasWarnings ? (
              <Info className="w-5 h-5 text-yellow-500" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            <h3 className="text-sm font-medium text-primary">
              Budget Impact Preview
            </h3>
          </div>

          {/* Impact Details */}
          <div className="space-y-3">
            {impacts.map((impact, index) => (
              <motion.div
                key={impact.budgetCategoryId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-primary/70">{impact.categoryName}</span>
                  <span className={`text-sm font-medium ${
                    impact.isOverBudget ? 'text-red-500' : 
                    impact.percentageUsed > 80 ? 'text-yellow-500' : 
                    'text-green-500'
                  }`}>
                    {impact.percentageUsed.toFixed(0)}% used
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(impact.percentageUsed, 100)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`absolute left-0 top-0 h-full rounded-full ${
                      impact.isOverBudget ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      impact.percentageUsed > 80 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                      'bg-gradient-to-r from-green-500 to-green-600'
                    }`}
                  />
                  {impact.isOverBudget && (
                    <div className="absolute right-0 top-0 h-full w-1 bg-red-500 animate-pulse" />
                  )}
                </div>

                <div className="flex justify-between text-xs text-primary/50">
                  <span>€{impact.remainingBudget.toFixed(2)} remaining</span>
                  <span>€{impact.amountUsed.toFixed(2)} from this transaction</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 space-y-2"
            >
              {warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2">
                  <TrendingDown className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-primary/70">{warning}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-3 p-3 bg-blue-500/10 rounded-lg"
            >
              <p className="text-xs text-blue-400 font-medium mb-1">Suggestions:</p>
              {suggestions.map((suggestion, index) => (
                <p key={index} className="text-xs text-primary/70">{suggestion}</p>
              ))}
            </motion.div>
          )}

          {/* Actions */}
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 flex gap-2"
            >
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 px-3 py-2 text-xs font-medium text-primary/70 
                           bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  Reconsider
                </button>
              )}
              {onAccept && (
                <button
                  onClick={onAccept}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors
                    ${hasOverBudget 
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                      : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                >
                  {hasOverBudget ? 'Proceed Anyway' : 'Looks Good'}
                </button>
              )}
            </motion.div>
          )}
        </GlassContainer>
      </motion.div>
    </AnimatePresence>
  );
} 