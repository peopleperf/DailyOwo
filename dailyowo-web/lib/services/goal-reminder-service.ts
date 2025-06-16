import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, getDoc, Timestamp, updateDoc, doc, addDoc } from 'firebase/firestore';
import { sendEmail } from './email-service';

interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Timestamp;
  status: 'active' | 'completed' | 'paused';
  category: string;
  currency?: string;
  lastReminderSent?: Timestamp;
  createdAt?: Timestamp;
}

interface GoalReminderData {
  userName: string;
  goalName: string;
  currentAmount: string;
  targetAmount: string;
  remainingAmount: string;
  progressPercentage: number;
  daysRemaining: number;
  projectedCompletion?: string;
  suggestedContribution?: string;
  currency: string;
}

/**
 * Calculate goal reminder data
 */
function calculateGoalReminderData(goal: Goal, userName: string): GoalReminderData {
  const now = new Date();
  const targetDate = goal.targetDate.toDate();
  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const remainingAmount = goal.targetAmount - goal.currentAmount;
  const progressPercentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
  const currency = goal.currency || '$';
  
  // Calculate suggested contribution
  let suggestedContribution: string | undefined;
  if (daysRemaining > 0 && remainingAmount > 0) {
    const dailyAmount = remainingAmount / daysRemaining;
    const weeklyAmount = dailyAmount * 7;
    const monthlyAmount = dailyAmount * 30;
    
    if (monthlyAmount > 100) {
      suggestedContribution = `${currency}${monthlyAmount.toFixed(0)} monthly`;
    } else if (weeklyAmount > 20) {
      suggestedContribution = `${currency}${weeklyAmount.toFixed(0)} weekly`;
    } else {
      suggestedContribution = `${currency}${dailyAmount.toFixed(0)} daily`;
    }
  }
  
  // Calculate projected completion
  let projectedCompletion: string | undefined;
  if (goal.currentAmount > 0 && remainingAmount > 0) {
    // Calculate average contribution rate (last 30 days)
    // This is simplified - in production, you'd analyze actual contribution history
    const avgMonthlyContribution = goal.currentAmount / 3; // Assume 3 months average
    if (avgMonthlyContribution > 0) {
      const monthsToComplete = remainingAmount / avgMonthlyContribution;
      const projectedDate = new Date();
      projectedDate.setMonth(projectedDate.getMonth() + monthsToComplete);
      
      if (projectedDate <= targetDate) {
        projectedCompletion = 'On track to complete on time';
      } else {
        projectedCompletion = `May complete by ${projectedDate.toLocaleDateString()}`;
      }
    }
  }
  
  return {
    userName,
    goalName: goal.name,
    currentAmount: goal.currentAmount.toFixed(2),
    targetAmount: goal.targetAmount.toFixed(2),
    remainingAmount: remainingAmount.toFixed(2),
    progressPercentage,
    daysRemaining,
    projectedCompletion,
    suggestedContribution,
    currency,
  };
}

/**
 * Determine if a goal needs a reminder
 */
function shouldSendReminder(goal: Goal): boolean {
  const now = new Date();
  const targetDate = goal.targetDate.toDate();
  const daysRemaining = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Don't send if goal is completed or paused
  if (goal.status !== 'active') {
    return false;
  }
  
  // Don't send if already completed
  if (goal.currentAmount >= goal.targetAmount) {
    return false;
  }
  
  // Check last reminder sent
  if (goal.lastReminderSent) {
    const lastSent = goal.lastReminderSent.toDate();
    const daysSinceLastReminder = Math.floor((now.getTime() - lastSent.getTime()) / (1000 * 60 * 60 * 24));
    
    // Send reminders based on urgency
    if (daysRemaining <= 7) {
      // Daily reminders in last week
      return daysSinceLastReminder >= 1;
    } else if (daysRemaining <= 30) {
      // Weekly reminders in last month
      return daysSinceLastReminder >= 7;
    } else {
      // Monthly reminders otherwise
      return daysSinceLastReminder >= 30;
    }
  }
  
  // First reminder
  return true;
}

/**
 * Send goal reminder email
 */
