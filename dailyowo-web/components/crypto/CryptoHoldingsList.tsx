'use client';

import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Wallet, Edit3, Trash2 } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { CryptoHolding } from '@/lib/services/crypto-service';
import { ExtendedCryptoHolding } from '@/lib/firebase/crypto-holdings-service';

interface CryptoHoldingsListProps {
  holdings: ExtendedCryptoHolding[];
  isBalanceHidden: boolean;
  onAddHolding?: () => void;
  onEditHolding?: (holding: ExtendedCryptoHolding) => void;
  onDeleteHolding?: (holding: ExtendedCryptoHolding) => void;
}

export function CryptoHoldingsList({
  holdings,
  isBalanceHidden,
  onAddHolding,
  onEditHolding,
  onDeleteHolding
}: CryptoHoldingsListProps) {
  const formatCurrency = (amount: number) => {
    return isBalanceHidden ? '****' : `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (percent: number) => {
    return isBalanceHidden ? '**%' : `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const formatCrypto = (amount: number, decimals = 4) => {
    return isBalanceHidden ? '****' : amount.toFixed(decimals);
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-gold';
    if (value < 0) return 'text-primary/60'; // Gray, not red
    return 'text-primary';
  };

  // Empty state
  if (holdings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <GlassContainer className="p-8 text-center bg-gradient-to-br from-white via-white to-gold/5">
          <Wallet className="w-12 h-12 text-primary/30 mx-auto mb-4" />
          <h3 className="text-lg font-light text-primary mb-2">No Holdings Yet</h3>
          <p className="text-sm font-light text-primary/60 mb-6">Start building your crypto portfolio</p>
          <GlassButton 
            variant="primary" 
            goldBorder
            onClick={onAddHolding}
            className="min-h-[44px]"
          >
            Add Your First Crypto
          </GlassButton>
        </GlassContainer>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
            Holdings
          </p>
          <h3 className="text-lg font-light text-primary">Your Crypto Assets</h3>
        </div>
        <GlassButton
          variant="primary"
          size="sm"
          onClick={onAddHolding}
          className="flex items-center gap-2 min-h-[44px]"
          goldBorder
        >
          <Plus className="w-4 h-4" />
          <span className="font-light">Add</span>
        </GlassButton>
      </div>

      {/* Holdings List */}
      <div className="space-y-3">
        {holdings.map((holding, index) => (
          <motion.div
            key={holding.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
          >
            <GlassContainer 
              className="p-4 hover:shadow-lg transition-all bg-gradient-to-r from-white to-white/50"
            >
              <div className="flex items-center justify-between">
                {/* Left side - Coin info */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/40 rounded-xl flex items-center justify-center border border-gold/20">
                    <span className="text-primary font-light text-sm">{holding.symbol}</span>
                  </div>
                  <div>
                    <p className="font-light text-primary text-sm">{holding.name}</p>
                    <p className="text-xs font-light text-primary/60">
                      {formatCrypto(holding.amount)} {holding.symbol}
                    </p>
                  </div>
                </div>

                {/* Right side - Values and Actions */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-light text-primary text-sm mb-1">
                      {formatCurrency(holding.current_value)}
                    </p>
                    <div className="flex items-center justify-end gap-1">
                      {holding.pnl_percentage >= 0 ? (
                        <TrendingUp className="w-3 h-3 text-gold" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-primary/60" />
                      )}
                      <span className={`text-xs font-light ${getChangeColor(holding.pnl_percentage)}`}>
                        {formatPercent(holding.pnl_percentage)}
                      </span>
                    </div>
                    <p className={`text-xs font-light ${getChangeColor(holding.pnl)}`}>
                      {formatCurrency(holding.pnl)}
                    </p>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditHolding?.(holding);
                      }}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Edit holding"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {onDeleteHolding && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteHolding(holding);
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Delete holding"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </GlassContainer>
          </motion.div>
        ))}
      </div>

      {/* Holdings Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: holdings.length * 0.1 + 0.3 }}
        className="pt-4 border-t border-gray-100"
      >
        <p className="text-xs font-light text-primary/60 text-center">
          {holdings.length} {holdings.length === 1 ? 'holding' : 'holdings'} • Tap to edit
        </p>
      </motion.div>
    </div>
  );
}