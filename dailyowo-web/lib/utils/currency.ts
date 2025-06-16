/**
 * Multi-Currency Support System
 * Handles currency conversion, exchange rates, and aggregation across different currencies
 */

export interface Currency {
  code: string; // ISO 4217 code (e.g., 'USD', 'EUR')
  symbol: string;
  name: string;
  decimalPlaces: number;
  symbolPosition: 'before' | 'after';
}

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: Date;
  source: 'api' | 'manual' | 'cache';
}

export interface CurrencyAmount {
  amount: number;
  currency: string;
}

export interface ConvertedAmount extends CurrencyAmount {
  originalAmount: number;
  originalCurrency: string;
  exchangeRate: number;
  conversionDate: Date;
}

// Common currencies
export const CURRENCIES: Record<string, Currency> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimalPlaces: 2, symbolPosition: 'before' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimalPlaces: 2, symbolPosition: 'before' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimalPlaces: 2, symbolPosition: 'before' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimalPlaces: 0, symbolPosition: 'before' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimalPlaces: 2, symbolPosition: 'before' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimalPlaces: 2, symbolPosition: 'before' },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', decimalPlaces: 2, symbolPosition: 'before' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimalPlaces: 2, symbolPosition: 'before' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimalPlaces: 2, symbolPosition: 'before' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', decimalPlaces: 2, symbolPosition: 'before' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimalPlaces: 2, symbolPosition: 'before' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimalPlaces: 0, symbolPosition: 'before' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimalPlaces: 2, symbolPosition: 'before' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimalPlaces: 2, symbolPosition: 'before' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', decimalPlaces: 2, symbolPosition: 'after' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', decimalPlaces: 2, symbolPosition: 'after' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', decimalPlaces: 2, symbolPosition: 'after' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', decimalPlaces: 2, symbolPosition: 'after' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimalPlaces: 2, symbolPosition: 'before' },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimalPlaces: 2, symbolPosition: 'after' },
};

// Exchange rate cache (in a real app, this would be stored in a database)
const exchangeRateCache = new Map<string, ExchangeRate>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  date?: Date
): Promise<number> {
  // Same currency
  if (fromCurrency === toCurrency) {
    return 1;
  }

  // Check cache first
  const cacheKey = `${fromCurrency}-${toCurrency}`;
  const cached = exchangeRateCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp.getTime() < CACHE_DURATION) {
    return cached.rate;
  }

  // In a real app, this would call an API like exchangerate-api.com or fixer.io
  // For now, return mock rates
  const mockRates = getMockExchangeRates(fromCurrency, toCurrency);
  
  // Cache the rate
  exchangeRateCache.set(cacheKey, {
    fromCurrency,
    toCurrency,
    rate: mockRates,
    timestamp: new Date(),
    source: 'api',
  });

  return mockRates;
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date?: Date
): Promise<ConvertedAmount> {
  const rate = await getExchangeRate(fromCurrency, toCurrency, date);
  const convertedAmount = amount * rate;

  return {
    amount: convertedAmount,
    currency: toCurrency,
    originalAmount: amount,
    originalCurrency: fromCurrency,
    exchangeRate: rate,
    conversionDate: date || new Date(),
  };
}

/**
 * Convert multiple amounts to a single currency
 */
export async function convertAmounts(
  amounts: CurrencyAmount[],
  targetCurrency: string,
  date?: Date
): Promise<ConvertedAmount[]> {
  const conversions = await Promise.all(
    amounts.map(({ amount, currency }) =>
      convertCurrency(amount, currency, targetCurrency, date)
    )
  );

  return conversions;
}

/**
 * Calculate total in a specific currency from mixed currency amounts
 */
export async function calculateTotalInCurrency(
  amounts: CurrencyAmount[],
  targetCurrency: string,
  date?: Date
): Promise<number> {
  const converted = await convertAmounts(amounts, targetCurrency, date);
  return converted.reduce((sum, { amount }) => sum + amount, 0);
}

/**
 * Format currency amount for display
 */
export function formatCurrency(
  amount: number,
  currencyCode: string,
  locale?: string
): string {
  const currency = CURRENCIES[currencyCode];
  
  if (!currency) {
    // Fallback for unknown currencies
    return `${amount.toFixed(2)} ${currencyCode}`;
  }

  // Use Intl.NumberFormat if available
  if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
    try {
      return new Intl.NumberFormat(locale || 'en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: currency.decimalPlaces,
        maximumFractionDigits: currency.decimalPlaces,
      }).format(amount);
    } catch (e) {
      // Fallback if currency is not supported by Intl
    }
  }

  // Manual formatting
  const formattedAmount = amount.toFixed(currency.decimalPlaces);
  
  if (currency.symbolPosition === 'before') {
    return `${currency.symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${currency.symbol}`;
  }
}

