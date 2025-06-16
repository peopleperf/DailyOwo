'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/lib/firebase/auth-context';
import { formatCurrency } from '@/lib/utils/format';
import { fadeInUp } from '@/lib/utils/animations';
import { getFirebaseDb } from '@/lib/firebase/config';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, Timestamp, where, limit, getDocs } from 'firebase/firestore';
import { TransactionDetailModal } from '@/components/transactions/TransactionDetailModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { 
  Search, Filter, Calendar, Tag, ArrowUpDown, Plus,
  Edit2, Trash2, ChevronDown, X, TrendingUp, TrendingDown,
  Briefcase, ShoppingCart, Home, Car, Heart, Tv,
  Coffee, Plane, Book, Dumbbell, Music, Gift, DollarSign,
  CreditCard, Wallet, Building, Camera, CheckSquare, Square,
  MousePointer, AlertCircle
} from 'lucide-react';
import { TRANSACTION_CATEGORIES, getCategoryById } from '@/lib/constants/transaction-categories';
import { useToast } from '@/hooks/useToast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'asset' | 'liability';
  amount: number;
  category: string;
  categoryIcon: any;
  categoryColor: string;
  categoryName: string;
  description: string;
  date: Date;
  recurring?: string;
  receiptUrl?: string;
  createdAt?: Date;
  currency?: string;
  // User tracking for family/partner scenarios
  createdBy?: string;
  createdByName?: string;
  createdByEmail?: string;
  // Budget tracking
  budgetCategory?: string;
  isOverBudget?: boolean;
  budgetUtilization?: number;
}

// Get category info using our comprehensive categories
const getCategoryInfo = (categoryId: string) => {
  const category = getCategoryById(categoryId);
  if (category) {
    return {
      icon: category.icon,
      color: category.color,
      name: category.name,
      budgetCategory: category.budgetCategory
    };
  }
  
  // Fallback for unknown categories
  return {
    icon: Tag,
    color: 'text-gray-600',
    name: 'Other',
    budgetCategory: 'other'
  };
};

const sortOptions = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'amount-desc', label: 'Highest Amount' },
  { value: 'amount-asc', label: 'Lowest Amount' },
  { value: 'category', label: 'Category' },
];

