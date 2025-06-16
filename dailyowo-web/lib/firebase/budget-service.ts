import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  writeBatch,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { getFirebaseDb } from './config';
import {
  Budget,
  BudgetData,
  BudgetCategory,
  BudgetMethod,
  BudgetPeriod,
  createBudgetFromMethod,
  createBudgetPeriod,
  calculateBudgetData
} from '@/lib/financial-logic/budget-logic';
import { Transaction } from '@/types/transaction';

export class BudgetService {
  private db: any = null;

  constructor() {
    this.initializeDb();
  }

  private initializeDb() {
    if (typeof window === 'undefined') return; // Skip SSR
    this.db = getFirebaseDb();
  }

  private getDb() {
    if (!this.db) {
      this.initializeDb();
    }
    return this.db;
  }

  // ============= BUDGET CRUD OPERATIONS =============

  async createBudget(userId: string, method: BudgetMethod, monthlyIncome: number): Promise<Budget> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const period = createBudgetPeriod('monthly');
    const budget = createBudgetFromMethod(method, monthlyIncome, period, userId);

    // Convert dates to Timestamps for Firebase
    const budgetData = {
      ...budget,
      createdAt: Timestamp.fromDate(budget.createdAt),
      updatedAt: Timestamp.fromDate(budget.updatedAt),
      period: {
        ...budget.period,
        startDate: Timestamp.fromDate(budget.period.startDate),
        endDate: Timestamp.fromDate(budget.period.endDate),
      }
    };

