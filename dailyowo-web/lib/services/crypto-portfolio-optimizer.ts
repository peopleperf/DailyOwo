/**
 * 🎯 Crypto Portfolio Optimizer - Advanced portfolio analysis and rebalancing
 * 
 * Provides intelligent portfolio optimization suggestions based on modern portfolio theory,
 * risk management principles, and market analysis.
 */

import { CryptoHolding, CryptoCoin, MarketData } from './crypto-service';

export interface PortfolioAllocation {
  symbol: string;
  name: string;
  currentWeight: number;
  targetWeight: number;
  currentValue: number;
  targetValue: number;
  rebalanceAmount: number; // Positive = buy, negative = sell
  rebalancePercentage: number;
}

export interface RiskMetrics {
  portfolioRisk: 'low' | 'medium' | 'high' | 'extreme';
  concentrationRisk: number; // 0-100
  volatilityScore: number; // 0-100
  diversificationScore: number; // 0-100
  riskAdjustedReturn: number;
}

export interface OptimizationRecommendation {
  type: 'rebalance' | 'diversify' | 'reduce_risk' | 'take_profit' | 'accumulate';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  actionItems: string[];
  targetAllocations?: PortfolioAllocation[];
}

export interface PortfolioOptimization {
  riskMetrics: RiskMetrics;
  currentAllocations: PortfolioAllocation[];
  recommendations: OptimizationRecommendation[];
  optimizedAllocations: PortfolioAllocation[];
  rebalancingNeeded: boolean;
  totalRebalanceAmount: number;
}

class CryptoPortfolioOptimizer {
  private readonly IDEAL_HOLDINGS_COUNT = 8; // Sweet spot for crypto diversification
  private readonly MAX_SINGLE_POSITION = 25; // Max % in one asset
  private readonly MIN_POSITION_SIZE = 5; // Min % for meaningful position
  private readonly REBALANCE_THRESHOLD = 10; // % deviation to trigger rebalance

  /**
   * Analyze and optimize portfolio
   */
  async optimizePortfolio(
    holdings: CryptoHolding[],
    marketData: MarketData,
    topCoins: CryptoCoin[],
    riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  ): Promise<PortfolioOptimization> {
    
    if (holdings.length === 0) {
      return this.getEmptyPortfolioOptimization();
    }

    const totalValue = holdings.reduce((sum, h) => sum + h.current_value, 0);
    const currentAllocations = this.calculateCurrentAllocations(holdings, totalValue);
    const riskMetrics = this.calculateRiskMetrics(holdings, currentAllocations, marketData);
    const optimizedAllocations = this.generateOptimizedAllocations(
      currentAllocations, 
      riskMetrics, 
      riskTolerance,
      topCoins
    );
    const recommendations = this.generateRecommendations(
      currentAllocations,
      optimizedAllocations,
      riskMetrics,
      holdings,
      riskTolerance
    );

    const rebalancingNeeded = this.isRebalancingNeeded(currentAllocations, optimizedAllocations);
    const totalRebalanceAmount = Math.abs(
      optimizedAllocations.reduce((sum, alloc) => sum + alloc.rebalanceAmount, 0)
    );

    return {
      riskMetrics,
      currentAllocations,
      recommendations,
      optimizedAllocations,
      rebalancingNeeded,
      totalRebalanceAmount
    };
  }

  /**
   * Calculate current portfolio allocations
   */
  private calculateCurrentAllocations(holdings: CryptoHolding[], totalValue: number): PortfolioAllocation[] {
    return holdings.map(holding => ({
      symbol: holding.symbol,
      name: holding.name,
      currentWeight: (holding.current_value / totalValue) * 100,
      targetWeight: 0, // Will be calculated in optimization
      currentValue: holding.current_value,
      targetValue: 0, // Will be calculated in optimization
      rebalanceAmount: 0,
      rebalancePercentage: 0
    }));
  }