export default function TransactionsPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const t = useTranslations('transactions');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'asset' | 'liability'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('date-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [displayCount, setDisplayCount] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Bulk selection states
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  const { toast } = useToast();
  
  // Current budget data for checking over budget status
  const [currentBudget, setCurrentBudget] = useState<any>(null);

  // Load current budget for expense checking
  useEffect(() => {
    const loadBudget = async () => {
      if (!user) return;
      
      try {
        const db = getFirebaseDb();
        if (!db) return;
        
        const budgetsRef = collection(db, 'users', user.uid, 'budgets');
        const budgetQuery = query(budgetsRef, where('isActive', '==', true), limit(1));
        const budgetSnapshot = await getDocs(budgetQuery);
        
        if (!budgetSnapshot.empty) {
          const budgetDoc = budgetSnapshot.docs[0];
          const budgetData = budgetDoc.data();
          
          // Convert timestamps
          if (budgetData.period?.startDate) {
            budgetData.period.startDate = budgetData.period.startDate.toDate ? 
              budgetData.period.startDate.toDate() : 
              new Date(budgetData.period.startDate);
          }
          if (budgetData.period?.endDate) {
            budgetData.period.endDate = budgetData.period.endDate.toDate ? 
              budgetData.period.endDate.toDate() : 
              new Date(budgetData.period.endDate);
          }
          
          setCurrentBudget({ id: budgetDoc.id, ...budgetData });
        }
      } catch (error) {
        console.error('Error loading budget:', error);
      }
    };
    
    loadBudget();
  }, [user]);

  // Load transactions from Firebase
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const db = getFirebaseDb();
    if (!db) {
      setIsLoading(false);
      return;
    }
    
    const transactionsRef = collection(db, 'users', user.uid, 'transactions');
    const q = query(transactionsRef, orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionsList: Transaction[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const categoryInfo = getCategoryInfo(data.categoryId || data.category);
        
        // Check if expense is over budget
        let isOverBudget = false;
        let budgetUtilization = 0;
        
        if (data.type === 'expense' && currentBudget && currentBudget.categories) {
          // Find matching budget category
          const budgetCategory = currentBudget.categories.find((cat: any) => 
            cat.transactionCategories?.includes(data.categoryId || data.category)
          );
          
          if (budgetCategory) {
            budgetUtilization = (budgetCategory.spent / budgetCategory.allocated) * 100;
            isOverBudget = budgetCategory.spent > budgetCategory.allocated;
          }
        }
        
        transactionsList.push({
          id: doc.id,
          type: data.type,
          amount: data.amount,
          category: data.categoryId || data.category,
          categoryIcon: categoryInfo.icon,
          categoryColor: categoryInfo.color,
          categoryName: categoryInfo.name,
          description: data.description || '',
          date: data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date),
          recurring: data.recurring === 'none' ? undefined : data.recurring,
          receiptUrl: data.receiptUrl,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : undefined,
          currency: data.currency,
          // User tracking
          createdBy: data.createdBy || data.userId,
          createdByName: data.createdByName,
          createdByEmail: data.createdByEmail,
          // Budget tracking
          budgetCategory: categoryInfo.budgetCategory,
          isOverBudget: isOverBudget,
          budgetUtilization: budgetUtilization,
        });
      });

      setTransactions(transactionsList);
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading transactions:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, currentBudget]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...transactions];

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(t => selectedCategories.includes(t.category));
    }

    // Date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      filtered = filtered.filter(t => t.date >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => t.date <= endDate);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(query) ||
        t.categoryName.toLowerCase().includes(query)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return a.date.getTime() - b.date.getTime();
        case 'date-desc':
          return b.date.getTime() - a.date.getTime();
        case 'amount-asc':
          return a.amount - b.amount;
        case 'amount-desc':
          return b.amount - a.amount;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    setFilteredTransactions(filtered);
  }, [transactions, searchQuery, filterType, selectedCategories, dateRange, sortBy]);

  // Load more transactions
  const loadMore = useCallback(() => {
    setDisplayCount(prev => prev + 20);
  }, []);

  // Group transactions by date
  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const groups: Record<string, Transaction[]> = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    transactions.forEach(transaction => {
      const date = transaction.date;
      let key: string;

      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString(locale, { 
          weekday: 'long',
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(transaction);
    });

    return groups;
  };

  const groupedTransactions = groupTransactionsByDate(
    filteredTransactions.slice(0, displayCount)
  );

  const handleDelete = (id: string) => {
    setTransactionToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!user || !transactionToDelete) return;
    
    try {
      const db = getFirebaseDb();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }
      
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', transactionToDelete));
      console.log('Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction. Please try again.');
    } finally {
      setTransactionToDelete(null);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    // Navigate to edit page with transaction data
    router.push(`/${locale}/transactions/new?edit=${transaction.id}`);
  };

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Bulk action handlers
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedTransactions(new Set());
  };

  const toggleTransactionSelection = (id: string) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedTransactions(newSelection);
  };

  const selectAllVisible = () => {
    const visibleIds = filteredTransactions.slice(0, displayCount).map(t => t.id);
    setSelectedTransactions(new Set(visibleIds));
  };

  const clearSelection = () => {
    setSelectedTransactions(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedTransactions.size === 0) return;
    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    if (!user || selectedTransactions.size === 0) return;
    
    try {
      const db = getFirebaseDb();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }
      
      const deletePromises = Array.from(selectedTransactions).map(id =>
        deleteDoc(doc(db, 'users', user.uid, 'transactions', id))
      );
      
      await Promise.all(deletePromises);
      toast('success', 'Success', `Deleted ${selectedTransactions.size} transactions`);
      
      setSelectedTransactions(new Set());
      setBulkMode(false);
    } catch (error) {
      console.error('Error deleting transactions:', error);
      toast('error', 'Error', 'Failed to delete some transactions');
    } finally {
      setShowBulkDeleteModal(false);
    }
  };

  // Calculate totals
  const totals = filteredTransactions.reduce(
    (acc, t) => {
      if (t.type === 'income') {
        acc.income += t.amount;
      } else if (t.type === 'expense') {
        acc.expense += t.amount;
      } else if (t.type === 'asset') {
        acc.assets += t.amount;
      } else if (t.type === 'liability') {
        acc.debts += t.amount;
      }
      return acc;
    },
    { income: 0, expense: 0, assets: 0, debts: 0 }
  );

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="loader" size="lg" className="animate-spin text-gold" />
          </div>
          <p className="text-primary/50 font-light">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <GlassContainer className="p-8 text-center">
          <p className="text-primary/60 mb-4">Please log in to view your transactions</p>
          <GlassButton
            variant="primary"
            goldBorder
            onClick={() => router.push(`/${locale}/auth/login`)}
          >
            Log In
          </GlassButton>
        </GlassContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/30 to-white" />
        <div className="absolute top-0 -left-32 w-[500px] h-[500px] bg-gold/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] bg-primary/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <Container size="lg" className="py-8 md:py-12">
        {/* Header */}
        <motion.div {...fadeInUp} className="mb-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-light text-primary">Transactions</h1>
            <div className="flex items-center gap-3">
              {bulkMode && selectedTransactions.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-sm text-primary/60 font-light">
                    {selectedTransactions.size} selected
                  </span>
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                  >
                    Clear
                  </GlassButton>
                  <GlassButton
                    variant="danger"
                    size="sm"
                    onClick={handleBulkDelete}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </GlassButton>
                </motion.div>
              )}
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={toggleBulkMode}
                className={bulkMode ? 'bg-gold/10 border-gold' : ''}
              >
                <CheckSquare className="w-4 h-4 mr-2" />
                {bulkMode ? 'Cancel' : 'Select'}
              </GlassButton>
              <GlassButton
                variant="primary"
                goldBorder
                onClick={() => router.push(`/${locale}/transactions/new`)}
                className="py-3 px-6 text-sm font-light"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </GlassButton>
            </div>
          </div>

          {/* Summary Cards - Premium Style */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <GlassContainer className="p-6 hover:shadow-lg transition-shadow">
              <p className="text-xs text-primary/40 mb-2 font-light tracking-wide uppercase">Income</p>
              <p className="text-2xl font-light text-green-600">
                {formatCurrency(totals.income, { 
                  currency: userProfile?.currency || 'USD', 
                  locale,
                  compact: true
                })}
              </p>
            </GlassContainer>
            <GlassContainer className="p-6 hover:shadow-lg transition-shadow">
              <p className="text-xs text-primary/40 mb-2 font-light tracking-wide uppercase">Expenses</p>
              <p className="text-2xl font-light text-red-600">
                {formatCurrency(totals.expense, { 
                  currency: userProfile?.currency || 'USD', 
                  locale,
                  compact: true
                })}
              </p>
            </GlassContainer>
            <GlassContainer className="p-6 hover:shadow-lg transition-shadow">
              <p className="text-xs text-primary/40 mb-2 font-light tracking-wide uppercase">Assets</p>
              <p className="text-2xl font-light text-blue-600">
                {formatCurrency(totals.assets, { 
                  currency: userProfile?.currency || 'USD', 
                  locale,
                  compact: true
                })}
              </p>
            </GlassContainer>
            <GlassContainer className="p-6 hover:shadow-lg transition-shadow">
              <p className="text-xs text-primary/40 mb-2 font-light tracking-wide uppercase">Debts</p>
              <p className="text-2xl font-light text-orange-600">
                {formatCurrency(totals.debts, { 
                  currency: userProfile?.currency || 'USD', 
                  locale,
                  compact: true
                })}
              </p>
            </GlassContainer>
          </div>

          {/* Bulk mode actions bar */}
          {bulkMode && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 glass rounded-xl flex items-center justify-between"
            >
              <button
                onClick={selectAllVisible}
                className="text-sm text-primary/60 hover:text-gold transition-colors font-light"
              >
                Select all visible ({filteredTransactions.slice(0, displayCount).length})
              </button>
              {selectedTransactions.size === filteredTransactions.slice(0, displayCount).length && 
               filteredTransactions.length > displayCount && (
                <span className="text-xs text-primary/40">
                  {filteredTransactions.length - displayCount} more available below
                </span>
              )}
            </motion.div>
          )}

          {/* Search and Filters Bar */}
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/30" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="glass px-6 py-3 rounded-xl hover:bg-white/60 transition-all text-primary/70 font-light text-sm flex items-center gap-2 whitespace-nowrap"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {(filterType !== 'all' || selectedCategories.length > 0 || dateRange.start || dateRange.end) && (
                <span className="w-2 h-2 bg-gold rounded-full" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none glass px-6 py-3 pr-10 rounded-xl hover:bg-white/60 transition-all text-primary/70 font-light text-sm cursor-pointer focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold border border-transparent"
                style={{
                  backgroundImage: 'none',
                  color: 'var(--primary)',
                }}
              >
                {sortOptions.map(option => (
                  <option 
                    key={option.value} 
                    value={option.value} 
                    className="bg-white text-primary"
                    style={{
                      backgroundColor: '#ffffff',
                      color: '#262659',
                    }}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ArrowUpDown className="w-4 h-4 text-primary/40" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6 overflow-hidden"
            >
              <GlassContainer className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Type Filter */}
                  <div>
                    <h3 className="text-xs font-light tracking-wide uppercase text-primary/60 mb-4">Transaction Type</h3>
                    <div className="space-y-2">
                      {['all', 'income', 'expense', 'asset', 'liability'].map(type => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type as any)}
                          className={`w-full px-4 py-2.5 rounded-xl text-left capitalize transition-all font-light text-sm ${
                            filterType === type
                              ? 'bg-white border border-gold text-primary shadow-sm'
                              : 'glass hover:bg-white/40 text-primary/70'
                          }`}
                        >
                          {type === 'all' ? 'All Transactions' : 
                           type === 'liability' ? 'Debts' : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <h3 className="text-xs font-light tracking-wide uppercase text-primary/60 mb-4">Categories</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {TRANSACTION_CATEGORIES.filter(cat => 
                        filterType === 'all' || cat.type === filterType
                      ).map((category) => {
                        const Icon = category.icon;
                        return (
                          <button
                            key={category.id}
                            onClick={() => toggleCategory(category.id)}
                            className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-all font-light ${
                              selectedCategories.includes(category.id)
                                ? 'bg-white border border-gold shadow-sm'
                                : 'glass hover:bg-white/40'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${category.color}`} />
                              <span className="text-primary/70">{category.name}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <h3 className="text-xs font-light tracking-wide uppercase text-primary/60 mb-4">Date Range</h3>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold transition-all text-primary font-light text-sm"
                      />
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold transition-all text-primary font-light text-sm"
                      />
                      <button
                        onClick={() => setDateRange({ start: '', end: '' })}
                        className="text-xs text-primary/50 hover:text-gold transition-colors font-light"
                      >
                        Clear dates
                      </button>
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setSelectedCategories([]);
                      setDateRange({ start: '', end: '' });
                    }}
                    className="text-xs text-primary/50 hover:text-gold transition-colors font-light"
                  >
                    Clear all filters
                  </button>
                </div>
              </GlassContainer>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="loader" size="lg" className="animate-spin text-gold" />
              </div>
              <p className="text-primary/50 font-light">Loading transactions...</p>
            </div>
          ) : Object.keys(groupedTransactions).length === 0 ? (
            <GlassContainer className="p-16 text-center bg-gradient-to-br from-white via-white to-gold/5">
              <div className="w-24 h-24 bg-gradient-to-br from-white to-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Icon name="receipt" size="xl" className="text-gold" />
              </div>
              <h3 className="text-xl font-light text-primary mb-3">No transactions found</h3>
              <p className="text-primary/50 mb-8 font-light">
                {searchQuery || filterType !== 'all' || selectedCategories.length > 0
                  ? 'Try adjusting your filters'
                  : 'Start tracking your money flow'}
              </p>
              <GlassButton
                variant="primary"
                goldBorder
                onClick={() => router.push(`/${locale}/transactions/new`)}
                className="py-3 px-6 text-sm font-light"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Transaction
              </GlassButton>
            </GlassContainer>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedTransactions).map(([date, transactions]) => (
                <div key={date}>
                  <h3 className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3">{date}</h3>
                  <GlassContainer className="overflow-hidden">
                    {transactions.map((transaction, index) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`group relative hover:bg-white/50 transition-all ${
                          bulkMode ? 'cursor-default' : 'cursor-pointer'
                        } ${selectedTransactions.has(transaction.id) ? 'bg-gold/5' : ''}`}
                        onClick={(e) => {
                          if (bulkMode) {
                            e.stopPropagation();
                            toggleTransactionSelection(transaction.id);
                          } else {
                            handleTransactionClick(transaction);
                          }
                        }}
                      >
                        {/* Click indicator - shows when not in bulk mode */}
                        {!bulkMode && (
                          <div className="absolute inset-0 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="flex items-center gap-1 text-xs text-primary/40">
                              <MousePointer className="w-3 h-3" />
                              <span>Click for details</span>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between p-5 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Checkbox for bulk mode */}
                            {bulkMode && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="flex items-center"
                              >
                                {selectedTransactions.has(transaction.id) ? (
                                  <CheckSquare className="w-5 h-5 text-gold" />
                                ) : (
                                  <Square className="w-5 h-5 text-primary/30" />
                                )}
                              </motion.div>
                            )}
                            
                            {/* Icon with budget indicator */}
                            <div className="relative">
                              <div className={`w-10 h-10 rounded-xl ${
                                transaction.type === 'income' ? 'bg-gold/10' : 
                                transaction.isOverBudget ? 'bg-red-50' : 'bg-gray-100'
                              } flex items-center justify-center`}>
                                <transaction.categoryIcon className={`w-5 h-5 ${
                                  transaction.isOverBudget ? 'text-red-500' : transaction.categoryColor
                                }`} />
                              </div>
                              
                              {/* Over budget indicator */}
                              {transaction.type === 'expense' && transaction.isOverBudget && (
                                <div className="absolute -top-1 -right-1">
                                  <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-2 h-2 text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Details */}
                            <div className="flex-1">
                              <p className="text-sm font-light text-primary">
                                {transaction.description}
                              </p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <p className="text-xs text-primary/40 font-light">
                                  {transaction.categoryName}
                                </p>
                                {transaction.recurring && (
                                  <span className="text-xs text-gold font-light">
                                    • Recurring
                                  </span>
                                )}
                                {transaction.receiptUrl && (
                                  <span className="text-xs text-primary/30 font-light flex items-center gap-1">
                                    • <Camera className="w-3 h-3" /> Receipt
                                  </span>
                                )}
                                {transaction.type === 'expense' && transaction.isOverBudget && (
                                  <span className="text-xs text-red-500 font-light">
                                    • Over budget
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Amount & Actions */}
                          <div className="flex items-center gap-4">
                            <p className={`text-lg font-light ${
                              transaction.type === 'income' ? 'text-gold' : 
                              transaction.isOverBudget ? 'text-red-500' : 'text-primary'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}
                              {formatCurrency(transaction.amount, { 
                                currency: transaction.currency || userProfile?.currency || 'USD', 
                                locale,
                                compact: transaction.amount >= 10000
                              })}
                            </p>
                            
                            {/* Actions - only show when not in bulk mode */}
                            {!bulkMode && (
                              <div 
                                className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button 
                                  onClick={() => handleEdit(transaction)}
                                  className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4 text-primary/50" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(transaction.id)}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </GlassContainer>
                </div>
              ))}

              {/* Load More */}
              {displayCount < filteredTransactions.length && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center py-8"
                >
                  <button
                    onClick={loadMore}
                    className="inline-flex items-center gap-2 px-8 py-3 glass rounded-xl hover:bg-white/60 transition-all text-primary/70 font-light text-sm"
                  >
                    Load More
                    <span className="text-xs text-primary/40">
                      ({filteredTransactions.length - displayCount} remaining)
                    </span>
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      </Container>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          onEdit={() => {
            setShowDetailModal(false);
            handleEdit(selectedTransaction);
          }}
          onDelete={() => {
            handleDelete(selectedTransaction.id);
            setShowDetailModal(false);
            setSelectedTransaction(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone and will affect your financial data."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
      
      {/* Bulk Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteModal}
        onClose={() => setShowBulkDeleteModal(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Transactions"
        message={`Are you sure you want to delete ${selectedTransactions.size} transactions? This action cannot be undone and will affect your financial data.`}
        confirmText={`Delete ${selectedTransactions.size} Transactions`}
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
} 