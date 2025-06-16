'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Clock, Eye } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { GlassContainer } from '@/components/ui/GlassContainer';

export function IncomeTab() {
  const { 
    income, 
    recentTransactions,
    isLoading 
  } = useFinancialData();

  const incomeTransactions = recentTransactions?.filter(t => t.type === 'income').slice(0, 10) || [];

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Income Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-primary">€{income.totalIncome.toLocaleString()}</h3>
                <p className="text-sm text-primary/60">Total Income</p>
              </div>
            </div>
          </GlassContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-primary">{Object.keys(income.incomeByCategory).length}</h3>
                <p className="text-sm text-primary/60">Income Sources</p>
              </div>
            </div>
          </GlassContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-primary">{income.incomeConsistency}%</h3>
                <p className="text-sm text-primary/60">Stability Score</p>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      </div>

      {/* Recent Income Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlassContainer className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-5 h-5 text-primary/60" />
            <h2 className="text-lg font-light text-primary">Recent Income</h2>
          </div>

          {incomeTransactions.length > 0 ? (
            <div className="space-y-4">
              {incomeTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-3 hover:bg-white/30 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <span className="text-sm font-light text-primary">{transaction.description}</span>
                      <p className="text-xs text-primary/60">{transaction.categoryId} • {new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-light text-green-600">+€{transaction.amount.toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-primary/20 mx-auto mb-4" />
              <p className="text-primary/60 font-light">No income transactions yet</p>
              <p className="text-sm text-primary/40">Add income transactions to see them here</p>
            </div>
          )}
        </GlassContainer>
      </motion.div>

      {/* Income Categories */}
      {Object.keys(income.incomeByCategory).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassContainer className="p-6">
            <h2 className="text-lg font-light text-primary mb-6">Income Categories</h2>
            <div className="space-y-4">
              {Object.entries(income.incomeByCategory).map(([category, amount], index) => (
                <div key={category} className="flex items-center justify-between p-3 hover:bg-white/30 rounded-xl transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-light text-primary">{category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-light text-primary">€{amount.toLocaleString()}</p>
                    <p className="text-xs text-primary/60">{((amount / income.totalIncome) * 100).toFixed(1)}% of total</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassContainer>
        </motion.div>
      )}
    </div>
  );
} 