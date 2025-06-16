'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { TrendingUp, DollarSign } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { BudgetData } from '@/lib/financial-logic/budget-logic';
import { formatCurrency } from '@/lib/utils/format';
import { BudgetHealthScore } from './BudgetHealthScore';
import { BudgetSummaryCards } from './BudgetSummaryCards';
import { BudgetAllocationChart } from './BudgetAllocationChart';
import { BudgetAlerts } from './BudgetAlerts';

interface BudgetOverviewTabProps {
  budgetData: BudgetData;
  currency: string;
  onRefresh?: () => void;
}

export function BudgetOverviewTab({ budgetData, currency, onRefresh }: BudgetOverviewTabProps) {
  const router = useRouter();
  const { currentBudget, budgetHealth, totalIncome, totalSpent, totalAllocated, totalSavings, alerts } = budgetData;

  if (!currentBudget) {
    return (
      <div className="text-center py-12">
        <p className="text-primary/60">No budget data available</p>
      </div>
    );
  }

  const budgetUtilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Budget Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <BudgetHealthScore 
          score={budgetHealth.score} 
          status={budgetHealth.status}
          suggestions={budgetHealth.suggestions}
        />
      </motion.div>

      {/* Key Metrics Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <BudgetSummaryCards
          totalIncome={totalIncome}
          totalSpent={totalSpent}
          totalAllocated={totalAllocated}
          totalExpenseAllocated={budgetData.totalExpenseAllocated}
          totalSavingsAllocated={budgetData.totalSavingsAllocated}
          savingsAmount={totalSavings}
          savingsRate={savingsRate}
          budgetUtilization={budgetUtilization}
          cashAtHand={budgetData.cashAtHand}
          currency={currency}
        />
      </motion.div>

      {/* Budget Allocation Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <GlassContainer className="p-6">
          <h3 className="text-lg font-light text-primary mb-4">Budget Allocation</h3>
          <BudgetAllocationChart 
            categories={currentBudget.categories}
            currency={currency}
          />
        </GlassContainer>
      </motion.div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <BudgetAlerts alerts={alerts} />
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <GlassContainer 
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => {/* TODO: Implement AI optimization */}}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Optimize Budget</p>
              <p className="text-xs text-primary/60">Get AI suggestions</p>
            </div>
          </div>
        </GlassContainer>

        <GlassContainer 
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => router.push('/transactions/new')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">Add Transaction</p>
              <p className="text-xs text-primary/60">Track spending</p>
            </div>
          </div>
        </GlassContainer>
      </motion.div>
    </div>
  );
} 