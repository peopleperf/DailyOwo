'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, DollarSign, Calculator, X } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { BudgetMethodSelector } from './BudgetMethodSelector';
import { formatCurrency } from '@/lib/utils/format';
import { format } from 'date-fns';

interface NewMonthBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: Date;
  lastMonthIncome?: number;
  currency: string;
  onSubmit: (income: number, method: 'zero-based' | '50-30-20' | 'custom') => void;
}

export function NewMonthBudgetModal({
  isOpen,
  onClose,
  currentMonth,
  lastMonthIncome = 0,
  currency,
  onSubmit
}: NewMonthBudgetModalProps) {
  const [income, setIncome] = useState(lastMonthIncome.toString());
  const [selectedMethod, setSelectedMethod] = useState<'zero-based' | '50-30-20' | 'custom'>('50-30-20');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const incomeAmount = parseFloat(income);
    
    if (isNaN(incomeAmount) || incomeAmount <= 0) {
      setError('Please enter a valid income amount');
      return;
    }

    onSubmit(incomeAmount, selectedMethod);
    onClose();
  };

  const handleIncomeChange = (value: string) => {
    // Only allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setIncome(value);
      setError('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 flex items-center justify-center z-[95] p-4"
          >
            <GlassContainer className="w-full max-w-md p-6 relative">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-primary/60 hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gold" />
                </div>
                <h2 className="text-2xl font-light text-primary mb-2">
                  Start Your {format(currentMonth, 'MMMM yyyy')} Budget
                </h2>
                <p className="text-sm text-primary/60">
                  Let\'s set up your budget for this month
                </p>
              </div>

              {/* Income Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-primary mb-2">
                  What\'s your expected income this month?
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={income}
                    onChange={(e) => handleIncomeChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 text-primary"
                  />
                </div>
                {lastMonthIncome > 0 && (
                  <p className="text-xs text-primary/60 mt-2">
                    Last month: {formatCurrency(lastMonthIncome, { currency })}
                  </p>
                )}
                {error && (
                  <p className="text-xs text-red-500 mt-2">{error}</p>
                )}
              </div>

              {/* Budget Method Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-primary mb-3">
                  Choose your budgeting method
                </label>
                <BudgetMethodSelector
                  currentMethod={selectedMethod}
                  onMethodChange={setSelectedMethod}
                  monthlyIncome={parseFloat(income) || 0}
                  currency={currency}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <GlassButton
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!income || parseFloat(income) <= 0}
                  className="flex-1"
                >
                  Create Budget
                </GlassButton>
              </div>

              <p className="text-xs text-center text-primary/40 mt-4">
                You can adjust your budget allocations anytime
              </p>
            </GlassContainer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 