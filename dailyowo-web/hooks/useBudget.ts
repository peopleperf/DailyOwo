import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { budgetService } from '@/lib/firebase/budget-service';
import { BudgetData } from '@/lib/financial-logic/budget-logic';

interface UseBudgetReturn {
  budgetData: BudgetData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useBudget(): UseBudgetReturn {
  const { user } = useAuth();
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgetData = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await budgetService.getBudgetData(user.uid);
      setBudgetData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching budget data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch budget data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, [user?.uid]);

  return {
    budgetData,
    loading,
    error,
    refetch: fetchBudgetData,
  };
} 