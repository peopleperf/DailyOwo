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

    const initializeBudget = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if user has an active budget
        const activeBudget = await budgetService.getActiveBudget(user.uid);
        
        if (!activeBudget && !hasInitialized) {
          // Create a sample budget for new users
          console.log('Creating sample budget for new user...');
          await budgetService.setupSampleBudget(user.uid);
          setHasInitialized(true);
        }

        // Subscribe to budget changes
        unsubscribe = budgetService.subscribeToActiveBudget(user.uid, async (budget) => {
          if (budget) {
            try {
              const data = await budgetService.getBudgetData(user.uid, budget.id);
              setBudgetData(data);
            } catch (err) {
              console.error('Error loading budget data:', err);
              setError('Failed to load budget data');
            }
          } else {
            setBudgetData(null);
          }
          setIsLoading(false);
        });

      } catch (err) {
        console.error('Error initializing budget:', err);
        setError('Failed to initialize budget');
        setIsLoading(false);
      }
    };

    initializeBudget();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, hasInitialized]);

  return { budgetData, isLoading, error };
} 