'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { format, addMonths, subMonths, isSameMonth } from 'date-fns';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { formatCurrency } from '@/lib/utils/format';
import { MonthlyBudgetData } from '@/lib/financial-logic/budget-period-logic';

interface BudgetMonthNavigatorProps {
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  monthlyData?: MonthlyBudgetData;
  currency: string;
  onCreateBudget?: () => void;
}

export function BudgetMonthNavigator({
  currentMonth,
  onMonthChange,
  monthlyData,
  currency,
  onCreateBudget
}: BudgetMonthNavigatorProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const isCurrentMonth = isSameMonth(currentMonth, new Date());

  const handlePreviousMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1);
    if (nextMonth <= new Date()) {
      onMonthChange(nextMonth);
    }
  };

  const handleMonthSelect = (month: number, year: number) => {
    const selectedDate = new Date(year, month);
    if (selectedDate <= new Date()) {
      onMonthChange(selectedDate);
      setShowCalendar(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="mb-6">
      {/* Month Navigation Bar */}
      <GlassContainer className="p-4 relative overflow-visible">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Navigation Buttons */}
            <div className="flex items-center gap-2 relative">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5 text-primary" />
              </button>

              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-lg font-medium text-primary">
                  {format(currentMonth, 'MMMM yyyy')}
                </span>
              </button>

              <button
                onClick={handleNextMonth}
                disabled={addMonths(currentMonth, 1) > new Date()}
                className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                  addMonths(currentMonth, 1) > new Date() 
                    ? 'opacity-50 cursor-not-allowed' 
                    : ''
                }`}
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5 text-primary" />
              </button>
            </div>

            {/* Current Month Indicator */}
            {isCurrentMonth && (
              <span className="px-3 py-1 bg-gold/10 text-gold text-xs font-medium rounded-full">
                Current Month
              </span>
            )}
          </div>

          {/* Month Summary */}
          {monthlyData && (
            <div className="flex items-center gap-6">
              {/* Income vs Budget */}
              <div className="text-right">
                <p className="text-xs text-primary/60">Income</p>
                <p className="text-sm font-medium text-primary">
                  {formatCurrency(monthlyData.actualIncome, { currency })}
                  {monthlyData.plannedIncome > 0 && (
                    <span className="text-xs text-primary/60 ml-1">
                      / {formatCurrency(monthlyData.plannedIncome, { currency, compact: true })}
                    </span>
                  )}
                </p>
              </div>

              {/* Health Score */}
              {monthlyData.hasBudget && (
                <div className="text-right">
                  <p className="text-xs text-primary/60">Health</p>
                  <p className={`text-sm font-medium ${getHealthColor(monthlyData.budgetHealth)}`}>
                    {monthlyData.budgetHealth}%
                  </p>
                </div>
              )}

              {/* No Budget Warning */}
              {!monthlyData.hasBudget && monthlyData.actualIncome > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs text-yellow-600">No budget set</span>
                  {onCreateBudget && (
                    <GlassButton
                      size="sm"
                      variant="secondary"
                      onClick={onCreateBudget}
                      className="ml-2"
                    >
                      Create Budget
                    </GlassButton>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Calendar Dropdown */}
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-[9999] min-w-[280px]"
            style={{ zIndex: 9999 }}
          >
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date(currentMonth.getFullYear(), i);
                const isDisabled = date > new Date();
                const isSelected = i === currentMonth.getMonth();

                return (
                  <button
                    key={i}
                    disabled={isDisabled}
                    onClick={() => handleMonthSelect(i, currentMonth.getFullYear())}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-gold text-white'
                        : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-gray-100 text-primary'
                    }`}
                  >
                    {format(date, 'MMM')}
                  </button>
                );
              })}
            </div>

            {/* Year Selector */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => onMonthChange(subMonths(currentMonth, 12))}
                  className="text-sm text-primary hover:text-gold transition-colors"
                >
                  ← {currentMonth.getFullYear() - 1}
                </button>
                <span className="text-sm font-medium text-primary">
                  {currentMonth.getFullYear()}
                </span>
                {currentMonth.getFullYear() < new Date().getFullYear() && (
                  <button
                    onClick={() => onMonthChange(addMonths(currentMonth, 12))}
                    className="text-sm text-primary hover:text-gold transition-colors"
                  >
                    {currentMonth.getFullYear() + 1} →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </GlassContainer>

      {/* Income-Based Budget Recommendation */}
      {monthlyData && !monthlyData.hasBudget && monthlyData.actualIncome === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <GlassContainer className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  No Income Recorded
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Budgets are created based on your monthly income. Record income transactions first to enable budget allocation for this month.
                </p>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      )}
    </div>
  );
} 