'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';

interface RebalanceAllocation {
  coinId: string;
  symbol: string;
  name: string;
  currentPercentage: number;
  targetPercentage: number;
  currentValue: number;
  targetValue: number;
  action: 'buy' | 'sell' | 'hold';
  amountChange: number;
}

interface RebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  allocations: RebalanceAllocation[];
  totalPortfolioValue: number;
  onConfirm: (allocations: RebalanceAllocation[]) => Promise<void>;
}

export function RebalanceModal({ 
  isOpen, 
  onClose, 
  allocations, 
  totalPortfolioValue,
  onConfirm 
}: RebalanceModalProps) {
  const [isRebalancing, setIsRebalancing] = useState(false);

  const handleConfirm = async () => {
    setIsRebalancing(true);
    try {
      await onConfirm(allocations);
      onClose();
    } catch (error) {
      console.error('Rebalancing failed:', error);
      // Handle error (show toast, etc.)
    } finally {
      setIsRebalancing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  if (!isOpen) return null;

  const totalChanges = allocations.reduce((sum, allocation) => 
    sum + Math.abs(allocation.amountChange), 0
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <GlassContainer className="p-6 md:p-8" goldBorder>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gold/10 rounded-xl">
                  <Target className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-light text-primary mb-1">
                    Portfolio Rebalancing
                  </h2>
                  <p className="text-sm font-light text-primary/60">
                    Review and confirm the recommended changes to optimize your portfolio
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-primary/60" />
              </button>
            </div>

            {/* Portfolio Summary */}
            <div className="mb-6 p-4 bg-gold/5 border border-gold/20 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-gold" />
                <span className="text-sm font-light text-primary/60">Portfolio Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-light text-primary/40 mb-1">Total Portfolio Value</p>
                  <p className="text-lg font-light text-primary">{formatCurrency(totalPortfolioValue)}</p>
                </div>
                <div>
                  <p className="text-xs font-light text-primary/40 mb-1">Total Changes Required</p>
                  <p className="text-lg font-light text-primary">{formatCurrency(totalChanges)}</p>
                </div>
              </div>
            </div>

            {/* Warning */}
            {totalChanges > totalPortfolioValue * 0.1 && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-800 mb-1">
                      Significant Portfolio Changes
                    </h3>
                    <p className="text-xs text-orange-700">
                      This rebalancing requires significant changes ({formatPercentage(totalChanges / totalPortfolioValue * 100)} of your portfolio). 
                      Please review carefully before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Allocations List */}
            <div className="mb-6">
              <h3 className="text-sm font-light text-primary/60 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recommended Changes
              </h3>
              <div className="space-y-3">
                {allocations.map((allocation) => (
                  <div
                    key={allocation.coinId}
                    className="p-4 bg-white/30 border border-gray-200/50 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-light text-primary">{allocation.name}</h4>
                        <p className="text-sm font-light text-primary/60">{allocation.symbol.toUpperCase()}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-light ${
                        allocation.action === 'buy' ? 'bg-green-100 text-green-700' :
                        allocation.action === 'sell' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {allocation.action === 'buy' ? 'Buy' : allocation.action === 'sell' ? 'Sell' : 'Hold'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-light text-primary/40 mb-1">Current Allocation</p>
                        <p className="font-light text-primary">
                          {formatPercentage(allocation.currentPercentage)} ({formatCurrency(allocation.currentValue)})
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-light text-primary/40 mb-1">Target Allocation</p>
                        <p className="font-light text-primary">
                          {formatPercentage(allocation.targetPercentage)} ({formatCurrency(allocation.targetValue)})
                        </p>
                      </div>
                    </div>

                    {allocation.amountChange !== 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50">
                        <p className="text-xs font-light text-primary/40 mb-1">Required Change</p>
                        <p className={`text-sm font-light ${
                          allocation.amountChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {allocation.amountChange > 0 ? '+' : ''}{formatCurrency(allocation.amountChange)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-700">
                <strong>Disclaimer:</strong> This is a simulation for educational purposes only. 
                DailyOwo does not execute actual trades. You would need to manually make these 
                changes in your actual trading accounts. Always consult with a financial advisor 
                before making investment decisions.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <GlassButton
                variant="ghost"
                onClick={onClose}
                className="flex-1 min-h-[44px]"
                disabled={isRebalancing}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={handleConfirm}
                loading={isRebalancing}
                goldBorder
                className="flex-1 min-h-[44px] flex items-center justify-center gap-2"
              >
                <Target className="w-4 h-4" />
                Confirm Rebalancing
              </GlassButton>
            </div>
          </GlassContainer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}