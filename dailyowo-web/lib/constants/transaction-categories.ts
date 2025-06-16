import { 
  Briefcase, ShoppingCart, Home, Car, Heart, Tv, Gamepad2, Coffee, Plane, Book, 
  Dumbbell, Music, Gift, DollarSign, CreditCard, TrendingUp, Wallet, PiggyBank, 
  Building, Tag, Zap, Shield, Phone, Utensils, Users, Baby, GraduationCap,
  Scissors, MapPin, ShoppingBag, Wine, Film, Headphones, Camera, Wrench,
  Stethoscope, Pill, Glasses, Dog, Flower, Hammer, Paintbrush, Fuel,
  Bus, Car as CarIcon, Train, Plane as PlaneIcon, Ship, Truck
} from 'lucide-react';

export interface TransactionCategory {
  id: string;
  name: string;
  icon: any;
  color: string;
  type: 'income' | 'expense' | 'asset' | 'liability';
  budgetCategory?: string; // Maps to budget category
  subcategories?: string[];
  isDefault?: boolean;
  description?: string;
  supportsAutoPrice?: boolean; // For stocks, crypto, etc.
}

export const TRANSACTION_CATEGORIES: TransactionCategory[] = [
  // ============= INCOME CATEGORIES =============
  {
    id: 'salary',
    name: 'Salary',
    icon: Briefcase,
    color: 'text-green-600',
    type: 'income',
    budgetCategory: 'income',
    isDefault: true,
    description: 'Regular employment income'
  },
  {
    id: 'freelance',
    name: 'Freelance',
    icon: DollarSign,
    color: 'text-green-600',
    type: 'income',
    budgetCategory: 'income',
    isDefault: true,
    description: 'Freelance or contract work'
  },
  {
    id: 'business-income',
    name: 'Business Income',
    icon: Building,
    color: 'text-green-600',
    type: 'income',
    budgetCategory: 'income',
    isDefault: true,
    description: 'Income from business operations'
  },
  {
    id: 'investment-income',
    name: 'Investment Income',
    icon: TrendingUp,
    color: 'text-green-600',
    type: 'income',
    budgetCategory: 'income',
    description: 'Dividends, interest, capital gains'
  },
  {
    id: 'rental-income',
    name: 'Rental Income',
    icon: Home,
    color: 'text-green-600',
    type: 'income',
    budgetCategory: 'income',
    description: 'Income from rental properties'
  },
  {
    id: 'bonus',
    name: 'Bonus',
    icon: Gift,
    color: 'text-green-600',
    type: 'income',
    budgetCategory: 'income',
    description: 'Work bonuses and incentives'
  },
  {
    id: 'gifts-received',
    name: 'Gifts Received',
    icon: Gift,
    color: 'text-green-600',
    type: 'income',
    budgetCategory: 'income',
    description: 'Money gifts from family/friends'
  },
  {
    id: 'refunds',
    name: 'Refunds',
    icon: DollarSign,
    color: 'text-green-600',
    type: 'income',
    budgetCategory: 'income',
    description: 'Tax refunds, purchase refunds'
  },
  {
    id: 'side-hustle',
    name: 'Side Hustle',
    icon: Briefcase,
    color: 'text-green-600',
    type: 'income',
    budgetCategory: 'income',
    description: 'Additional income sources'
  },
  {
    id: 'other-income',
    name: 'Other Income',
    icon: Wallet,
    color: 'text-green-600',
    type: 'income',
    budgetCategory: 'income',
    isDefault: true,
    description: 'Other sources of income'
  },

  // ============= HOUSING & UTILITIES EXPENSES =============
  {
    id: 'rent',
    name: 'Rent',
    icon: Home,
    color: 'text-purple-600',
    type: 'expense',
    budgetCategory: 'housing',
    isDefault: true,
    description: 'Monthly rent payments'
  },
  {
    id: 'mortgage',
    name: 'Mortgage',
    icon: Home,
    color: 'text-purple-600',
    type: 'expense',
    budgetCategory: 'housing',
    description: 'Mortgage payments'
  },
  {
    id: 'electricity',
    name: 'Electricity',
    icon: Zap,
    color: 'text-yellow-600',
    type: 'expense',
    budgetCategory: 'utilities',
    description: 'Electric bill'
  },
  {
    id: 'gas',
    name: 'Gas',
    icon: Fuel,
    color: 'text-orange-600',
    type: 'expense',
    budgetCategory: 'utilities',
    description: 'Natural gas bill'
  },
  {
    id: 'water',
    name: 'Water',
    icon: Zap,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'utilities',
    description: 'Water and sewer bill'
  },
  {
    id: 'internet',
    name: 'Internet',
    icon: Phone,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'utilities',
    isDefault: true,
    description: 'Internet service'
  },
  {
    id: 'phone',
    name: 'Phone',
    icon: Phone,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'utilities',
    isDefault: true,
    description: 'Mobile/landline phone'
  },
  {
    id: 'cable-tv',
    name: 'Cable/TV',
    icon: Tv,
    color: 'text-gray-600',
    type: 'expense',
    budgetCategory: 'utilities',
    description: 'Cable and TV services'
  },
  {
    id: 'home-maintenance',
    name: 'Home Maintenance',
    icon: Hammer,
    color: 'text-brown-600',
    type: 'expense',
    budgetCategory: 'housing',
    description: 'Home repairs and maintenance'
  },
  {
    id: 'home-improvement',
    name: 'Home Improvement',
    icon: Paintbrush,
    color: 'text-purple-600',
    type: 'expense',
    budgetCategory: 'housing',
    description: 'Home renovation and upgrades'
  },

  // ============= FOOD & DINING EXPENSES =============
  {
    id: 'groceries',
    name: 'Groceries',
    icon: ShoppingCart,
    color: 'text-green-600',
    type: 'expense',
    budgetCategory: 'food',
    isDefault: true,
    description: 'Grocery shopping'
  },
  {
    id: 'dining-out',
    name: 'Dining Out',
    icon: Utensils,
    color: 'text-orange-600',
    type: 'expense',
    budgetCategory: 'food',
    isDefault: true,
    description: 'Restaurants and takeout'
  },
  {
    id: 'coffee-shops',
    name: 'Coffee Shops',
    icon: Coffee,
    color: 'text-brown-600',
    type: 'expense',
    budgetCategory: 'food',
    description: 'Coffee shops and cafes'
  },
  {
    id: 'fast-food',
    name: 'Fast Food',
    icon: Utensils,
    color: 'text-red-600',
    type: 'expense',
    budgetCategory: 'food',
    description: 'Quick service restaurants'
  },
  {
    id: 'alcohol',
    name: 'Alcohol',
    icon: Wine,
    color: 'text-purple-600',
    type: 'expense',
    budgetCategory: 'food',
    description: 'Alcoholic beverages'
  },

  // ============= TRANSPORTATION EXPENSES =============
  {
    id: 'fuel',
    name: 'Fuel',
    icon: Fuel,
    color: 'text-red-600',
    type: 'expense',
    budgetCategory: 'transportation',
    isDefault: true,
    description: 'Gasoline and fuel'
  },
  {
    id: 'public-transport',
    name: 'Public Transport',
    icon: Bus,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'transportation',
    description: 'Bus, train, subway fares'
  },
  {
    id: 'taxi-uber',
    name: 'Taxi/Uber',
    icon: Car,
    color: 'text-yellow-600',
    type: 'expense',
    budgetCategory: 'transportation',
    description: 'Taxi and rideshare services'
  },
  {
    id: 'car-maintenance',
    name: 'Car Maintenance',
    icon: Wrench,
    color: 'text-gray-600',
    type: 'expense',
    budgetCategory: 'transportation',
    description: 'Car repairs and maintenance'
  },
  {
    id: 'car-insurance',
    name: 'Car Insurance',
    icon: Shield,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'insurance',
    description: 'Vehicle insurance'
  },
  {
    id: 'parking',
    name: 'Parking',
    icon: Car,
    color: 'text-gray-600',
    type: 'expense',
    budgetCategory: 'transportation',
    description: 'Parking fees'
  },
  {
    id: 'flights',
    name: 'Flights',
    icon: PlaneIcon,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'travel',
    description: 'Air travel'
  },

  // ============= HEALTHCARE EXPENSES =============
  {
    id: 'medical-visits',
    name: 'Medical Visits',
    icon: Stethoscope,
    color: 'text-red-600',
    type: 'expense',
    budgetCategory: 'healthcare',
    isDefault: true,
    description: 'Doctor and specialist visits'
  },
  {
    id: 'prescriptions',
    name: 'Prescriptions',
    icon: Pill,
    color: 'text-green-600',
    type: 'expense',
    budgetCategory: 'healthcare',
    description: 'Prescription medications'
  },
  {
    id: 'dental',
    name: 'Dental',
    icon: Heart,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'healthcare',
    description: 'Dental care'
  },
  {
    id: 'vision',
    name: 'Vision',
    icon: Glasses,
    color: 'text-purple-600',
    type: 'expense',
    budgetCategory: 'healthcare',
    description: 'Eye care and glasses'
  },
  {
    id: 'health-insurance',
    name: 'Health Insurance',
    icon: Shield,
    color: 'text-red-600',
    type: 'expense',
    budgetCategory: 'insurance',
    description: 'Health insurance premiums'
  },

  // ============= ENTERTAINMENT & RECREATION =============
  {
    id: 'movies',
    name: 'Movies',
    icon: Film,
    color: 'text-purple-600',
    type: 'expense',
    budgetCategory: 'entertainment',
    description: 'Movie theaters and streaming'
  },
  {
    id: 'games',
    name: 'Games',
    icon: Gamepad2,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'entertainment',
    description: 'Video games and gaming'
  },
  {
    id: 'music',
    name: 'Music',
    icon: Headphones,
    color: 'text-green-600',
    type: 'expense',
    budgetCategory: 'entertainment',
    description: 'Music streaming and concerts'
  },
  {
    id: 'sports',
    name: 'Sports',
    icon: Dumbbell,
    color: 'text-orange-600',
    type: 'expense',
    budgetCategory: 'entertainment',
    description: 'Sports events and activities'
  },
  {
    id: 'gym',
    name: 'Gym',
    icon: Dumbbell,
    color: 'text-red-600',
    type: 'expense',
    budgetCategory: 'fitness',
    description: 'Gym memberships and fitness'
  },
  {
    id: 'hobbies',
    name: 'Hobbies',
    icon: Camera,
    color: 'text-teal-600',
    type: 'expense',
    budgetCategory: 'entertainment',
    description: 'Hobby supplies and activities'
  },

  // ============= SHOPPING & PERSONAL =============
  {
    id: 'clothing',
    name: 'Clothing',
    icon: ShoppingBag,
    color: 'text-pink-600',
    type: 'expense',
    budgetCategory: 'shopping',
    isDefault: true,
    description: 'Clothes and accessories'
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    icon: Scissors,
    color: 'text-purple-600',
    type: 'expense',
    budgetCategory: 'personal-care',
    isDefault: true,
    description: 'Haircuts, cosmetics, toiletries'
  },
  {
    id: 'household-items',
    name: 'Household Items',
    icon: Home,
    color: 'text-gray-600',
    type: 'expense',
    budgetCategory: 'shopping',
    description: 'Home supplies and furniture'
  },
  {
    id: 'electronics',
    name: 'Electronics',
    icon: Phone,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'shopping',
    description: 'Electronics and gadgets'
  },

  // ============= FAMILY & CHILDREN =============
  {
    id: 'childcare',
    name: 'Childcare',
    icon: Baby,
    color: 'text-pink-600',
    type: 'expense',
    budgetCategory: 'family',
    description: 'Daycare and babysitting'
  },
  {
    id: 'school-fees',
    name: 'School Fees',
    icon: GraduationCap,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'education',
    description: 'School tuition and fees'
  },
  {
    id: 'family-activities',
    name: 'Family Activities',
    icon: Users,
    color: 'text-green-600',
    type: 'expense',
    budgetCategory: 'family',
    description: 'Family outings and activities'
  },

  // ============= PETS =============
  {
    id: 'pet-food',
    name: 'Pet Food',
    icon: Dog,
    color: 'text-brown-600',
    type: 'expense',
    budgetCategory: 'pets',
    description: 'Pet food and treats'
  },
  {
    id: 'pet-care',
    name: 'Pet Care',
    icon: Heart,
    color: 'text-pink-600',
    type: 'expense',
    budgetCategory: 'pets',
    description: 'Veterinary and pet care'
  },

  // ============= TRAVEL =============
  {
    id: 'vacation',
    name: 'Vacation',
    icon: Plane,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'travel',
    description: 'Vacation and holiday expenses'
  },
  {
    id: 'hotels',
    name: 'Hotels',
    icon: MapPin,
    color: 'text-purple-600',
    type: 'expense',
    budgetCategory: 'travel',
    description: 'Accommodation costs'
  },

  // ============= INSURANCE & FINANCIAL =============
  {
    id: 'life-insurance',
    name: 'Life Insurance',
    icon: Shield,
    color: 'text-green-600',
    type: 'expense',
    budgetCategory: 'insurance',
    description: 'Life insurance premiums'
  },
  {
    id: 'home-insurance',
    name: 'Home Insurance',
    icon: Shield,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'insurance',
    description: 'Home/renters insurance'
  },
  {
    id: 'bank-fees',
    name: 'Bank Fees',
    icon: DollarSign,
    color: 'text-red-600',
    type: 'expense',
    budgetCategory: 'financial',
    description: 'Banking and financial fees'
  },
  {
    id: 'debt-payment',
    name: 'Debt Payment',
    icon: CreditCard,
    color: 'text-red-600',
    type: 'expense',
    budgetCategory: 'debt',
    isDefault: true,
    description: 'Credit card and loan payments'
  },

  // ============= GIFTS & DONATIONS =============
  {
    id: 'gifts-given',
    name: 'Gifts Given',
    icon: Gift,
    color: 'text-pink-600',
    type: 'expense',
    budgetCategory: 'gifts',
    description: 'Gifts for others'
  },
  {
    id: 'charity',
    name: 'Charity',
    icon: Heart,
    color: 'text-red-600',
    type: 'expense',
    budgetCategory: 'donations',
    description: 'Charitable donations'
  },

  // ============= SUBSCRIPTIONS =============
  {
    id: 'streaming-services',
    name: 'Streaming Services',
    icon: Tv,
    color: 'text-purple-600',
    type: 'expense',
    budgetCategory: 'subscriptions',
    description: 'Netflix, Spotify, etc.'
  },
  {
    id: 'software-subscriptions',
    name: 'Software',
    icon: Phone,
    color: 'text-blue-600',
    type: 'expense',
    budgetCategory: 'subscriptions',
    description: 'Software and app subscriptions'
  },

  // ============= OTHER EXPENSE =============
  {
    id: 'other-expense',
    name: 'Other Expense',
    icon: Tag,
    color: 'text-gray-600',
    type: 'expense',
    budgetCategory: 'other',
    isDefault: true,
    description: 'Miscellaneous expenses'
  },

  // ============= ASSET CATEGORIES =============
  {
    id: 'cash',
    name: 'Cash',
    icon: DollarSign,
    color: 'text-blue-600',
    type: 'asset',
    budgetCategory: 'savings',
    isDefault: true,
    description: 'Physical cash'
  },
  {
    id: 'checking-account',
    name: 'Checking Account',
    icon: Wallet,
    color: 'text-blue-600',
    type: 'asset',
    budgetCategory: 'savings',
    isDefault: true,
    description: 'Checking account balance'
  },
  {
    id: 'savings-account',
    name: 'Savings Account',
    icon: PiggyBank,
    color: 'text-blue-600',
    type: 'asset',
    budgetCategory: 'savings',
    isDefault: true,
    description: 'Savings account balance'
  },
  {
    id: 'emergency-fund',
    name: 'Emergency Fund',
    icon: PiggyBank,
    color: 'text-green-600',
    type: 'asset',
    budgetCategory: 'savings',
    isDefault: true,
    description: 'Emergency savings fund'
  },
  {
    id: 'general-savings',
    name: 'General Savings',
    icon: PiggyBank,
    color: 'text-blue-600',
    type: 'asset',
    budgetCategory: 'savings',
    description: 'General purpose savings'
  },
  {
    id: 'pension',
    name: 'Pension',
    icon: PiggyBank,
    color: 'text-purple-600',
    type: 'asset',
    budgetCategory: 'savings',
    description: 'Pension contributions'
  },
  {
    id: 'vacation-fund',
    name: 'Vacation Fund',
    icon: PiggyBank,
    color: 'text-teal-600',
    type: 'asset',
    budgetCategory: 'savings',
    description: 'Vacation savings'
  },
  {
    id: 'education-fund',
    name: 'Education Fund',
    icon: PiggyBank,
    color: 'text-indigo-600',
    type: 'asset',
    budgetCategory: 'savings',
    description: 'Education savings'
  },
  {
    id: 'house-fund',
    name: 'House Down Payment',
    icon: PiggyBank,
    color: 'text-orange-600',
    type: 'asset',
    budgetCategory: 'savings',
    description: 'House down payment fund'
  },
  {
    id: 'car-fund',
    name: 'Car Fund',
    icon: PiggyBank,
    color: 'text-cyan-600',
    type: 'asset',
    budgetCategory: 'savings',
    description: 'Car purchase fund'
  },
  {
    id: 'stocks',
    name: 'Stocks',
    icon: TrendingUp,
    color: 'text-green-600',
    type: 'asset',
    budgetCategory: 'investments',
    isDefault: true,
    description: 'Stock investments',
    supportsAutoPrice: true
  },
  {
    id: 'etf',
    name: 'ETF',
    icon: TrendingUp,
    color: 'text-green-600',
    type: 'asset',
    budgetCategory: 'investments',
    description: 'Exchange-traded funds',
    supportsAutoPrice: true
  },
  {
    id: 'mutual-funds',
    name: 'Mutual Funds',
    icon: TrendingUp,
    color: 'text-green-600',
    type: 'asset',
    budgetCategory: 'investments',
    description: 'Mutual fund investments',
    supportsAutoPrice: true
  },
  {
    id: 'cryptocurrency',
    name: 'Cryptocurrency',
    icon: TrendingUp,
    color: 'text-orange-600',
    type: 'asset',
    budgetCategory: 'investments',
    description: 'Crypto investments',
    supportsAutoPrice: true
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    icon: Home,
    color: 'text-purple-600',
    type: 'asset',
    budgetCategory: 'investments',
    description: 'Real estate investments'
  },
  {
    id: 'retirement-401k',
    name: '401k',
    icon: PiggyBank,
    color: 'text-indigo-600',
    type: 'asset',
    budgetCategory: 'retirement',
    description: '401k retirement account'
  },
  {
    id: 'retirement-ira',
    name: 'IRA',
    icon: PiggyBank,
    color: 'text-indigo-600',
    type: 'asset',
    budgetCategory: 'retirement',
    description: 'IRA retirement account'
  },
  {
    id: 'other-asset',
    name: 'Other Asset',
    icon: Building,
    color: 'text-gray-600',
    type: 'asset',
    budgetCategory: 'other',
    isDefault: true,
    description: 'Other assets'
  },

  // ============= LIABILITY CATEGORIES =============
  {
    id: 'credit-card',
    name: 'Credit Card',
    icon: CreditCard,
    color: 'text-red-600',
    type: 'liability',
    budgetCategory: 'debt',
    isDefault: true,
    description: 'Credit card debt'
  },
  {
    id: 'personal-loan',
    name: 'Personal Loan',
    icon: DollarSign,
    color: 'text-red-600',
    type: 'liability',
    budgetCategory: 'debt',
    description: 'Personal loans'
  },
  {
    id: 'auto-loan',
    name: 'Auto Loan',
    icon: Car,
    color: 'text-red-600',
    type: 'liability',
    budgetCategory: 'debt',
    description: 'Car loans'
  },
  {
    id: 'mortgage-debt',
    name: 'Mortgage',
    icon: Home,
    color: 'text-red-600',
    type: 'liability',
    budgetCategory: 'debt',
    description: 'Mortgage debt'
  },
  {
    id: 'student-loan',
    name: 'Student Loan',
    icon: Book,
    color: 'text-red-600',
    type: 'liability',
    budgetCategory: 'debt',
    description: 'Student loan debt'
  },
  {
    id: 'other-liability',
    name: 'Other Debt',
    icon: Tag,
    color: 'text-red-600',
    type: 'liability',
    budgetCategory: 'debt',
    isDefault: true,
    description: 'Other debts'
  },
];

// Helper functions
export const getCategoryById = (id: string): TransactionCategory | undefined => {
  return TRANSACTION_CATEGORIES.find(cat => cat.id === id);
};

export const getCategoriesByType = (type: TransactionCategory['type']): TransactionCategory[] => {
  return TRANSACTION_CATEGORIES.filter(cat => cat.type === type);
};

export const getDefaultCategories = (): TransactionCategory[] => {
  return TRANSACTION_CATEGORIES.filter(cat => cat.isDefault);
};

export const getCategoriesByBudgetCategory = (budgetCategory: string): TransactionCategory[] => {
  return TRANSACTION_CATEGORIES.filter(cat => cat.budgetCategory === budgetCategory);
};

// Budget category mappings
export const BUDGET_CATEGORIES = [
  'income',
  'housing',
  'utilities', 
  'food',
  'transportation',
  'healthcare',
  'insurance',
  'entertainment',
  'shopping',
  'personal-care',
  'family',
  'education',
  'pets',
  'travel',
  'subscriptions',
  'financial',
  'debt',
  'gifts',
  'donations',
  'savings',
  'investments',
  'retirement',
  'fitness',
  'other'
] as const;

export type BudgetCategoryType = typeof BUDGET_CATEGORIES[number]; 