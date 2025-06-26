/**
 * Budget-Transaction Integration Service
 * Handles real-time synchronization between transactions and budgets
 */

import { Transaction } from '@/types/transaction';
import { budgetService } from '@/lib/firebase/budget-service';
import { storeAuditEntry } from '@/lib/services/audit-storage-service';
import { createAuditEntry } from '@/lib/utils/transaction-audit';

interface BudgetImpact {
  budgetId: string;
  categoryId: string;
  previousAmount: number;
  newAmount: number;
  difference: number;
  overBudget: boolean;
  remainingBudget: number;
}

interface BudgetAlert {
  id: string;
  type: 'overspend' | 'approaching_limit' | 'budget_exceeded';
  budgetId: string;
  categoryId: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  acknowledged: boolean;
}

class BudgetTransactionIntegrationService {
  /**
   * Process transaction impact on budget when a transaction is created
   */
  async onTransactionCreated(transaction: Transaction): Promise<BudgetImpact | null> {
    try {
      // Only process expense transactions for budget impact
      if (transaction.type !== 'expense') {
        return null;
      }

      // Get user's active budget
      const budget = await budgetService.getActiveBudget(transaction.userId);
      if (!budget) {
        console.log(`[BudgetIntegration] No active budget found for user ${transaction.userId}`);
        return null;
      }

      // Find matching budget category
      const budgetCategory = this.findMatchingBudgetCategory(budget, transaction);
      if (!budgetCategory) {
        console.log(`[BudgetIntegration] No matching budget category for transaction ${transaction.id}`);
        return null;
      }

      // Calculate budget impact
      const impact = await this.calculateBudgetImpact(
        budget.id,
        budgetCategory.id,
        transaction.amount,
        transaction.userId
      );

      // Update budget spending
      await this.updateBudgetSpending(
        transaction.userId,
        budget.id,
        budgetCategory.id,
        transaction.amount
      );

      // Check for budget alerts
      await this.checkBudgetAlerts(transaction.userId, budget.id, budgetCategory.id, impact);

      // Audit the budget impact
      await this.auditBudgetImpact(transaction, impact);

      return impact;
    } catch (error) {
      console.error('[BudgetIntegration] Error processing transaction creation:', error);
      return null;
    }
  }

  /**
   * Process transaction impact on budget when a transaction is updated
   */
  async onTransactionUpdated(
    oldTransaction: Transaction,
    newTransaction: Transaction
  ): Promise<BudgetImpact | null> {
    try {
      // Only process if amount or category changed
      const amountChanged = oldTransaction.amount !== newTransaction.amount;
      const categoryChanged = oldTransaction.categoryId !== newTransaction.categoryId;
      const typeChanged = oldTransaction.type !== newTransaction.type;

      if (!amountChanged && !categoryChanged && !typeChanged) {
        return null;
      }

      // Get user's active budget
      const budget = await budgetService.getActiveBudget(newTransaction.userId);
      if (!budget) {
        return null;
      }

      // Reverse the old transaction impact
      if (oldTransaction.type === 'expense') {
        const oldBudgetCategory = this.findMatchingBudgetCategory(budget, oldTransaction);
        if (oldBudgetCategory) {
          await this.updateBudgetSpending(
            oldTransaction.userId,
            budget.id,
            oldBudgetCategory.id,
            -oldTransaction.amount // Negative to reverse
          );
        }
      }

      // Apply the new transaction impact
      if (newTransaction.type === 'expense') {
        const newBudgetCategory = this.findMatchingBudgetCategory(budget, newTransaction);
        if (newBudgetCategory) {
          const impact = await this.calculateBudgetImpact(
            budget.id,
            newBudgetCategory.id,
            newTransaction.amount,
            newTransaction.userId
          );

          await this.updateBudgetSpending(
            newTransaction.userId,
            budget.id,
            newBudgetCategory.id,
            newTransaction.amount
          );

          // Check for budget alerts
          await this.checkBudgetAlerts(newTransaction.userId, budget.id, newBudgetCategory.id, impact);

          // Audit the budget impact
          await this.auditBudgetImpact(newTransaction, impact, 'UPDATE');

          return impact;
        }
      }

      return null;
    } catch (error) {
      console.error('[BudgetIntegration] Error processing transaction update:', error);
      return null;
    }
  }

