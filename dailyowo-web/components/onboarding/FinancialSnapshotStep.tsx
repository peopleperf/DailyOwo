'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Icon } from '@/components/ui/Icon';
import { formatCurrency } from '@/lib/utils/format';
import {
  calculateQuickNetWorth,
  calculateQuickMonthlySavings,
  calculateQuickSavingsRate,
} from '../../lib/financial-logic/quick-preview-logic';
import { DollarSign, CreditCard, PiggyBank, TrendingDown, Plus, X } from 'lucide-react';

interface ExpenseCategory {
  id: string;
  name: string;
  amount: string;
}

interface FinancialSnapshotStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function FinancialSnapshotStep({ data, onNext, onBack, onSkip }: FinancialSnapshotStepProps) {
  const t = useTranslations('onboarding.financialSnapshot');
  const tCommon = useTranslations('common');
  
  const [showExpenseBreakdown, setShowExpenseBreakdown] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([
    { id: '1', name: 'Rent/Mortgage', amount: '' },
    { id: '2', name: 'Utilities', amount: '' },
    { id: '3', name: 'Groceries', amount: '' },
    { id: '4', name: 'Transportation', amount: '' },
  ]);
  
  const [finances, setFinances] = useState({
    monthlyIncome: data.monthlyIncome || '',
    monthlyExpenses: data.monthlyExpenses || '',
    currentSavings: data.currentSavings || '',
    currentDebt: data.currentDebt || '',
  });

  const [calculations, setCalculations] = useState({
    monthlySavings: 0,
    savingsRate: 0,
    netWorth: 0,
  });

  // Calculate total expenses from breakdown
  useEffect(() => {
    if (showExpenseBreakdown) {
      const total = expenseCategories.reduce((sum, cat) => {
        return sum + (parseFloat(cat.amount) || 0);
      }, 0);
      setFinances(prev => ({ ...prev, monthlyExpenses: total.toString() }));
    }
  }, [expenseCategories, showExpenseBreakdown]);

  // Calculate financial metrics
  useEffect(() => {
    const income = parseFloat(finances.monthlyIncome) || 0;
    const expenses = parseFloat(finances.monthlyExpenses) || 0;
    const savings = parseFloat(finances.currentSavings) || 0;
    const debt = parseFloat(finances.currentDebt) || 0;

    const monthlySavings = calculateQuickMonthlySavings(income, expenses);
    const savingsRate = calculateQuickSavingsRate(income, monthlySavings);
    const netWorth = calculateQuickNetWorth(savings, debt);

    setCalculations({
      monthlySavings,
      savingsRate,
      netWorth,
    });
  }, [finances]);

