'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBudgetData } from '@/hooks/useBudgetData';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BudgetOverviewTab } from '@/components/budgets/BudgetOverviewTab';
import { BudgetCategoriesTab } from '@/components/budgets/BudgetCategoriesTab';
import { BudgetSettingsTab } from '@/components/budgets/BudgetSettingsTab';
import { BudgetHistoryTab } from '@/components/budgets/BudgetHistoryTab';
import { BudgetEmptyState } from '@/components/budgets/BudgetEmptyState';
import { BudgetMonthNavigator } from '@/components/budgets/BudgetMonthNavigator';
import { NewMonthBudgetModal } from '@/components/budgets/NewMonthBudgetModal';
import { Wallet, LayoutGrid, Settings, BarChart } from 'lucide-react';
import { getFirebaseDb } from '@/lib/firebase/config';
import { getDoc, doc, collection, query, where, getDocs, orderBy, addDoc, Timestamp, limit } from 'firebase/firestore';
import { budgetService } from '@/lib/firebase/budget-service';
import { 
  getMonthlyBudgetData, 
  getBudgetHistory, 
  getBudgetRecommendations,
  createMonthlyBudget 
} from '@/lib/financial-logic/budget-period-logic';
import { subMonths, startOfMonth, format } from 'date-fns';
import { Transaction } from '@/types/transaction';
import { Budget, createBudgetPeriod, createBudgetFromMethod } from '@/lib/financial-logic/budget-logic';

