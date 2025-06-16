// Liability type definition
export interface Liability {
  id: string;
  name: string;
  type: 'credit_card' | 'loan' | 'mortgage' | 'other';
  balance: number;
  currency: string;
  interestRate?: number;
  minimumPayment?: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 