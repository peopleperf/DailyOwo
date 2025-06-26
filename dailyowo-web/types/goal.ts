// Goal type definition
export type GoalCategory = 
  | 'emergency-fund'
  | 'vacation'
  | 'home-purchase'
  | 'car-purchase'
  | 'wedding'
  | 'education'
  | 'retirement'
  | 'debt-payoff'
  | 'investment'
  | 'business'
  | 'gadget'
  | 'health'
  | 'charity'
  | 'other';

export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface Goal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: GoalCategory;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: Date;
  startDate: Date;
  priority: GoalPriority;
  status: GoalStatus;
  
  // Contribution settings
  monthlyContribution?: number;
  autoContribute?: boolean;
  contributionDay?: number; // Day of month (1-31)
  
  // Progress tracking
  progressPercentage: number;
  daysRemaining: number;
  onTrack: boolean;
  projectedCompletionDate?: Date;
  requiredMonthlyContribution: number;
  
  // Visual customization
  color?: string;
  icon?: string;
  imageUrl?: string;
  
  // Milestones
  milestones?: GoalMilestone[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  
  // For shared/family goals
  isShared?: boolean;
  sharedWith?: string[]; // User IDs
  contributors?: GoalContributor[];
}

export interface GoalMilestone {
  id: string;
  amount: number;
  description: string;
  reached: boolean;
  reachedAt?: Date;
}

export interface GoalContributor {
  userId: string;
  name: string;
  contributedAmount: number;
  lastContribution?: Date;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  date: Date;
  note?: string;
  isAutomatic: boolean;
  transactionId?: string; // Link to transaction if applicable
  createdAt: Date;
}

export interface GoalAnalytics {
  totalSaved: number;
  averageMonthlyContribution: number;
  projectedShortfall?: number;
  daysAheadBehindSchedule: number;
  contributionStreak: number;
  largestContribution: number;
  contributionHistory: {
    date: Date;
    amount: number;
  }[];
}

export interface CreateGoalData {
  name: string;
  description?: string;
  category: GoalCategory;
  targetAmount: number;
  currency: string;
  targetDate: Date;
  priority: GoalPriority;
  monthlyContribution?: number;
  autoContribute?: boolean;
  contributionDay?: number;
  color?: string;
  icon?: string;
  imageUrl?: string;
}

export interface UpdateGoalData extends Partial<CreateGoalData> {
  status?: GoalStatus;
  currentAmount?: number;
} 