export async function sendGoalReminder(
  goal: Goal,
  userEmail: string,
  userName: string
): Promise<boolean> {
  if (!db) {
    console.warn('Database not initialized');
    return false;
  }
  
  try {
    const reminderData = calculateGoalReminderData(goal, userName);
    
    // Create goal reminder email template
    await sendEmail({
      to: userEmail,
      subject: `Goal Update: ${goal.name} - ${reminderData.progressPercentage}% Complete`,
      template: 'goal-reminder',
      data: reminderData,
    });
    
    // Update last reminder sent
    await updateDoc(doc(db, 'goals', goal.id), {
      lastReminderSent: Timestamp.now(),
    });
    
    // Log reminder sent
    await addDoc(collection(db, 'email_logs'), {
      userId: goal.userId,
      goalId: goal.id,
      type: 'goal_reminder',
      sentAt: Timestamp.now(),
      status: 'sent',
    });
    
    return true;
  } catch (error) {
    console.error('Error sending goal reminder:', error);
    
    // Log error
    if (db) {
      await addDoc(collection(db, 'email_logs'), {
        userId: goal.userId,
        goalId: goal.id,
        type: 'goal_reminder',
        sentAt: Timestamp.now(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    return false;
  }
}

/**
 * Process goal reminders for all users
 * This should be called by a scheduled function daily
 */
export async function processGoalReminders(): Promise<void> {
  if (!db) {
    console.warn('Database not initialized');
    return;
  }
  
  try {
    // Get all active goals
    const goalsRef = collection(db, 'goals');
    const q = query(
      goalsRef,
      where('status', '==', 'active'),
      where('targetDate', '>', Timestamp.now())
    );
    
    const snapshot = await getDocs(q);
    const goals = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Goal[];
    
    console.log(`Processing goal reminders for ${goals.length} active goals`);
    
    // Process each goal
    const results = await Promise.allSettled(
      goals.map(async (goal) => {
        if (!shouldSendReminder(goal)) {
          return false;
        }
        
        if (!db) {
          return false;
        }
        
        // Get user data
        const userDocRef = doc(db, 'users', goal.userId);
        const userSnapshot = await getDoc(userDocRef);
        const userData = userSnapshot.data();
        
        if (!userData || !userData.emailPreferences?.goalReminders) {
          return false;
        }
        
        return sendGoalReminder(
          goal,
          userData.email,
          userData.displayName || userData.firstName || 'User'
        );
      })
    );
    
    // Log results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Goal reminders sent: ${successful} successful, ${failed} failed`);
    
    // Log batch processing
    await addDoc(collection(db, 'batch_logs'), {
      type: 'goal_reminders',
      processedAt: Timestamp.now(),
      totalGoals: goals.length,
      successful,
      failed,
    });
  } catch (error) {
    console.error('Error processing goal reminders:', error);
    throw error;
  }
}

/**
 * Send goal achievement notification
 */
export async function sendGoalAchievementNotification(
  goalId: string,
  userId: string
): Promise<boolean> {
  if (!db) {
    console.warn('Database not initialized');
    return false;
  }
  
  try {
    // Get goal data
    const goalDocRef = doc(db, 'goals', goalId);
    const goalSnapshot = await getDoc(goalDocRef);
    const goalData = goalSnapshot.data() as Goal;
    
    if (!goalData) {
      throw new Error('Goal not found');
    }
    
    // Get user data
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    // Calculate achievement data
    const achievedDate = new Date().toLocaleDateString();
    const createdDate = goalData.createdAt?.toDate() || new Date();
    const duration = Math.ceil((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    const durationText = duration > 30 
      ? `${Math.round(duration / 30)} months`
      : `${duration} days`;
    
    // Suggest next goal based on category
    const nextGoalSuggestions: Record<string, string> = {
      'Emergency Fund': 'Increase your emergency fund to 6 months of expenses',
      'Savings': 'Start an investment portfolio',
      'Investment': 'Diversify into different asset classes',
      'Debt Repayment': 'Build your credit score',
      'Travel': 'Plan your next adventure',
      'Education': 'Invest in continuous learning',
      'Home': 'Save for home improvements',
      'Other': 'Set a new financial milestone',
    };
    
    await sendEmail({
      to: userData.email,
      subject: `Congratulations! You've achieved your "${goalData.name}" goal`,
      template: 'goal-achievement',
      data: {
        userName: userData.displayName || userData.firstName || 'User',
        goalName: goalData.name,
        targetAmount: goalData.targetAmount.toFixed(2),
        achievedDate,
        duration: durationText,
        nextGoalSuggestion: nextGoalSuggestions[goalData.category] || nextGoalSuggestions['Other'],
        currency: goalData.currency || '$',
      },
    });
    
    return true;
  } catch (error) {
    console.error('Error sending goal achievement notification:', error);
    return false;
  }
} 