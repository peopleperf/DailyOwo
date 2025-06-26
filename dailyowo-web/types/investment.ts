export interface InvestmentHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  totalCost: number;
  unrealizedGain: number;
  unrealizedGainPercentage: number;
  realizedGain?: number;
  dividends?: number;
  allocation: number; // Percentage of portfolio
  assetClass: 'stocks' | 'bonds' | 'etf' | 'mutual-funds' | 'cryptocurrency' | 'commodities' | 'real-estate' | 'other';
  sector?: string;
  currency: string;
  exchange?: string;
  lastUpdated: Date;
}

export interface InvestmentPortfolio {
  userId: string;
  holdings: InvestmentHolding[];
  totalValue: number;
  totalCost: number;
  totalReturn: number;
  totalReturnPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  unrealizedGain: number;
  realizedGain: number;
  dividendIncome: number;
  assetAllocation: {
    stocks: number;
    bonds: number;
    etf: number;
    mutualFunds: number;
    cryptocurrency: number;
    realEstate: number;
    commodities: number;
    cash: number;
    other: number;
  };
  sectorAllocation?: Record<string, number>;
  geographicAllocation?: Record<string, number>;
  riskScore: number; // 1-10
  lastUpdated: Date;
}

export interface InvestmentTransaction {
  id: string;
  userId: string;
  symbol: string;
  type: 'buy' | 'sell' | 'dividend' | 'split' | 'transfer';
  quantity: number;
  price: number;
  totalAmount: number;
  fees?: number;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high52Week?: number;
  low52Week?: number;
  pe?: number;
  dividendYield?: number;
  lastUpdated: Date;
} 