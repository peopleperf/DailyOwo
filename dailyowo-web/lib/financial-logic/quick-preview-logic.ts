/**
 * Quick Preview Financial Logic Module
 * Provides simple calculations for onboarding or summary views
 * where only basic financial figures are available.
 */

/**
 * Calculates net worth based on current savings and debt.
 * @param currentSavings Total current savings or liquid assets.
 * @param currentDebt Total current debt.
 * @returns The calculated net worth.
 */
export function calculateQuickNetWorth(currentSavings: number, currentDebt: number): number {
  return currentSavings - currentDebt;
}

/**
 * Calculates monthly savings based on monthly income and expenses.
 * @param monthlyIncome Total monthly income.
 * @param monthlyExpenses Total monthly expenses.
 * @returns The calculated monthly savings.
 */
export function calculateQuickMonthlySavings(monthlyIncome: number, monthlyExpenses: number): number {
  return monthlyIncome - monthlyExpenses;
}

/**
 * Calculates the savings rate.
 * @param monthlyIncome Total monthly income.
 * @param monthlySavings Total monthly savings.
 * @returns The savings rate as a percentage (e.g., 10 for 10%). Returns 0 if income is zero or less to avoid division by zero.
 */
export function calculateQuickSavingsRate(monthlyIncome: number, monthlySavings: number): number {
  if (monthlyIncome <= 0) {
    return 0;
  }
  return (monthlySavings / monthlyIncome) * 100;
}
