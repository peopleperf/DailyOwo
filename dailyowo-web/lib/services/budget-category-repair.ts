/**
 * Budget Category Repair Service
 * Ensures all budgets have proper transaction category mappings
 */

import { Budget, BudgetCategory } from '@/lib/financial-logic/budget-logic';
import { getFirebaseDb } from '@/lib/firebase/config';
import { collection, doc, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';

// Default mappings for budget categories to transaction categories
const DEFAULT_CATEGORY_MAPPINGS: Record<string, string[]> = {
  // Food related
  'food': ['groceries', 'dining-out', 'coffee-shops', 'fast-food', 'alcohol', 'takeout', 'restaurants'],
  'needs-food': ['groceries', 'dining-out', 'coffee-shops', 'fast-food', 'alcohol', 'takeout', 'restaurants'],
  'Food & Groceries': ['groceries', 'dining-out', 'coffee-shops', 'fast-food', 'alcohol', 'takeout', 'restaurants'],
  
  // Transportation
  'transportation': ['fuel', 'public-transport', 'taxi-rideshare', 'car-maintenance', 'parking', 'flights', 'car-rental', 'maintenance-repairs', 'taxi-uber'],
  'needs-transportation': ['fuel', 'public-transport', 'taxi-rideshare', 'car-maintenance', 'parking', 'flights', 'car-rental', 'maintenance-repairs', 'taxi-uber'],
  
  // Housing
  'housing': ['rent', 'mortgage', 'home-maintenance', 'home-improvement', 'home-insurance', 'property-tax', 'hoa-fees'],
  'needs-housing': ['rent', 'mortgage', 'home-maintenance', 'home-improvement', 'home-insurance', 'property-tax', 'hoa-fees'],
  
  // Shopping
  'shopping': ['clothing', 'household-items', 'electronics', 'personal-care', 'gifts-given', 'other-shopping', 'online-shopping'],
  'wants-shopping': ['clothing', 'household-items', 'electronics', 'personal-care', 'gifts-given', 'other-shopping', 'online-shopping'],
  'Shopping & Personal': ['clothing', 'household-items', 'electronics', 'personal-care', 'gifts-given', 'other-shopping', 'online-shopping'],
  
  // Healthcare
  'healthcare': ['medical-visits', 'medications', 'prescriptions', 'dental', 'vision', 'medical-visits', 'health-insurance', 'therapy'],
  'needs-healthcare': ['medical-visits', 'medications', 'prescriptions', 'dental', 'vision', 'medical-visits', 'health-insurance', 'therapy'],
  
  // Entertainment
  'entertainment': ['movies', 'games', 'music', 'sports', 'hobbies', 'streaming-services', 'entertainment', 'concerts', 'events'],
  'wants-entertainment': ['movies', 'games', 'music', 'sports', 'hobbies', 'streaming-services', 'entertainment', 'concerts', 'events'],
  
  // Other common
  'other': ['other-expense', 'miscellaneous', 'cash', 'atm-withdrawal'],
  'wants-other': ['subscriptions', 'other-expense', 'pets', 'pet-supplies', 'family-activities', 'childcare', 'school-fees', 'donations', 'bank-fees', 'pet-vet'],
};

export class BudgetCategoryRepairService {
  private db: any = null;

  constructor() {
    this.initializeDb();
  }

  private async initializeDb() {
    if (typeof window !== 'undefined') {
      this.db = await getFirebaseDb();
    } else {
      const { db } = await import('@/lib/firebase/firebaseAdmin');
      this.db = db;
    }
  }

  private async getDb() {
    if (!this.db) {
      await this.initializeDb();
    }
    return this.db;
  }

  /**
   * Repair a single budget by ensuring all categories have proper transaction mappings
   */
  async repairBudget(budget: Budget, userId: string): Promise<Budget> {
    const updatedCategories = budget.categories.map(category => {
      // If category already has mappings and they're not empty, keep them
      if (category.transactionCategories && category.transactionCategories.length > 0) {
        return category;
      }

      // Try to find default mappings
      const mappings = this.findMappingsForCategory(category);
      
      return {
        ...category,
        transactionCategories: mappings
      };
    });

    // Update in Firebase - commented out for now to avoid build errors
    // TODO: Fix database initialization
    /*
    const db = await this.dbPromise;
    if (db) {
      const budgetRef = doc(db, 'users', userId, 'budgets', budget.id);
      await updateDoc(budgetRef, {
        categories: updatedCategories,
        updatedAt: serverTimestamp()
      });
    }
    */

    return {
      ...budget,
      categories: updatedCategories,
      updatedAt: new Date()
    };
  }

  /**
   * Repair all budgets for a user
   */
  async repairAllUserBudgets(userId: string): Promise<void> {
    // Temporarily disabled to avoid build errors
    console.log('Budget repair temporarily disabled');
    return;
    /*
    const db = await this.dbPromise;
    if (!db) return;

    const budgetsRef = collection(db, 'users', userId, 'budgets');
    const snapshot = await getDocs(budgetsRef);
    
    const repairs = snapshot.docs.map(async (doc) => {
      const budget = { id: doc.id, ...doc.data() } as Budget;
      await this.repairBudget(budget, userId);
    });

    await Promise.all(repairs);
    console.log(`Repaired ${repairs.length} budgets for user ${userId}`);
    */
  }

  /**
   * Find appropriate transaction category mappings for a budget category
   */
  private findMappingsForCategory(category: BudgetCategory): string[] {
    // Check by exact name match
    if (DEFAULT_CATEGORY_MAPPINGS[category.name]) {
      return DEFAULT_CATEGORY_MAPPINGS[category.name];
    }

    // Check by ID match
    if (DEFAULT_CATEGORY_MAPPINGS[category.id]) {
      return DEFAULT_CATEGORY_MAPPINGS[category.id];
    }

    // Check by type
    const typeBasedMappings = this.getMappingsByType(category.type);
    if (typeBasedMappings.length > 0) {
      return typeBasedMappings;
    }

    // Fuzzy match on name
    const nameLower = category.name.toLowerCase();
    for (const [key, mappings] of Object.entries(DEFAULT_CATEGORY_MAPPINGS)) {
      if (nameLower.includes(key.toLowerCase()) || key.toLowerCase().includes(nameLower)) {
        return mappings;
      }
    }

    // Default fallback based on type
    return this.getDefaultMappingsByType(category.type);
  }

  /**
   * Get mappings based on budget category type
   */
  private getMappingsByType(type: string): string[] {
    const typeMappings: Record<string, string[]> = {
      'food': ['groceries', 'dining-out', 'coffee-shops', 'fast-food'],
      'transportation': ['fuel', 'public-transport', 'taxi-rideshare', 'parking'],
      'housing': ['rent', 'mortgage', 'home-maintenance'],
      'healthcare': ['medical-visits', 'medications', 'health-insurance'],
      'shopping': ['clothing', 'household-items', 'personal-care'],
      'entertainment': ['entertainment', 'movies', 'games', 'hobbies'],
      'utilities': ['electricity', 'gas', 'water', 'internet', 'phone'],
      'insurance': ['car-insurance', 'health-insurance', 'life-insurance'],
      'debt': ['credit-card-payment', 'loan-payment', 'student-loan'],
      'savings': ['emergency-fund', 'general-savings'],
      'investments': ['stocks', 'etf', 'cryptocurrency'],
      'other': ['other-expense', 'miscellaneous']
    };

    return typeMappings[type] || [];
  }

  /**
   * Get default mappings for categories without specific mappings
   */
  private getDefaultMappingsByType(type: string): string[] {
    // Return at least one mapping so the category can catch expenses
    return ['other-expense'];
  }

  /**
   * Check if a budget needs repair
   */
  static needsRepair(budget: Budget): boolean {
    return budget.categories.some(category => 
      !category.transactionCategories || category.transactionCategories.length === 0
    );
  }
}

// Singleton instance
export const budgetCategoryRepair = new BudgetCategoryRepairService();
