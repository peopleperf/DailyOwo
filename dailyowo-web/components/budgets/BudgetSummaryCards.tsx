'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { formatCurrency } from '@/lib/utils/format';

interface BudgetSummaryCardsProps {
  totalIncome: number;
  totalSpent: number;
  totalAllocated: number;
  totalExpenseAllocated?: number;
  totalSavingsAllocated?: number;
  savingsAmount: number;
  savingsRate: number;
  budgetUtilization: number;
  cashAtHand?: number;
  currency: string;
}

export function BudgetSummaryCards({
  totalIncome,
  totalSpent,
  totalAllocated,
  totalExpenseAllocated,
  totalSavingsAllocated,
  savingsAmount,
  savingsRate,
  budgetUtilization,
  cashAtHand,
  currency
}: BudgetSummaryCardsProps) {
  const cards = [
    {
      title: 'Total Income',
      value: formatCurrency(totalIncome, { currency, compact: totalIncome >= 10000 }),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'from-green-500/10 to-green-500/5',
      iconBg: 'bg-green-500/10',
      trend: null,
    },
    {
      title: 'Total Spent',
      value: formatCurrency(totalSpent, { currency, compact: totalSpent >= 10000 }),
      icon: TrendingDown,
      color: budgetUtilization > 100 ? 'text-red-600' : budgetUtilization > 80 ? 'text-yellow-600' : 'text-blue-600',
      bgColor: budgetUtilization > 100 ? 'from-red-500/10 to-red-500/5' : budgetUtilization > 80 ? 'from-yellow-500/10 to-yellow-500/5' : 'from-blue-500/10 to-blue-500/5',
      iconBg: budgetUtilization > 100 ? 'bg-red-500/10' : budgetUtilization > 80 ? 'bg-yellow-500/10' : 'bg-blue-500/10',
      trend: {
        value: `${budgetUtilization.toFixed(0)}%`,
        label: 'of allocated',
      },
      subtitle: 'Expenses + Debt + Savings',
    },
    {
      title: 'Allocated',
      value: formatCurrency(totalExpenseAllocated || totalAllocated, { currency, compact: totalAllocated >= 10000 }),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'from-purple-500/10 to-purple-500/5',
      iconBg: 'bg-purple-500/10',
      trend: {
        value: totalIncome > 0 ? `${(((totalExpenseAllocated || totalAllocated) / totalIncome) * 100).toFixed(0)}%` : '0%',
        label: 'of income',
      },
      subtitle: 'Based on budget method',
    },
    {
      title: 'Cash at Hand',
      value: formatCurrency(cashAtHand ?? (totalIncome - totalSpent - savingsAmount), { currency, compact: (cashAtHand ?? 0) >= 10000 }),
      icon: PiggyBank,
      color: (cashAtHand ?? 0) > 0 ? 'text-green-600' : 'text-red-600',
      bgColor: (cashAtHand ?? 0) > 0 ? 'from-green-500/10 to-green-500/5' : 'from-red-500/10 to-red-500/5',
      iconBg: (cashAtHand ?? 0) > 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      trend: {
        value: `${savingsRate.toFixed(0)}%`,
        label: 'savings rate',
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="h-full"
          >
            <GlassContainer className="p-6 h-full hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white via-white to-gold/5 relative overflow-hidden group">
              {/* Premium background effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative">
                {/* Icon */}
                <div className={`w-10 h-10 ${card.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                
                {/* Title */}
                <p className="text-xs font-light tracking-wide uppercase text-primary/60 mb-2">
                  {card.title}
                </p>
                
                {/* Value */}
                <p className={`text-2xl font-light ${card.color} mb-1`}>
                  {card.value}
                </p>
                
                {/* Subtitle */}
                {(card as any).subtitle && (
                  <p className="text-xs text-primary/50 mb-1">
                    {(card as any).subtitle}
                  </p>
                )}
                
                {/* Trend */}
                {card.trend && (
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-medium ${card.color}`}>
                      {card.trend.value}
                    </span>
                    <span className="text-xs text-primary/40">
                      {card.trend.label}
                    </span>
                  </div>
                )}
              </div>
            </GlassContainer>
          </motion.div>
        );
      })}
    </div>
  );
} 