  /**
   * Process transaction impact on budget when a transaction is deleted
   */
  async onTransactionDeleted(transaction: Transaction): Promise<BudgetImpact | null> {
    try {
      // Only process expense transactions
      if (transaction.type !== 'expense') {
        return null;
      }

      // Get user's active budget
      const budget = await budgetService.getActiveBudget(transaction.userId);
      if (!budget) {
        return null;
      }

      // Find matching budget category
      const budgetCategory = this.findMatchingBudgetCategory(budget, transaction);
      if (!budgetCategory) {
        return null;
      }

      // Reverse the transaction impact (negative amount)
      const impact = await this.calculateBudgetImpact(
        budget.id,
        budgetCategory.id,
        -transaction.amount, // Negative to reverse
        transaction.userId
      );

      await this.updateBudgetSpending(
        transaction.userId,
        budget.id,
        budgetCategory.id,
        -transaction.amount // Negative to reverse
      );

      // Audit the budget impact
      await this.auditBudgetImpact(transaction, impact, 'DELETE');

      return impact;
    } catch (error) {
      console.error('[BudgetIntegration] Error processing transaction deletion:', error);
      return null;
    }
  }

  /**
   * Find matching budget category for a transaction
   */
  private findMatchingBudgetCategory(budget: any, transaction: Transaction): any {
    // First, try to find exact category match
    let category = budget.categories.find((cat: any) => 
      cat.transactionCategories?.includes(transaction.categoryId)
    );

    if (category) {
      return category;
    }

    // Fallback: try to find by category name mapping
    const categoryMappings: Record<string, string[]> = {
      'housing': ['rent', 'mortgage', 'utilities', 'internet', 'electricity', 'water', 'gas'],
      'food': ['groceries', 'dining-out', 'restaurants', 'food-delivery'],
      'transportation': ['fuel', 'car-payment', 'insurance', 'maintenance', 'parking'],
      'entertainment': ['movies', 'streaming-services', 'games', 'hobbies'],
      'shopping': ['clothing', 'electronics', 'home-goods'],
      'healthcare': ['medical', 'pharmacy', 'dental', 'vision'],
      'savings': ['emergency-fund', 'retirement-401k', 'investments']
    };

    for (const [budgetCat, transactionCats] of Object.entries(categoryMappings)) {
      if (transactionCats.includes(transaction.categoryId)) {
        category = budget.categories.find((cat: any) => 
          cat.name.toLowerCase().includes(budgetCat) || cat.id.includes(budgetCat)
        );
        if (category) {
          return category;
        }
      }
    }

    // Final fallback: use miscellaneous category
    return budget.categories.find((cat: any) => 
      cat.name.toLowerCase().includes('other') || 
      cat.name.toLowerCase().includes('miscellaneous') ||
      cat.id.includes('other')
    );
  }

  /**
   * Calculate the impact of a transaction on budget
   */
  private async calculateBudgetImpact(
    budgetId: string,
    categoryId: string,
    amount: number,
    userId: string
  ): Promise<BudgetImpact> {
    const budgetData = await budgetService.getBudgetData(userId, budgetId);
    const categoryPerformance = budgetData.categoryPerformance.find(
      (cat: any) => cat.id === categoryId
    );

    const previousAmount = (categoryPerformance as any)?.spent || 0;
    const newAmount = previousAmount + amount;
    const budgetLimit = (categoryPerformance as any)?.allocated || 0;
    const remainingBudget = Math.max(0, budgetLimit - newAmount);
    const overBudget = newAmount > budgetLimit;

    return {
      budgetId,
      categoryId,
      previousAmount,
      newAmount,
      difference: amount,
      overBudget,
      remainingBudget
    };
  }

