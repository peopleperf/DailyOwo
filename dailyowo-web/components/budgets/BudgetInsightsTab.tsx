'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Lightbulb, Target, Calendar, DollarSign } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { BudgetData } from '@/lib/financial-logic/budget-logic';
import { formatCurrency } from '@/lib/utils/format';
import { BudgetTrendChart } from './BudgetTrendChart';
import { BudgetOptimizationCard } from './BudgetOptimizationCard';

interface BudgetInsightsTabProps {
  budgetData: BudgetData;
  currency: string;
}

export function BudgetInsightsTab({ budgetData, currency }: BudgetInsightsTabProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const { currentBudget, budgetHealth } = budgetData;
  
  // These properties might not exist yet in the BudgetData type
  const trends = (budgetData as any).trends || {};
  const insights = (budgetData as any).insights || {};
  const goals = (budgetData as any).goals || [];

  if (!currentBudget) {
    return (
      <div className="text-center py-12">
        <p className="text-primary/60">No budget insights available</p>
      </div>
    );
  }

  const periods = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'quarter', label: 'Quarter' }
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-light text-primary">Budget Insights</h3>
        <div className="flex gap-2">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => setSelectedPeriod(period.value as any)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                selectedPeriod === period.value
                  ? 'bg-gold text-white'
                  : 'bg-gray-100 text-primary hover:bg-gray-200'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spending Trends */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GlassContainer className="p-6">
          <h4 className="text-lg font-light text-primary mb-4">Spending Trends</h4>
          <BudgetTrendChart 
            trends={trends}
            period={selectedPeriod}
            currency={currency}
          />
        </GlassContainer>
      </motion.div>

      {/* Key Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Spending Patterns */}
        <GlassContainer className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h5 className="text-sm font-medium text-primary">Spending Patterns</h5>
              <p className="text-xs text-primary/60">Based on last 3 months</p>
            </div>
          </div>
          <div className="space-y-3">
            {insights?.spendingPatterns ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-primary/70">Highest spending day</span>
                  <span className="text-sm font-medium text-primary">{insights.spendingPatterns.highestDay || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-primary/70">Peak spending time</span>
                  <span className="text-sm font-medium text-primary">{insights.spendingPatterns.peakTime || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-primary/70">Most frequent category</span>
                  <span className="text-sm font-medium text-primary">{insights.spendingPatterns.topCategory || 'N/A'}</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-primary/40">No spending patterns available yet</p>
            )}
          </div>
        </GlassContainer>

        {/* Savings Opportunities */}
        <GlassContainer className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h5 className="text-sm font-medium text-primary">Savings Opportunities</h5>
              <p className="text-xs text-primary/60">AI-powered suggestions</p>
            </div>
          </div>
          <div className="space-y-3">
            {insights?.savingsOpportunities && insights.savingsOpportunities.length > 0 ? (
              insights.savingsOpportunities.slice(0, 3).map((opp: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-primary/70">{opp.description}</span>
                  <span className="text-sm font-medium text-green-600">+${opp.amount}/mo</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-primary/40">Analyzing spending patterns...</p>
            )}
          </div>
        </GlassContainer>
      </motion.div>

      {/* AI Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-5 h-5 text-gold" />
          <h4 className="text-lg font-light text-primary">AI Recommendations</h4>
        </div>

        {insights?.recommendations?.map((rec: any, index: number) => (
          <BudgetOptimizationCard
            key={index}
            recommendation={rec}
            onApply={() => console.log('Apply recommendation:', rec)}
          />
        ))}
      </motion.div>

      {/* Budget Goals Progress */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <GlassContainer className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              <h4 className="text-lg font-light text-primary">Budget Goals</h4>
            </div>
            <GlassButton size="sm" goldBorder>
              Set New Goal
            </GlassButton>
          </div>

          <div className="space-y-4">
            {goals && goals.length > 0 ? (
              goals.map((goal: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-primary">{goal.name}</span>
                    <span className={`text-sm font-medium ${
                      goal.status === 'on-track' ? 'text-green-600' : 
                      goal.status === 'at-risk' ? 'text-yellow-600' : 
                      'text-blue-600'
                    }`}>
                      {goal.statusText}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`h-full rounded-full ${
                        goal.status === 'on-track' ? 'bg-green-500' : 
                        goal.status === 'at-risk' ? 'bg-yellow-500' : 
                        'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-primary/40 text-center py-4">
                No budget goals set yet. Click "Set New Goal" to get started.
              </p>
            )}
          </div>
        </GlassContainer>
      </motion.div>
    </div>
  );
}