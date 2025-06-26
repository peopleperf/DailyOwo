/**
 * 🪙 Crypto Service - Real-time cryptocurrency data and analysis
 * 
 * Provides comprehensive crypto market data, portfolio tracking,
 * and AI-powered trading insights following DailyOwo's premium standards.
 */

import { formatCurrency } from '@/lib/utils/format';

// Types
export interface CryptoCoin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  market_cap_rank: number;
  total_volume: number;
  image: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface CryptoHolding {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  purchase_price: number;
  purchase_date: Date;
  current_price: number;
  current_value: number;
  pnl: number;
  pnl_percentage: number;
}

export interface PortfolioSummary {
  total_value: number;
  total_pnl: number;
  total_pnl_percentage: number;
  day_change: number;
  day_change_percentage: number;
  holdings_count: number;
}

export interface AISignal {
  coin: string;
  symbol: string;
  signal_type: 'buy' | 'sell' | 'hold' | 'alert';
  confidence: number;
  price_target?: number;
  current_price: number;
  message: string;
  recommendation: string;
  created_at: Date;
  image?: string;
  technical_indicators: {
    rsi: number;
    moving_average_50: number;
    moving_average_200: number;
    volume_trend: 'up' | 'down' | 'stable';
  };
  detailed_analysis: {
    momentum_score: number;
    risk_level: number;
    volume_signal: string;
    market_structure: string;
    key_levels: {
      support: number;
      resistance: number;
    };
  };
}

export interface MarketData {
  total_market_cap: number;
  total_volume: number;
  bitcoin_dominance: number;
  fear_greed_index?: number;
  trending_coins: CryptoCoin[];
}

class CryptoService {
  private readonly BASE_URL = '/api/crypto'; // Use our server-side API
  private readonly CACHE_DURATION = 60000; // 1 minute cache
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests for free tier
  private cache = new Map<string, { data: any; timestamp: number }>();
  private lastRequestTime = 0;

