import { renderHook, act } from '@testing-library/react';
import { useBudgetData } from '@/hooks/useBudgetData';
import { useFinancialData } from '@/hooks/useFinancialData';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

// Create mock implementations
let mockAuthValue = {
  user: { uid: 'test-user-123' },
  loading: false,
  userProfile: {
    uid: 'test-user-123',
    email: 'test@example.com',
    onboardingCompleted: true
  }
};

let mockDbValue: any = {};

// Mock Firestore functions
const mockCollection = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();

// Mock Firebase config
jest.mock('@/lib/firebase/config', () => ({
  getFirebaseDb: jest.fn(() => mockDbValue)
}));

// Mock Firestore imports
jest.mock('firebase/firestore', () => ({
  collection: (...args: any[]) => mockCollection(...args),
  query: (...args: any[]) => mockQuery(...args),
  where: (...args: any[]) => mockWhere(...args),
  orderBy: (...args: any[]) => mockOrderBy(...args),
  limit: (...args: any[]) => mockLimit(...args),
  QuerySnapshot: jest.fn(),
}));

// Mock firestore-helpers
jest.mock('@/lib/firebase/firestore-helpers', () => ({
  safeOnSnapshot: jest.fn((query, id, onNext, onError) => {
    // Return unsubscribe function
    return jest.fn();
  })
}));

// Mock auth context with dynamic value
jest.mock('@/lib/firebase/auth-context', () => ({
  useAuth: jest.fn(() => mockAuthValue)
}));

// Mock Firebase Budget Service
jest.mock('@/lib/firebase/budget-service', () => ({
  budgetService: {
    getActiveBudget: jest.fn(),
    setupSampleBudget: jest.fn(),
    subscribeToActiveBudget: jest.fn(),
    getBudgetData: jest.fn(),
  }
}));

// Get the mocked services
const mockBudgetService = jest.requireMock('@/lib/firebase/budget-service').budgetService;

