'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Shuffle,
  RefreshCw,
  PieChart
} from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { 
  PortfolioOptimization, 
  OptimizationRecommendation,
  RiskMetrics,
  PortfolioAllocation
} from '@/lib/services/crypto-portfolio-optimizer';

interface PortfolioOptimizerProps {
  optimization?: PortfolioOptimization;
  isLoading?: boolean;
  onRefresh?: () => Promise<void>;
  onRebalance?: (allocations: PortfolioAllocation[]) => void;
}

export function PortfolioOptimizer({ 
  optimization, 
  isLoading = false, 
  onRefresh,
  onRebalance 
}: PortfolioOptimizerProps) {
  
  const [showRebalanceDetails, setShowRebalanceDetails] = useState(false);

  const getRiskColor = (risk: RiskMetrics['portfolioRisk']) => {
    switch (risk) {
      case 'low': return 'text-gold';
      case 'medium': return 'text-primary';
      case 'high': return 'text-orange-600';
      case 'extreme': return 'text-red-600';
      default: return 'text-primary';
    }
  };

  const getRiskBadgeColor = (risk: RiskMetrics['portfolioRisk']) => {
    switch (risk) {
      case 'low': return 'bg-gold/10 text-gold border-gold/20';
      case 'medium': return 'bg-primary/10 text-primary border-primary/20';
      case 'high': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'extreme': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getRecommendationIcon = (type: OptimizationRecommendation['type']) => {
    switch (type) {
      case 'rebalance': return Shuffle;
      case 'diversify': return PieChart;
      case 'reduce_risk': return Shield;
      case 'take_profit': return TrendingUp;
      case 'accumulate': return Target;
      default: return Info;
    }
  };

  const getPriorityColor = (priority: OptimizationRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-primary bg-primary/5 border-primary/20';
      case 'low': return 'text-primary/60 bg-gray-50 border-gray-200';
      default: return 'text-primary bg-primary/5 border-primary/20';
    }
  };

  if (!optimization) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <GlassContainer className="p-8 text-center">
          <Target className="w-12 h-12 text-primary/30 mx-auto mb-4" />
          <h3 className="text-lg font-light text-primary mb-2">
            {isLoading ? 'Analyzing Portfolio...' : 'Portfolio Analysis Unavailable'}
          </h3>
          <p className="text-sm font-light text-primary/60">
            {isLoading ? 'Running optimization algorithms' : 'Add holdings to see optimization suggestions'}
          </p>
        </GlassContainer>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Risk Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <GlassContainer className="p-6 md:p-8 bg-gradient-to-br from-primary/5 via-white to-gold/5" goldBorder>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-gold/20 to-gold/40 rounded-xl flex items-center justify-center border border-gold/20">
                <Shield className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
                  Portfolio Analysis
                </p>
                <h3 className="text-lg font-light text-primary">Risk Assessment</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-light border ${getRiskBadgeColor(optimization.riskMetrics.portfolioRisk)}`}>
                {optimization.riskMetrics.portfolioRisk.toUpperCase()} RISK
              </span>
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
          </div>

          {/* Risk Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-light text-primary mb-1">
                {optimization.riskMetrics.concentrationRisk}%
              </p>
              <p className="text-xs font-light tracking-wide uppercase text-primary/40">
                Concentration Risk
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-light text-primary mb-1">
                {optimization.riskMetrics.volatilityScore}%
              </p>
              <p className="text-xs font-light tracking-wide uppercase text-primary/40">
                Volatility Score
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-light text-primary mb-1">
                {optimization.riskMetrics.diversificationScore}%
              </p>
              <p className="text-xs font-light tracking-wide uppercase text-primary/40">
                Diversification
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl md:text-3xl font-light text-primary mb-1">
                {optimization.riskMetrics.riskAdjustedReturn.toFixed(1)}
              </p>
              <p className="text-xs font-light tracking-wide uppercase text-primary/40">
                Risk-Adj Return
              </p>
            </div>
          </div>
        </GlassContainer>
      </motion.div>

      {/* Rebalancing Section */}
      {optimization.rebalancingNeeded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <GlassContainer className="p-6 bg-gradient-to-r from-orange-50/50 to-orange-100/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shuffle className="w-5 h-5 text-orange-600" />
                <div>
                  <h4 className="font-light text-primary">Rebalancing Suggested</h4>
                  <p className="text-sm font-light text-primary/60">
                    Total adjustment: ${optimization.totalRebalanceAmount.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRebalanceDetails(!showRebalanceDetails)}
                  className="min-h-[40px]"
                >
                  {showRebalanceDetails ? 'Hide' : 'Show'} Details
                </GlassButton>
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => onRebalance?.(optimization.optimizedAllocations)}
                  goldBorder
                  className="min-h-[40px]"
                >
                  Apply Rebalancing
                </GlassButton>
              </div>
            </div>

            {/* Rebalance Details */}
            {showRebalanceDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {optimization.optimizedAllocations
                  .filter(alloc => Math.abs(alloc.rebalanceAmount) > 10)
                  .map((allocation, index) => (
                  <div key={allocation.symbol} className="flex items-center justify-between p-3 bg-white/50 rounded-lg">
                    <div>
                      <p className="font-light text-primary text-sm">{allocation.symbol}</p>
                      <p className="text-xs font-light text-primary/60">
                        {allocation.currentWeight.toFixed(1)}% → {allocation.targetWeight.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-light ${allocation.rebalanceAmount > 0 ? 'text-gold' : 'text-primary/60'}`}>
                        {allocation.rebalanceAmount > 0 ? '+' : ''}
                        ${Math.abs(allocation.rebalanceAmount).toLocaleString()}
                      </p>
                      <p className="text-xs font-light text-primary/60">
                        {allocation.rebalanceAmount > 0 ? 'Buy' : 'Sell'}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </GlassContainer>
        </motion.div>
      )}

      {/* Recommendations */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
            Optimization Recommendations
          </p>
          <h3 className="text-lg font-light text-primary">Suggested Actions</h3>
        </div>

        {optimization.recommendations.map((recommendation, index) => {
          const Icon = getRecommendationIcon(recommendation.type);
          
          return (
            <motion.div
              key={`${recommendation.type}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <GlassContainer className="p-4 hover:shadow-lg transition-all">
                <div className="flex items-start gap-3">
                  {/* Recommendation Icon */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>

                  {/* Recommendation Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-light text-primary text-sm">{recommendation.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full font-light border ${getPriorityColor(recommendation.priority)}`}>
                        {recommendation.priority.toUpperCase()}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm font-light text-primary/80 mb-2">
                      {recommendation.description}
                    </p>

                    {/* Expected Impact */}
                    <p className="text-xs font-light text-gold mb-3">
                      Expected Impact: {recommendation.expectedImpact}
                    </p>

                    {/* Action Items */}
                    <div className="space-y-1">
                      {recommendation.actionItems.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />
                          <p className="text-xs font-light text-primary/60">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassContainer>
            </motion.div>
          );
        })}
      </div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: optimization.recommendations.length * 0.1 + 0.5 }}
        className="pt-4 border-t border-gray-100"
      >
        <p className="text-xs font-light text-primary/40 text-center">
          Portfolio optimization suggestions are based on modern portfolio theory and market analysis. 
          Consider your personal financial situation and consult a financial advisor for major decisions.
        </p>
      </motion.div>
    </div>
  );
}