'use client';

import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Target, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Activity, BarChart3 } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { AISignal } from '@/lib/services/crypto-service';
import { useState } from 'react';

interface AISignalsListProps {
  signals: AISignal[];
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
}

export function AISignalsList({ signals, isLoading = false, onRefresh }: AISignalsListProps) {
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set());
  const getSignalIcon = (type: AISignal['signal_type']) => {
    switch (type) {
      case 'buy':
        return TrendingUp;
      case 'sell':
        return TrendingDown;
      case 'hold':
        return Target;
      case 'alert':
        return AlertTriangle;
      default:
        return Target;
    }
  };

  const getSignalColors = (type: AISignal['signal_type']) => {
    switch (type) {
      case 'buy':
        return {
          bg: 'bg-gold/10',
          text: 'text-gold',
          badge: 'bg-gold/20 text-gold'
        };
      case 'sell':
        return {
          bg: 'bg-primary/10',
          text: 'text-primary/60',
          badge: 'bg-primary/20 text-primary/60'
        };
      case 'hold':
        return {
          bg: 'bg-gray-100',
          text: 'text-primary',
          badge: 'bg-gray-200 text-primary'
        };
      case 'alert':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-700'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-primary',
          badge: 'bg-gray-200 text-primary'
        };
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-gold';
    if (confidence >= 60) return 'text-primary';
    return 'text-primary/60';
  };

  const toggleSignalExpansion = (signalKey: string) => {
    const newExpanded = new Set(expandedSignals);
    if (newExpanded.has(signalKey)) {
      newExpanded.delete(signalKey);
    } else {
      newExpanded.add(signalKey);
    }
    setExpandedSignals(newExpanded);
  };

  const getRiskColor = (riskLevel: number) => {
    if (riskLevel >= 8) return 'text-red-600';
    if (riskLevel >= 6) return 'text-orange-600';
    if (riskLevel >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <GlassContainer className="p-6 md:p-8 bg-gradient-to-br from-gold/5 via-white to-primary/5" goldBorder>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/40 rounded-xl flex items-center justify-center border border-gold/20">
                <Brain className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
                  AI Analysis
                </p>
                <h3 className="text-lg font-light text-primary">Trading Signals</h3>
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

          {/* AI Stats */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-light text-primary mb-1">
                {signals.length > 0 
                  ? `${Math.round(signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length)}%`
                  : '--'
                }
              </p>
              <p className="text-xs font-light tracking-wide uppercase text-primary/40">
                Avg Confidence
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-light text-primary mb-1">{signals.length}</p>
              <p className="text-xs font-light tracking-wide uppercase text-primary/40">
                Active Signals
              </p>
            </div>
          </div>
        </GlassContainer>
      </motion.div>

      {/* Signals List */}
      {signals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassContainer className="p-8 text-center">
            <Brain className="w-12 h-12 text-primary/30 mx-auto mb-4" />
            <h3 className="text-lg font-light text-primary mb-2">
              {isLoading ? 'Analyzing Market...' : 'No Active Signals'}
            </h3>
            <p className="text-sm font-light text-primary/60">
              {isLoading ? 'AI is processing market data' : 'Check back later for new trading insights'}
            </p>
          </GlassContainer>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {signals.map((signal, index) => {
            const Icon = getSignalIcon(signal.signal_type);
            const colors = getSignalColors(signal.signal_type);
            const signalKey = `${signal.symbol}-${signal.created_at.getTime()}`;
            const isExpanded = expandedSignals.has(signalKey);
            
            return (
              <motion.div
                key={signalKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <GlassContainer className="p-4 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-3">
                    {/* Coin Image + Signal Icon */}
                    <div className="flex flex-col items-center gap-2">
                      {signal.image ? (
                        <img 
                          src={signal.image} 
                          alt={signal.coin}
                          className="w-10 h-10 rounded-full border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-primary/60 text-xs font-light">{signal.symbol.slice(0, 2)}</span>
                        </div>
                      )}
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${colors.bg}`}>
                        <Icon className={`w-3 h-3 ${colors.text}`} />
                      </div>
                    </div>

                    {/* Signal Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-light text-primary">{signal.coin}</span>
                          <span className="text-primary/60 text-sm">({signal.symbol})</span>
                          <span className={`text-xs px-2 py-1 rounded-full font-light ${colors.badge}`}>
                            {signal.signal_type.toUpperCase()}
                          </span>
                          <span className={`text-xs font-light ${getConfidenceColor(signal.confidence)}`}>
                            {signal.confidence}% confidence
                          </span>
                        </div>
                        <button
                          onClick={() => toggleSignalExpansion(signalKey)}
                          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-primary/60" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-primary/60" />
                          )}
                        </button>
                      </div>

                      {/* Current Price */}
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm font-light text-primary">
                          Current: ${signal.current_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        {signal.price_target && (
                          <span className="text-sm font-light text-primary/60">
                            Target: ${signal.price_target.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>

                      {/* Message */}
                      <p className="text-sm font-light text-primary/80 mb-2">
                        {signal.message}
                      </p>

                      {/* Recommendation */}
                      <p className="text-xs font-light text-primary/60 mb-3">
                        {signal.recommendation}
                      </p>

                      {/* Expanded Technical Analysis */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-3 border-t border-gray-100"
                        >
                          <h4 className="text-sm font-light text-primary mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Technical Analysis
                          </h4>
                          
                          {/* Consolidated Analysis Section */}
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h5 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              AI Analysis Summary
                            </h5>
                            
                            {/* Simple Explanation */}
                            <div className="mb-3">
                              <p className="text-xs font-medium text-blue-800 mb-1">
                                {signal.signal_type === 'buy' && '💡 What BUY means:'}
                                {signal.signal_type === 'sell' && '🚨 What SELL means:'}
                                {signal.signal_type === 'alert' && '⚠️ What ALERT means:'}
                              </p>
                              <p className="text-xs text-blue-700 leading-relaxed">
                                {signal.signal_type === 'buy' && `The AI predicts ${signal.coin} will likely increase in value. Consider buying gradually rather than all at once. Good entry point below $${(signal.current_price * 0.97).toFixed(2)}.`}
                                {signal.signal_type === 'sell' && `The AI predicts ${signal.coin} will likely decrease in value. If you own it, consider reducing your position. If you don't own it, wait for a better entry point.`}
                                {signal.signal_type === 'alert' && `${signal.coin} is experiencing high volatility or risk. Exercise extreme caution and use smaller position sizes.`}
                              </p>
                            </div>
                            
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="bg-white/70 rounded-lg p-2">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-gray-600">Confidence</span>
                                  <span className={`font-bold ${getConfidenceColor(signal.confidence)}`}>
                                    {signal.confidence}%
                                  </span>
                                </div>
                                <p className="text-gray-500">
                                  {signal.confidence >= 80 ? 'Very confident' :
                                   signal.confidence >= 65 ? 'Confident' :
                                   signal.confidence >= 50 ? 'Moderate confidence' :
                                   'Low confidence'}
                                </p>
                              </div>
                              
                              <div className="bg-white/70 rounded-lg p-2">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-gray-600">Risk Level</span>
                                  <span className={getRiskColor(signal.detailed_analysis.risk_level)}>
                                    {signal.detailed_analysis.risk_level}/10
                                  </span>
                                </div>
                                <p className="text-gray-500">
                                  {signal.detailed_analysis.risk_level >= 8 ? 'Very risky' :
                                   signal.detailed_analysis.risk_level >= 6 ? 'Moderate risk' :
                                   signal.detailed_analysis.risk_level >= 4 ? 'Low risk' :
                                   'Very safe'}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            {/* Technical Indicators - Simplified */}
                            <div>
                              <p className="text-primary/40 mb-2">Technical Data</p>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-primary/60">RSI:</span>
                                  <span className={`${signal.technical_indicators.rsi > 70 ? 'text-red-600' : signal.technical_indicators.rsi < 30 ? 'text-green-600' : 'text-primary'}`}>
                                    {signal.technical_indicators.rsi.toFixed(1)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-primary/60">Volume:</span>
                                  <span className={`${signal.technical_indicators.volume_trend === 'up' ? 'text-green-600' : signal.technical_indicators.volume_trend === 'down' ? 'text-red-600' : 'text-primary'}`}>
                                    {signal.technical_indicators.volume_trend.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Price Targets */}
                            <div>
                              <p className="text-primary/40 mb-2">Price Targets</p>
                              <div className="space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-primary/60">Current:</span>
                                  <span className="text-primary font-medium">${signal.current_price.toFixed(2)}</span>
                                </div>
                                {signal.price_target && (
                                  <div className="flex justify-between">
                                    <span className="text-primary/60">Target:</span>
                                    <span className="text-gold font-medium">${signal.price_target.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Key Levels - Simplified */}
                            <div className="col-span-2">
                              <p className="text-primary/40 mb-2">Support & Resistance</p>
                              <div className="flex justify-between">
                                <span className="text-primary/60">
                                  Support: <span className="text-green-600">${signal.detailed_analysis.key_levels.support.toFixed(2)}</span>
                                </span>
                                <span className="text-primary/60">
                                  Resistance: <span className="text-red-600">${signal.detailed_analysis.key_levels.resistance.toFixed(2)}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* Timestamp */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                        <span className="text-xs text-primary/40 font-light">
                          {new Date(signal.created_at).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-primary/40" />
                          <span className="text-xs text-primary/40">Live Analysis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassContainer>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Enhanced Disclaimer with explanations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: signals.length * 0.1 + 0.5 }}
        className="pt-4 border-t border-gray-100"
      >
        <div className="bg-amber-50/50 border border-amber-200/50 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Understanding AI Signals
          </h4>
          <div className="text-xs text-amber-700 space-y-1">
            <p><strong>Confidence Levels:</strong> Higher % = AI is more certain about the prediction</p>
            <p><strong>These are suggestions, not guarantees:</strong> Crypto markets are unpredictable</p>
            <p><strong>Always start small:</strong> Never invest more than you can afford to lose</p>
            <p><strong>Do your research:</strong> Use these signals as one factor among many</p>
          </div>
        </div>
        <p className="text-xs font-light text-primary/40 text-center">
          AI signals are educational tools based on technical analysis. Past performance does not guarantee future results.
        </p>
      </motion.div>
    </div>
  );
}