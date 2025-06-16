'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBudget } from '@/hooks/useBudget';
import { PageHeader } from '@/components/ui/PageHeader';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { BudgetOverviewTab } from '@/components/budgets/BudgetOverviewTab';
import { BudgetCategoriesTab } from '@/components/budgets/BudgetCategoriesTab';
import { BudgetInsightsTab } from '@/components/budgets/BudgetInsightsTab';
import { BudgetSettingsTab } from '@/components/budgets/BudgetSettingsTab';
import { BudgetHistoryTab } from '@/components/budgets/BudgetHistoryTab';
import { BudgetEmptyState } from '@/components/budgets/BudgetEmptyState';
import { BudgetMonthNavigator } from '@/components/budgets/BudgetMonthNavigator';
import { NewMonthBudgetModal } from '@/components/budgets/NewMonthBudgetModal';
import { Wallet, LayoutGrid, Lightbulb, Settings, BarChart } from 'lucide-react';
import { getFirebaseDb } from '@/lib/firebase/config';
import { getDoc, doc, collection, query, where, getDocs, orderBy, addDoc, Timestamp } from 'firebase/firestore';
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
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'history', label: 'History', icon: BarChart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function BudgetsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { budgetData, loading: budgetLoading, error, refetch } = useBudget();
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [budgetHistory, setBudgetHistory] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [allBudgets, setAllBudgets] = useState<Budget[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [showNewMonthModal, setShowNewMonthModal] = useState(false);

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
          const db = getFirebaseDb();
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
  }, [user, budgetData, refetch]);

  // Fetch all budgets and transactions for history
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!user?.uid) return;

      try {
        const db = getFirebaseDb();
        if (!db) return;

        // Fetch all budgets
        const budgetsRef = collection(db, 'users', user.uid, 'budgets');
        const budgetsQuery = query(budgetsRef, orderBy('createdAt', 'desc'));
        const budgetsSnapshot = await getDocs(budgetsQuery);
        
        const budgets: Budget[] = [];
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
        setAllBudgets(budgets);

        // Fetch all transactions
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        const transactionsSnapshot = await getDocs(transactionsRef);
        
        const transactions: Transaction[] = [];
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
      }
    };

    fetchHistoricalData();
  }, [user, selectedMonth]);

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

    try {
      const db = getFirebaseDb();
      if (!db) return;

      // 1. Create income transaction for this month
      const incomeTransaction = {
        type: 'income',
        amount: income,
        currency: currency,
        categoryId: 'salary',
        categoryType: 'global',
        description: `Monthly Income - ${format(selectedMonth, 'MMMM yyyy')}`,
        date: Timestamp.fromDate(startOfMonth(selectedMonth)),
        userId: user.uid,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        createdBy: user.uid,
        isRecurring: false,
      };

      await addDoc(collection(db, 'users', user.uid, 'transactions'), incomeTransaction);

      // 2. Create budget for this month
      const budgetMethod = { type: method, allocations: {} };
      const period = createBudgetPeriod('monthly', selectedMonth);
      const newBudget = createBudgetFromMethod(budgetMethod, income, period, user.uid);
      
      // Save to Firestore
      await budgetService.createBudget(user.uid, budgetMethod, income);
      
      // Refresh data
      refetch();
      
      // Reload monthly data
      const currentMonthData = getMonthlyBudgetData(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + 1,
        [...allBudgets, newBudget],
        [...allTransactions, { ...incomeTransaction, id: 'temp-' + Date.now() } as any]
      );
      setMonthlyData(currentMonthData);
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  if (!budgetData || !budgetData.currentBudget) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <PageHeader
          title="Budget"
          subtitle="Track spending and manage your financial goals"
        />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <BudgetEmptyState onBudgetCreated={refetch} />
        </div>
      </div>
    );
  }

  const currency = userProfile?.currency || 'USD';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <PageHeader
        title="Budget"
        subtitle="Track spending and manage your financial goals"
      />

      <div className="container mx-auto px-4 py-8 pb-24 max-w-7xl">
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
              budgetData={selectedMonth && monthlyData?.hasBudget ? {
                ...budgetData,
                currentBudget: monthlyData.budget,
                totalIncome: monthlyData.actualIncome,
                totalAllocated: monthlyData.totalAllocated,
                totalSpent: monthlyData.totalSpent,
              } : budgetData} 
              currency={currency} 
              onRefresh={refetch}
            />
          )}
          {activeTab === 'categories' && (
            <BudgetCategoriesTab 
              budgetData={selectedMonth && monthlyData?.hasBudget ? {
                ...budgetData,
                currentBudget: monthlyData.budget,
                totalIncome: monthlyData.actualIncome,
                totalAllocated: monthlyData.totalAllocated,
                totalSpent: monthlyData.totalSpent,
              } : budgetData} 
              currency={currency} 
              onUpdate={refetch}
            />
          )}
          {activeTab === 'insights' && (
            <BudgetInsightsTab budgetData={budgetData} currency={currency} />
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
      </div>

      {/* New Month Budget Modal */}
      <NewMonthBudgetModal
        isOpen={showNewMonthModal}
        onClose={() => setShowNewMonthModal(false)}
        currentMonth={selectedMonth}
        lastMonthIncome={monthlyData?.actualIncome || userProfile?.monthlyIncome || 0}
        currency={currency}
        onSubmit={handleNewMonthBudgetSubmit}
      />
    </div>
  );
} 