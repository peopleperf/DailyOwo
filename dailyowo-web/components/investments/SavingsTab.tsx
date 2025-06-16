'use client';

import { motion } from 'framer-motion';
import { PiggyBank, Target, TrendingUp, Calendar, Eye } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { GlassContainer } from '@/components/ui/GlassContainer';

export function SavingsTab() {
  const { 
    recentTransactions, 
    savingsRate, 
    isLoading 
  } = useFinancialData();

  const savingsTransactions = recentTransactions?.filter(t => 
    (t.type === 'expense' && t.categoryId === 'savings') || 
    (t.type === 'asset' && ['savings-account', 'money-market', 'cd'].includes(t.categoryId))
  ).slice(0, 5) || [];

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
      {/* Savings Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-primary">{savingsRate.savingsRate.toFixed(1)}%</h3>
                <p className="text-sm text-primary/60">Savings Rate</p>
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
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-primary">€{savingsRate.monthlySavings.toLocaleString()}</h3>
                <p className="text-sm text-primary/60">Monthly Savings</p>
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
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-primary">{savingsRate.savingsStreak}</h3>
                <p className="text-sm text-primary/60">Saving Streak (months)</p>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      </div>

      {/* Savings Summary */}
      {savingsRate.totalSavings > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassContainer className="p-6">
            <h2 className="text-lg font-light text-primary mb-6">Savings Summary</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-4 bg-white/30 rounded-xl">
                <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-medium text-primary">Total Savings</h3>
                <p className="text-2xl font-light text-primary">€{savingsRate.totalSavings.toLocaleString()}</p>
                <p className="text-sm text-primary/60">Current period</p>
              </div>
              
              <div className="text-center p-4 bg-white/30 rounded-xl">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-medium text-primary">Projected Annual</h3>
                <p className="text-2xl font-light text-primary">€{savingsRate.projectedAnnualSavings.toLocaleString()}</p>
                <p className="text-sm text-primary/60">Based on current rate</p>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      )}



      {/* Recent Savings Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassContainer className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-5 h-5 text-primary/60" />
            <h2 className="text-lg font-light text-primary">Recent Savings Activity</h2>
          </div>

          {savingsTransactions.length > 0 ? (
            <div className="space-y-3">
              {savingsTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-gray-100"
                >
                  <div>
                    <h3 className="font-medium text-primary">{transaction.description}</h3>
                    <p className="text-sm text-primary/60">{transaction.categoryId}</p>
                    <p className="text-xs text-primary/40">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-light text-gold">
                      +€{transaction.amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-primary/60">{transaction.type}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <PiggyBank className="w-12 h-12 text-primary/20 mx-auto mb-4" />
              <p className="text-primary/60 font-light">No savings activity yet</p>
              <p className="text-sm text-primary/40">Start saving to build your financial future</p>
            </div>
          )}
        </GlassContainer>
      </motion.div>

      {/* Savings Rate Benchmarks */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <GlassContainer className="p-6">
          <h2 className="text-lg font-light text-primary mb-6">Savings Rate Benchmarks</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <h3 className="text-sm font-medium text-green-700">Excellent</h3>
              <p className="text-2xl font-light text-green-600">30%+</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <h3 className="text-sm font-medium text-blue-700">Good</h3>
              <p className="text-2xl font-light text-blue-600">20-29%</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-xl">
              <h3 className="text-sm font-medium text-yellow-700">Fair</h3>
              <p className="text-2xl font-light text-yellow-600">10-19%</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-xl">
              <h3 className="text-sm font-medium text-red-700">Poor</h3>
              <p className="text-2xl font-light text-red-600">0-9%</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gold/10 rounded-xl text-center">
            <p className="text-sm text-primary/70">
              Your current rate: <span className="font-medium text-gold">{savingsRate.savingsRate.toFixed(1)}%</span>
            </p>
          </div>
        </GlassContainer>
      </motion.div>
    </div>
  );
} 