/**
 * Asset categories that count as savings for savings rate calculations
 * These are the categories that represent actual savings transactions
 */
export const SAVINGS_CATEGORIES = [
  'savings-account', 
  'general-savings', 
  'emergency-fund',
  'pension',
  'mutual-funds',
  'cryptocurrency',
  'retirement-401k',
  'retirement-ira'
] as const;

export type SavingsCategory = typeof SAVINGS_CATEGORIES[number]; 