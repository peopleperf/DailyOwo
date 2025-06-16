import { TransactionCategory, CategoryConfig } from '@/types/transaction';

export const INCOME_CATEGORIES: CategoryConfig[] = [
  { id: 'salary', name: 'Salary', icon: 'briefcase', color: '#10B981', type: 'income' },
  { id: 'freelance', name: 'Freelance', icon: 'dollar', color: '#3B82F6', type: 'income' },
  { id: 'business', name: 'Business', icon: 'trendingUp', color: '#8B5CF6', type: 'income' },
  { id: 'investments', name: 'Investments', icon: 'lineChart', color: '#F59E0B', type: 'income' },
  { id: 'rental', name: 'Rental Income', icon: 'housing', color: '#06B6D4', type: 'income' },
  { id: 'gifts', name: 'Gifts', icon: 'gift', color: '#EC4899', type: 'income' },
  { id: 'refunds', name: 'Refunds', icon: 'receipt', color: '#84CC16', type: 'income' },
  { id: 'other-income', name: 'Other Income', icon: 'plus', color: '#6B7280', type: 'income' },
];

export const EXPENSE_CATEGORIES: CategoryConfig[] = [
  { id: 'housing', name: 'Housing', icon: 'housing', color: '#DC2626', type: 'expense' },
  { id: 'transportation', name: 'Transportation', icon: 'transport', color: '#EA580C', type: 'expense' },
  { id: 'food', name: 'Food & Dining', icon: 'food', color: '#F97316', type: 'expense' },
  { id: 'utilities', name: 'Utilities', icon: 'utilities', color: '#0891B2', type: 'expense' },
  { id: 'healthcare', name: 'Healthcare', icon: 'health', color: '#059669', type: 'expense' },
  { id: 'insurance', name: 'Insurance', icon: 'shield', color: '#7C3AED', type: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: 'shopping', color: '#DB2777', type: 'expense' },
  { id: 'entertainment', name: 'Entertainment', icon: 'gift', color: '#9333EA', type: 'expense' },
  { id: 'education', name: 'Education', icon: 'education', color: '#2563EB', type: 'expense' },
  { id: 'travel', name: 'Travel', icon: 'travel', color: '#0EA5E9', type: 'expense' },
  { id: 'personal', name: 'Personal Care', icon: 'user', color: '#8B5CF6', type: 'expense' },
  { id: 'savings', name: 'Savings', icon: 'piggyBank', color: '#10B981', type: 'expense' },
  { id: 'debt-payment', name: 'Debt Payment', icon: 'creditCard', color: '#EF4444', type: 'expense' },
  { id: 'other-expense', name: 'Other', icon: 'receipt', color: '#6B7280', type: 'expense' },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export const getCategoryById = (id: TransactionCategory): CategoryConfig | undefined => {
  return ALL_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoriesByType = (type: 'income' | 'expense'): CategoryConfig[] => {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}; 