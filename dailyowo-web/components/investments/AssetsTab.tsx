'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Building2, Coins, Home, Eye, X, ChevronRight } from 'lucide-react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { GlassContainer } from '@/components/ui/GlassContainer';

export function AssetsTab() {
  const [selectedAssetType, setSelectedAssetType] = useState<string | null>(null);
  
  const { 
    recentTransactions, 
    netWorth, 
    totalAssets, 
    isLoading 
  } = useFinancialData();

  const assetTransactions = recentTransactions?.filter(t => t.type === 'asset').slice(0, 5) || [];

  // Asset allocation data with enhanced details
  const assetAllocationData = [
    {
      id: 'liquid',
      name: 'Liquid Assets',
      icon: Coins,
      color: 'text-blue-600',
      amount: netWorth.assetAllocation.liquid,
      percentage: ((netWorth.assetAllocation.liquid / totalAssets) * 100).toFixed(1),
      description: 'Cash, checking, and savings accounts',
      subcategories: [
        { name: 'Checking Account', amount: netWorth.assetsByCategory['checking-account'] || 0 },
        { name: 'Savings Account', amount: netWorth.assetsByCategory['savings-account'] || 0 },
        { name: 'General Savings', amount: netWorth.assetsByCategory['general-savings'] || 0 },
        { name: 'Emergency Fund', amount: netWorth.assetsByCategory['emergency-fund'] || 0 },
        { name: 'Cash', amount: netWorth.assetsByCategory['cash'] || 0 }
      ].filter(sub => sub.amount > 0)
    },
    {
      id: 'investments',
      name: 'Investments',
      icon: TrendingUp,
      color: 'text-green-600',
      amount: netWorth.assetAllocation.investments,
      percentage: ((netWorth.assetAllocation.investments / totalAssets) * 100).toFixed(1),
      description: 'Stocks, bonds, ETFs, and crypto',
      subcategories: [
        { name: 'Stocks', amount: netWorth.assetsByCategory['stocks'] || 0 },
        { name: 'ETFs', amount: netWorth.assetsByCategory['etf'] || 0 },
        { name: 'Bonds', amount: netWorth.assetsByCategory['bonds'] || 0 },
        { name: 'Mutual Funds', amount: netWorth.assetsByCategory['mutual-funds'] || 0 },
        { name: 'Cryptocurrency', amount: netWorth.assetsByCategory['cryptocurrency'] || 0 }
      ].filter(sub => sub.amount > 0)
    },
    {
      id: 'realEstate',
      name: 'Real Estate',
      icon: Home,
      color: 'text-purple-600',
      amount: netWorth.assetAllocation.realEstate,
      percentage: ((netWorth.assetAllocation.realEstate / totalAssets) * 100).toFixed(1),
      description: 'Primary residence and investment properties',
      subcategories: [
        { name: 'Real Estate', amount: netWorth.assetsByCategory['real-estate'] || 0 }
      ].filter(sub => sub.amount > 0)
    },
    {
      id: 'retirement',
      name: 'Retirement',
      icon: Building2,
      color: 'text-orange-600',
      amount: netWorth.assetAllocation.retirement,
      percentage: ((netWorth.assetAllocation.retirement / totalAssets) * 100).toFixed(1),
      description: '401k, IRA, and pension accounts',
      subcategories: [
        { name: '401(k)', amount: netWorth.assetsByCategory['retirement-401k'] || 0 },
        { name: 'IRA', amount: netWorth.assetsByCategory['retirement-ira'] || 0 }
      ].filter(sub => sub.amount > 0)
    }
  ];

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
      {/* Asset Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-primary">€{totalAssets.toLocaleString()}</h3>
                <p className="text-sm text-primary/60">Total Assets</p>
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
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-primary">€{netWorth.assetAllocation.investments.toLocaleString()}</h3>
                <p className="text-sm text-primary/60">Investments</p>
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
                <Coins className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-light text-primary">€{netWorth.assetAllocation.liquid.toLocaleString()}</h3>
                <p className="text-sm text-primary/60">Liquid Assets</p>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      </div>

      {/* Asset Allocation */}
      {totalAssets > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-light text-primary">Asset Allocation</h2>
              <p className="text-xs text-primary/50">Click to view details</p>
            </div>
            <div className="space-y-4">
              {assetAllocationData.map((asset) => {
                const Icon = asset.icon;
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAssetType(asset.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/30 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${asset.color}`} />
                      <span className="text-sm font-light text-primary">{asset.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-light text-primary">€{asset.amount.toLocaleString()}</p>
                        <p className="text-xs text-primary/60">{asset.percentage}%</p>
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

      {/* Recent Asset Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassContainer className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Eye className="w-5 h-5 text-primary/60" />
            <h2 className="text-lg font-light text-primary">Recent Asset Transactions</h2>
          </div>

          {assetTransactions.length > 0 ? (
            <div className="space-y-3">
              {assetTransactions.map((transaction, index) => (
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
                    {transaction.assetDetails && (
                      <div className="text-xs text-primary/50 mt-1">
                        {transaction.assetDetails.symbol && (
                          <span>Symbol: {transaction.assetDetails.symbol} • </span>
                        )}
                        {transaction.assetDetails.quantity && (
                          <span>Qty: {transaction.assetDetails.quantity}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-light text-blue-600">
                      €{transaction.amount.toLocaleString()}
                    </p>
                    {transaction.assetDetails?.currentPrice && (
                      <p className="text-sm text-primary/60">
                        €{transaction.assetDetails.currentPrice}/unit
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-primary/20 mx-auto mb-4" />
              <p className="text-primary/60 font-light">No asset transactions yet</p>
              <p className="text-sm text-primary/40">Add assets to track your investment portfolio</p>
            </div>
          )}
        </GlassContainer>
      </motion.div>

      {/* Asset Details Modal */}
      {selectedAssetType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedAssetType(null)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <GlassContainer className="p-6 bg-gradient-to-br from-white via-white to-primary/5">
              {(() => {
                const selectedAsset = assetAllocationData.find(asset => asset.id === selectedAssetType);
                if (!selectedAsset) return null;
                
                const Icon = selectedAsset.icon;
                return (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${selectedAsset.color}`} />
                        <h2 className="text-xl font-light text-primary">{selectedAsset.name}</h2>
                      </div>
                      <button
                        onClick={() => setSelectedAssetType(null)}
                        className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5 text-primary/50" />
                      </button>
                    </div>

                    <div className="mb-6">
                      <div className="text-center p-4 bg-white/50 rounded-xl mb-4">
                        <p className="text-3xl font-light text-primary mb-1">
                          €{selectedAsset.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-primary/60">{selectedAsset.percentage}% of total assets</p>
                      </div>
                      <p className="text-primary/70 text-center">{selectedAsset.description}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-light text-primary mb-4">Breakdown</h3>
                      <div className="space-y-3">
                        {selectedAsset.subcategories.map((subcategory, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white/30 rounded-xl">
                            <span className="text-sm font-light text-primary">{subcategory.name}</span>
                            <div className="text-right">
                              <p className="text-primary font-light">€{subcategory.amount.toLocaleString()}</p>
                              <p className="text-xs text-primary/60">
                                {((subcategory.amount / selectedAsset.amount) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <p className="text-xs text-primary/50 text-center">
                        Detailed asset tracking and management coming soon
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