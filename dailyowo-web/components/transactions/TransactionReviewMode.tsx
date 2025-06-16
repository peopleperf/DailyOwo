'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  XCircle,
  Edit,
  Filter,
  FileUp
} from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { ValidationFeedback, ValidationMessage } from '@/components/ui/ValidationFeedback';
import { formatCurrency } from '@/lib/utils/currency';
import { validateTransaction, ValidationLevel } from '@/lib/utils/input-validation';
import { TRANSACTION_CATEGORIES } from '@/lib/constants/transaction-categories';
import { Transaction } from '@/types/transaction';

export interface ReviewableTransaction extends Partial<Transaction> {
  reviewId: string;
  status: 'pending' | 'approved' | 'rejected' | 'edited';
  validationMessages?: ValidationMessage[];
  suggestedCategory?: string;
  confidence?: number;
  isDuplicate?: boolean;
  similarTransactions?: Transaction[];
}

interface TransactionReviewModeProps {
  transactions: ReviewableTransaction[];
  onReview: (reviewedTransactions: ReviewableTransaction[]) => Promise<void>;
  onClose: () => void;
}

export function TransactionReviewMode({
  transactions,
  onReview,
  onClose
}: TransactionReviewModeProps) {
  const [reviewedTransactions, setReviewedTransactions] = useState<ReviewableTransaction[]>(
    transactions.map(t => ({ ...t, status: 'pending' }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'issues'>('all');
  const [editingField, setEditingField] = useState<string | null>(null);

  const currentTransaction = reviewedTransactions[currentIndex];
  const pendingCount = reviewedTransactions.filter(t => t.status === 'pending').length;
  const approvedCount = reviewedTransactions.filter(t => t.status === 'approved').length;
  const rejectedCount = reviewedTransactions.filter(t => t.status === 'rejected').length;

  useEffect(() => {
    // Validate all transactions on mount
    validateAllTransactions();
  }, []);

  const validateAllTransactions = () => {
    const validated = reviewedTransactions.map(transaction => {
      const validation = validateTransaction(
        {
          type: transaction.type,
          amount: transaction.amount,
          categoryId: transaction.categoryId,
          description: transaction.description,
          date: transaction.date,
        },
        ValidationLevel.NORMAL
      );

      const messages: ValidationMessage[] = [
        ...validation.errors.map(e => ({ type: 'error' as const, message: e.message, field: e.field })),
        ...validation.warnings.map(w => ({ type: 'warning' as const, message: w.message, field: w.field }))
      ];

      return {
        ...transaction,
        validationMessages: messages
      };
    });

    setReviewedTransactions(validated);
  };

  const handleApprove = () => {
    updateTransactionStatus(currentIndex, 'approved');
    if (currentIndex < reviewedTransactions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleReject = () => {
    updateTransactionStatus(currentIndex, 'rejected');
    if (currentIndex < reviewedTransactions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const updateTransactionStatus = (index: number, status: ReviewableTransaction['status']) => {
    setReviewedTransactions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status };
      return updated;
    });
  };

  const handleEdit = (field: string, value: any) => {
    setReviewedTransactions(prev => {
      const updated = [...prev];
      updated[currentIndex] = {
        ...updated[currentIndex],
        [field]: value,
        status: 'edited'
      };
      return updated;
    });
    setEditingField(null);
    
    // Revalidate after edit
    setTimeout(validateAllTransactions, 100);
  };

  const handleBulkApprove = () => {
    setReviewedTransactions(prev => 
      prev.map(t => ({
        ...t,
        status: t.status === 'pending' && (!t.validationMessages || t.validationMessages.filter(m => m.type === 'error').length === 0) 
          ? 'approved' 
          : t.status
      }))
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onReview(reviewedTransactions.filter(t => t.status !== 'rejected'));
      onClose();
    } catch (error) {
      console.error('Error submitting reviewed transactions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredTransactions = () => {
    switch (filter) {
      case 'pending':
        return reviewedTransactions.map((t, i) => ({ ...t, index: i }))
          .filter(t => t.status === 'pending');
      case 'issues':
        return reviewedTransactions.map((t, i) => ({ ...t, index: i }))
          .filter(t => t.validationMessages && t.validationMessages.length > 0);
      default:
        return reviewedTransactions.map((t, i) => ({ ...t, index: i }));
    }
  };

  const filteredTransactions = getFilteredTransactions();

  if (!currentTransaction) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassContainer className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-light text-primary">Review Imported Transactions</h2>
              <p className="text-sm text-primary/60 mt-1">
                Review and approve transactions before importing
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-primary/60" />
            </button>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-light">{reviewedTransactions.length}</p>
              <p className="text-xs text-primary/60">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-light text-yellow-600">{pendingCount}</p>
              <p className="text-xs text-primary/60">Pending</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-light text-green-600">{approvedCount}</p>
              <p className="text-xs text-primary/60">Approved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-light text-red-600">{rejectedCount}</p>
              <p className="text-xs text-primary/60">Rejected</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <Filter className="w-4 h-4 text-primary/60" />
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-primary hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All ({reviewedTransactions.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'pending' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-primary hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('issues')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'issues' 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-primary hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Has Issues ({reviewedTransactions.filter(t => t.validationMessages?.length).length})
          </button>
        </div>

        {/* Transaction Review */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTransaction.reviewId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Transaction Details */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary/60">
                      Transaction {currentIndex + 1} of {reviewedTransactions.length}
                    </span>
                    {currentTransaction.status !== 'pending' && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        currentTransaction.status === 'approved' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : currentTransaction.status === 'rejected'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {currentTransaction.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                      disabled={currentIndex === 0}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentIndex(Math.min(reviewedTransactions.length - 1, currentIndex + 1))}
                      disabled={currentIndex === reviewedTransactions.length - 1}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Amount */}
                  <div>
                    <label className="text-xs text-primary/60 uppercase tracking-wide">Amount</label>
                    {editingField === 'amount' ? (
                      <GlassInput
                        type="number"
                        value={currentTransaction.amount}
                        onChange={(e) => handleEdit('amount', parseFloat(e.target.value))}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-lg font-medium flex items-center gap-2">
                        {formatCurrency(currentTransaction.amount || 0, currentTransaction.currency || 'USD')}
                        <button
                          onClick={() => setEditingField('amount')}
                          className="text-primary/40 hover:text-primary"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </p>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-xs text-primary/60 uppercase tracking-wide">Date</label>
                    {editingField === 'date' ? (
                      <GlassInput
                        type="date"
                        value={currentTransaction.date?.toISOString().split('T')[0]}
                        onChange={(e) => handleEdit('date', new Date(e.target.value))}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-lg font-medium flex items-center gap-2">
                        {currentTransaction.date?.toLocaleDateString()}
                        <button
                          onClick={() => setEditingField('date')}
                          className="text-primary/40 hover:text-primary"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-xs text-primary/60 uppercase tracking-wide">Category</label>
                    {editingField === 'categoryId' ? (
                      <select
                        value={currentTransaction.categoryId}
                        onChange={(e) => handleEdit('categoryId', e.target.value)}
                        onBlur={() => setEditingField(null)}
                        autoFocus
                        className="mt-1 w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <option value="">Select category</option>
                        {TRANSACTION_CATEGORIES
                          .filter(cat => cat.type === currentTransaction.type)
                          .map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))
                        }
                      </select>
                    ) : (
                      <p className="text-lg font-medium flex items-center gap-2">
                        {TRANSACTION_CATEGORIES.find(c => c.id === currentTransaction.categoryId)?.name || 'Uncategorized'}
                        <button
                          onClick={() => setEditingField('categoryId')}
                          className="text-primary/40 hover:text-primary"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </p>
                    )}
                  </div>

                  {/* Type */}
                  <div>
                    <label className="text-xs text-primary/60 uppercase tracking-wide">Type</label>
                    <p className={`text-lg font-medium ${
                      currentTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {currentTransaction.type}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-4">
                  <label className="text-xs text-primary/60 uppercase tracking-wide">Description</label>
                  {editingField === 'description' ? (
                    <GlassInput
                      type="text"
                      value={currentTransaction.description}
                      onChange={(e) => handleEdit('description', e.target.value)}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className="mt-1 w-full"
                    />
                  ) : (
                    <p className="text-sm text-primary/80 flex items-center gap-2">
                      {currentTransaction.description || 'No description'}
                      <button
                        onClick={() => setEditingField('description')}
                        className="text-primary/40 hover:text-primary"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                    </p>
                  )}
                </div>
              </div>

              {/* Validation Messages */}
              {currentTransaction.validationMessages && currentTransaction.validationMessages.length > 0 && (
                <ValidationFeedback messages={currentTransaction.validationMessages} />
              )}

              {/* Duplicate Warning */}
              {currentTransaction.isDuplicate && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Possible Duplicate Transaction
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        This transaction appears similar to existing transactions. Please review carefully.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Suggestion */}
              {currentTransaction.suggestedCategory && currentTransaction.confidence && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm">
                    <span className="font-medium">AI Suggestion:</span> Category "{
                      TRANSACTION_CATEGORIES.find(c => c.id === currentTransaction.suggestedCategory)?.name
                    }" with {Math.round(currentTransaction.confidence * 100)}% confidence
                  </p>
                  <button
                    onClick={() => handleEdit('categoryId', currentTransaction.suggestedCategory)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
                  >
                    Apply suggestion
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={handleReject}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </GlassButton>
              <GlassButton
                onClick={handleApprove}
                goldBorder
                className="flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </GlassButton>
              {pendingCount > 10 && (
                <GlassButton
                  onClick={handleBulkApprove}
                  variant="secondary"
                  className="flex items-center gap-2 ml-4"
                >
                  <Check className="w-4 h-4" />
                  Approve All Valid
                </GlassButton>
              )}
            </div>
            <GlassButton
              onClick={handleSubmit}
              disabled={isSubmitting || approvedCount === 0}
              className="flex items-center gap-2"
            >
              <FileUp className="w-4 h-4" />
              Import {approvedCount} Transaction{approvedCount !== 1 ? 's' : ''}
            </GlassButton>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
} 