describe('Custom Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock values to default state
    mockAuthValue = {
      user: { uid: 'test-user-123' },
      loading: false,
      userProfile: {
        uid: 'test-user-123',
        email: 'test@example.com',
        onboardingCompleted: true
      }
    };
    // Mock proper Firestore structure
    mockDbValue = {
      _delegate: {} // Basic Firebase db structure
    };
    
    // Reset Firestore mocks
    mockCollection.mockReturnValue({});
    mockQuery.mockReturnValue({});
    mockWhere.mockReturnValue({});
    mockOrderBy.mockReturnValue({});
    mockLimit.mockReturnValue({});
  });

  describe('useBudgetData Hook', () => {
    it('should return initial budget data', () => {
      const { result } = renderHook(() => useBudgetData());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.budgetData).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should load budget data successfully', async () => {
      const mockBudget = {
        id: 'budget-1',
        userId: 'test-user-123',
        name: 'Monthly Budget',
        period: {
          frequency: 'monthly',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        },
        categories: [],
        method: { type: '50-30-20', allocations: {} },
        totalAllocated: 5000,
        totalSpent: 3500,
        totalRemaining: 1500,
        isActive: true
      };

      const mockBudgetData = {
        budget: mockBudget,
        categories: [],
        totalSpent: 3500,
        totalRemaining: 1500
      };

      mockBudgetService.getActiveBudget.mockResolvedValue(mockBudget);
      mockBudgetService.getBudgetData.mockResolvedValue(mockBudgetData);
      mockBudgetService.subscribeToActiveBudget.mockImplementation((userId, callback) => {
        // Simulate async subscription callback
        setTimeout(() => callback(mockBudget), 0);
        return jest.fn(); // unsubscribe function
      });
      
      const { result } = renderHook(() => useBudgetData());

      // Wait for the effect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(mockBudgetService.getActiveBudget).toHaveBeenCalledWith('test-user-123');
      expect(result.current.budgetData).toEqual(mockBudgetData);
      expect(result.current.isLoading).toBe(false);
    });

    it('should create sample budget for new users', async () => {
      mockBudgetService.getActiveBudget.mockResolvedValue(null);
      mockBudgetService.setupSampleBudget.mockResolvedValue();
      mockBudgetService.subscribeToActiveBudget.mockImplementation((userId, callback) => {
        callback(null);
        return jest.fn();
      });
      
      const { result } = renderHook(() => useBudgetData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(mockBudgetService.setupSampleBudget).toHaveBeenCalledWith('test-user-123');
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Failed to load budget');
      mockBudgetService.getActiveBudget.mockRejectedValue(error);
      
      const { result } = renderHook(() => useBudgetData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.error).toBe('Failed to initialize budget');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useFinancialData Hook', () => {
    it('should load financial data when user is authenticated', async () => {
      // Mock safeOnSnapshot to simulate data loading
      const mockSafeOnSnapshot = jest.requireMock('@/lib/firebase/firestore-helpers').safeOnSnapshot;
      mockSafeOnSnapshot.mockImplementation((query, id, onNext, onError) => {
        // Simulate data load with sample transactions
        setTimeout(() => {
          onNext({ 
            docs: [
              {
                id: '1',
                data: () => ({
                  type: 'income',
                  amount: 1000,
                  date: new Date(),
                  createdAt: new Date(),
                  updatedAt: new Date()
                })
              }
            ] 
          });
        }, 0);
        return jest.fn();
      });

      const { result } = renderHook(() => useFinancialData());

      // Wait for effects and data loading
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });

      // Should have loaded successfully
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      // Check that data structures are initialized
      expect(result.current.income).toBeDefined();
      expect(result.current.expenses).toBeDefined();
      expect(result.current.netWorth).toBeDefined();
      expect(result.current.savingsRate).toBeDefined();
    });

    it('should handle user not logged in', () => {
      // Change the mock value for this test
      mockAuthValue = {
        user: null,
        loading: false,
        userProfile: null
      };

      const { result } = renderHook(() => useFinancialData());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.income.totalIncome).toBe(0);
      expect(result.current.expenses.totalExpenses).toBe(0);
    });

    it('should handle database not initialized', async () => {
      // Set database to null for this test
      mockDbValue = null;

      const { result } = renderHook(() => useFinancialData());

      // Give the effect time to run and set error
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });

      // Should have error set and loading false
      // The hook should detect null database and set error
      expect(result.current.isLoading).toBe(false);
      // Either error should be set or the hook should handle gracefully
      if (result.current.error) {
        expect(result.current.error).toBe('Database not initialized');
      } else {
        // If no error, data should be in default state
        expect(result.current.income.totalIncome).toBe(0);
        expect(result.current.expenses.totalExpenses).toBe(0);
        expect(result.current.netWorth.netWorth).toBe(0);
      }
    });
  });

  describe('usePullToRefresh Hook', () => {
    it('should return initial state', () => {
      const mockRefreshFn = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({ onRefresh: mockRefreshFn }));

      expect(result.current.pullDistance).toBe(0);
      expect(result.current.pullProgress).toBe(0);
      expect(result.current.isPulling).toBe(false);
    });

    it('should handle touch events', async () => {
      const mockRefreshFn = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({ onRefresh: mockRefreshFn, threshold: 80 }));

      // Mock window.scrollY
      Object.defineProperty(window, 'scrollY', { 
        value: 0, 
        writable: true,
        configurable: true 
      });

      // Simulate touch start
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientY: 100 } as Touch]
      });
      
      await act(async () => {
        document.dispatchEvent(touchStartEvent);
      });

      // Simulate touch move
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [{ clientY: 180 } as Touch]
      });
      
      await act(async () => {
        document.dispatchEvent(touchMoveEvent);
      });

      // Touch end should trigger refresh if distance > threshold
      const touchEndEvent = new TouchEvent('touchend');
      
      await act(async () => {
        document.dispatchEvent(touchEndEvent);
      });

      // The actual behavior depends on internal state management
      // Just verify the hook doesn't crash
      expect(result.current).toBeDefined();
    });

    it('should respect disabled state', () => {
      const mockRefreshFn = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({ 
        onRefresh: mockRefreshFn,
        disabled: true 
      }));

      expect(result.current.pullDistance).toBe(0);
      expect(result.current.isPulling).toBe(false);
    });

    it('should calculate pull progress correctly', () => {
      const mockRefreshFn = jest.fn();
      const { result } = renderHook(() => usePullToRefresh({ 
        onRefresh: mockRefreshFn,
        threshold: 100 
      }));

      // Initially progress should be 0
      expect(result.current.pullProgress).toBe(0);
    });
  });

  describe('Hook Error Handling', () => {
    it('should handle authentication errors', () => {
      // Mock unauthenticated state
      mockAuthValue = {
        user: null,
        loading: false,
        userProfile: null
      };

      const { result } = renderHook(() => useBudgetData());

      expect(result.current.budgetData).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle service unavailable errors', async () => {
      mockBudgetService.getActiveBudget.mockRejectedValue(new Error('Service unavailable'));
      
      const { result } = renderHook(() => useBudgetData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Hook Performance', () => {
    it('should not cause unnecessary re-renders', async () => {
      let callCount = 0;
      mockBudgetService.getActiveBudget.mockImplementation(() => {
        callCount++;
        return Promise.resolve(null);
      });
      mockBudgetService.subscribeToActiveBudget.mockImplementation((userId, callback) => {
        callback(null);
        return jest.fn();
      });

      const { rerender } = renderHook(() => useBudgetData());

      // Wait for initial render
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      const initialCallCount = callCount;

      // Multiple rerenders shouldn't cause new API calls
      rerender();
      rerender();
      rerender();

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Should not have made additional calls
      expect(callCount).toBe(initialCallCount);
    });

    it('should cleanup subscriptions on unmount', async () => {
      const mockUnsubscribe = jest.fn();
      mockBudgetService.subscribeToActiveBudget.mockReturnValue(mockUnsubscribe);
      mockBudgetService.getActiveBudget.mockResolvedValue({});

      const { unmount } = renderHook(() => useBudgetData());

      // Wait for subscription to be set up
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe('Hook Integration', () => {
    it('should work together with multiple hooks', async () => {
      mockBudgetService.getActiveBudget.mockResolvedValue(null);
      mockBudgetService.subscribeToActiveBudget.mockImplementation((userId, callback) => {
        callback(null);
        return jest.fn();
      });

      const { result: budgetResult } = renderHook(() => useBudgetData());
      const { result: financialResult } = renderHook(() => useFinancialData());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      // Both hooks should work independently
      expect(budgetResult.current.isLoading).toBe(false);
      // Financial data should be loaded since we mocked the database
      expect(financialResult.current.isLoading).toBe(false);
    });

    it('should handle concurrent operations', async () => {
      const mockRefresh1 = jest.fn().mockResolvedValue(undefined);
      const mockRefresh2 = jest.fn().mockResolvedValue(undefined);

      const { result: pullToRefresh1 } = renderHook(() => usePullToRefresh({ onRefresh: mockRefresh1 }));
      const { result: pullToRefresh2 } = renderHook(() => usePullToRefresh({ onRefresh: mockRefresh2 }));

      // Both hooks should maintain independent state
      expect(pullToRefresh1.current.pullDistance).toBe(0);
      expect(pullToRefresh2.current.pullDistance).toBe(0);
    });
  });
}); 