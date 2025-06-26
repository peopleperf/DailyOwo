'use client';

import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Globe, Zap, RefreshCw } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { CryptoCoin, MarketData } from '@/lib/services/crypto-service';

interface MarketOverviewProps {
  marketData?: MarketData;
  topCoins: CryptoCoin[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onCoinSelect?: (coin: CryptoCoin) => void;
}

export function MarketOverview({ 
  marketData, 
  topCoins, 
  isLoading = false, 
  onRefresh,
  onCoinSelect 
}: MarketOverviewProps) {
  const formatCurrency = (amount: number, options?: { compact?: boolean }) => {
    if (options?.compact) {
      if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`;
      if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
      if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
    }
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-gold';
    if (value < 0) return 'text-primary/60'; // Gray, not red
    return 'text-primary';
  };

  return (
    <div className="space-y-6">
      {/* Market Stats */}
      {marketData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassContainer className="p-6 md:p-8 bg-gradient-to-br from-primary/5 via-white to-gold/5" goldBorder>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/40 rounded-xl flex items-center justify-center border border-primary/20">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
                    Global Market
                  </p>
                  <h3 className="text-lg font-light text-primary">Crypto Overview</h3>
                </div>
              </div>
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <motion.div
                  animate={{ rotate: isLoading ? 360 : 0 }}
                  transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
              </GlassButton>
            </div>

            {/* Market Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg md:text-xl font-light text-primary mb-1">
                  {formatCurrency(marketData.total_market_cap, { compact: true })}
                </p>
                <p className="text-xs font-light tracking-wide uppercase text-primary/40">
                  Market Cap
                </p>
              </div>
              <div className="text-center">
                <p className="text-lg md:text-xl font-light text-primary mb-1">
                  {formatCurrency(marketData.total_volume, { compact: true })}
                </p>
                <p className="text-xs font-light tracking-wide uppercase text-primary/40">
                  24h Volume
                </p>
              </div>
              <div className="text-center col-span-2 md:col-span-1">
                <p className="text-lg md:text-xl font-light text-gold mb-1">
                  {marketData.bitcoin_dominance.toFixed(1)}%
                </p>
                <p className="text-xs font-light tracking-wide uppercase text-primary/40">
                  BTC Dominance
                </p>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      )}

      {/* Top Cryptocurrencies */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
              Market Leaders
            </p>
            <h3 className="text-lg font-light text-primary">Top Cryptocurrencies</h3>
          </div>
          {marketData?.trending_coins && marketData.trending_coins.length > 0 && (
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 text-gold" />
              <span className="text-xs font-light text-gold">Trending</span>
            </div>
          )}
        </div>

        {topCoins.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <GlassContainer className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-primary/30 mx-auto mb-4" />
              <h3 className="text-lg font-light text-primary mb-2">
                {isLoading ? 'Loading Market Data...' : 'Market Data Unavailable'}
              </h3>
              <p className="text-sm font-light text-primary/60">
                {isLoading ? 'Fetching latest cryptocurrency prices' : 'Please check your connection and try again'}
              </p>
            </GlassContainer>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {topCoins.map((coin, index) => (
              <motion.div
                key={coin.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.6 }}
              >
                <GlassContainer 
                  className="p-4 hover:shadow-lg transition-all cursor-pointer bg-gradient-to-r from-white to-white/50"
                  onClick={() => onCoinSelect?.(coin)}
                >
                  <div className="flex items-center justify-between">
                    {/* Left side - Coin info */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border border-gray-200">
                          {coin.image ? (
                            <img 
                              src={coin.image} 
                              alt={coin.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <span className="text-primary font-light text-sm">{coin.symbol}</span>
                          )}
                        </div>
                        {/* Market cap rank badge */}
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-light text-primary/60">
                            {coin.market_cap_rank}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="font-light text-primary text-sm">{coin.name}</p>
                        <p className="text-xs font-light text-primary/60">
                          {coin.symbol.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {/* Right side - Price and change */}
                    <div className="text-right">
                      <p className="font-light text-primary text-sm mb-1">
                        {formatCurrency(coin.current_price)}
                      </p>
                      <div className="flex items-center justify-end gap-1">
                        {coin.price_change_percentage_24h >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-gold" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-primary/60" />
                        )}
                        <span className={`text-xs font-light ${getChangeColor(coin.price_change_percentage_24h)}`}>
                          {formatPercent(coin.price_change_percentage_24h)}
                        </span>
                      </div>
                      <p className="text-xs font-light text-primary/40">
                        Vol: {formatCurrency(coin.total_volume, { compact: true })}
                      </p>
                    </div>
                  </div>
                </GlassContainer>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Market Status */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: topCoins.length * 0.05 + 0.3 }}
        className="pt-4 border-t border-gray-100"
      >
        <p className="text-xs font-light text-primary/40 text-center">
          Market data updated every minute • Tap any coin for details
        </p>
      </motion.div>
    </div>
  );
}