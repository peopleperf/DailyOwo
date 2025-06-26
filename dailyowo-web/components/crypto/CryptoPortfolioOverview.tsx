'use client';

import { motion } from 'framer-motion';
import { Eye, EyeOff, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { PortfolioSummary } from '@/lib/services/crypto-service';

interface CryptoPortfolioOverviewProps {
  portfolio: PortfolioSummary;
  isBalanceHidden: boolean;
  isRefreshing: boolean;
  onToggleBalance: () => void;
  onRefresh: () => Promise<void>;
}

export function CryptoPortfolioOverview({
  portfolio,
  isBalanceHidden,
  isRefreshing,
  onToggleBalance,
  onRefresh
}: CryptoPortfolioOverviewProps) {
  const formatCurrency = (amount: number) => {
    return isBalanceHidden ? '****' : `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (percent: number) => {
    return isBalanceHidden ? '**%' : `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-gold';
    if (value < 0) return 'text-primary/60'; // Gray, not red
    return 'text-primary';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <GlassContainer className="p-6 md:p-8 bg-gradient-to-br from-orange-50/30 to-orange-100/20" goldBorder>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
              Crypto Portfolio
            </p>
            <h3 className="text-lg font-light text-primary">Total Value</h3>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={onToggleBalance}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl hover:bg-white/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {isBalanceHidden ? 
                <EyeOff className="w-5 h-5 text-primary/60" /> : 
                <Eye className="w-5 h-5 text-primary/60" />
              }
            </motion.button>
            <motion.button
              onClick={onRefresh}
              animate={{ rotate: isRefreshing ? 360 : 0 }}
              transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl hover:bg-white/50 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 text-primary/60" />
            </motion.button>
          </div>
        </div>

        {/* Main Value Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Value */}
          <div>
            <motion.p 
              className="text-4xl md:text-5xl font-light text-primary mb-2"
              key={portfolio.total_value} // Re-animate on value change
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {formatCurrency(portfolio.total_value)}
            </motion.p>
            
            {/* All Time P&L */}
            <div className="flex items-center gap-2">
              {portfolio.total_pnl >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-gold" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-primary/60" />
              )}
              <span className={`text-sm font-light ${getChangeColor(portfolio.total_pnl)}`}>
                {formatPercent(portfolio.total_pnl_percentage)} All Time
              </span>
            </div>
            
            {/* All Time Value */}
            <p className={`text-xs font-light mt-1 ${getChangeColor(portfolio.total_pnl)}`}>
              {formatCurrency(portfolio.total_pnl)}
            </p>
          </div>

          {/* 24h Change */}
          <div>
            <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-2">
              24H Change
            </p>
            <motion.p 
              className={`text-2xl md:text-3xl font-light mb-1 ${getChangeColor(portfolio.day_change)}`}
              key={portfolio.day_change}
              initial={{ scale: 1.05 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {formatCurrency(portfolio.day_change)}
            </motion.p>
            <p className={`text-sm font-light ${getChangeColor(portfolio.day_change)}`}>
              {formatPercent(portfolio.day_change_percentage)}
            </p>
          </div>
        </div>

        {/* Holdings Count */}
        {portfolio.holdings_count > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs font-light text-primary/60">
              {portfolio.holdings_count} {portfolio.holdings_count === 1 ? 'holding' : 'holdings'}
            </p>
          </div>
        )}
      </GlassContainer>
    </motion.div>
  );
}