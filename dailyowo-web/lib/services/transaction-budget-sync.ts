import { Transaction } from '@/types/transaction';
import { Budget, BudgetCategory, BudgetAlert } from '@/lib/financial-logic/budget-logic';
import { BudgetService } from '@/lib/firebase/budget-service';
import { getFirebaseDb } from '@/lib/firebase/config';
import { getCategoryById } from '@/lib/constants/transaction-categories';
import { sendEmail } from '@/lib/services/email-service';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  Timestamp,
  writeBatch,
  serverTimestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';

export interface BudgetImpact {
  budgetCategoryId: string;
  categoryName: string;
  amountUsed: number;
  percentageUsed: number;
  remainingBudget: number;
  isOverBudget: boolean;
}

export interface TransactionBudgetSync {
  transactionId: string;
  budgetId: string;
  budgetPeriodId: string;
  impacts: BudgetImpact[];
  totalBudgetUsage: number;
  alerts: BudgetAlert[];
}

export class TransactionBudgetSyncService {
  private budgetService: BudgetService;
  private listeners: Map<string, () => void> = new Map();

  constructor() {
    this.budgetService = new BudgetService();
  }

  private async getDb() {
    const db = await getFirebaseDb();
    if (!db) {
      throw new Error('Database not initialized. Please check your Firebase configuration.');
    }
    return db;
  }

  /**
   * Calculate budget impact for a transaction
   */
  async calculateBudgetImpact(
    transaction: Transaction,
    budget: Budget
  ): Promise<BudgetImpact[]> {
    const impacts: BudgetImpact[] = [];

    // Only expenses affect budget categories
    if (transaction.type !== 'expense') {
      return impacts;
    }

    // Find matching budget categories
    const matchingCategories = budget.categories.filter(category =>
      category.transactionCategories.includes(transaction.categoryId)
    );

    for (const category of matchingCategories) {
      const amountUsed = transaction.amount;
      const newSpent = category.spent + amountUsed;
      const percentageUsed = (newSpent / category.allocated) * 100;
      const remainingBudget = category.allocated - newSpent;

      impacts.push({
        budgetCategoryId: category.id,
        categoryName: category.name,
        amountUsed,
        percentageUsed,
        remainingBudget,
        isOverBudget: newSpent > category.allocated
      });
    }

    return impacts;
  }

  /**
   * Preview budget impact before saving transaction
   */
  async previewBudgetImpact(
    transaction: Partial<Transaction>,
    userId: string
  ): Promise<{
    impacts: BudgetImpact[];
    warnings: string[];
    suggestions: string[];
  }> {
    const activeBudget = await this.budgetService.getActiveBudget(userId);
    
    if (!activeBudget || transaction.type !== 'expense') {
      return { impacts: [], warnings: [], suggestions: [] };
    }

    const impacts = await this.calculateBudgetImpact(transaction as Transaction, activeBudget);
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check if transaction category is mapped to any budget category
    if (impacts.length === 0 && transaction.categoryId) {
      const categoryInfo = getCategoryById(transaction.categoryId);
      const categoryName = categoryInfo?.name || transaction.categoryId;
      warnings.push(`The category "${categoryName}" is not mapped to any budget category. Consider updating your budget categories.`);
      suggestions.push('This transaction will not affect your budget tracking.');
    }

    for (const impact of impacts) {
      if (impact.isOverBudget) {
        warnings.push(`This will put you over budget for ${impact.categoryName}`);
        
        // Find categories with available budget
        const availableCategories = activeBudget.categories
          .filter(cat => cat.remaining > transaction.amount!)
          .map(cat => cat.name);
        
        if (availableCategories.length > 0) {
          suggestions.push(`Consider using budget from: ${availableCategories.join(', ')}`);
        }
      } else if (impact.percentageUsed > 80) {
        warnings.push(`This will use ${impact.percentageUsed.toFixed(0)}% of your ${impact.categoryName} budget`);
      }
    }

    return { impacts, warnings, suggestions };
  }

