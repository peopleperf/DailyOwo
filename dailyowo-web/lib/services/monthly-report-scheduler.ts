import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, Timestamp, addDoc, doc, getDoc } from 'firebase/firestore';
import { sendEmail } from './email-service';
import { calculateMonthlyMetrics } from '@/lib/utils/financial-calculations';

interface MonthlyReportData {
  userId: string;
  userEmail: string;
  userName: string;
  month: string;
  year: string;
  totalIncome: string;
  totalExpenses: string;
  netSavings: string;
  topCategory: string;
  savingsRate: number;
  comparisonLastMonth?: number;
  currency: string;
}

/**
 * Calculate monthly report data for a user
 */
async function calculateUserMonthlyReport(
  userId: string,
  month: number,
  year: number
): Promise<Partial<MonthlyReportData> | null> {
  if (!db) {
    console.warn('Database not initialized');
    return null;
  }
  
  try {
    // Get date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    // Query transactions for the month
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );
    
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        amount: data.amount || 0,
        type: data.type as 'income' | 'expense',
        category: data.category || 'Uncategorized',
        date: data.date?.toDate() || new Date(),
        description: data.description,
        currency: data.currency,
      };
    });
    
    if (transactions.length === 0) {
      return null;
    }
    
    // Calculate metrics
    const metrics = calculateMonthlyMetrics(transactions);
    
    // Get previous month data for comparison
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59);
    
    const prevQ = query(
      transactionsRef,
      where('userId', '==', userId),
      where('date', '>=', Timestamp.fromDate(prevStartDate)),
      where('date', '<=', Timestamp.fromDate(prevEndDate))
    );
    
    const prevSnapshot = await getDocs(prevQ);
    const prevTransactions = prevSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        amount: data.amount || 0,
        type: data.type as 'income' | 'expense',
        category: data.category || 'Uncategorized',
        date: data.date?.toDate() || new Date(),
        description: data.description,
        currency: data.currency,
      };
    });
    
    let comparisonLastMonth: number | undefined;
    if (prevTransactions.length > 0) {
      const prevMetrics = calculateMonthlyMetrics(prevTransactions);
      if (prevMetrics.totalExpenses > 0) {
        comparisonLastMonth = Math.round(
          ((metrics.totalExpenses - prevMetrics.totalExpenses) / prevMetrics.totalExpenses) * 100
        );
      }
    }
    
    return {
      month: startDate.toLocaleString('default', { month: 'long' }),
      year: year.toString(),
      totalIncome: metrics.totalIncome.toFixed(2),
      totalExpenses: metrics.totalExpenses.toFixed(2),
      netSavings: metrics.netSavings.toFixed(2),
      topCategory: metrics.topCategory || 'Uncategorized',
      savingsRate: metrics.savingsRate,
      comparisonLastMonth,
      currency: metrics.currency || '$',
    };
  } catch (error) {
    console.error('Error calculating monthly report:', error);
    return null;
  }
}

/**
 * Send monthly report to a user
 */
export async function sendMonthlyReport(
  userId: string,
  userEmail: string,
  userName: string,
  month: number,
  year: number
): Promise<boolean> {
  if (!db) {
    console.warn('Database not initialized');
    return false;
  }
  
  try {
    const reportData = await calculateUserMonthlyReport(userId, month, year);
    
    if (!reportData) {
      console.log(`No transaction data for user ${userId} in ${month}/${year}`);
      return false;
    }
    
    const emailData: MonthlyReportData = {
      userId,
      userEmail,
      userName,
      ...reportData as any,
    };
    
    await sendEmail({
      to: userEmail,
      subject: `${emailData.month} ${emailData.year} Financial Summary - DailyOwo`,
      template: 'monthly-report',
      data: emailData,
    });
    
    // Log report sent
    await addDoc(collection(db, 'email_logs'), {
      userId,
      type: 'monthly_report',
      sentAt: Timestamp.now(),
      month,
      year,
      status: 'sent',
    });
    
    return true;
  } catch (error) {
    console.error('Error sending monthly report:', error);
    
    // Log error
    if (db) {
      await addDoc(collection(db, 'email_logs'), {
        userId,
        type: 'monthly_report',
        sentAt: Timestamp.now(),
        month,
        year,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    
    return false;
  }
}

/**
 * Check if user should receive monthly report
 */
async function shouldSendReport(userId: string, month: number, year: number): Promise<boolean> {
  if (!db) {
    console.warn('Database not initialized');
    return false;
  }
  
  try {
    // Check user preferences
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();
    
    if (!userData?.emailPreferences?.monthlyReports) {
      return false;
    }
    
    // Check if report was already sent this month
    const logsRef = collection(db, 'email_logs');
    const q = query(
      logsRef,
      where('userId', '==', userId),
      where('type', '==', 'monthly_report'),
      where('month', '==', month),
      where('year', '==', year),
      where('status', '==', 'sent')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch (error) {
    console.error('Error checking report status:', error);
    return false;
  }
}

/**
 * Process monthly reports for all users
 * This should be called by a scheduled function on the 1st of each month
 */
export async function processMonthlyReports(): Promise<void> {
  if (!db) {
    console.warn('Database not initialized');
    return;
  }
  
  try {
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    
    // Get all users with monthly reports enabled
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('emailPreferences.monthlyReports', '==', true),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        firstName: data.firstName,
        ...data
      };
    });
    
    console.log(`Processing monthly reports for ${users.length} users`);
    
    // Process each user
    const results = await Promise.allSettled(
      users.map(async (user) => {
        if (await shouldSendReport(user.id, lastMonth + 1, year)) {
          return sendMonthlyReport(
            user.id,
            user.email,
            user.displayName || user.firstName || 'User',
            lastMonth + 1,
            year
          );
        }
        return false;
      })
    );
    
    // Log results
    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Monthly reports sent: ${successful} successful, ${failed} failed`);
    
    // Log batch processing
    await addDoc(collection(db, 'batch_logs'), {
      type: 'monthly_reports',
      processedAt: Timestamp.now(),
      month: lastMonth + 1,
      year,
      totalUsers: users.length,
      successful,
      failed,
    });
  } catch (error) {
    console.error('Error processing monthly reports:', error);
    throw error;
  }
}

/**
 * Send test monthly report (for development)
 */
export async function sendTestMonthlyReport(
  userId: string,
  month?: number,
  year?: number
): Promise<boolean> {
  if (!db) {
    console.warn('Database not initialized');
    return false;
  }
  
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();
    
    if (!userData) {
      throw new Error('User not found');
    }
    
    const now = new Date();
    const targetMonth = month || (now.getMonth() === 0 ? 12 : now.getMonth());
    const targetYear = year || (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
    
    return sendMonthlyReport(
      userId,
      userData.email,
      userData.displayName || userData.firstName || 'User',
      targetMonth,
      targetYear
    );
  } catch (error) {
    console.error('Error sending test monthly report:', error);
    return false;
  }
} 