/**
 * Asset Price Logic Module
 * Handles automatic price updates for assets using CoinGecko MCP and other price sources
 */

import { Transaction, AssetPrice, PriceUpdateRequest } from '@/types/transaction';

export interface AssetPriceManager {
  updateAssetPrices: (transactions: Transaction[]) => Promise<AssetPriceUpdate[]>;
  getCryptoPrices: (symbols: string[]) => Promise<CryptoPriceData[]>;
  getStockPrices: (symbols: string[]) => Promise<StockPriceData[]>;
  scheduleAutoUpdates: (transactions: Transaction[]) => void;
  getLastUpdateTime: (transactionId: string) => Date | null;
}

export interface AssetPriceUpdate {
  transactionId: string;
  symbol: string;
  oldPrice: number;
  newPrice: number;
  changePercent: number;
  updateSource: 'coingecko' | 'manual' | 'yahoo-finance';
  updateTime: Date;
  success: boolean;
  error?: string;
}

export interface CryptoPriceData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  last_updated: string;
}

export interface StockPriceData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  lastUpdated: Date;
  source: string;
}

export interface PriceUpdateSettings {
  enableAutoUpdates: boolean;
  updateFrequency: 'hourly' | 'daily' | 'weekly';
  cryptoSymbols: string[];
  stockSymbols: string[];
  lastUpdateTime?: Date;
}

// Map common crypto symbols to CoinGecko IDs
const CRYPTO_SYMBOL_TO_ID: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'ADA': 'cardano',
  'SOL': 'solana',
  'MATIC': 'polygon',
  'DOT': 'polkadot',
  'LINK': 'chainlink',
  'AVAX': 'avalanche-2',
  'ATOM': 'cosmos',
  'XRP': 'ripple',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'UNI': 'uniswap',
  'AAVE': 'aave',
  'COMP': 'compound-governance-token'
};

/**
 * Get crypto prices from CoinGecko MCP
 * This function will be enhanced to use the actual MCP integration
 */
export async function getCryptoPrices(symbols: string[]): Promise<CryptoPriceData[]> {
  try {
    // Convert symbols to CoinGecko IDs
    const coinIds = symbols.map(symbol => 
      CRYPTO_SYMBOL_TO_ID[symbol.toUpperCase()] || symbol.toLowerCase()
    ).filter(Boolean);

    if (coinIds.length === 0) {
      return [];
    }

    // TODO: Integrate with actual CoinGecko MCP
    // Return empty array when no real price data is available
    console.log('getCryptoPrices called with symbols:', symbols);
    return [];

    // When MCP is integrated, replace above with:
    /*
    const response = await fetch('https://mcp.api.coingecko.com/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetCryptoPrices($ids: [String!]!) {
            coins(ids: $ids) {
              id
              symbol
              name
              current_price
              price_change_percentage_24h
              market_cap
              last_updated
            }
          }
        `,
        variables: { ids: coinIds }
      })
    });

    const data = await response.json();
    return data.data.coins;
    */

  } catch (error) {
    console.error('Error fetching crypto prices:', error);
    return [];
  }
}

/**
 * Get stock prices (placeholder for future Yahoo Finance integration)
 */
export async function getStockPrices(symbols: string[]): Promise<StockPriceData[]> {
  try {
    // TODO: Integrate with Yahoo Finance API or similar
    // Return empty array when no real price data is available
    console.log('getStockPrices called with symbols:', symbols);
    return [];
  } catch (error) {
    console.error('Error fetching stock prices:', error);
    return [];
  }
}

/**
 * Update asset prices for all relevant transactions
 */
