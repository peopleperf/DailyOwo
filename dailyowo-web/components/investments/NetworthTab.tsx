'use client';

import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, BarChart3, Shield } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { GlassContainer } from '@/components/ui/GlassContainer';

export function NetworthTab() {
  const { 
    netWorth, 
    totalAssets, 
    totalLiabilities, 
    emergencyFundMonths,
    isLoading 
  } = useFinancialData();

  const netWorthValue = netWorth.netWorth;

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
      {/* Net Worth Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassContainer className="p-8 bg-gradient-to-br from-white via-white to-gold/5" goldBorder>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-8 h-8 text-gold" />
              </div>
            </div>
            <h2 className="text-sm text-primary/60 mb-2">Total Net Worth</h2>
            <h1 className="text-4xl font-light text-primary mb-4">
              €{netWorthValue.toLocaleString()}
            </h1>
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="text-center">
                <p className="text-primary/60">Assets</p>
                <p className="text-lg font-light text-green-600">+€{totalAssets.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-primary/60">Liabilities</p>
                <p className="text-lg font-light text-red-600">-€{totalLiabilities.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </GlassContainer>
      </motion.div>

      {/* Net Worth Components */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <h3 className="text-xl font-light text-primary">€{netWorth.assetAllocation.liquid.toLocaleString()}</h3>
                <p className="text-sm text-primary/60">Liquid Assets</p>
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
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-light text-primary">€{netWorth.assetAllocation.investments.toLocaleString()}</h3>
                <p className="text-sm text-primary/60">Investments</p>
              </div>
            </div>
          </GlassContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-light text-primary">€{netWorth.assetAllocation.realEstate.toLocaleString()}</h3>
                <p className="text-sm text-primary/60">Real Estate</p>
              </div>
            </div>
          </GlassContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-light text-primary">€{netWorth.assetAllocation.retirement.toLocaleString()}</h3>
                <p className="text-sm text-primary/60">Retirement</p>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      </div>

      {/* Emergency Fund Status */}
      {emergencyFundMonths > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-5 h-5 text-primary/60" />
              <h2 className="text-lg font-light text-primary">Emergency Fund</h2>
            </div>
            
            <div className="text-center">
              <div className="p-6 bg-white/30 rounded-xl">
                <h3 className="text-3xl font-light text-primary mb-2">
                  {emergencyFundMonths.toFixed(1)}
                </h3>
                <p className="text-sm text-primary/60">Months of Expenses Covered</p>
                
                <div className={`mt-4 p-3 rounded-xl text-center text-sm ${
                  emergencyFundMonths >= 6 
                    ? 'bg-green-50 text-green-700'
                    : emergencyFundMonths >= 3
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {emergencyFundMonths >= 6 
                    ? '✅ Excellent! You have a strong emergency fund.'
                    : emergencyFundMonths >= 3
                    ? '⚠️ Good start! Aim for 6 months of expenses.'
                    : '🚨 Build your emergency fund for financial security.'
                  }
                </div>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      )}

      {/* Asset Allocation Pie Chart */}
      {totalAssets > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <GlassContainer className="p-6">
            <h2 className="text-lg font-light text-primary mb-6">Asset Allocation</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Visual representation could go here */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-primary">Liquid Assets</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary">
                      {((netWorth.assetAllocation.liquid / totalAssets) * 100).toFixed(1)}%
                    </span>
                    <p className="text-xs text-primary/60">€{netWorth.assetAllocation.liquid.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-primary">Investments</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary">
                      {((netWorth.assetAllocation.investments / totalAssets) * 100).toFixed(1)}%
                    </span>
                    <p className="text-xs text-primary/60">€{netWorth.assetAllocation.investments.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-primary">Real Estate</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary">
                      {((netWorth.assetAllocation.realEstate / totalAssets) * 100).toFixed(1)}%
                    </span>
                    <p className="text-xs text-primary/60">€{netWorth.assetAllocation.realEstate.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-white/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-primary">Retirement</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-primary">
                      {((netWorth.assetAllocation.retirement / totalAssets) * 100).toFixed(1)}%
                    </span>
                    <p className="text-xs text-primary/60">€{netWorth.assetAllocation.retirement.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-light text-primary mb-2">Portfolio Status</h3>
                  <div className="text-2xl font-light text-primary">
                    {totalAssets > 0 ? 'Active' : 'Getting Started'}
                  </div>
                  <p className="text-sm text-primary/60">
                    {totalAssets > 0 ? 'Building wealth' : 'Add assets to track portfolio'}
                  </p>
                </div>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      )}
    </div>
  );
} 