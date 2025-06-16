'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';
import EmptyState from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatCurrency } from '@/lib/utils/currency';
import { SyncStatusBadge } from '@/components/ui/SyncStatusIndicator';
import { canEditTransaction } from '@/services/transaction-service';
import { Lock, Plus, Minus } from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { TRANSACTION_CATEGORIES } from '@/lib/constants/transaction-categories';

export function TransactionCard({ 
  transaction, 
  onClick 
}: { 
  transaction: Transaction; 
  onClick: (transaction: Transaction) => void;
}) {
  const [canEdit, setCanEdit] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    checkEditPermission();
  }, [transaction.id]);

  const checkEditPermission = async () => {
    const result = await canEditTransaction(transaction.id);
    setCanEdit(result.canEdit);
    setIsLocked(!!result.lockedBy);
  };

  const getCategoryDetails = (categoryId: string, categoryType: string) => {
    if (categoryType === 'global') {
      return TRANSACTION_CATEGORIES.find(cat => cat.id === categoryId);
    }
    // Handle user categories here
    return null;
  };

  const category = getCategoryDetails(transaction.categoryId, transaction.categoryType);
  const isIncome = transaction.type === 'income';
  const isExpense = transaction.type === 'expense';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(transaction)}
      className="glass-panel p-4 mb-3 cursor-pointer hover:bg-white/50 transition-all relative"
    >
      {/* Lock indicator */}
      {isLocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Category Icon */}
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isIncome ? 'bg-green-100 text-green-600' : 
            isExpense ? 'bg-red-100 text-red-600' :
            'bg-blue-100 text-blue-600'
          }`}>
            {category?.icon || (isIncome ? <Plus className="w-5 h-5" /> : <Minus className="w-5 h-5" />)}
          </div>

          {/* Transaction Details */}
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {transaction.description || category?.name || 'Transaction'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {format(transaction.date, 'MMM d, yyyy')} • {category?.name}
            </p>
          </div>
        </div>

        {/* Amount with Currency */}
        <div className="text-right">
          <p className={`font-semibold text-lg ${
            isIncome ? 'text-green-600' : 
            isExpense ? 'text-red-600' :
            'text-blue-600'
          }`}>
            {isIncome ? '+' : isExpense ? '-' : ''}{formatCurrency(transaction.amount, transaction.currency || 'USD')}
          </p>
        </div>
      </div>

      {/* Tags */}
      {transaction.tags && transaction.tags.length > 0 && (
        <div className="flex gap-2 mt-2">
          {transaction.tags.map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs text-gray-600 dark:text-gray-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
} 