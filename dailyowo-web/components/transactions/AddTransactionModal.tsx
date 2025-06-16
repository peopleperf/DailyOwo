'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { useAuth } from '@/hooks/useAuth';
import { TRANSACTION_CATEGORIES } from '@/lib/constants/transaction-categories';
import { transactionBudgetSync } from '@/lib/services/transaction-budget-sync';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';
import { Transaction } from '@/types/transaction';
import { BudgetImpactPreview } from './BudgetImpactPreview';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { createTransaction } from '@/services/transaction-service';
import { ValidationFeedback, InlineValidation, ValidationMessage } from '@/components/ui/ValidationFeedback';
import { SyncStatusIndicator } from '@/components/ui/SyncStatusIndicator';
import { validateTransaction, ValidationLevel } from '@/lib/utils/input-validation';
import { formatCurrency } from '@/lib/utils/currency';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialType?: 'income' | 'expense' | 'asset' | 'liability';
}

export function AddTransactionModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialType = 'expense' 
}: AddTransactionModalProps) {
  const { user, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [validationMessages, setValidationMessages] = useState<ValidationMessage[]>([]);
  const [fieldValidation, setFieldValidation] = useState<{[key: string]: { error?: string; warning?: string }}>({});
  
  // Form state
  const [type, setType] = useState<'income' | 'expense' | 'asset' | 'liability'>(initialType);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  // Budget impact preview
  const [showBudgetPreview, setShowBudgetPreview] = useState(false);
  const [budgetImpact, setBudgetImpact] = useState<any>(null);

  const filteredCategories = TRANSACTION_CATEGORIES.filter(cat => cat.type === type);

  const handleAmountChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(cleanValue);
    
    // Validate amount
    if (cleanValue) {
      validateField('amount', parseFloat(cleanValue));
    }
    
    // Update budget preview when amount changes
    if (cleanValue && selectedCategory && type === 'expense') {
      updateBudgetPreview(cleanValue, selectedCategory);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    validateField('categoryId', category);
    
    // Update budget preview when category changes
    if (amount && category && type === 'expense') {
      updateBudgetPreview(amount, category);
    }
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    validateField('date', new Date(value));
  };

  const updateBudgetPreview = async (amountStr: string, categoryId: string) => {
    if (!user) return;
    
    try {
      const preview = await transactionBudgetSync.previewBudgetImpact({
        type: 'expense',
        amount: parseFloat(amountStr),
        categoryId,
        date: new Date(date),
      }, user.uid);
      
      setBudgetImpact(preview);
      setShowBudgetPreview(true);
    } catch (error) {
      console.error('Error getting budget preview:', error);
    }
  };

  // Real-time validation
  const validateField = (field: string, value: any) => {
    const validation = validateTransaction(
      { [field]: value, type },
      ValidationLevel.PARTIAL,
      {
        monthlyIncome: userProfile?.monthlyIncome,
      }
    );

    const fieldErrors = validation.errors.filter(e => e.field === field);
    const fieldWarnings = validation.warnings.filter(w => w.field === field);

    setFieldValidation(prev => ({
      ...prev,
      [field]: {
        error: fieldErrors[0]?.message,
        warning: fieldWarnings[0]?.message,
      }
    }));
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    const formData = {
      type,
      amount: parseFloat(amount),
      categoryId: selectedCategory,
      categoryType: 'global' as const,
      description,
      date: new Date(date),
      isRecurring: false,
    };

    // Full validation before submission
    const validation = validateTransaction(formData, ValidationLevel.STRICT, {
      monthlyIncome: userProfile?.monthlyIncome,
    });
    
    if (!validation.isValid && validation.errors.length > 0) {
      setValidationMessages(
        validation.errors.map(err => ({ type: 'error' as const, message: err.message }))
      );
      return;
    }

    // Show warnings but allow submission
    if (validation.warnings.length > 0) {
      setValidationMessages(
        validation.warnings.map(warn => ({ type: 'warning' as const, message: warn.message }))
      );
    }

    setIsLoading(true);
    setError(null);
    setSyncStatus('syncing');

    try {
      const transactionId = await createTransaction({
        ...formData,
        currency: 'USD',
        userId: user!.uid,
        createdBy: user!.uid,
      });

      if (transactionId) {
        setSyncStatus('synced');
        
        // Reset form
        setAmount('');
        setSelectedCategory('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setValidationMessages([]);
        setFieldValidation({});
        setBudgetImpact(null);
        setShowBudgetPreview(false);
        
        onSuccess?.();
        onClose();
      } else {
        throw new Error('Failed to create transaction');
      }
    } catch (err: any) {
      setSyncStatus('error');
      const errorMessage = err.message || 'Failed to add transaction';
      setError(errorMessage);
      
      // Check if it's a validation error
      if (errorMessage.includes('Validation failed')) {
        setValidationMessages([{ type: 'error', message: errorMessage }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = amount && parseFloat(amount) > 0 && selectedCategory && date;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <GlassContainer className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-light text-primary">Add Transaction</h2>
            <div className="flex items-center gap-2">
              <SyncStatusIndicator 
                status={syncStatus} 
                showDetails={false}
              />
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-primary/60" />
              </button>
            </div>
          </div>
          <p className="text-sm text-primary/60 mb-6">
            Add a new income or expense transaction
          </p>

          <div className="space-y-6">
            {/* Validation Messages */}
            <ValidationFeedback messages={validationMessages} />

            {/* Transaction Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">Transaction Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setType('income')}
                  className={`p-3 rounded-lg border transition-colors ${
                    type === 'income' 
                      ? 'bg-green-100 dark:bg-green-900/30 border-green-500' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm">Income</span>
                </button>
                <button
                  onClick={() => setType('expense')}
                  className={`p-3 rounded-lg border transition-colors ${
                    type === 'expense' 
                      ? 'bg-red-100 dark:bg-red-900/30 border-red-500' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <TrendingDown className="w-4 h-4 mx-auto mb-1" />
                  <span className="text-sm">Expense</span>
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-primary">Amount</label>
              <div className="relative">
                <GlassInput
                  id="amount"
                  type="text"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className={`pl-8 ${fieldValidation.amount?.error ? 'border-red-500' : ''}`}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60">
                  $
                </span>
              </div>
              <InlineValidation 
                error={fieldValidation.amount?.error}
                warning={fieldValidation.amount?.warning}
              />
              {parseFloat(amount) > 0 && (
                <p className="text-sm text-primary/60">
                  {formatCurrency(parseFloat(amount), 'USD')}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-primary">Category</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                  fieldValidation.categoryId?.error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <option value="">Select a category</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              <InlineValidation 
                error={fieldValidation.categoryId?.error}
                warning={fieldValidation.categoryId?.warning}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium text-primary">Date</label>
              <GlassInput
                id="date"
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className={fieldValidation.date?.error ? 'border-red-500' : ''}
              />
              <InlineValidation 
                error={fieldValidation.date?.error}
                warning={fieldValidation.date?.warning}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-primary">Description (Optional)</label>
              <textarea
                id="description"
                placeholder="Add a note about this transaction"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full px-4 py-2 bg-white dark:bg-gray-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none ${
                  fieldValidation.description?.error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
                }`}
              />
              <InlineValidation 
                error={fieldValidation.description?.error}
                warning={fieldValidation.description?.warning}
              />
            </div>

            {/* Budget Impact Preview */}
            {showBudgetPreview && budgetImpact && type === 'expense' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">Budget Impact</label>
                <BudgetImpactPreview
                  transaction={{
                    type: 'expense',
                    amount: parseFloat(amount),
                    categoryId: selectedCategory,
                    date: new Date(date),
                  }}
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <GlassButton
                variant="secondary"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </GlassButton>
              <GlassButton
                goldBorder
                className="flex-1"
                onClick={handleSubmit}
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Transaction'
                )}
              </GlassButton>
            </div>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
} 