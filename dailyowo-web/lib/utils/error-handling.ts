/**
 * Error handling utilities for financial calculations
 * Provides consistent error handling and validation across the app
 */

export interface CalculationError {
  code: string;
  message: string;
  field?: string;
  value?: any;
  suggestion?: string;
}

export class FinancialCalculationError extends Error {
  public errors: CalculationError[];
  
  constructor(errors: CalculationError[]) {
    super(errors.map(e => e.message).join(', '));
    this.name = 'FinancialCalculationError';
    this.errors = errors;
  }
}

/**
 * Safe division with zero check
 */
export function safeDivide(
  numerator: number, 
  denominator: number, 
  defaultValue: number = 0
): number {
  if (denominator === 0 || isNaN(denominator) || !isFinite(denominator)) {
    return defaultValue;
  }
  
  const result = numerator / denominator;
  
  if (isNaN(result) || !isFinite(result)) {
    return defaultValue;
  }
  
  return result;
}

/**
 * Safe percentage calculation
 */
export function safePercentage(
  part: number,
  whole: number,
  maxValue: number = 100
): number {
  const percentage = safeDivide(part, whole, 0) * 100;
  return Math.min(Math.max(0, percentage), maxValue);
}

/**
 * Validate monetary amount
 */
export function validateAmount(
  amount: any,
  fieldName: string = 'amount'
): CalculationError[] {
  const errors: CalculationError[] = [];
  
  if (amount === undefined || amount === null) {
    errors.push({
      code: 'AMOUNT_REQUIRED',
      message: `${fieldName} is required`,
      field: fieldName,
      value: amount
    });
    return errors;
  }
  
  const numAmount = Number(amount);
  
  if (isNaN(numAmount)) {
    errors.push({
      code: 'AMOUNT_INVALID',
      message: `${fieldName} must be a valid number`,
      field: fieldName,
      value: amount
    });
  } else if (numAmount < 0) {
    errors.push({
      code: 'AMOUNT_NEGATIVE',
      message: `${fieldName} cannot be negative`,
      field: fieldName,
      value: amount,
      suggestion: 'Use transaction type to indicate expense vs income'
    });
  } else if (!isFinite(numAmount)) {
    errors.push({
      code: 'AMOUNT_INFINITE',
      message: `${fieldName} must be a finite number`,
      field: fieldName,
      value: amount
    });
  }
  
  return errors;
}

/**
 * Validate date range
 */
export function validateDateRange(
  startDate: Date,
  endDate: Date
): CalculationError[] {
  const errors: CalculationError[] = [];
  
  if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
    errors.push({
      code: 'START_DATE_INVALID',
      message: 'Start date is invalid',
      field: 'startDate',
      value: startDate
    });
  }
  
  if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
    errors.push({
      code: 'END_DATE_INVALID',
      message: 'End date is invalid',
      field: 'endDate',
      value: endDate
    });
  }
  
  if (errors.length === 0 && startDate > endDate) {
    errors.push({
      code: 'DATE_RANGE_INVALID',
      message: 'Start date must be before end date',
      field: 'dateRange',
      value: { startDate, endDate }
    });
  }
  
  return errors;
}

/**
 * Calculate compound interest with error handling
 */
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
  compoundingFrequency: number = 12
): { value: number; errors: CalculationError[] } {
  const errors: CalculationError[] = [];
  
  // Validate inputs
  errors.push(...validateAmount(principal, 'principal'));
  errors.push(...validateAmount(rate, 'rate'));
  errors.push(...validateAmount(time, 'time'));
  errors.push(...validateAmount(compoundingFrequency, 'compoundingFrequency'));
  
  if (errors.length > 0) {
    return { value: 0, errors };
  }
  
  try {
    const value = principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * time);
    
    if (!isFinite(value)) {
      errors.push({
        code: 'CALCULATION_OVERFLOW',
        message: 'Calculation resulted in overflow',
        suggestion: 'Check if rate or time values are too large'
      });
      return { value: 0, errors };
    }
    
    return { value, errors: [] };
  } catch (error) {
    errors.push({
      code: 'CALCULATION_ERROR',
      message: 'Failed to calculate compound interest',
      value: error
    });
    return { value: 0, errors };
  }
}

/**
 * Log calculation warning
 */
export function logCalculationWarning(
  context: string,
  warning: string,
  data?: any
): void {
  console.warn(`[${context}] ${warning}`, data);
}

/**
 * Format error for user display
 */
export function formatCalculationError(error: CalculationError): string {
  let message = error.message;
  
  if (error.suggestion) {
    message += `. ${error.suggestion}`;
  }
  
  return message;
}

/**
 * Aggregate multiple calculation results
 */
export function aggregateCalculations<T>(
  calculations: Array<{ value: T; errors: CalculationError[] }>
): { values: T[]; errors: CalculationError[] } {
  const values: T[] = [];
  const errors: CalculationError[] = [];
  
  calculations.forEach(calc => {
    if (calc.errors.length === 0) {
      values.push(calc.value);
    }
    errors.push(...calc.errors);
  });
  
  return { values, errors };
} 