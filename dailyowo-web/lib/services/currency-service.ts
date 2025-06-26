/**
 * 💱 Currency Service - Exchange rates and currency conversion
 * 
 * Provides real-time currency conversion for crypto holdings and other assets
 * supporting the user's preferred currency settings.
 */

import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

interface ExchangeRates {
  [currency: string]: number;
}

interface UserCurrencyPreferences {
  currency: string;
  locale: string;
}

class CurrencyService {
  private readonly CACHE_DURATION = 300000; // 5 minutes
  private exchangeRatesCache: { rates: ExchangeRates; timestamp: number } | null = null;
  private readonly DEFAULT_CURRENCY = 'USD';
  private readonly DEFAULT_LOCALE = 'en-US';

  /**
   * Get exchange rates from a free API (exchangerate-api or similar)
   */
  private async fetchExchangeRates(): Promise<ExchangeRates> {
    try {
      // Using a mock for now - in production, you'd use a real API like:
      // https://api.exchangerate-api.com/v4/latest/USD
      // or https://api.fixer.io/latest?access_key=YOUR_KEY
      
      // Mock exchange rates for common currencies
      const mockRates: ExchangeRates = {
        'USD': 1.0,
        'EUR': 0.85,
        'GBP': 0.73,
        'JPY': 110.0,
        'CAD': 1.25,
        'AUD': 1.35,
        'CHF': 0.92,
        'CNY': 6.45,
        'INR': 74.5,
        'KRW': 1180.0,
        'BRL': 5.2,
        'MXN': 20.0,
        'ZAR': 14.8,
        'NGN': 411.0,
        'EGP': 15.7,
        'MAD': 9.0
      };

      return mockRates;
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Return default rates if API fails
      return { 'USD': 1.0 };
    }
  }

  /**
   * Get cached exchange rates or fetch new ones
   */
  async getExchangeRates(): Promise<ExchangeRates> {
    const now = Date.now();
    
    if (this.exchangeRatesCache && (now - this.exchangeRatesCache.timestamp) < this.CACHE_DURATION) {
      return this.exchangeRatesCache.rates;
    }

    const rates = await this.fetchExchangeRates();
    this.exchangeRatesCache = { rates, timestamp: now };
    
    return rates;
  }

  /**
   * Get user's currency preferences from their profile
   */
  async getUserCurrencyPreferences(userId: string): Promise<UserCurrencyPreferences> {
    if (!db) {
      return { currency: this.DEFAULT_CURRENCY, locale: this.DEFAULT_LOCALE };
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();

      const currency = userData?.preferences?.currency || 
                      userData?.regionalSettings?.currency || 
                      this.DEFAULT_CURRENCY;

      const locale = userData?.preferences?.locale || 
                    userData?.regionalSettings?.locale || 
                    this.DEFAULT_LOCALE;

      return { currency, locale };
    } catch (error) {
      console.error('Error getting user currency preferences:', error);
      return { currency: this.DEFAULT_CURRENCY, locale: this.DEFAULT_LOCALE };
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await this.getExchangeRates();
    
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency] || 1;
    
    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    const convertedAmount = usdAmount * toRate;
    
    return convertedAmount;
  }

  /**
   * Convert crypto price from USD to user's preferred currency
   */
  async convertCryptoPriceToUserCurrency(
    priceInUSD: number, 
    userId: string
  ): Promise<{ amount: number; currency: string; locale: string }> {
    const preferences = await this.getUserCurrencyPreferences(userId);
    const convertedAmount = await this.convertCurrency(priceInUSD, 'USD', preferences.currency);
    
    return {
      amount: convertedAmount,
      currency: preferences.currency,
      locale: preferences.locale
    };
  }

  /**
   * Format amount in user's preferred currency
   */
  async formatInUserCurrency(
    amount: number, 
    userId: string,
    options?: { compact?: boolean; decimals?: number }
  ): Promise<string> {
    const { amount: convertedAmount, currency, locale } = await this.convertCryptoPriceToUserCurrency(amount, userId);
    
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: options?.decimals ?? 2,
      maximumFractionDigits: options?.decimals ?? 2,
      ...(options?.compact && convertedAmount >= 1000 ? {
        notation: 'compact',
        compactDisplay: 'short'
      } : {})
    });

    return formatter.format(convertedAmount);
  }

  /**
   * Get list of supported currencies
   */
  async getSupportedCurrencies(): Promise<string[]> {
    const rates = await this.getExchangeRates();
    return Object.keys(rates).sort();
  }

  /**
   * Clear exchange rates cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.exchangeRatesCache = null;
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();

// Export types
export type { ExchangeRates, UserCurrencyPreferences };