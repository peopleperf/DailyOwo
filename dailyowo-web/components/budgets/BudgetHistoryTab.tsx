'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, TrendingUp, Calendar, Info } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { BudgetHistoryChart } from './BudgetHistoryChart';
import { BudgetHistoryData } from '@/lib/financial-logic/budget-period-logic';
import { formatCurrency } from '@/lib/utils/format';

interface BudgetHistoryTabProps {
  history: BudgetHistoryData;
  currency: string;
  recommendations: string[];
}

export function BudgetHistoryTab({ history, currency, recommendations }: BudgetHistoryTabProps) {
  const [chartView, setChartView] = useState<'income-expense' | 'savings-rate' | 'budget-health'>('income-expense');
  const { yearlyOverview } = history;

  const chartViews = [
    { value: 'income-expense', label: 'Income vs Expenses', icon: BarChart },
    { value: 'savings-rate', label: 'Savings Rate', icon: TrendingUp },
    { value: 'budget-health', label: 'Budget Health', icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      {/* Year Overview Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <GlassContainer className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-primary/60">Total Income</p>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-xl font-medium text-primary">
            {formatCurrency(yearlyOverview.totalIncome, { currency })}
          </p>
          <p className="text-xs text-primary/60 mt-1">
            Avg: {formatCurrency(yearlyOverview.averageMonthlyIncome, { currency, compact: true })}/mo
          </p>
        </GlassContainer>

        <GlassContainer className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-primary/60">Total Expenses</p>
            <BarChart className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-xl font-medium text-primary">
            {formatCurrency(yearlyOverview.totalExpenses, { currency })}
          </p>
          <p className="text-xs text-primary/60 mt-1">
            Avg: {formatCurrency(yearlyOverview.averageMonthlyExpenses, { currency, compact: true })}/mo
          </p>
        </GlassContainer>

        <GlassContainer className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-primary/60">Total Savings</p>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-medium text-primary">
            {formatCurrency(yearlyOverview.totalSavings, { currency })}
          </p>
          <p className="text-xs text-primary/60 mt-1">
            {yearlyOverview.totalIncome > 0 
              ? `${((yearlyOverview.totalSavings / yearlyOverview.totalIncome) * 100).toFixed(1)}% of income`
              : 'No income recorded'
            }
          </p>
        </GlassContainer>

        <GlassContainer className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-primary/60">Avg Savings Rate</p>
            <TrendingUp className="w-4 h-4 text-gold" />
          </div>
          <p className={`text-xl font-medium ${
            yearlyOverview.averageSavingsRate >= 20 ? 'text-green-600' :
            yearlyOverview.averageSavingsRate >= 10 ? 'text-blue-600' :
            'text-red-600'
          }`}>
            {yearlyOverview.averageSavingsRate.toFixed(1)}%
          </p>
          <p className="text-xs text-primary/60 mt-1">
            Target: 20%+
          </p>
        </GlassContainer>
      </motion.div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <GlassContainer className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-light text-primary">Budget Trends</h3>
            <div className="flex gap-2">
              {chartViews.map((view) => {
                const Icon = view.icon;
                return (
                  <button
                    key={view.value}
                    onClick={() => setChartView(view.value as any)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      chartView === view.value
                        ? 'bg-gold text-white'
                        : 'bg-gray-100 text-primary hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{view.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <BudgetHistoryChart 
            history={history}
            currency={currency}
            view={chartView}
          />
        </GlassContainer>
      </motion.div>

      {/* Monthly Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <GlassContainer className="p-6">
          <h3 className="text-lg font-light text-primary mb-4">Monthly Performance</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 text-xs font-medium text-primary/60">Month</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-primary/60">Income</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-primary/60">Expenses</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-primary/60">Savings</th>
                  <th className="text-right py-2 px-4 text-xs font-medium text-primary/60">Health</th>
                  <th className="text-center py-2 px-4 text-xs font-medium text-primary/60">Budget</th>
                </tr>
              </thead>
              <tbody>
                {history.months.slice(-6).reverse().map((month) => (
                  <tr key={`${month.year}-${month.month}`} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-primary">
                      {month.monthName}
                      {month.isCurrentMonth && (
                        <span className="ml-2 text-xs text-gold">(Current)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-primary">
                      {formatCurrency(month.actualIncome, { currency, compact: true })}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-primary">
                      {formatCurrency(month.totalSpent, { currency, compact: true })}
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={
                        month.savingsRate >= 20 ? 'text-green-600' :
                        month.savingsRate >= 10 ? 'text-blue-600' :
                        'text-red-600'
                      }>
                        {month.savingsRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={
                        month.budgetHealth >= 80 ? 'text-green-600' :
                        month.budgetHealth >= 60 ? 'text-blue-600' :
                        month.budgetHealth >= 40 ? 'text-yellow-600' :
                        'text-red-600'
                      }>
                        {month.budgetHealth}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-center">
                      {month.hasBudget ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                          None
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassContainer>
      </motion.div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-light text-primary">Budget Recommendations</h3>
            </div>
            
            <div className="space-y-3">
              {recommendations.map((recommendation, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />
                  <p className="text-sm text-blue-900">{recommendation}</p>
                </div>
              ))}
            </div>
          </GlassContainer>
        </motion.div>
      )}
    </div>
  );
} 