  /**
   * Calculate comprehensive risk metrics
   */
  private calculateRiskMetrics(
    holdings: CryptoHolding[], 
    allocations: PortfolioAllocation[],
    marketData: MarketData
  ): RiskMetrics {
    
    // Concentration risk - how much is in the largest position
    const maxWeight = Math.max(...allocations.map(a => a.currentWeight));
    const concentrationRisk = Math.min(100, (maxWeight / this.MAX_SINGLE_POSITION) * 100);

    // Volatility score based on individual asset volatility
    const avgVolatility = holdings.reduce((sum, h) => {
      const vol = Math.abs(h.pnl_percentage) || 0;
      return sum + vol;
    }, 0) / holdings.length;
    const volatilityScore = Math.min(100, avgVolatility * 2);

    // Diversification score
    const holdingsCount = holdings.length;
    const diversificationScore = Math.min(100, (holdingsCount / this.IDEAL_HOLDINGS_COUNT) * 100);

    // Risk-adjusted return (Sharpe ratio approximation)
    const avgReturn = holdings.reduce((sum, h) => sum + h.pnl_percentage, 0) / holdings.length;
    const riskAdjustedReturn = avgVolatility > 0 ? avgReturn / avgVolatility : 0;

    // Overall portfolio risk
    let portfolioRisk: RiskMetrics['portfolioRisk'] = 'medium';
    if (concentrationRisk > 80 || volatilityScore > 60 || diversificationScore < 40) {
      portfolioRisk = 'high';
    } else if (concentrationRisk > 90 || volatilityScore > 80) {
      portfolioRisk = 'extreme';
    } else if (concentrationRisk < 40 && volatilityScore < 30 && diversificationScore > 70) {
      portfolioRisk = 'low';
    }

    return {
      portfolioRisk,
      concentrationRisk: Math.round(concentrationRisk),
      volatilityScore: Math.round(volatilityScore),
      diversificationScore: Math.round(diversificationScore),
      riskAdjustedReturn: Math.round(riskAdjustedReturn * 100) / 100
    };
  }

  /**
   * Generate optimized allocations based on risk tolerance
   */
  private generateOptimizedAllocations(
    currentAllocations: PortfolioAllocation[],
    riskMetrics: RiskMetrics,
    riskTolerance: 'conservative' | 'moderate' | 'aggressive',
    topCoins: CryptoCoin[]
  ): PortfolioAllocation[] {
    
    const totalValue = currentAllocations.reduce((sum, a) => sum + a.currentValue, 0);
    
    // Define target weights based on risk tolerance
    const targetWeights = this.calculateTargetWeights(currentAllocations, riskTolerance, topCoins);
    
    return currentAllocations.map(allocation => {
      const targetWeight = targetWeights[allocation.symbol] || 0;
      const targetValue = (targetWeight / 100) * totalValue;
      const rebalanceAmount = targetValue - allocation.currentValue;
      const rebalancePercentage = allocation.currentValue > 0 ? 
        (rebalanceAmount / allocation.currentValue) * 100 : 0;

      return {
        ...allocation,
        targetWeight,
        targetValue,
        rebalanceAmount,
        rebalancePercentage
      };
    });
  }