  const handleChange = (field: string, value: string) => {
    // Only allow numbers and decimals
    if (value && !/^\d*\.?\d*$/.test(value)) return;
    
    setFinances(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCategoryChange = (id: string, field: 'name' | 'amount', value: string) => {
    if (field === 'amount' && value && !/^\d*\.?\d*$/.test(value)) return;
    
    setExpenseCategories(prev => 
      prev.map(cat => 
        cat.id === id ? { ...cat, [field]: value } : cat
      )
    );
  };

  const addCategory = () => {
    setExpenseCategories(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', amount: '' }
    ]);
  };

  const removeCategory = (id: string) => {
    setExpenseCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const handleContinue = () => {
    const dataToSave = {
      ...finances,
      expenseBreakdown: showExpenseBreakdown ? expenseCategories : null
    };
    onNext(dataToSave);
  };

  const currencySymbol = data.currencySymbol || '$';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      <GlassContainer className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-16 h-16 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <DollarSign className="w-8 h-8 text-gold" />
          </motion.div>
          <h2 className="text-2xl font-bold text-primary mb-2">
            {t('title')}
          </h2>
          <p className="text-primary/60 text-sm">
            {t('subtitle')}
          </p>
        </div>

        {/* Financial inputs */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t('monthlyIncome')}
            </label>
            <GlassInput
              type="text"
              value={finances.monthlyIncome}
              onChange={(e) => handleChange('monthlyIncome', e.target.value)}
              placeholder="5000"
              icon={<DollarSign size={18} />}
              className="text-lg"
            />
            <p className="text-xs text-primary/50 mt-1">{t('monthlyIncomeHelper')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t('monthlyExpenses')}
              {!showExpenseBreakdown && (
                <button
                  onClick={() => setShowExpenseBreakdown(true)}
                  className="ml-2 text-xs text-gold hover:text-gold-dark transition-colors"
                >
                  Break down expenses
                </button>
              )}
            </label>
            {!showExpenseBreakdown ? (
              <>
                <GlassInput
                  type="text"
                  value={finances.monthlyExpenses}
                  onChange={(e) => handleChange('monthlyExpenses', e.target.value)}
                  placeholder="3500"
                  icon={<CreditCard size={18} />}
                  className="text-lg"
                />
                <p className="text-xs text-primary/50 mt-1">{t('monthlyExpensesHelper')}</p>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <AnimatePresence>
                  {expenseCategories.map((category, index) => (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => handleCategoryChange(category.id, 'name', e.target.value)}
                        placeholder="Category"
                        className="glass-input flex-1 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={category.amount}
                        onChange={(e) => handleCategoryChange(category.id, 'amount', e.target.value)}
                        placeholder="0"
                        className="glass-input w-24 py-2 text-sm"
                      />
                      <button
                        onClick={() => removeCategory(category.id)}
                        className="p-2 text-primary/40 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <button
                  onClick={addCategory}
                  className="flex items-center gap-1 text-xs text-gold hover:text-gold-dark transition-colors mt-2"
                >
                  <Plus size={14} />
                  Add category
                </button>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm font-medium text-primary">Total</span>
                  <span className="text-sm font-semibold text-primary">
                    {formatCurrency(
                      expenseCategories.reduce((sum, cat) => sum + (parseFloat(cat.amount) || 0), 0),
                      { currency: data.currency }
                    )}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t('currentSavings')}
            </label>
            <GlassInput
              type="text"
              value={finances.currentSavings}
              onChange={(e) => handleChange('currentSavings', e.target.value)}
              placeholder="10000"
              icon={<PiggyBank size={18} />}
              className="text-lg"
            />
            <p className="text-xs text-primary/50 mt-1">{t('currentSavingsHelper')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {t('currentDebt')}
            </label>
            <GlassInput
              type="text"
              value={finances.currentDebt}
              onChange={(e) => handleChange('currentDebt', e.target.value)}
              placeholder="0"
              icon={<TrendingDown size={18} />}
              className="text-lg"
            />
            <p className="text-xs text-primary/50 mt-1">{t('currentDebtHelper')}</p>
          </div>
        </div>

        {/* Preview calculations */}
        <AnimatePresence>
          {(finances.monthlyIncome || finances.monthlyExpenses) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-subtle p-4 rounded-xl mb-6">
                <h3 className="font-semibold text-primary mb-3 text-sm">{t('preview')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-primary/60 mb-1">{t('monthlySavings')}</p>
                    <p className={`font-semibold ${calculations.monthlySavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(calculations.monthlySavings), { currency: data.currency, compact: true })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-primary/60 mb-1">{tCommon('saveRate')}</p>
                    <p className={`font-semibold ${calculations.savingsRate >= 20 ? 'text-green-600' : calculations.savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {calculations.savingsRate.toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-primary/60 mb-1">{t('netWorth')}</p>
                    <p className={`font-semibold ${calculations.netWorth >= 0 ? 'text-primary' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(calculations.netWorth), { currency: data.currency, compact: true })}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info note */}
        <div className="glass-subtle p-3 rounded-lg mb-6 flex items-start gap-2">
          <Icon name="info" size="xs" className="text-gold mt-0.5" />
          <p className="text-xs text-primary/60">
            {t('dontWorry')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <GlassButton
            variant="ghost"
            onClick={onBack}
          >
            <Icon name="arrowLeft" size="sm" className="mr-2" />
            {tCommon('back')}
          </GlassButton>
          <div className="flex gap-3">
            <GlassButton
              variant="ghost"
              onClick={onSkip}
            >
              {tCommon('skipForNow')}
            </GlassButton>
            <GlassButton
              variant="primary"
              goldBorder
              onClick={handleContinue}
            >
              {tCommon('continue')}
              <Icon name="arrowRight" size="sm" className="ml-2" />
            </GlassButton>
          </div>
        </div>
      </GlassContainer>
    </motion.div>
  );
} 