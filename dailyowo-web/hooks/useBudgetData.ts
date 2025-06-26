'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { budgetService } from '@/lib/firebase/budget-service';
import { 
  BudgetData as CoreBudgetData,
  Budget as CoreBudget,
  BudgetMethod as CoreBudgetMethod
} from '@/lib/financial-logic/budget-logic';

export function useBudgetData(): {
  budgetData: CoreBudgetData | null;
  isLoading: boolean;
  error: string | null;
} {
  const { user } = useAuth();
  const [budgetData, setBudgetData] = useState<CoreBudgetData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let isMounted = true; // Track if component is still mounted

    const initializeBudget = async () => {
      try {
        if (!isMounted) return; // Prevent state updates if unmounted
        
        setIsLoading(true);
        setError(null);

        // Check if user has an active budget
        const activeBudget = await budgetService.getActiveBudget(user.uid);
        
        if (!isMounted) return; // Check again after async operation
        
        if (!activeBudget && !hasInitialized) {
          // Create a sample budget for new users
          console.log('Creating sample budget for new user...');
          await budgetService.setupSampleBudget(user.uid);
          if (isMounted) {
            setHasInitialized(true);
          }
        }

        if (!isMounted) return; // Final check before subscription

        // Subscribe to budget changes
        const subscription = await budgetService.subscribeToActiveBudget(user.uid, async (budget) => {
          if (!isMounted) return; // Prevent updates if unmounted
          
          console.log('🔔 Budget subscription triggered with budget:', budget?.id);
          
          if (budget) {
            try {
              console.log('🔄 Calling getBudgetData...');
              const data = await budgetService.getBudgetData(user.uid, budget.id);
              console.log('📊 useBudgetData hook received data from service:', {
                totalIncome: data?.totalIncome,
                totalSpent: data?.totalSpent,
                totalAllocated: data?.totalAllocated,
                cashAtHand: data?.cashAtHand
              });
              if (isMounted) {
                console.log('✅ Setting budget data to state');
                setBudgetData(data);
              }
            } catch (err) {
              console.error('Error loading budget data:', err);
              if (isMounted) {
                setError('Failed to load budget data');
              }
            }
          } else {
            console.log('❌ No budget found, setting null');
            if (isMounted) {
              setBudgetData(null);
            }
          }
          if (isMounted) {
            setIsLoading(false);
          }
        });
        
        if (isMounted) {
          unsubscribe = subscription;
        } else {
          // If component unmounted during setup, clean up immediately
          subscription();
        }

      } catch (err) {
        console.error('Error initializing budget:', err);
        if (isMounted) {
          setError('Failed to initialize budget');
          setIsLoading(false);
        }
      }
    };

    initializeBudget();

    return () => {
      isMounted = false; // Mark component as unmounted
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error cleaning up budget subscription:', error);
        }
      }
    };
  }, [user, hasInitialized]);

  return { budgetData, isLoading, error };
}
