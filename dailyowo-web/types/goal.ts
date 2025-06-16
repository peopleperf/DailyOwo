// Goal type definition
export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  category?: string;
  description?: string;
  isCompleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
} 