const tabs = [
  { id: 'overview', label: 'Overview', icon: Wallet },
  { id: 'categories', label: 'Categories', icon: LayoutGrid },
  { id: 'history', label: 'History', icon: BarChart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function BudgetsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { budgetData, isLoading: budgetLoading, error } = useBudgetData();
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [budgetHistory, setBudgetHistory] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [allBudgets, setAllBudgets] = useState<Budget[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [showNewMonthModal, setShowNewMonthModal] = useState(false);
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Create a refetch function to force data refresh
  const refetch = () => {
    setDataCache(prev => ({ ...prev, lastFetched: null }));
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    // Get user profile for currency and other data
    const fetchUserProfile = async () => {
      if (user?.uid) {
        try {
          const db = await getFirebaseDb();
          if (!db) return;
          
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserProfile(userData);
            
            // If no budget exists, create one using profile data
            if (!budgetData?.currentBudget && userData.monthlyIncome) {
              console.log('Creating budget with profile income:', userData.monthlyIncome);
              await budgetService.initializeUserBudget(
                user.uid,
                userData.monthlyIncome,
                '50-30-20'
              );
              // Refresh budget data
              refetch();
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user, budgetData]);

  // Cache for historical data to avoid repeated fetches
  const [dataCache, setDataCache] = useState<{
    budgets: Budget[];
    transactions: Transaction[];
    lastFetched: Date | null;
  }>({
    budgets: [],
    transactions: [],
    lastFetched: null
  });

  // Fetch historical data with caching and pagination
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!user?.uid) return;

      try {
        const db = await getFirebaseDb();
        if (!db) return;

        // Check if we need to refetch data (cache for 5 minutes)
        const shouldRefetch = !dataCache.lastFetched || 
          (new Date().getTime() - dataCache.lastFetched.getTime()) > 5 * 60 * 1000;

        let budgets = dataCache.budgets;
        let transactions = dataCache.transactions;

        if (shouldRefetch) {
          // Fetch budgets (these are typically fewer, so get all)
          const budgetsRef = collection(db, 'users', user.uid, 'budgets');
          const budgetsQuery = query(
            budgetsRef, 
            orderBy('createdAt', 'desc'),
            limit(50) // Reasonable limit for budgets
          );
          const budgetsSnapshot = await getDocs(budgetsQuery);
          
          budgets = [];
          budgetsSnapshot.forEach((doc) => {
            const data = doc.data();
            budgets.push({
              id: doc.id,
              ...data,
              period: {
                ...data.period,
                startDate: data.period.startDate.toDate(),
                endDate: data.period.endDate.toDate(),
              },
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate(),
            } as Budget);
          });

          // Fetch transactions with date filtering (last 18 months for history)
          const historyStartDate = subMonths(new Date(), 18);
          const transactionsRef = collection(db, 'users', user.uid, 'transactions');
          const transactionsQuery = query(
            transactionsRef,
            where('date', '>=', Timestamp.fromDate(historyStartDate)),
            where('deleted', '!=', true),
            orderBy('deleted'),
            orderBy('date', 'desc'),
            limit(1000) // Reasonable limit for transactions
          );
          const transactionsSnapshot = await getDocs(transactionsQuery);
          
          transactions = [];
          transactionsSnapshot.forEach((doc) => {
            const data = doc.data();
            transactions.push({
              id: doc.id,
              ...data,
              date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
            } as Transaction);
          });

          // Update cache
          setDataCache({
            budgets,
            transactions,
            lastFetched: new Date()
          });

          console.log(`[Budget] Fetched ${budgets.length} budgets and ${transactions.length} transactions (cached)`);
        }

        setAllBudgets(budgets);
        setAllTransactions(transactions);

        // Calculate budget history
        const historyStartDate = subMonths(new Date(), 11); // Last 12 months
        const history = getBudgetHistory(historyStartDate, new Date(), budgets, transactions);
        setBudgetHistory(history);

        // Get current month data
        const currentMonthData = getMonthlyBudgetData(
          selectedMonth.getFullYear(),
          selectedMonth.getMonth() + 1,
          budgets,
          transactions
        );
        setMonthlyData(currentMonthData);

        // Get recommendations
        const currentMonthIncome = transactions
          .filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'income' && 
              tDate.getMonth() === selectedMonth.getMonth() &&
              tDate.getFullYear() === selectedMonth.getFullYear();
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const recs = getBudgetRecommendations(history, currentMonthIncome);
        setRecommendations(recs);
      } catch (error) {
        console.error('Error fetching historical data:', error);
        // Don't clear existing data on error, just log it
      }
    };

    fetchHistoricalData();
  }, [user, refreshTrigger]); // Add refreshTrigger to force refetch

  // Separate effect for month-specific calculations (no API calls)
  useEffect(() => {
    if (dataCache.budgets.length > 0 && dataCache.transactions.length > 0) {
      // Recalculate monthly data when month changes
      const currentMonthData = getMonthlyBudgetData(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        dataCache.budgets,
        dataCache.transactions
      );
      setMonthlyData(currentMonthData);

      // Recalculate recommendations
      const currentMonthIncome = dataCache.transactions
        .filter(t => {
          const tDate = new Date(t.date);
          return t.type === 'income' && 
            tDate.getMonth() === selectedMonth.getMonth() &&
            tDate.getFullYear() === selectedMonth.getFullYear();
        })
        .reduce((sum, t) => sum + t.amount, 0);

      if (budgetHistory) {
        const recs = getBudgetRecommendations(budgetHistory, currentMonthIncome);
        setRecommendations(recs);
      }
    }
  }, [selectedMonth, dataCache.budgets, dataCache.transactions, budgetHistory]);

  if (authLoading || budgetLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassContainer className="p-8 text-center">
          <p className="text-red-500 mb-4">Error loading budget data</p>
          <p className="text-sm text-primary/60">{error}</p>
        </GlassContainer>
      </div>
    );
  }

  const handleMonthChange = (date: Date) => {
    setSelectedMonth(date);
  };

  const handleCreateBudget = () => {
    setShowNewMonthModal(true);
  };

  const handleNewMonthBudgetSubmit = async (income: number, method: 'zero-based' | '50-30-20' | 'custom') => {
    if (!user?.uid) return;

    setIsCreatingBudget(true);
    setBudgetError(null);

    try {
      // Import transaction service to use proper creation flow
      const { createTransaction } = await import('@/services/transaction-service');

      // 1. Create income transaction using proper service (includes validation, audit, budget integration)
      const transactionData = {
        type: 'income' as const,
        amount: income,
        currency: currency,
        categoryId: 'salary',
        categoryType: 'global' as const,
        description: `Monthly Income - ${format(selectedMonth, 'MMMM yyyy')}`,
        date: startOfMonth(selectedMonth),
        isRecurring: false,
        userId: user.uid,
        createdBy: user.uid,
      };

      const transactionId = await createTransaction(transactionData);
      
      if (!transactionId) {
        throw new Error('Failed to create income transaction');
      }

      // 2. Create budget for this month
      const budgetMethod = { type: method, allocations: {} };
      const newBudget = await budgetService.createBudget(user.uid, budgetMethod, income);
      
      // 3. Refresh data and clear cache to get updated data
      refetch();
      
      // 4. Update local state optimistically
      const period = createBudgetPeriod('monthly', selectedMonth);
      const optimisticBudget = createBudgetFromMethod(budgetMethod, income, period, user.uid);
      const optimisticTransaction = {
        id: transactionId,
        ...transactionData,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.uid,
      };

      // Update local data immediately for better UX
      setAllBudgets(prev => [optimisticBudget, ...prev]);
      setAllTransactions(prev => [optimisticTransaction as any, ...prev]);
      
      const currentMonthData = getMonthlyBudgetData(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        [optimisticBudget, ...allBudgets],
        [optimisticTransaction as any, ...allTransactions]
      );
      setMonthlyData(currentMonthData);

      console.log(`[Budget] Successfully created budget and income transaction for ${format(selectedMonth, 'MMMM yyyy')}`);
      
      // Close modal on success
      setShowNewMonthModal(false);
      
    } catch (error: any) {
      console.error('Error creating budget:', error);
      setBudgetError(
        error.message || 'Failed to create budget. Please try again.'
      );
      
      // Show user-friendly error message
      if (error.message?.includes('Validation failed')) {
        setBudgetError('Please check your income amount and try again.');
      } else if (error.message?.includes('Not authenticated')) {
        setBudgetError('Please log in again to create a budget.');
      } else if (error.message?.includes('duplicate')) {
        setBudgetError('A budget for this month already exists.');
      } else {
        setBudgetError('Unable to create budget. Please check your connection and try again.');
      }
    } finally {
      setIsCreatingBudget(false);
    }
  };

  if (!budgetData || !budgetData.currentBudget) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Budget</h1>
            <p className="text-gray-600 mt-1">Track spending and manage your financial goals</p>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <BudgetEmptyState onBudgetCreated={refetch} />
        </div>
      </div>
    );
  }

  const currency = userProfile?.currency || 'USD';

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/30 to-white" />
        <div className="absolute top-0 -left-32 w-[500px] h-[500px] bg-gold/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] bg-primary/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <Container size="lg" className="py-8 md:py-12 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-primary mb-2">Budget</h1>
          <p className="text-primary/60 font-light">Track spending and manage your financial goals</p>
        </div>
        {/* Month Navigator */}
        <BudgetMonthNavigator
          currentMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          monthlyData={monthlyData}
          currency={currency}
          onCreateBudget={handleCreateBudget}
        />

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-1 py-4 border-b-2 transition-all ${
                      activeTab === tab.id
                        ? 'border-gold text-gold'
                        : 'border-transparent text-primary/60 hover:text-primary hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <BudgetOverviewTab 
              budgetData={budgetData} 
              currency={currency} 
              onRefresh={refetch}
            />
          )}
          {activeTab === 'categories' && (
            <BudgetCategoriesTab 
              budgetData={budgetData} 
              currency={currency} 
              onUpdate={refetch}
            />
          )}
          {activeTab === 'history' && budgetHistory && (
            <BudgetHistoryTab 
              history={budgetHistory} 
              currency={currency}
              recommendations={recommendations}
            />
          )}
          {activeTab === 'settings' && (
            <BudgetSettingsTab budgetData={budgetData} onUpdate={refetch} />
          )}
        </motion.div>
      </Container>

      {/* New Month Budget Modal */}
      <NewMonthBudgetModal
        isOpen={showNewMonthModal}
        onClose={() => {
          setShowNewMonthModal(false);
          setBudgetError(null); // Clear error when closing
        }}
        currentMonth={selectedMonth}
        lastMonthIncome={monthlyData?.actualIncome || userProfile?.monthlyIncome || 0}
        currency={currency}
        onSubmit={handleNewMonthBudgetSubmit}
        isLoading={isCreatingBudget}
        error={budgetError}
      />
    </div>
  );
}