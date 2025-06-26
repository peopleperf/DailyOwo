'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { calculateBudgetData, Budget, BudgetCategory } from '@/lib/financial-logic/budget-logic';
import { formatCurrency } from '@/lib/utils/format';
import { getFirebaseDb } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { Transaction } from '@/types/transaction';
import CircularProgress from '@/components/ui/CircularProgress';
import { motion } from 'framer-motion';
import { PiggyBank, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

export function BudgetSummary() {
  const { user, userProfile } = useAuth();
  const [budgetData, setBudgetData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBudgetData = async () => {
      if (!user?.uid || !userProfile) return;

      try {
        const db = await getFirebaseDb();
        if (!db) return;

        // Fetch current budget
        const budgetsRef = collection(db, 'users', user.uid, 'budgets');
        const budgetQuery = query(budgetsRef, where('isActive', '==', true), limit(1));
        const budgetSnapshot = await getDocs(budgetQuery);
        
        if (budgetSnapshot.empty) {
          setIsLoading(false);
          return;
        }

        const budgetDoc = budgetSnapshot.docs[0];
        const budgetData = budgetDoc.data();
        
        // Convert Firestore timestamps to Date objects
        // Handle different date formats from Firestore
        let startDate: Date;
        let endDate: Date;
        
        if (budgetData.period?.startDate) {
          const start = budgetData.period.startDate;
          startDate = start.toDate ? start.toDate() : new Date(start);
        } else {
          startDate = new Date();
        }
        
        if (budgetData.period?.endDate) {
          const end = budgetData.period.endDate;
          endDate = end.toDate ? end.toDate() : new Date(end);
        } else {
          endDate = new Date();
        }
        
        const budget: Budget = {
          id: budgetDoc.id,
          ...budgetData,
          period: {
            ...budgetData.period,
            startDate,
            endDate
          }
        } as Budget;

        // Fetch transactions for the current period
        const transactionsRef = collection(db, 'users', user.uid, 'transactions');
        const transactionQuery = query(
          transactionsRef,
          where('date', '>=', startDate),
          where('date', '<=', endDate),
          orderBy('date', 'desc')
        );
        const transactionSnapshot = await getDocs(transactionQuery);
        
        const transactions: Transaction[] = transactionSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];

        // Calculate budget data
        const data = calculateBudgetData(transactions, budget);
        setBudgetData(data);
      } catch (error) {
        console.error('Error fetching budget data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBudgetData();
  }, [user, userProfile]);

  if (isLoading) {
    return (
      <GlassContainer className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </GlassContainer>
    );
  }

  if (!budgetData?.currentBudget) {
    return (
      <GlassContainer className="p-6">
        <div className="text-center py-8">
          <PiggyBank className="w-16 h-16 text-primary/20 mx-auto mb-4" />
          <p className="text-primary/60 font-light mb-4">You haven't created a budget yet.</p>
          <a href="/budgets" className="text-gold hover:text-gold-dark transition-colors text-sm">
            Create a Budget →
          </a>
        </div>
      </GlassContainer>
    );
  }

  const { currentBudget, totalIncome, totalAllocated, totalSpent, unallocatedAmount, budgetHealth } = budgetData;
  const currency = userProfile?.currency || 'USD';
  const allocationPercentage = totalIncome > 0 ? (totalAllocated / totalIncome) * 100 : 0;
  const spentPercentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  // Get top spending categories
  const topCategories = currentBudget.categories
    .filter((cat: BudgetCategory) => cat.spent > 0)
    .sort((a: BudgetCategory, b: BudgetCategory) => b.spent - a.spent)
    .slice(0, 4) || [];

  return (
    <GlassContainer className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-light tracking-wide uppercase text-primary/60">Budget Summary</h3>
        <a href="/budgets" className="text-xs text-gold hover:text-gold-dark transition-colors">
          View Details →
        </a>
      </div>

      {/* Budget Health Score */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <CircularProgress 
            percentage={budgetHealth.score}
            size={50}
            strokeWidth={5}
          />
          <div className="flex-1">
            <p className="text-xs text-primary/60">Budget Health</p>
            <p className={`text-sm font-medium ${
              budgetHealth.status === 'excellent' ? 'text-green-600' :
              budgetHealth.status === 'good' ? 'text-blue-600' :
              budgetHealth.status === 'fair' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {budgetHealth.score}% - {budgetHealth.status.charAt(0).toUpperCase() + budgetHealth.status.slice(1)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="space-y-1">
          <p className="text-xs text-primary/60">Allocated</p>
          <p className="text-sm font-medium text-primary">
            {formatCurrency(totalAllocated, { currency, locale: 'en-US', compact: true })}
          </p>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div 
              className="bg-gold h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(allocationPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-primary/40">{allocationPercentage.toFixed(0)}% of income</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-primary/60">Spent</p>
          <p className="text-sm font-medium text-primary">
            {formatCurrency(totalSpent, { currency, locale: 'en-US', compact: true })}
          </p>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                spentPercentage > 100 ? 'bg-red-500' : 
                spentPercentage > 80 ? 'bg-yellow-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-primary/40">{spentPercentage.toFixed(0)}% of budget</p>
        </div>
      </div>

      {/* Unallocated Amount */}
      {unallocatedAmount > 0 && (
        <div className="mb-6 p-3 bg-amber-50 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-amber-800">
              {formatCurrency(unallocatedAmount, { currency, locale: 'en-US' })} unallocated
            </p>
            <p className="text-xs text-amber-700 mt-1">Consider allocating these funds to your goals or savings.</p>
          </div>
        </div>
      )}

      {/* Top Spending Categories */}
      {topCategories.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-primary/60 mb-3">Top Spending Categories</h4>
          <div className="space-y-2">
            {topCategories.map((category: BudgetCategory) => {
              const utilization = (category.spent / category.allocated) * 100;
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      category.isOverBudget ? 'bg-red-500' : 
                      utilization > 80 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`} />
                    <span className="text-xs text-primary/80">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {category.isOverBudget ? (
                      <TrendingUp className="w-3 h-3 text-red-500" />
                    ) : utilization > 80 ? (
                      <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-green-500" />
                    )}
                    <span className="text-xs font-medium text-primary">
                      {formatCurrency(category.spent, { currency, locale: 'en-US' })} / {formatCurrency(category.allocated, { currency, locale: 'en-US' })}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Budget Suggestions */}
      {budgetHealth.suggestions.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-primary/60 mb-2">Suggestions</p>
          <ul className="space-y-1">
            {budgetHealth.suggestions.slice(0, 2).map((suggestion: string, index: number) => (
              <li key={index} className="text-xs text-primary/80 flex items-start gap-2">
                <span className="text-gold">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </GlassContainer>
  );
} 