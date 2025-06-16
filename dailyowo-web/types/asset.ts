// Asset type definition
export interface Asset {
  id: string;
  name: string;
  type: 'cash' | 'investment' | 'property' | 'other';
  value: number;
  currency: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 