/**
 * Parse currency amount from string
 */
export function parseCurrencyAmount(
  value: string,
  currencyCode?: string
): CurrencyAmount | null {
  // Remove currency symbols and whitespace
  const cleanValue = value.replace(/[^\d.,\-]/g, '').replace(',', '.');
  const amount = parseFloat(cleanValue);

  if (isNaN(amount)) {
    return null;
  }

  // Try to detect currency from the string if not provided
  if (!currencyCode) {
    for (const [code, currency] of Object.entries(CURRENCIES)) {
      if (value.includes(currency.symbol)) {
        currencyCode = code;
        break;
      }
    }
  }

  return {
    amount,
    currency: currencyCode || 'USD',
  };
}

/**
 * Group transactions by currency
 */
export function groupByCurrency<T extends { amount: number; currency?: string }>(
  items: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  items.forEach(item => {
    const currency = item.currency || 'USD';
    if (!groups.has(currency)) {
      groups.set(currency, []);
    }
    groups.get(currency)!.push(item);
  });

  return groups;
}

/**
 * Calculate currency exposure (percentage of total value in each currency)
 */
export async function calculateCurrencyExposure(
  amounts: CurrencyAmount[],
  baseCurrency: string
): Promise<Map<string, number>> {
  const exposure = new Map<string, number>();
  
  // Convert all to base currency to get total
  const total = await calculateTotalInCurrency(amounts, baseCurrency);
  
  if (total === 0) {
    return exposure;
  }

  // Group by currency and calculate percentages
  const grouped = groupByCurrency(amounts);
  
  for (const [currency, items] of grouped) {
    const currencyTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const convertedTotal = await convertCurrency(currencyTotal, currency, baseCurrency);
    const percentage = (convertedTotal.amount / total) * 100;
    exposure.set(currency, percentage);
  }

  return exposure;
}

/**
 * Get mock exchange rates (in production, this would call a real API)
 */
function getMockExchangeRates(from: string, to: string): number {
  // Base rates against USD
  const baseRates: Record<string, number> = {
    USD: 1.0,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.0,
    CAD: 1.25,
    AUD: 1.35,
    CHF: 0.92,
    CNY: 6.45,
    INR: 74.5,
    MXN: 20.0,
    BRL: 5.25,
    KRW: 1180.0,
    SGD: 1.35,
    HKD: 7.75,
    SEK: 8.6,
    NOK: 8.5,
    DKK: 6.3,
    PLN: 3.9,
    TRY: 8.8,
    RUB: 75.0,
  };

  const fromRate = baseRates[from] || 1;
  const toRate = baseRates[to] || 1;

  return toRate / fromRate;
}

/**
 * Currency converter class for stateful operations
 */
export class CurrencyConverter {
  private baseCurrency: string;
  private rates: Map<string, number> = new Map();
  private lastUpdate?: Date;

  constructor(baseCurrency: string = 'USD') {
    this.baseCurrency = baseCurrency;
  }

  async updateRates(): Promise<void> {
    // In production, fetch rates from API
    // For now, use mock rates
    for (const currency of Object.keys(CURRENCIES)) {
      if (currency !== this.baseCurrency) {
        const rate = await getExchangeRate(this.baseCurrency, currency);
        this.rates.set(currency, rate);
      }
    }
    this.rates.set(this.baseCurrency, 1);
    this.lastUpdate = new Date();
  }

  convert(amount: number, from: string, to: string): number {
    if (from === to) return amount;

    const fromRate = this.rates.get(from) || 1;
    const toRate = this.rates.get(to) || 1;

    // Convert to base currency first, then to target
    const inBase = amount / fromRate;
    return inBase * toRate;
  }

  getRate(from: string, to: string): number {
    if (from === to) return 1;

    const fromRate = this.rates.get(from) || 1;
    const toRate = this.rates.get(to) || 1;

    return toRate / fromRate;
  }

  isStale(maxAge: number = CACHE_DURATION): boolean {
    if (!this.lastUpdate) return true;
    return Date.now() - this.lastUpdate.getTime() > maxAge;
  }
}

/**
 * Validate currency code
 */
export function isValidCurrency(code: string): boolean {
  return code in CURRENCIES;
}

/**
 * Get currency display name
 */
export function getCurrencyName(code: string): string {
  return CURRENCIES[code]?.name || code;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(code: string): string {
  return CURRENCIES[code]?.symbol || code;
} 