  /**
   * Calculate optimal target weights
   */
  private calculateTargetWeights(
    allocations: PortfolioAllocation[],
    riskTolerance: 'conservative' | 'moderate' | 'aggressive',
    topCoins: CryptoCoin[]
  ): Record<string, number> {
    
    const weights: Record<string, number> = {};
    
    // Risk tolerance parameters
    const params = {
      conservative: { maxSingle: 20, btcWeight: 40, ethWeight: 25, altWeight: 35 },
      moderate: { maxSingle: 25, btcWeight: 35, ethWeight: 20, altWeight: 45 },
      aggressive: { maxSingle: 30, btcWeight: 25, ethWeight: 15, altWeight: 60 }
    }[riskTolerance];

    // Sort by market cap rank for stability preference
    const sortedAllocations = [...allocations].sort((a, b) => {
      const coinA = topCoins.find(c => c.symbol.toLowerCase() === a.symbol.toLowerCase());
      const coinB = topCoins.find(c => c.symbol.toLowerCase() === b.symbol.toLowerCase());
      const rankA = coinA?.market_cap_rank || 999;
      const rankB = coinB?.market_cap_rank || 999;
      return rankA - rankB;
    });

    // Assign weights based on market cap rank and risk tolerance
    sortedAllocations.forEach((allocation, index) => {
      const symbol = allocation.symbol.toLowerCase();
      
      if (symbol === 'btc') {
        weights[allocation.symbol] = params.btcWeight;
      } else if (symbol === 'eth') {
        weights[allocation.symbol] = params.ethWeight;
      } else {
        // Distribute remaining weight among altcoins
        const remainingAlts = sortedAllocations.length - 
          (sortedAllocations.some(a => a.symbol.toLowerCase() === 'btc') ? 1 : 0) -
          (sortedAllocations.some(a => a.symbol.toLowerCase() === 'eth') ? 1 : 0);
        
        if (remainingAlts > 0) {
          const altWeight = params.altWeight / remainingAlts;
          weights[allocation.symbol] = Math.min(params.maxSingle, altWeight);
        }
      }
    });

    // Normalize weights to 100%
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (totalWeight > 0) {
      Object.keys(weights).forEach(symbol => {
        weights[symbol] = (weights[symbol] / totalWeight) * 100;
      });
    }

    return weights;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    currentAllocations: PortfolioAllocation[],
    optimizedAllocations: PortfolioAllocation[],
    riskMetrics: RiskMetrics,
    holdings: CryptoHolding[],
    riskTolerance: string
  ): OptimizationRecommendation[] {
    
    const recommendations: OptimizationRecommendation[] = [];

    // Check for concentration risk
    if (riskMetrics.concentrationRisk > 70) {
      const overweightAsset = currentAllocations.find(a => a.currentWeight > this.MAX_SINGLE_POSITION);
      if (overweightAsset) {
        recommendations.push({
          type: 'reduce_risk',
          priority: 'high',
          title: 'Reduce Concentration Risk',
          description: `${overweightAsset.symbol} represents ${overweightAsset.currentWeight.toFixed(1)}% of your portfolio, increasing risk.`,
          expectedImpact: 'Reduce portfolio volatility by 15-25%',
          actionItems: [
            `Consider reducing ${overweightAsset.symbol} position to ${this.MAX_SINGLE_POSITION}% or less`,
            'Redistribute funds to other quality assets',
            'Use dollar-cost averaging for position adjustments'
          ]
        });
      }
    }

    // Check for diversification opportunities
    if (riskMetrics.diversificationScore < 60) {
      recommendations.push({
        type: 'diversify',
        priority: 'medium',
        title: 'Improve Diversification',
        description: `Portfolio has ${holdings.length} holdings. Optimal range is 6-10 for crypto.`,
        expectedImpact: 'Reduce overall portfolio risk',
        actionItems: [
          'Consider adding 2-3 quality assets from different sectors',
          'Focus on established projects with strong fundamentals',
          'Maintain minimum 5% position sizes for meaningful impact'
        ]
      });
    }

    // Check for rebalancing needs
    const needsRebalancing = optimizedAllocations.some(a => Math.abs(a.rebalancePercentage) > this.REBALANCE_THRESHOLD);
    if (needsRebalancing) {
      recommendations.push({
        type: 'rebalance',
        priority: 'medium',
        title: 'Portfolio Rebalancing Needed',
        description: 'Some positions have drifted significantly from optimal allocation.',
        expectedImpact: 'Optimize risk-return profile',
        actionItems: [
          'Review proposed rebalancing amounts',
          'Consider tax implications of rebalancing',
          'Execute rebalancing gradually over 1-2 weeks'
        ],
        targetAllocations: optimizedAllocations
      });
    }

    // Check for profit-taking opportunities
    const profitableHoldings = holdings.filter(h => h.pnl_percentage > 50);
    if (profitableHoldings.length > 0) {
      recommendations.push({
        type: 'take_profit',
        priority: 'low',
        title: 'Consider Profit Taking',
        description: `${profitableHoldings.length} holdings have significant gains (>50%).`,
        expectedImpact: 'Lock in profits and reduce risk',
        actionItems: [
          'Consider taking 20-30% profits from top performers',
          'Use the 20% rule: sell 20% after 100% gains',
          'Reinvest profits into underweight positions'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Check if rebalancing is needed
   */
  private isRebalancingNeeded(
    current: PortfolioAllocation[], 
    optimized: PortfolioAllocation[]
  ): boolean {
    return optimized.some(opt => {
      const curr = current.find(c => c.symbol === opt.symbol);
      if (!curr) return false;
      return Math.abs(curr.currentWeight - opt.targetWeight) > this.REBALANCE_THRESHOLD;
    });
  }

  /**
   * Get empty portfolio optimization
   */
  private getEmptyPortfolioOptimization(): PortfolioOptimization {
    return {
      riskMetrics: {
        portfolioRisk: 'low',
        concentrationRisk: 0,
        volatilityScore: 0,
        diversificationScore: 0,
        riskAdjustedReturn: 0
      },
      currentAllocations: [],
      recommendations: [{
        type: 'accumulate',
        priority: 'high',
        title: 'Start Your Crypto Portfolio',
        description: 'Begin with established cryptocurrencies for a solid foundation.',
        expectedImpact: 'Build diversified crypto exposure',
        actionItems: [
          'Start with Bitcoin (BTC) for 40-50% of initial investment',
          'Add Ethereum (ETH) for 25-30% of portfolio',
          'Consider 2-3 additional quality projects',
          'Use dollar-cost averaging for entry'
        ]
      }],
      optimizedAllocations: [],
      rebalancingNeeded: false,
      totalRebalanceAmount: 0
    };
  }
}

// Export singleton instance
export const cryptoPortfolioOptimizer = new CryptoPortfolioOptimizer();