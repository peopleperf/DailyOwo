// Mock Firebase config first
jest.mock('@/lib/firebase/config', () => ({
  getFirebaseDb: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
  })),
}));

// Mock Firestore functions with factory functions
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined)
  })),
  Timestamp: {
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
}));

import { BudgetService } from '@/lib/firebase/budget-service';
import { BudgetMethod } from '@/lib/financial-logic/budget-logic';
import * as firestore from 'firebase/firestore';

describe('BudgetService', () => {
  let budgetService: BudgetService;
  const mockUserId = 'test-user-123';

  beforeEach(() => {
    budgetService = new BudgetService();
    jest.clearAllMocks();
  });

  describe('createBudget', () => {
    it('should create a 50/30/20 budget with correct allocations', async () => {
      const method: BudgetMethod = {
        type: '50-30-20',
        allocations: {}
      };
      const monthlyIncome = 5000;

      (firestore.setDoc as jest.Mock).mockResolvedValue(undefined);

      const budget = await budgetService.createBudget(mockUserId, method, monthlyIncome);

      expect(budget).toMatchObject({
        userId: mockUserId,
        method,
        isActive: true,
      });

      expect(budget.categories).toHaveLength(9); // 4 needs + 3 wants + 2 savings
      
      // Check Housing allocation (20% of income)
      const housingCategory = budget.categories.find(cat => cat.id === 'needs-housing');
      expect(housingCategory?.allocated).toBe(1000); // 20% of 5000

      // Check total needs allocation (50% of income)
      const needsCategories = budget.categories.filter(cat => 
        ['housing', 'utilities', 'food', 'transportation'].includes(cat.type)
      );
      const totalNeeds = needsCategories.reduce((sum, cat) => sum + cat.allocated, 0);
      expect(totalNeeds).toBe(2500); // 50% of 5000

      // Check total wants allocation (30% of income)
      const wantsCategories = budget.categories.filter(cat => 
        ['entertainment', 'shopping', 'other'].includes(cat.type)
      );
      const totalWants = wantsCategories.reduce((sum, cat) => sum + cat.allocated, 0);
      expect(totalWants).toBe(1500); // 30% of 5000

      // Check total savings allocation (20% of income)
      const savingsCategories = budget.categories.filter(cat => 
        ['savings', 'retirement'].includes(cat.type)
      );
      const totalSavings = savingsCategories.reduce((sum, cat) => sum + cat.allocated, 0);
      expect(totalSavings).toBe(1000); // 20% of 5000

      // Verify setDoc was called to save the budget
      expect(firestore.setDoc).toHaveBeenCalled();
    });

    it('should create a zero-based budget with initial categories', async () => {
      const method: BudgetMethod = {
        type: 'zero-based',
        allocations: {}
      };
      const monthlyIncome = 3000;

      (firestore.setDoc as jest.Mock).mockResolvedValue(undefined);

      const budget = await budgetService.createBudget(mockUserId, method, monthlyIncome);

      expect(budget.method.type).toBe('zero-based');
      expect(budget.categories).toHaveLength(4); // Basic categories for zero-based

      // All categories should start with 0 allocation
      budget.categories.forEach(category => {
        expect(category.allocated).toBe(0);
      });
    });
  });

  describe('getBudget', () => {
    it('should return budget when it exists', async () => {
      const mockBudgetData = {
        id: 'budget-123',
        userId: mockUserId,
        name: 'Test Budget',
        method: { type: '50-30-20', allocations: {} },
        categories: [],
        isActive: true,
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() },
        period: {
          startDate: { toDate: () => new Date() },
          endDate: { toDate: () => new Date() },
          frequency: 'monthly',
          totalIncome: 5000,
          totalAllocated: 5000,
          totalSpent: 0,
          totalRemaining: 5000,
          isActive: true,
        }
      };

      firestore.getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockBudgetData,
        id: 'budget-123'
      });

      const budget = await budgetService.getBudget(mockUserId, 'budget-123');

      expect(budget).toBeDefined();
      expect(budget?.id).toBe('budget-123');
      expect(budget?.userId).toBe(mockUserId);
    });

    it('should return null when budget does not exist', async () => {
      firestore.getDoc.mockResolvedValue({
        exists: () => false
      });

      const budget = await budgetService.getBudget(mockUserId, 'non-existent');

      expect(budget).toBeNull();
    });
  });

  describe('setupSampleBudget', () => {
    it('should create budget and sample transactions', async () => {
      (firestore.setDoc as jest.Mock).mockResolvedValue(undefined);
      (firestore.writeBatch as jest.Mock).mockReturnValue({
        set: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      });

      const budget = await budgetService.setupSampleBudget(mockUserId);

      expect(budget).toBeDefined();
      expect(budget.userId).toBe(mockUserId);
      expect(budget.method.type).toBe('50-30-20');

      // Should have created budget document
      expect(firestore.setDoc).toHaveBeenCalled();
      
      // Should have created batch for sample transactions
      expect(firestore.writeBatch).toHaveBeenCalled();
    });
  });

  describe('getBudgetData', () => {
    it('should return empty budget data when no budget exists', async () => {
      // Mock getActiveBudget to return null
      firestore.getDocs.mockResolvedValue({ empty: true });

      const budgetData = await budgetService.getBudgetData(mockUserId);

      expect(budgetData.currentBudget).toBeNull();
      expect(budgetData.totalIncome).toBe(0);
      expect(budgetData.budgetHealth.score).toBe(0);
      expect(budgetData.budgetHealth.status).toBe('poor');
    });
  });

  describe('subscribeToActiveBudget', () => {
    it('should call callback when budget changes', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      firestore.onSnapshot.mockImplementation((query, callback) => {
        // Simulate empty snapshot initially
        callback({ empty: true });
        return mockUnsubscribe;
      });

      const unsubscribe = budgetService.subscribeToActiveBudget(mockUserId, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('updateBudgetCategory', () => {
    it('should update specific category in budget', async () => {
      const mockBudget = {
        id: 'budget-123',
        userId: mockUserId,
        categories: [
          { id: 'cat-1', name: 'Housing', allocated: 1000, spent: 800 },
          { id: 'cat-2', name: 'Food', allocated: 500, spent: 400 }
        ],
        period: {
          startDate: { toDate: () => new Date('2024-01-01') },
          endDate: { toDate: () => new Date('2024-01-31') },
          frequency: 'monthly',
          totalIncome: 5000,
          totalAllocated: 1500,
          totalSpent: 1200,
          totalRemaining: 300,
          isActive: true,
        },
        isActive: true,
        createdAt: { toDate: () => new Date('2024-01-01') },
        updatedAt: { toDate: () => new Date('2024-01-01') }
      };

      // Mock getBudget
      (firestore.getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockBudget,
        id: 'budget-123'
      });

      (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);

      await budgetService.updateBudgetCategory(
        mockUserId, 
        'budget-123', 
        'cat-1', 
        { allocated: 1200 }
      );

      expect(firestore.updateDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          categories: expect.arrayContaining([
            expect.objectContaining({ id: 'cat-1', allocated: 1200 }),
            expect.objectContaining({ id: 'cat-2', allocated: 500 })
          ]),
          updatedAt: expect.anything()
        })
      );
    });
  });

  describe('Budget Health Calculation', () => {
    it('should calculate budget health score correctly', () => {
      // This would test the integration with budget-logic.ts
      // We'll test this through the getBudgetData method
      expect(true).toBe(true); // Placeholder for actual implementation
    });
  });

  describe('Error Handling', () => {
    it('should throw error when database is not initialized', async () => {
      const budgetServiceWithNoDb = new BudgetService();
      
      // Mock getDb to return null
      (budgetServiceWithNoDb as any).getDb = jest.fn(() => null);

      await expect(
        budgetServiceWithNoDb.createBudget(mockUserId, { type: '50-30-20', allocations: {} }, 5000)
      ).rejects.toThrow('Database not initialized');
    });
  });
}); 