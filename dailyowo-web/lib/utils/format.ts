/**
 * Format a number as currency based on locale and currency settings
 */
export function formatCurrency(
  amount: number | string,
  options?: {
    currency?: string;
    locale?: string;
    decimals?: number;
    compact?: boolean;
  }
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Handle invalid numbers
  if (isNaN(numAmount)) {
    return options?.currency ? `${options.currency}0` : '$0';
  }

  const {
    currency = 'USD',
    locale = 'en-US',
    decimals = 2,
    compact = false
  } = options || {};

  try {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      ...(compact && numAmount >= 1000 ? {
        notation: 'compact',
        compactDisplay: 'short'
      } : {})
    });

    return formatter.format(numAmount);
  } catch (error) {
    // Fallback for unsupported currencies
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${numAmount.toFixed(decimals)}`;
  }
}

/**
 * Get currency symbol from currency code
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    ZAR: 'R',
    KES: 'KSh',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'Fr',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    BRL: 'R$',
    MXN: '$',
    ARS: '$',
    CLP: '$',
    COP: '$',
    PEN: 'S/',
    UYU: '$U',
  };

  return symbols[currency] || currency + ' ';
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(
  value: number | string,
  options?: {
    locale?: string;
    decimals?: number;
    compact?: boolean;
  }
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0';
  }

  const {
    locale = 'en-US',
    decimals = 0,
    compact = false
  } = options || {};

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    ...(compact && numValue >= 1000 ? {
      notation: 'compact',
      compactDisplay: 'short'
    } : {})
  });

  return formatter.format(numValue);
}

/**
 * Format a percentage
 */
export function formatPercentage(
  value: number,
  options?: {
    locale?: string;
    decimals?: number;
    showSign?: boolean;
  }
): string {
  const {
    locale = 'en-US',
    decimals = 1,
    showSign = false
  } = options || {};

  const formatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: showSign ? 'always' : 'auto'
  });

  // Divide by 100 because formatters expect decimal form
  return formatter.format(value / 100);
}

/**
 * Format a date
 */
export function formatDate(
  date: Date | string | number,
  options?: {
    locale?: string;
    format?: 'short' | 'medium' | 'long' | 'full';
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  const {
    locale = 'en-US',
    format = 'medium'
  } = options || {};

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  };

  return new Intl.DateTimeFormat(locale, formatOptions[format]).format(dateObj);
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 */
export function formatRelativeTime(
  date: Date | string | number,
  options?: {
    locale?: string;
  }
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
  
  const {
    locale = 'en-US'
  } = options || {};

  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto'
  });

  // Determine the appropriate unit
  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'seconds' },
    { amount: 60, unit: 'minutes' },
    { amount: 24, unit: 'hours' },
    { amount: 7, unit: 'days' },
    { amount: 4.34524, unit: 'weeks' },
    { amount: 12, unit: 'months' },
    { amount: Number.POSITIVE_INFINITY, unit: 'years' }
  ];

  let duration = Math.abs(diffInSeconds);
  for (const division of divisions) {
    if (duration < division.amount) {
      return formatter.format(
        Math.round(diffInSeconds < 0 ? -duration : duration),
        division.unit
      );
    }
    duration /= division.amount;
  }

  return formatter.format(0, 'seconds');
} 