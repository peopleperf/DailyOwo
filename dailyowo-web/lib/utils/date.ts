/**
 * Date utility functions
 */

/**
 * Format a date as relative time (e.g., "2 hours ago", "yesterday")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  // Future dates
  if (seconds < 0) {
    const futureSeconds = Math.abs(seconds);
    if (futureSeconds < 60) return 'in a few seconds';
    if (futureSeconds < 3600) return `in ${Math.floor(futureSeconds / 60)} minutes`;
    if (futureSeconds < 86400) return `in ${Math.floor(futureSeconds / 3600)} hours`;
    if (futureSeconds < 2592000) return `in ${Math.floor(futureSeconds / 86400)} days`;
    return then.toLocaleDateString();
  }

  // Past dates
  if (seconds < 60) return 'just now';
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (seconds < 172800) return 'yesterday';
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} days ago`;
  }
  if (seconds < 2592000) {
    const weeks = Math.floor(seconds / 604800);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  
  const years = Math.floor(seconds / 31536000);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

/**
 * Format date for display
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {},
  locale: string = 'en-US'
): string {
  const d = new Date(date);
  return d.toLocaleDateString(locale, options);
}

/**
 * Format time for display
 */
export function formatTime(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {},
  locale: string = 'en-US'
): string {
  const d = new Date(date);
  return d.toLocaleTimeString(locale, options);
}

/**
 * Format date and time for display
 */
export function formatDateTime(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {},
  locale: string = 'en-US'
): string {
  const d = new Date(date);
  return d.toLocaleString(locale, options);
}

/**
 * Get the start of a period (day, week, month, year)
 */
export function getStartOfPeriod(
  date: Date = new Date(),
  period: 'day' | 'week' | 'month' | 'year'
): Date {
  const d = new Date(date);
  
  switch (period) {
    case 'day':
      d.setHours(0, 0, 0, 0);
      break;
    case 'week':
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      break;
    case 'month':
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      break;
    case 'year':
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      break;
  }
  
  return d;
}

/**
 * Get the end of a period (day, week, month, year)
 */
export function getEndOfPeriod(
  date: Date = new Date(),
  period: 'day' | 'week' | 'month' | 'year'
): Date {
  const d = new Date(date);
  
  switch (period) {
    case 'day':
      d.setHours(23, 59, 59, 999);
      break;
    case 'week':
      const day = d.getDay();
      const diff = d.getDate() - day + 7;
      d.setDate(diff);
      d.setHours(23, 59, 59, 999);
      break;
    case 'month':
      d.setMonth(d.getMonth() + 1, 0);
      d.setHours(23, 59, 59, 999);
      break;
    case 'year':
      d.setMonth(11, 31);
      d.setHours(23, 59, 59, 999);
      break;
  }
  
  return d;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if a date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
  const d = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Add days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Add months to a date
 */
export function addMonths(date: Date | string, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Get days between two dates
 */
export function getDaysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
} 