export async function updateAssetPrices(transactions: Transaction[]): Promise<AssetPriceUpdate[]> {
  const updates: AssetPriceUpdate[] = [];
  
  // Filter transactions that need price updates
  const priceUpdateRequests = transactions
    .filter(t => 
      t.type === 'asset' && 
      t.assetDetails?.symbol &&
      shouldUpdatePrice(t)
    )
    .map(t => ({
      transactionId: t.id,
      symbol: t.assetDetails!.symbol!,
      category: t.categoryId,
      currentPrice: t.assetDetails?.currentPrice || 0
    }));

  if (priceUpdateRequests.length === 0) {
    return updates;
  }

  // Group by asset type for batch requests
  const cryptoSymbols = priceUpdateRequests
    .filter(req => isCryptocurrency(req.category))
    .map(req => req.symbol);
  
  const stockSymbols = priceUpdateRequests
    .filter(req => isStock(req.category))
    .map(req => req.symbol);

  // Fetch crypto prices
  if (cryptoSymbols.length > 0) {
    try {
      const cryptoPrices = await getCryptoPrices(cryptoSymbols);
      
      for (const request of priceUpdateRequests.filter(req => isCryptocurrency(req.category))) {
        const priceData = cryptoPrices.find(p => 
          p.symbol.toLowerCase() === request.symbol.toLowerCase()
        );
        
        if (priceData) {
          const changePercent = ((priceData.current_price - request.currentPrice) / request.currentPrice) * 100;
          
          updates.push({
            transactionId: request.transactionId,
            symbol: request.symbol,
            oldPrice: request.currentPrice,
            newPrice: priceData.current_price,
            changePercent: changePercent,
            updateSource: 'coingecko',
            updateTime: new Date(),
            success: true
          });
        } else {
          updates.push({
            transactionId: request.transactionId,
            symbol: request.symbol,
            oldPrice: request.currentPrice,
            newPrice: request.currentPrice,
            changePercent: 0,
            updateSource: 'coingecko',
            updateTime: new Date(),
            success: false,
            error: 'Symbol not found'
          });
        }
      }
    } catch (error) {
      console.error('Error updating crypto prices:', error);
    }
  }

  // Fetch stock prices
  if (stockSymbols.length > 0) {
    try {
      const stockPrices = await getStockPrices(stockSymbols);
      
      for (const request of priceUpdateRequests.filter(req => isStock(req.category))) {
        const priceData = stockPrices.find(p => 
          p.symbol.toLowerCase() === request.symbol.toLowerCase()
        );
        
        if (priceData) {
          const changePercent = ((priceData.price - request.currentPrice) / request.currentPrice) * 100;
          
          updates.push({
            transactionId: request.transactionId,
            symbol: request.symbol,
            oldPrice: request.currentPrice,
            newPrice: priceData.price,
            changePercent: changePercent,
            updateSource: 'yahoo-finance',
            updateTime: new Date(),
            success: true
          });
        }
      }
    } catch (error) {
      console.error('Error updating stock prices:', error);
    }
  }

  return updates;
}

/**
 * Check if an asset price should be updated
 */
function shouldUpdatePrice(transaction: Transaction): boolean {
  if (!transaction.assetDetails?.symbol) return false;
  
  const lastUpdate = transaction.assetDetails.lastPriceUpdate;
  if (!lastUpdate) return true; // Never updated
  
  const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
  
  // Update crypto every hour, stocks every day
  if (isCryptocurrency(transaction.categoryId)) {
    return hoursSinceUpdate >= 1;
  } else if (isStock(transaction.categoryId)) {
    return hoursSinceUpdate >= 24;
  }
  
  return false;
}

/**
 * Check if a category is cryptocurrency
 */
function isCryptocurrency(category: string): boolean {
  return category === 'crypto';
}

/**
 * Check if a category is a stock/equity
 */
function isStock(category: string): boolean {
  return ['stock', 'etf', 'mutual-funds'].includes(category);
}

/**
 * Apply price updates to transactions
 */
export function applyPriceUpdates(
  transactions: Transaction[], 
  updates: AssetPriceUpdate[]
): Transaction[] {
  return transactions.map(transaction => {
    const update = updates.find(u => u.transactionId === transaction.id);
    
    if (update && update.success && transaction.assetDetails) {
      return {
        ...transaction,
        assetDetails: {
          ...transaction.assetDetails,
          currentPrice: update.newPrice,
          lastPriceUpdate: update.updateTime
        },
        updatedAt: update.updateTime
      };
    }
    
    return transaction;
  });
}