  /**
   * Update budget spending for a category
   */
  private async updateBudgetSpending(
    userId: string,
    budgetId: string,
    categoryId: string,
    amount: number
  ): Promise<void> {
    try {
      const budget = await budgetService.getBudget(userId, budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      // Update the category's current spending
      const updatedCategories = budget.categories.map((cat: any) => {
        if (cat.id === categoryId) {
          return {
            ...cat,
            spent: (cat.spent || 0) + amount,
            lastUpdated: new Date()
          };
        }
        return cat;
      });

      await budgetService.updateBudget(userId, {
        id: budgetId,
        categories: updatedCategories
      });

      console.log(`[BudgetIntegration] Updated budget ${budgetId} category ${categoryId} by ${amount}`);
    } catch (error) {
      console.error('[BudgetIntegration] Error updating budget spending:', error);
      throw error;
    }
  }

  /**
   * Check for budget alerts and create them if necessary
   */
  private async checkBudgetAlerts(
    userId: string,
    budgetId: string,
    categoryId: string,
    impact: BudgetImpact
  ): Promise<void> {
    const alerts: BudgetAlert[] = [];

    // Check for overspending
    if (impact.overBudget) {
      alerts.push({
        id: `alert_${Date.now()}_overspend`,
        type: 'budget_exceeded',
        budgetId,
        categoryId,
        message: `Budget exceeded for category by $${Math.abs(impact.remainingBudget).toFixed(2)}`,
        severity: 'high',
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Check for approaching limit (80% of budget)
    const percentUsed = impact.newAmount / (impact.newAmount + impact.remainingBudget);
    if (percentUsed >= 0.8 && percentUsed < 1.0) {
      alerts.push({
        id: `alert_${Date.now()}_approaching`,
        type: 'approaching_limit',
        budgetId,
        categoryId,
        message: `You've used ${(percentUsed * 100).toFixed(0)}% of your budget for this category`,
        severity: 'medium',
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Store alerts in the database and send notifications
    for (const alert of alerts) {
      console.log(`[BudgetIntegration] Budget Alert: ${alert.message}`);
      
      try {
        await this.storeBudgetAlert(userId, alert);
        await this.sendBudgetNotification(userId, alert);
      } catch (error) {
        console.error('[BudgetIntegration] Error storing/sending alert:', error);
        // Continue with other alerts even if one fails
      }
    }
  }

  /**
   * Audit budget impact for compliance and tracking
   */
  private async auditBudgetImpact(
    transaction: Transaction,
    impact: BudgetImpact,
    action: 'CREATE' | 'UPDATE' | 'DELETE' = 'CREATE'
  ): Promise<void> {
    try {
      const auditEntry = createAuditEntry(
        action,
        transaction.userId,
        transaction.id,
        {
          metadata: {
            source: 'budget-transaction-integration'
          }
        }
      );

      await storeAuditEntry(auditEntry);
    } catch (error) {
      console.error('[BudgetIntegration] Error auditing budget impact:', error);
      // Don't throw - audit failures shouldn't break the main flow
    }
  }

  /**
   * Get budget impact preview before creating a transaction
   */
  async previewBudgetImpact(
    userId: string,
    transactionData: {
      type: Transaction['type'];
      amount: number;
      categoryId: string;
    }
  ): Promise<{
    wouldExceedBudget: boolean;
    remainingBudget: number;
    percentageUsed: number;
    categoryName?: string;
  }> {
    try {
      if (transactionData.type !== 'expense') {
        return {
          wouldExceedBudget: false,
          remainingBudget: 0,
          percentageUsed: 0
        };
      }

      const budget = await budgetService.getActiveBudget(userId);
      if (!budget) {
        return {
          wouldExceedBudget: false,
          remainingBudget: 0,
          percentageUsed: 0
        };
      }

      // Create a mock transaction to find category
      const mockTransaction: Partial<Transaction> = {
        userId,
        type: transactionData.type,
        amount: transactionData.amount,
        categoryId: transactionData.categoryId
      };

      const budgetCategory = this.findMatchingBudgetCategory(budget, mockTransaction as Transaction);
      if (!budgetCategory) {
        return {
          wouldExceedBudget: false,
          remainingBudget: 0,
          percentageUsed: 0
        };
      }

      const budgetData = await budgetService.getBudgetData(userId, budget.id);
      const categoryPerformance = budgetData.categoryPerformance.find(
        (cat: any) => cat.id === budgetCategory.id
      );

      const currentSpent = (categoryPerformance as any)?.spent || 0;
      const allocated = (categoryPerformance as any)?.allocated || 0;
      const newTotal = currentSpent + transactionData.amount;
      const remainingBudget = Math.max(0, allocated - newTotal);
      const percentageUsed = allocated > 0 ? (newTotal / allocated) * 100 : 0;

      return {
        wouldExceedBudget: newTotal > allocated && allocated > 0,
        remainingBudget,
        percentageUsed,
        categoryName: budgetCategory.name
      };
    } catch (error) {
      console.error('[BudgetIntegration] Error previewing budget impact:', error);
      return {
        wouldExceedBudget: false,
        remainingBudget: 0,
        percentageUsed: 0
      };
    }
  }

  /**
   * Store budget alert in database
   */
  private async storeBudgetAlert(userId: string, alert: BudgetAlert): Promise<void> {
    try {
      const { getFirebaseDb } = await import('@/lib/firebase/config');
      const { collection, addDoc, doc, serverTimestamp } = await import('firebase/firestore');
      
      const db = await getFirebaseDb();
      if (!db) {
        throw new Error('Database not initialized');
      }

      const userDocRef = doc(db, 'users', userId);
      await addDoc(collection(userDocRef, 'budget_alerts'), {
        ...alert,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp()
      });

      console.log(`[BudgetIntegration] Stored budget alert ${alert.id} for user ${userId}`);
    } catch (error) {
      console.error('[BudgetIntegration] Error storing budget alert:', error);
      throw error;
    }
  }

  /**
   * Send budget notification to user
   */
  private async sendBudgetNotification(userId: string, alert: BudgetAlert): Promise<void> {
    try {
      // For now, just log the notification
      // In production, this would integrate with email/push notification services
      console.log(`[BudgetIntegration] Budget notification sent to ${userId}:`, {
        type: alert.type,
        message: alert.message,
        severity: alert.severity
      });

      // TODO: Integrate with actual notification service
      // await emailService.sendBudgetAlert(userId, alert);
      // await pushNotificationService.sendAlert(userId, alert);
    } catch (error) {
      console.error('[BudgetIntegration] Error sending budget notification:', error);
      throw error;
    }
  }

  /**
   * Recalculate all budget data from transactions (for data consistency)
   */
  async recalculateBudgetFromTransactions(userId: string, budgetId?: string): Promise<void> {
    try {
      console.log(`[BudgetIntegration] Recalculating budget data for user ${userId}`);
      
      const budget = budgetId 
        ? await budgetService.getBudget(userId, budgetId)
        : await budgetService.getActiveBudget(userId);

      if (!budget) {
        console.log('[BudgetIntegration] No budget found for recalculation');
        return;
      }

      // Reset all category spending to 0
      const resetCategories = budget.categories.map((cat: any) => ({
        ...cat,
        spent: 0,
        lastUpdated: new Date()
      }));

      await budgetService.updateBudget(userId, {
        id: budget.id,
        categories: resetCategories
      });

      // Recalculate from budget data service (which fetches fresh transaction data)
      await budgetService.getBudgetData(userId, budget.id);

      console.log(`[BudgetIntegration] Budget recalculation completed for budget ${budget.id}`);
    } catch (error) {
      console.error('[BudgetIntegration] Error recalculating budget:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const budgetTransactionIntegration = new BudgetTransactionIntegrationService();

// Export types
export type { BudgetImpact, BudgetAlert };