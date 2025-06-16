'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, TrendingDown, Eye, Calculator, X, ChevronRight, Home, Car, GraduationCap, Building2 } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { GlassContainer } from '@/components/ui/GlassContainer';

export function LoanTab() {
  const [selectedDebtType, setSelectedDebtType] = useState<string | null>(null);

  const { 
    recentTransactions, 
    debtRatio, 
    totalLiabilities, 
    isLoading 
  } = useFinancialData();

  const liabilityTransactions = recentTransactions?.filter(t => t.type === 'liability').slice(0, 5) || [];

  // Debt categories data with enhanced details
  const debtCategoriesData = [
    {
      id: 'credit-card',
      name: 'Credit Cards',
      icon: CreditCard,
      color: 'text-red-600',
      amount: totalLiabilities * 0.4, // Simplified allocation
      interestRate: 18.5,
      minimumPayment: totalLiabilities * 0.4 * 0.02,
      description: 'Revolving credit card debt',
      payoffMonths: 24,
      details: [
        { name: 'Chase Sapphire', balance: totalLiabilities * 0.25, rate: 19.9 },
        { name: 'Bank of America', balance: totalLiabilities * 0.15, rate: 17.2 }
      ]
    },
    {
      id: 'auto-loan',
      name: 'Auto Loan',
      icon: Car,
      color: 'text-blue-600',
      amount: totalLiabilities * 0.35,
      interestRate: 4.2,
      minimumPayment: totalLiabilities * 0.35 * 0.015,
      description: 'Vehicle financing',
      payoffMonths: 48,
      details: [
        { name: '2022 Honda Accord', balance: totalLiabilities * 0.35, rate: 4.2 }
      ]
    },
    {
      id: 'student-loan',
      name: 'Student Loans',
      icon: GraduationCap,
      color: 'text-purple-600',
      amount: totalLiabilities * 0.15,
      interestRate: 6.8,
      minimumPayment: totalLiabilities * 0.15 * 0.01,
      description: 'Educational loan debt',
      payoffMonths: 120,
      details: [
        { name: 'Federal Loan', balance: totalLiabilities * 0.15, rate: 6.8 }
      ]
    },
    {
      id: 'mortgage',
      name: 'Mortgage',
      icon: Home,
      color: 'text-green-600',
      amount: totalLiabilities * 0.1,
      interestRate: 3.5,
      minimumPayment: totalLiabilities * 0.1 * 0.005,
      description: 'Home mortgage loan',
      payoffMonths: 300,
      details: [
        { name: 'Primary Residence', balance: totalLiabilities * 0.1, rate: 3.5 }
      ]
    }
  ].filter(debt => debt.amount > 0);

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
      {/* Debt Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-primary">€{totalLiabilities.toLocaleString()}</h3>
                <p className="text-sm text-primary/60">Total Debt</p>
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
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-primary">{debtRatio.debtToIncomeRatio.toFixed(1)}%</h3>
                <p className="text-sm text-primary/60">Debt-to-Income</p>
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
                <Calculator className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-primary">€{debtRatio.monthlyDebtPayments.toLocaleString()}</h3>
                <p className="text-sm text-primary/60">Monthly Payments</p>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      </div>

      {/* Debt Categories */}
      {debtCategoriesData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light text-primary">Debt Categories</h2>
              <p className="text-xs text-primary/50">Click to view details</p>
            </div>
            <div className="space-y-4">
              {debtCategoriesData.map((debt) => {
                const Icon = debt.icon;
                return (
                  <button
                    key={debt.id}
                    onClick={() => setSelectedDebtType(debt.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/30 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${debt.color}`} />
                      <div className="text-left">
                        <span className="text-sm font-light text-primary block">{debt.name}</span>
                        <span className="text-xs text-primary/60">{debt.interestRate}% APR</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-light text-red-600">€{debt.amount.toLocaleString()}</p>
                        <p className="text-xs text-primary/60">€{debt.minimumPayment.toFixed(0)}/mo</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-primary/40 group-hover:text-primary/60 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          </GlassContainer>
        </motion.div>
      )}

      {/* Recent Debt Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassContainer className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-5 h-5 text-primary/60" />
            <h2 className="text-lg font-light text-primary">Recent Debt Transactions</h2>
          </div>

          {liabilityTransactions.length > 0 ? (
            <div className="space-y-4">
              {liabilityTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-3 hover:bg-white/30 rounded-xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-red-600" />
                    <div>
                      <span className="text-sm font-light text-primary">{transaction.description}</span>
                      <p className="text-xs text-primary/60">
                        {transaction.categoryId} • {new Date(transaction.date).toLocaleDateString()}
                        {transaction.liabilityDetails?.interestRate && (
                          <span> • {transaction.liabilityDetails.interestRate}% APR</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-light text-red-600">€{transaction.amount.toLocaleString()}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-primary/20 mx-auto mb-4" />
              <p className="text-primary/60 font-light">No debt transactions yet</p>
              <p className="text-sm text-primary/40">Add debt to track and optimize payoff strategies</p>
            </div>
          )}
        </GlassContainer>
      </motion.div>

      {/* Debt Details Modal */}
      {selectedDebtType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedDebtType(null)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <GlassContainer className="p-6 bg-gradient-to-br from-white via-white to-red/5">
              {(() => {
                const selectedDebt = debtCategoriesData.find(debt => debt.id === selectedDebtType);
                if (!selectedDebt) return null;
                
                const Icon = selectedDebt.icon;
                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${selectedDebt.color}`} />
                        <h2 className="text-xl font-light text-primary">{selectedDebt.name}</h2>
                      </div>
                      <button
                        onClick={() => setSelectedDebtType(null)}
                        className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-primary/50" />
                      </button>
                    </div>

                    <div className="mb-6">
                      <div className="text-center p-4 bg-red-50 rounded-xl mb-4 border border-red-100">
                        <p className="text-3xl font-light text-red-600 mb-1">
                          €{selectedDebt.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-primary/60">Total Balance</p>
                      </div>
                      <p className="text-primary/70 text-center">{selectedDebt.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-3 bg-white/50 rounded-xl">
                        <p className="text-lg font-light text-primary">{selectedDebt.interestRate}%</p>
                        <p className="text-xs text-primary/60">Interest Rate</p>
                      </div>
                      <div className="text-center p-3 bg-white/50 rounded-xl">
                        <p className="text-lg font-light text-primary">€{selectedDebt.minimumPayment.toFixed(0)}</p>
                        <p className="text-xs text-primary/60">Min Payment</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-light text-primary mb-4">Account Details</h3>
                      <div className="space-y-3">
                        {selectedDebt.details.map((detail, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/30 rounded-xl">
                            <span className="text-sm font-light text-primary">{detail.name}</span>
                            <div className="text-right">
                              <p className="text-primary font-light">€{detail.balance.toLocaleString()}</p>
                              <p className="text-xs text-primary/60">{detail.rate}% APR</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <h4 className="font-medium text-primary mb-2">Payoff Strategy</h4>
                      <p className="text-sm text-primary/70">
                        At current payment rate: <strong>{selectedDebt.payoffMonths} months</strong>
                      </p>
                      <p className="text-xs text-primary/60 mt-1">
                        Consider paying extra to reduce interest costs
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-xs text-primary/50 text-center">
                        Advanced debt management tools coming soon
                      </p>
                    </div>
                  </>
                );
              })()}
            </GlassContainer>
          </motion.div>
        </div>
      )}
    </div>
  );
} 