  /**
   * Rate limiting for free tier
   */
  private async rateLimitedRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Enhanced fetch with error handling and rate limiting
   */
  private async fetchWithRetry(url: string, retries = 3): Promise<Response> {
    await this.rateLimitedRequest();
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (response.status === 429) {
          // Rate limited - wait longer
          await new Promise(resolve => setTimeout(resolve, 5000 * (i + 1)));
          continue;
        }
        
        if (!response.ok && response.status !== 404) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Get cached data or fetch fresh data
   */
  private async getCachedData<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: now });
      return data;
    } catch (error) {
      // Return cached data if available during error
      if (cached) {
        console.warn('Using cached data due to API error:', error);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Fetch top cryptocurrencies with market data
   */
  async getTopCoins(limit: number = 50): Promise<CryptoCoin[]> {
    return this.getCachedData(`top-coins-${limit}`, async () => {
      const url = `${this.BASE_URL}/market?endpoint=top-coins&limit=${limit}`;
      const response = await this.fetchWithRetry(url);
      return response.json();
    });
  }

  /**
   * Get specific coin data by ID
   */
  async getCoinData(coinId: string): Promise<CryptoCoin> {
    return this.getCachedData(`coin-${coinId}`, async () => {
      const url = `${this.BASE_URL}/coin?id=${coinId}`;
      const response = await this.fetchWithRetry(url);
      return response.json();
    });
  }

  /**
   * Get market overview data
   */
  async getMarketData(): Promise<MarketData> {
    return this.getCachedData('market-data', async () => {
      const [globalResponse, trendingResponse] = await Promise.all([
        this.fetchWithRetry(`${this.BASE_URL}/market?endpoint=global`),
        this.fetchWithRetry(`${this.BASE_URL}/market?endpoint=trending`)
      ]);

      const [globalData, trendingData] = await Promise.all([
        globalResponse.json(),
        trendingResponse.json()
      ]);

      return {
        total_market_cap: globalData.data.total_market_cap.usd,
        total_volume: globalData.data.total_volume.usd,
        bitcoin_dominance: globalData.data.market_cap_percentage.btc,
        trending_coins: trendingData.coins.slice(0, 5).map((item: any) => ({
          id: item.item.id,
          symbol: item.item.symbol,
          name: item.item.name,
          market_cap_rank: item.item.market_cap_rank,
          image: item.item.small
        }))
      };
    });
  }

  /**
   * Calculate portfolio metrics from holdings
   */
  calculatePortfolioSummary(holdings: CryptoHolding[]): PortfolioSummary {
    if (holdings.length === 0) {
      return {
        total_value: 0,
        total_pnl: 0,
        total_pnl_percentage: 0,
        day_change: 0,
        day_change_percentage: 0,
        holdings_count: 0
      };
    }

    const total_value = holdings.reduce((sum, holding) => sum + holding.current_value, 0);
    const total_cost = holdings.reduce((sum, holding) => sum + (holding.purchase_price * holding.amount), 0);
    const total_pnl = total_value - total_cost;
    const total_pnl_percentage = total_cost > 0 ? (total_pnl / total_cost) * 100 : 0;

    // Calculate 24h change (simplified - would need historical purchase values for accuracy)
    const day_change = holdings.reduce((sum, holding) => {
      const dailyChange = (holding.current_price * (holdings.find(h => h.symbol === holding.symbol)?.pnl_percentage || 0) / 100) * holding.amount;
      return sum + dailyChange;
    }, 0);

    const day_change_percentage = total_value > 0 ? (day_change / total_value) * 100 : 0;

    return {
      total_value,
      total_pnl,
      total_pnl_percentage,
      day_change,
      day_change_percentage,
      holdings_count: holdings.length
    };
  }

  /**
   * Advanced AI analysis with strategic decision making
   */
  async generateAISignals(holdings: CryptoHolding[]): Promise<AISignal[]> {
    const signals: AISignal[] = [];

    try {
      // Get comprehensive market data
      const [topCoins, marketData] = await Promise.all([
        this.getTopCoins(20),
        this.getMarketData()
      ]);

      // Analyze top coins + user holdings
      const coinsToAnalyze = new Map<string, CryptoCoin>();
      
      // Add top coins
      topCoins.forEach(coin => coinsToAnalyze.set(coin.id, coin));
      
      // Add user holdings (get fresh data for them)
      for (const holding of holdings) {
        if (!coinsToAnalyze.has(holding.id)) {
          try {
            const coinData = await this.getCoinData(holding.id);
            coinsToAnalyze.set(holding.id, coinData);
          } catch (error) {
            console.warn(`Failed to fetch data for ${holding.symbol}:`, error);
          }
        }
      }

      // Advanced analysis for each coin
      for (const coin of Array.from(coinsToAnalyze.values()).slice(0, 12)) {
        const analysis = this.performTechnicalAnalysis(coin, marketData, holdings);
        if (analysis) {
          signals.push(analysis);
        }
      }
      
      // Filter to only show high-quality signals (minimum 8 signals or top confidence)
      if (signals.length > 8) {
        signals.sort((a, b) => b.confidence - a.confidence);
        signals.splice(8); // Keep only top 8
      }

      // Sort by confidence and relevance
      return signals.sort((a, b) => {
        // Prioritize user holdings
        const aIsHolding = holdings.some(h => h.symbol === a.symbol);
        const bIsHolding = holdings.some(h => h.symbol === b.symbol);
        
        if (aIsHolding !== bIsHolding) {
          return aIsHolding ? -1 : 1;
        }
        
        return b.confidence - a.confidence;
      });

    } catch (error) {
      console.error('Failed to generate AI signals:', error);
      return [];
    }
  }

  /**
   * Perform comprehensive technical analysis
   */
  private performTechnicalAnalysis(
    coin: CryptoCoin, 
    marketData: MarketData, 
    holdings: CryptoHolding[]
  ): AISignal | null {
    const change24h = coin.price_change_percentage_24h;
    const change7d = coin.price_change_percentage_7d || 0;
    const price = coin.current_price;
    const volume = coin.total_volume;
    const marketCap = coin.market_cap;
    
    // Technical indicators calculation
    const rsi = this.calculateRSI(change24h, change7d);
    const { ma50, ma200 } = this.calculateMovingAverages(coin);
    const volumeTrend = this.analyzeVolumeTrend(volume, marketCap);
    
    // Market context
    const btcDominance = marketData.bitcoin_dominance;
    const totalMarketCap = marketData.total_market_cap;
    const isUserHolding = holdings.some(h => h.symbol === coin.symbol);
    
    // Multi-factor analysis
    let signal_type: AISignal['signal_type'] = 'hold';
    let confidence = this.calculateBaseConfidence(coin, change24h, change7d, rsi, volumeTrend);
    let message = '';
    let recommendation = '';
    let price_target: number | undefined;

    // 1. Momentum Analysis
    const momentum = this.analyzeMomentum(change24h, change7d, rsi);
    
    // 2. Volume Analysis
    const volumeSignal = this.analyzeVolumeSignal(volumeTrend, change24h);
    
    // 3. Market Structure Analysis
    const marketStructure = this.analyzeMarketStructure(coin, marketData);
    
    // 4. Risk Assessment
    const riskLevel = this.assessRisk(coin, change24h, change7d, rsi);

    // Generate signals based on comprehensive analysis
    if (momentum.score > 7 && volumeSignal === 'strong_buy' && riskLevel < 6) {
      signal_type = 'buy';
      confidence = this.enhanceConfidenceWithRealData(
        this.calculateRefinedConfidence('buy', momentum.score, riskLevel, volumeSignal, rsi, change24h),
        coin,
        volumeTrend
      );
      message = `Strong bullish momentum with ${volumeSignal === 'strong_buy' ? 'exceptional' : 'good'} volume confirmation`;
      recommendation = `**What BUY means:** The analysis suggests this crypto is likely to increase in value. Consider purchasing gradually rather than all at once. Entry below $${(price * 0.97).toFixed(2)} is optimal. Target: $${(price * 1.15).toFixed(2)}`;
      price_target = price * 1.15;
      
    } else if (momentum.score < 3 && riskLevel > 7 && change24h < -5) {
      signal_type = 'sell';
      confidence = this.enhanceConfidenceWithRealData(
        this.calculateRefinedConfidence('sell', momentum.score, riskLevel, volumeSignal, rsi, change24h),
        coin,
        volumeTrend
      );
      message = `Bearish momentum accelerating with high risk indicators`;
      recommendation = isUserHolding ? 
        `**What SELL means:** The analysis suggests the price may fall further. Consider reducing your position by 25-50% to protect your investment. This doesn't mean panic selling - it's risk management.` : 
        `**What SELL means:** Avoid buying now as the price is likely to drop. Wait for better entry around $${(price * 0.85).toFixed(2)} support level.`;
      price_target = price * 0.85;
      
    } else if (riskLevel > 8 || Math.abs(change24h) > 10) {
      signal_type = 'alert';
      confidence = this.enhanceConfidenceWithRealData(
        this.calculateRefinedConfidence('alert', momentum.score, riskLevel, volumeSignal, rsi, change24h),
        coin,
        volumeTrend
      );
      message = `High volatility alert - ${riskLevel > 8 ? 'elevated risk detected' : 'price swing warning'}`;
      recommendation = `**What ALERT means:** This crypto is experiencing high volatility or risk. Be very careful with any trades. Use smaller amounts and be prepared for sudden price swings.`;
      
    } else {
      // Only generate hold signals if confidence is reasonable
      const holdConfidence = this.enhanceConfidenceWithRealData(
        this.calculateRefinedConfidence('hold', momentum.score, riskLevel, volumeSignal, rsi, change24h),
        coin,
        volumeTrend
      );
      
      // Filter out low-confidence hold signals to maintain user trust
      if (holdConfidence < 60) {
        return null; // Don't show weak signals
      }
      
      signal_type = 'hold';
      confidence = holdConfidence;
      message = `Stable outlook with balanced risk-reward profile`;
      recommendation = `**What HOLD means:** The analysis shows balanced indicators suggesting price stability. This is a good time to maintain current positions and monitor for clearer directional signals.`;
    }

    // Adjust for user holdings
    if (isUserHolding) {
      const holding = holdings.find(h => h.symbol === coin.symbol)!;
      const pnlPercentage = holding.pnl_percentage;
      
      if (pnlPercentage > 50 && signal_type === 'buy') {
        signal_type = 'alert';
        message = `Strong gains achieved (+${pnlPercentage.toFixed(1)}%) - consider profit taking`;
        recommendation = `Take partial profits. Consider selling 20-30% of position`;
      } else if (pnlPercentage < -20 && signal_type === 'sell') {
        confidence = Math.min(confidence + 10, 95);
        recommendation = `Position showing losses (${pnlPercentage.toFixed(1)}%). ${recommendation}`;
      }
    }

    return {
      coin: coin.name,
      symbol: coin.symbol.toUpperCase(),
      signal_type,
      confidence,
      price_target,
      current_price: price,
      message,
      recommendation,
      created_at: new Date(),
      image: coin.image,
      technical_indicators: {
        rsi,
        moving_average_50: ma50,
        moving_average_200: ma200,
        volume_trend: volumeTrend
      },
      detailed_analysis: {
        momentum_score: momentum.score,
        risk_level: riskLevel,
        volume_signal: volumeSignal,
        market_structure: marketStructure,
        key_levels: {
          support: price * 0.92,
          resistance: price * 1.08
        }
      }
    };
  }

  // Helper methods for technical analysis
  private calculateRSI(change24h: number, change7d: number): number {
    // Simplified RSI calculation using available data
    const recentGain = Math.max(0, change24h);
    const recentLoss = Math.max(0, -change24h);
    const weeklyGain = Math.max(0, change7d);
    const weeklyLoss = Math.max(0, -change7d);
    
    const avgGain = (recentGain + weeklyGain) / 2;
    const avgLoss = (recentLoss + weeklyLoss) / 2;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMovingAverages(coin: CryptoCoin): { ma50: number; ma200: number } {
    const price = coin.current_price;
    const change24h = coin.price_change_percentage_24h;
    const change7d = coin.price_change_percentage_7d || 0;
    
    // Calculate estimated moving averages based on recent price action
    // This uses the current price and recent percentage changes to estimate where MAs might be
    // Note: This is a mathematical approximation - real MAs would require historical price data
    
    // MA50 approximation: assume it follows recent 7-day trend
    const weeklyTrendFactor = 1 + (change7d / 100);
    const ma50 = price / Math.pow(weeklyTrendFactor, 7/50); // Approximate 50-day position
    
    // MA200 approximation: use longer-term estimation based on current market position
    const marketCapRank = coin.market_cap_rank;
    const volatilityFactor = Math.abs(change24h) / 100;
    
    // Large cap coins (rank < 50) tend to have MAs closer to current price
    // Small cap coins have more volatile MA relationships
    let ma200Factor = 0.85; // Base assumption: MA200 is 15% below current price for trending assets
    
    if (marketCapRank <= 10) {
      ma200Factor = 0.90; // Large caps have MAs closer to price
    } else if (marketCapRank <= 50) {
      ma200Factor = 0.87;
    } else if (marketCapRank > 100) {
      ma200Factor = 0.80; // Small caps can have larger MA distances
    }
    
    // Adjust based on recent trend direction
    if (change7d > 0) {
      ma200Factor += volatilityFactor * 0.1; // Uptrend: MA200 closer to price
    } else {
      ma200Factor -= volatilityFactor * 0.1; // Downtrend: MA200 further from price
    }
    
    const ma200 = price * Math.max(0.5, Math.min(1.1, ma200Factor));
    
    return {
      ma50: Math.max(0, ma50),
      ma200: Math.max(0, ma200)
    };
  }

  private analyzeVolumeTrend(volume: number, marketCap: number): 'up' | 'down' | 'stable' {
    const volumeToMarketCapRatio = volume / marketCap;
    
    if (volumeToMarketCapRatio > 0.1) return 'up';
    if (volumeToMarketCapRatio < 0.02) return 'down';
    return 'stable';
  }

  private analyzeMomentum(change24h: number, change7d: number, rsi: number): { score: number; direction: string } {
    let score = 5; // Neutral
    
    // 24h momentum
    if (change24h > 5) score += 2;
    else if (change24h > 2) score += 1;
    else if (change24h < -5) score -= 2;
    else if (change24h < -2) score -= 1;
    
    // 7d momentum
    if (change7d > 15) score += 2;
    else if (change7d > 5) score += 1;
    else if (change7d < -15) score -= 2;
    else if (change7d < -5) score -= 1;
    
    // RSI confirmation
    if (rsi > 70) score -= 1; // Overbought
    else if (rsi < 30) score += 1; // Oversold
    
    return {
      score: Math.max(0, Math.min(10, score)),
      direction: score > 5 ? 'bullish' : score < 5 ? 'bearish' : 'neutral'
    };
  }

  private analyzeVolumeSignal(volumeTrend: 'up' | 'down' | 'stable', priceChange: number): string {
    if (volumeTrend === 'up' && priceChange > 3) return 'strong_buy';
    if (volumeTrend === 'up' && priceChange < -3) return 'strong_sell';
    if (volumeTrend === 'down' && Math.abs(priceChange) > 5) return 'weak_signal';
    return 'neutral';
  }

  private analyzeMarketStructure(coin: CryptoCoin, marketData: MarketData): string {
    const rank = coin.market_cap_rank;
    const btcDominance = marketData.bitcoin_dominance;
    
    if (rank <= 10 && btcDominance > 50) return 'strong_foundation';
    if (rank <= 50 && btcDominance < 45) return 'alt_season_ready';
    if (rank > 100) return 'high_risk';
    return 'stable';
  }

  private assessRisk(coin: CryptoCoin, change24h: number, change7d: number, rsi: number): number {
    let risk = 5; // Base risk
    
    // Volatility risk
    if (Math.abs(change24h) > 15) risk += 3;
    else if (Math.abs(change24h) > 10) risk += 2;
    else if (Math.abs(change24h) > 5) risk += 1;
    
    // Weekly volatility
    if (Math.abs(change7d) > 30) risk += 2;
    else if (Math.abs(change7d) > 20) risk += 1;
    
    // Market cap risk (lower cap = higher risk)
    if (coin.market_cap_rank > 100) risk += 2;
    else if (coin.market_cap_rank > 50) risk += 1;
    
    // RSI extremes
    if (rsi > 80 || rsi < 20) risk += 1;
    
    return Math.max(1, Math.min(10, risk));
  }

  /**
   * Calculate base confidence using multiple real data points
   */
  private calculateBaseConfidence(
    coin: CryptoCoin, 
    change24h: number, 
    change7d: number, 
    rsi: number, 
    volumeTrend: 'up' | 'down' | 'stable'
  ): number {
    let confidence = 30; // Start lower and build up with real data
    
    // Volume confidence (higher volume = higher confidence)
    const volumeToCapRatio = coin.total_volume / coin.market_cap;
    if (volumeToCapRatio > 0.15) confidence += 25;
    else if (volumeToCapRatio > 0.08) confidence += 15;
    else if (volumeToCapRatio > 0.04) confidence += 10;
    else confidence += 5; // Low volume = low confidence
    
    // Market cap ranking (established coins = higher confidence)
    if (coin.market_cap_rank <= 10) confidence += 20;
    else if (coin.market_cap_rank <= 50) confidence += 15;
    else if (coin.market_cap_rank <= 100) confidence += 10;
    else confidence += 5;
    
    // Price stability factor
    const volatility = Math.abs(change24h) + Math.abs(change7d);
    if (volatility < 5) confidence += 10; // Low volatility = higher confidence
    else if (volatility > 20) confidence -= 5; // High volatility = lower confidence
    
    // RSI validation (extreme RSI reduces confidence)
    if (rsi > 80 || rsi < 20) confidence -= 10;
    else if (rsi > 70 || rsi < 30) confidence -= 5;
    
    return Math.max(25, Math.min(75, confidence)); // Base range: 25-75%
  }
  
  /**
   * Calculate refined confidence based on signal type and multiple factors
   */
  private calculateRefinedConfidence(
    signalType: 'buy' | 'sell' | 'hold' | 'alert',
    momentumScore: number,
    riskLevel: number,
    volumeSignal: string,
    rsi: number,
    change24h: number
  ): number {
    let confidence = 60; // Start with base confidence
    
    // Adjust based on signal strength
    switch (signalType) {
      case 'buy':
        confidence += (momentumScore - 5) * 5; // Higher momentum = higher confidence
        confidence -= (riskLevel - 5) * 3; // Higher risk = lower confidence
        if (volumeSignal === 'strong_buy') confidence += 15;
        break;
        
      case 'sell':
        confidence += Math.abs(change24h) * 2; // Larger drops = higher sell confidence
        confidence += (riskLevel - 5) * 2; // Higher risk = higher sell confidence
        confidence -= (momentumScore - 5) * 3; // Avoid selling on positive momentum
        break;
        
      case 'alert':
        confidence += riskLevel * 3; // Higher risk = higher alert confidence
        confidence += Math.abs(change24h); // Volatility increases alert confidence
        break;
        
      case 'hold':
        // Hold confidence is inverse of extremes
        confidence -= Math.abs(momentumScore - 5) * 2;
        confidence -= Math.abs(riskLevel - 5) * 2;
        break;
    }
    
    return Math.max(30, Math.min(95, Math.round(confidence)));
  }
  
  /**
   * Enhance confidence calculation with real market data
   */
  private enhanceConfidenceWithRealData(
    baseConfidence: number,
    coin: CryptoCoin,
    volumeTrend: 'up' | 'down' | 'stable'
  ): number {
    let confidence = baseConfidence;
    
    // Real volume analysis
    const volumeToCapRatio = coin.total_volume / coin.market_cap;
    if (volumeToCapRatio > 0.15) confidence += 8; // High volume = high confidence
    else if (volumeToCapRatio > 0.08) confidence += 5;
    else if (volumeToCapRatio < 0.02) confidence -= 5; // Low volume = low confidence
    
    // Market position confidence
    if (coin.market_cap_rank <= 10) confidence += 10; // Top 10 coins are more predictable
    else if (coin.market_cap_rank <= 50) confidence += 5;
    else if (coin.market_cap_rank > 200) confidence -= 8; // Very small caps are unpredictable
    
    // Price stability factor
    const dailyVolatility = Math.abs(coin.price_change_percentage_24h);
    if (dailyVolatility > 15) confidence -= 10; // High volatility reduces confidence
    else if (dailyVolatility < 3) confidence += 5; // Low volatility increases confidence
    
    return Math.max(25, Math.min(95, Math.round(confidence)));
  }

  /**
   * Search for cryptocurrencies
   */
  async searchCoins(query: string): Promise<CryptoCoin[]> {
    if (query.length < 2) return [];

    return this.getCachedData(`search-${query}`, async () => {
      const response = await this.fetchWithRetry(`${this.BASE_URL}/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search coins');
      }

      const data = await response.json();
      
      // Return coins with market data
      const coinIds = data.coins.slice(0, 10).map((coin: any) => coin.id).join(',');
      return this.getTopCoins(50).then(coins => 
        coins.filter(coin => 
          coin.name.toLowerCase().includes(query.toLowerCase()) || 
          coin.symbol.toLowerCase().includes(query.toLowerCase())
        )
      );
    });
  }

  /**
   * Format currency following DailyOwo patterns
   */
  formatPrice(price: number, currency = 'USD'): string {
    return formatCurrency(price, { currency, locale: 'en-US' });
  }

  /**
   * Format percentage with proper styling
   */
  formatPercentage(percentage: number): string {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  }

  /**
   * Get color class based on value (following design philosophy)
   */
  getValueColor(value: number): string {
    if (value > 0) return 'text-gold'; // Gold for positive
    if (value < 0) return 'text-primary/60'; // Gray for negative (not red)
    return 'text-primary'; // Navy for neutral
  }

  /**
   * Clear cache (useful for refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const cryptoService = new CryptoService();

// Types are already exported above, no need to re-export