  /**
   * Sync transaction with budget in real-time
   */
  async syncTransactionWithBudget(
    transaction: Transaction,
    eventType: 'create' | 'update' | 'delete'
  ): Promise<TransactionBudgetSync | null> {
    const db = await this.getDb();
    const userId = transaction.userId;

    // Get active budget
    const activeBudget = await this.budgetService.getActiveBudget(userId);
    if (!activeBudget) {
      return null;
    }

    // Check if transaction is within budget period
    const transactionDate = transaction.date instanceof Date ? transaction.date : transaction.date;
    if (transactionDate < activeBudget.period.startDate || transactionDate > activeBudget.period.endDate) {
      return null;
    }

    const batch = writeBatch(db);
    const alerts: BudgetAlert[] = [];

    try {
      // Calculate impacts
      const impacts = await this.calculateBudgetImpact(transaction, activeBudget);
      
      // Update budget categories
      for (const impact of impacts) {
        const category = activeBudget.categories.find(c => c.id === impact.budgetCategoryId);
        if (!category) continue;

        let newSpent = category.spent;
        
        switch (eventType) {
          case 'create':
            newSpent += transaction.amount;
            break;
          case 'delete':
            newSpent -= transaction.amount;
            break;
          case 'update':
            // This would need the old transaction amount to calculate properly
            // For now, we'll recalculate from all transactions
            const allTransactions = await this.getUserTransactionsForPeriod(userId, activeBudget.period);
            newSpent = this.calculateCategorySpending(category, allTransactions);
            break;
        }

        const updatedCategory = {
          ...category,
          spent: Math.max(0, newSpent),
          remaining: category.allocated - Math.max(0, newSpent),
          isOverBudget: newSpent > category.allocated
        };

        // Generate alerts if needed
        if (updatedCategory.isOverBudget && eventType !== 'delete') {
          alerts.push({
            id: `alert-${Date.now()}-${category.id}`,
            budgetId: activeBudget.id,
            categoryId: category.id,
            type: 'over-budget',
            message: `You've exceeded your ${category.name} budget by ${(newSpent - category.allocated).toFixed(2)}`,
            severity: 'error',
            threshold: category.allocated,
            currentAmount: newSpent,
            isRead: false,
            createdAt: new Date()
          });
          
          // Send email alert if enabled
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.data()?.emailPreferences?.budgetAlerts) {
            try {
              const percentageUsed = Math.round((newSpent / category.allocated) * 100);
              const remaining = category.allocated - newSpent;
              const daysLeft = Math.max(0, Math.ceil((activeBudget.period.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
              
              await sendEmail({
                to: userDoc.data()!.email,
                subject: `Budget Exceeded: ${category.name}`,
                template: 'budget-alert',
                data: {
                  userName: userDoc.data()!.displayName || userDoc.data()!.firstName || 'User',
                  budgetName: category.name,
                  spent: newSpent.toFixed(2),
                  limit: category.allocated.toFixed(2),
                  percentage: percentageUsed,
                  remaining: remaining.toFixed(2),
                  daysLeft,
                  currency: userDoc.data()!.currency || '$',
                },
                userId: userId,
              });
              console.log(`Email alert sent for budget ${category.name}`);
            } catch (emailError) {
              console.error('Error sending email alert:', emailError);
              // Don't fail the whole operation if email fails
            }
          }
        } else if (newSpent >= category.allocated * 0.8 && eventType !== 'delete') {
          alerts.push({
            id: `alert-${Date.now()}-${category.id}`,
            budgetId: activeBudget.id,
            categoryId: category.id,
            type: 'approaching-limit',
            message: `You've used ${((newSpent / category.allocated) * 100).toFixed(0)}% of your ${category.name} budget`,
            severity: 'warning',
            threshold: category.allocated * 0.8,
            currentAmount: newSpent,
            isRead: false,
            createdAt: new Date()
          });
          
          // Send email alert if enabled
          const userDoc2 = await getDoc(doc(db, 'users', userId));
          if (userDoc2.data()?.emailPreferences?.budgetAlerts) {
            try {
              const percentageUsed = Math.round((newSpent / category.allocated) * 100);
              const remaining = category.allocated - newSpent;
              const daysLeft = Math.max(0, Math.ceil((activeBudget.period.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
              
              await sendEmail({
                to: userDoc2.data()!.email,
                subject: `Budget Alert: ${category.name} at ${percentageUsed}%`,
                template: 'budget-alert',
                data: {
                  userName: userDoc2.data()!.displayName || userDoc2.data()!.firstName || 'User',
                  budgetName: category.name,
                  spent: newSpent.toFixed(2),
                  limit: category.allocated.toFixed(2),
                  percentage: percentageUsed,
                  remaining: remaining.toFixed(2),
                  daysLeft,
                  currency: userDoc2.data()!.currency || '$',
                },
                userId: userId,
              });
              console.log(`Email alert sent for budget ${category.name}`);
            } catch (emailError) {
              console.error('Error sending email alert:', emailError);
              // Don't fail the whole operation if email fails
            }
          }
        }

        // Update the category in the budget
        const categoryIndex = activeBudget.categories.findIndex(c => c.id === category.id);
        if (categoryIndex !== -1) {
          activeBudget.categories[categoryIndex] = updatedCategory;
        }
      }

      // Update budget document
      const budgetRef = doc(db, 'users', userId, 'budgets', activeBudget.id);
      batch.update(budgetRef, {
        categories: activeBudget.categories,
        'period.totalSpent': activeBudget.categories.reduce((sum, cat) => sum + cat.spent, 0),
        updatedAt: serverTimestamp()
      });

      // Save alerts
      for (const alert of alerts) {
        const alertRef = doc(collection(db, 'users', userId, 'alerts'));
        batch.set(alertRef, {
          ...alert,
          createdAt: serverTimestamp()
        });
      }

      // Create sync record
      const syncRecord: TransactionBudgetSync = {
        transactionId: transaction.id,
        budgetId: activeBudget.id,
        budgetPeriodId: activeBudget.period.id,
        impacts,
        totalBudgetUsage: impacts.reduce((sum, impact) => sum + impact.amountUsed, 0),
        alerts
      };

      // Save sync record for audit trail
      const syncRef = doc(collection(db, 'users', userId, 'budget_sync_log'));
      batch.set(syncRef, {
        ...syncRecord,
        eventType,
        timestamp: serverTimestamp()
      });

      await batch.commit();

      // Emit real-time update event
      this.emitBudgetUpdate(userId, activeBudget);

      return syncRecord;

    } catch (error) {
      console.error('Error syncing transaction with budget:', error);
      throw error;
    }
  }

  /**
   * Set up real-time listeners for transaction changes
   */
  async setupTransactionListener(userId: string, callback: (sync: TransactionBudgetSync | null) => void): Promise<() => void> {
    const db = await this.getDb();
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    
    const unsubscribe = onSnapshot(transactionsRef, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        const transaction = {
          id: change.doc.id,
          ...change.doc.data()
        } as Transaction;

        let sync: TransactionBudgetSync | null = null;

        switch (change.type) {
          case 'added':
            sync = await this.syncTransactionWithBudget(transaction, 'create');
            break;
          case 'modified':
            sync = await this.syncTransactionWithBudget(transaction, 'update');
            break;
          case 'removed':
            sync = await this.syncTransactionWithBudget(transaction, 'delete');
            break;
        }

        if (sync) {
          callback(sync);
        }
      }
    });

    // Store listener for cleanup
    const listenerId = `transaction-${userId}`;
    this.listeners.set(listenerId, unsubscribe);

    return unsubscribe;
  }

  /**
   * Emit budget update event
   */
  private emitBudgetUpdate(userId: string, budget: Budget) {
    // This would integrate with your state management (Zustand)
    // or a custom event emitter to update UI components in real-time
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('budgetUpdate', {
        detail: { userId, budget }
      }));
    }
  }

  /**
   * Get user transactions for a specific period
   */
  private async getUserTransactionsForPeriod(
    userId: string,
    period: { startDate: Date; endDate: Date }
  ): Promise<Transaction[]> {
    const db = await this.getDb();
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    
    const q = query(
      transactionsRef,
      where('date', '>=', Timestamp.fromDate(period.startDate)),
      where('date', '<=', Timestamp.fromDate(period.endDate))
    );

    const snapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    snapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      } as Transaction);
    });

    return transactions;
  }

  /**
   * Calculate category spending from transactions
   */
  private calculateCategorySpending(
    category: BudgetCategory,
    transactions: Transaction[]
  ): number {
    return transactions
      .filter(t => 
        t.type === 'expense' && 
        category.transactionCategories.includes(t.categoryId)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}

// Export singleton instance
export const transactionBudgetSync = new TransactionBudgetSyncService();