    await setDoc(doc(db, 'users', userId, 'budgets', budget.id), budgetData);
    return budget;
  }

  async getBudget(userId: string, budgetId: string): Promise<Budget | null> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const budgetDoc = await getDoc(doc(db, 'users', userId, 'budgets', budgetId));
    
    if (!budgetDoc.exists()) {
      return null;
    }

    return this.convertFirestoreBudget(budgetDoc);
  }

  async getActiveBudget(userId: string): Promise<Budget | null> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const budgetsRef = collection(db, 'users', userId, 'budgets');
    const q = query(
      budgetsRef, 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }

    return this.convertFirestoreBudget(snapshot.docs[0]);
  }

  async updateBudget(userId: string, budget: Partial<Budget> & { id: string }): Promise<void> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    // Remove undefined values to prevent Firestore errors
    const cleanedBudget = this.removeUndefinedValues(budget);

    const updateData: any = {
      ...cleanedBudget,
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Convert dates if they exist
    if (updateData.period) {
      updateData.period = {
        ...updateData.period,
        startDate: updateData.period.startDate instanceof Date 
          ? Timestamp.fromDate(updateData.period.startDate) 
          : updateData.period.startDate,
        endDate: updateData.period.endDate instanceof Date 
          ? Timestamp.fromDate(updateData.period.endDate) 
          : updateData.period.endDate,
      };
    }

    await updateDoc(doc(db, 'users', userId, 'budgets', budget.id), updateData);
  }

  async deleteBudget(userId: string, budgetId: string): Promise<void> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    await deleteDoc(doc(db, 'users', userId, 'budgets', budgetId));
  }

  // ============= BUDGET CATEGORY OPERATIONS =============

  async updateBudgetCategory(
    userId: string, 
    budgetId: string, 
    categoryId: string, 
    updates: Partial<BudgetCategory>
  ): Promise<void> {
    const budget = await this.getBudget(userId, budgetId);
    if (!budget) throw new Error('Budget not found');

    const updatedCategories = budget.categories.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    );

    await this.updateBudget(userId, {
      id: budgetId,
      categories: updatedCategories
    });
  }

  async addBudgetCategory(
    userId: string, 
    budgetId: string, 
    category: BudgetCategory
  ): Promise<void> {
    const budget = await this.getBudget(userId, budgetId);
    if (!budget) throw new Error('Budget not found');

    const updatedCategories = [...budget.categories, category];

    await this.updateBudget(userId, {
      id: budgetId,
      categories: updatedCategories
    });
  }

  async removeBudgetCategory(
    userId: string, 
    budgetId: string, 
    categoryId: string
  ): Promise<void> {
    const budget = await this.getBudget(userId, budgetId);
    if (!budget) throw new Error('Budget not found');

    const updatedCategories = budget.categories.filter(cat => cat.id !== categoryId);

    await this.updateBudget(userId, {
      id: budgetId,
      categories: updatedCategories
    });
  }

  // ============= BUDGET DATA & ANALYTICS =============

  async getBudgetData(userId: string, budgetId?: string): Promise<BudgetData> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    // Get budget (active if no specific budget requested)
    const budget = budgetId 
      ? await this.getBudget(userId, budgetId)
      : await this.getActiveBudget(userId);

    if (!budget) {
      return this.getEmptyBudgetData();
    }

    // Fetch transactions for the current budget period
    const transactionsRef = collection(db, 'users', userId, 'transactions');
    const q = query(
      transactionsRef,
      where('date', '>=', budget.period.startDate),
      where('date', '<=', budget.period.endDate)
    );
    const transactionsSnapshot = await getDocs(q);
    
    const transactions: Transaction[] = [];
    transactionsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Properly convert all transaction fields
      const transaction: Transaction = {
        id: doc.id,
        userId: data.userId || userId,
        type: data.type,
        amount: data.amount || 0,
        currency: data.currency || 'USD',
        categoryId: data.categoryId,
        categoryType: data.categoryType || 'global',
        description: data.description || '',
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        isRecurring: data.isRecurring || false,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
        createdBy: data.createdBy || userId,
      };

      // Add optional fields if they exist
      if (data.merchant) transaction.merchant = data.merchant;
      if (data.location) transaction.location = data.location;
      if (data.tags) transaction.tags = data.tags;
      if (data.debtId) transaction.debtId = data.debtId;

      // Handle nested attachments
      if (data.notes || data.receiptUrl) {
        transaction.attachments = {};
        if (data.notes) {
          transaction.attachments.notes = data.notes;
        }
        if (data.receiptUrl) {
          transaction.attachments.receipts = [data.receiptUrl];
        }
      }
      
      // Asset details
      if (data.assetDetails) {
        transaction.assetDetails = {
          symbol: data.assetDetails.symbol,
          quantity: data.assetDetails.quantity,
          currentPrice: data.assetDetails.currentPrice,
          lastPriceUpdate: data.assetDetails.lastPriceUpdate?.toDate 
            ? data.assetDetails.lastPriceUpdate.toDate() 
            : data.assetDetails.lastPriceUpdate,
        };
      }
      
      // Liability details
      if (data.liabilityDetails) {
        transaction.liabilityDetails = {
          lender: data.liabilityDetails.lender,
          interestRate: data.liabilityDetails.interestRate,
          minimumPayment: data.liabilityDetails.minimumPayment,
          dueDate: data.liabilityDetails.dueDate?.toDate 
            ? data.liabilityDetails.dueDate.toDate() 
            : data.liabilityDetails.dueDate,
        };
      }
      
      // Recurring config
      if (data.recurringConfig) {
        transaction.recurringConfig = {
          frequency: data.recurringConfig.frequency,
          endDate: data.recurringConfig.endDate?.toDate 
            ? data.recurringConfig.endDate.toDate() 
            : data.recurringConfig.endDate,
          nextDate: data.recurringConfig.nextDate?.toDate 
            ? data.recurringConfig.nextDate.toDate() 
            : data.recurringConfig.nextDate,
        };
      }
      
      transactions.push(transaction);
    });

    console.log(`Found ${transactions.length} transactions for budget calculation`);
    
    // Log transaction breakdown for debugging
    const incomeCount = transactions.filter(t => t.type === 'income').length;
    const expenseCount = transactions.filter(t => t.type === 'expense').length;
    const assetCount = transactions.filter(t => t.type === 'asset').length;
    const liabilityCount = transactions.filter(t => t.type === 'liability').length;
    
    console.log(`Transaction breakdown: ${incomeCount} income, ${expenseCount} expenses, ${assetCount} assets, ${liabilityCount} liabilities`);

    // Calculate budget data with all transactions
    return calculateBudgetData(transactions, budget);
  }

  // ============= REAL-TIME SUBSCRIPTIONS =============

  subscribeToBudgets(
    userId: string, 
    callback: (budgets: Budget[]) => void
  ): Unsubscribe {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const budgetsRef = collection(db, 'users', userId, 'budgets');
    const q = query(budgetsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const budgets: Budget[] = [];
      snapshot.forEach((doc) => {
        budgets.push(this.convertFirestoreBudget(doc));
      });
      callback(budgets);
    });
  }

  subscribeToActiveBudget(
    userId: string,
    callback: (budget: Budget | null) => void
  ): Unsubscribe {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const budgetsRef = collection(db, 'users', userId, 'budgets');
    const q = query(
      budgetsRef, 
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }
      
      const budget = this.convertFirestoreBudget(snapshot.docs[0]);
      callback(budget);
    });
  }

  // ============= USER PROFILE INTEGRATION =============

  async getUserProfile(userId: string): Promise<any> {
    const db = this.getDb();
    if (!db) throw new Error('Database not initialized');

    const userDoc = await getDoc(doc(db, 'users', userId));
    return userDoc.exists() ? userDoc.data() : null;
  }

  async initializeUserBudget(
    userId: string, 
    monthlyIncome?: number, 
    preferredMethod: BudgetMethod['type'] = '50-30-20'
  ): Promise<Budget> {
    // Check if user already has an active budget
    const existingBudget = await this.getActiveBudget(userId);
    if (existingBudget) {
      return existingBudget;
    }

    // Get user profile data from onboarding
    const userProfile = await this.getUserProfile(userId);
    
    // Use onboarding data if available, otherwise use provided income
    const income = monthlyIncome || userProfile?.monthlyIncome || 5000;
    
    // Create budget method with user's expense breakdown if available
    const method: BudgetMethod = {
      type: preferredMethod,
      allocations: {}
    };

    // If user has expense breakdown from onboarding, use it to adjust allocations
    if (userProfile?.expenseBreakdown && preferredMethod === 'custom') {
      method.allocations.categories = userProfile.expenseBreakdown;
    }

    const budget = await this.createBudget(userId, method, income);

    // Note: We don't create transactions from profile data anymore
    // Onboarding data is just estimates, not actual transactions

    return budget;
  }

  // Method removed - we don't create transactions from onboarding data anymore

  // ============= BUDGET INITIALIZATION & SETUP =============

  async setupSampleBudget(userId: string): Promise<Budget> {
    const sampleIncome = 5000;
    const method: BudgetMethod = {
      type: '50-30-20',
      allocations: {}
    };

    const budget = await this.createBudget(userId, method, sampleIncome);

    // Add some sample transactions to make the budget realistic
    await this.createSampleTransactions(userId);

    return budget;
  }

  private async createSampleTransactions(userId: string): Promise<void> {
    const db = this.getDb();
    if (!db) return;

    const sampleTransactions = [
      // Income
      { type: 'income', amount: 5000, category: 'salary', description: 'Monthly Salary', date: new Date() },
      
      // Housing (Needs)
      { type: 'expense', amount: 1200, category: 'rent', description: 'Monthly Rent', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) },
      { type: 'expense', amount: 150, category: 'electricity', description: 'Electric Bill', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) },
      { type: 'expense', amount: 80, category: 'internet', description: 'Internet Bill', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) },
      
      // Food (Needs)
      { type: 'expense', amount: 120, category: 'groceries', description: 'Weekly Groceries', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
      { type: 'expense', amount: 45, category: 'dining-out', description: 'Restaurant Dinner', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4) },
      
      // Transportation (Needs)
      { type: 'expense', amount: 60, category: 'fuel', description: 'Gas Station', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6) },
      
      // Entertainment (Wants)
      { type: 'expense', amount: 15, category: 'streaming-services', description: 'Netflix Subscription', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
      { type: 'expense', amount: 85, category: 'movies', description: 'Movie Night', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8) },
      
      // Shopping (Wants)
      { type: 'expense', amount: 200, category: 'clothing', description: 'New Clothes', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9) },
      
      // Savings
      { type: 'expense', amount: 500, category: 'emergency-fund', description: 'Emergency Fund Transfer', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10) },
      { type: 'expense', amount: 300, category: 'retirement-401k', description: '401k Contribution', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11) },
    ];

    const batch = writeBatch(db);

    sampleTransactions.forEach((transaction, index) => {
      const docRef = doc(collection(db, 'users', userId, 'transactions'));
      batch.set(docRef, {
        ...transaction,
        userId,
        date: Timestamp.fromDate(transaction.date),
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        createdBy: userId,
        currency: 'USD',
        isRecurring: false,
      });
    });

    await batch.commit();
  }

  // ============= UTILITY METHODS =============

  private convertFirestoreBudget(doc: DocumentSnapshot): Budget {
    const data = doc.data()!;
    
    return {
      id: doc.id,
      userId: data.userId,
      name: data.name,
      method: data.method,
      period: {
        ...data.period,
        startDate: data.period.startDate.toDate(),
        endDate: data.period.endDate.toDate(),
      },
      categories: data.categories || [],
      isActive: data.isActive,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  }

  private getEmptyBudgetData(): BudgetData {
    return {
      currentBudget: null,
      budgetHistory: [],
      alerts: [],
      totalIncome: 0,
      totalAllocated: 0,
      totalExpenseAllocated: 0,
      totalSavingsAllocated: 0,
      totalSpent: 0,
      totalSavings: 0,
      cashAtHand: 0,
      unallocatedAmount: 0,
      budgetHealth: {
        score: 0,
        status: 'poor',
        suggestions: ['Create your first budget to get started']
      },
      categoryPerformance: []
    };
  }

  /**
   * Remove undefined values from an object to prevent Firestore errors
   */
  private removeUndefinedValues(obj: any): any {
    const cleaned: any = {};
    
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
          // Recursively clean nested objects
          cleaned[key] = this.removeUndefinedValues(obj[key]);
        } else {
          cleaned[key] = obj[key];
        }
      }
    });
    
    return cleaned;
  }
}

// Create singleton instance
export const budgetService = new BudgetService(); 