/**
 * Get price update summary for portfolio performance
 */
export function getPriceUpdateSummary(updates: AssetPriceUpdate[]): {
  totalUpdates: number;
  successfulUpdates: number;
  totalValueChange: number;
  totalPercentChange: number;
  biggestGainer: AssetPriceUpdate | null;
  biggestLoser: AssetPriceUpdate | null;
} {
  const successfulUpdates = updates.filter(u => u.success);
  
  const totalValueChange = successfulUpdates.reduce((sum, update) => {
    return sum + (update.newPrice - update.oldPrice);
  }, 0);
  
  const avgPercentChange = successfulUpdates.length > 0 
    ? successfulUpdates.reduce((sum, update) => sum + update.changePercent, 0) / successfulUpdates.length
    : 0;
  
  const biggestGainer = successfulUpdates.reduce((best, update) => 
    !best || update.changePercent > best.changePercent ? update : best, 
    null as AssetPriceUpdate | null
  );
  
  const biggestLoser = successfulUpdates.reduce((worst, update) => 
    !worst || update.changePercent < worst.changePercent ? update : worst, 
    null as AssetPriceUpdate | null
  );

  return {
    totalUpdates: updates.length,
    successfulUpdates: successfulUpdates.length,
    totalValueChange,
    totalPercentChange: avgPercentChange,
    biggestGainer,
    biggestLoser
  };
}

/**
 * Schedule automatic price updates
 */
export function scheduleAutoUpdates(
  transactions: Transaction[],
  updateFrequency: 'hourly' | 'daily' | 'weekly' = 'daily'
): NodeJS.Timeout {
  const intervalMs = {
    hourly: 60 * 60 * 1000,
    daily: 24 * 60 * 60 * 1000,
    weekly: 7 * 24 * 60 * 60 * 1000
  }[updateFrequency];

  return setInterval(async () => {
    try {
      console.log('Running scheduled price updates...');
      const updates = await updateAssetPrices(transactions);
      const summary = getPriceUpdateSummary(updates);
      
      console.log(`Price update completed: ${summary.successfulUpdates}/${summary.totalUpdates} successful`);
      
      // Here you would save the updated transactions back to the database
      // and potentially notify the user of significant changes
      
    } catch (error) {
      console.error('Error in scheduled price update:', error);
    }
  }, intervalMs);
}

/**
 * Get asset price performance over time
 */
export function getAssetPerformance(
  transactions: Transaction[],
  symbol: string,
  days: number = 30
): {
  symbol: string;
  currentPrice: number;
  initialPrice: number;
  totalReturn: number;
  percentReturn: number;
  priceHistory: { date: Date; price: number }[];
} {
  const assetTransactions = transactions.filter(t => 
    t.type === 'asset' && 
    t.assetDetails?.symbol?.toLowerCase() === symbol.toLowerCase()
  );

  if (assetTransactions.length === 0) {
    return {
      symbol,
      currentPrice: 0,
      initialPrice: 0,
      totalReturn: 0,
      percentReturn: 0,
      priceHistory: []
    };
  }

  // Get the most recent price
  const latestTransaction = assetTransactions.reduce((latest, transaction) => 
    new Date(transaction.updatedAt) > new Date(latest.updatedAt) ? transaction : latest
  );

  const currentPrice = latestTransaction.assetDetails?.currentPrice || 0;
  
  // For now, use a simplified calculation
  // In a real implementation, you'd store historical price data
  const initialPrice = currentPrice; // No mock data
  const totalReturn = 0; // No historical data available
  const percentReturn = 0;

  // Return empty price history until real data is available
  const priceHistory: { date: Date; price: number }[] = [];

  return {
    symbol,
    currentPrice,
    initialPrice,
    totalReturn,
    percentReturn,
    priceHistory
  };
} 