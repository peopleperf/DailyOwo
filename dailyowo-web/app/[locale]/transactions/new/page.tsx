'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Icon } from '@/components/ui/Icon';
import { useAuth } from '@/lib/firebase/auth-context';
import { formatCurrency } from '@/lib/utils/format';
import { fadeInUp } from '@/lib/utils/animations';
import { getFirebaseDb } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  Calendar, Camera, Plus, Minus, Repeat, Tag, FileText,
  Briefcase, ShoppingCart, Home, Car, Heart, Tv, Gamepad2,
  Coffee, Plane, Book, Dumbbell, Music, Gift, DollarSign,
  CreditCard, TrendingUp, Wallet, PiggyBank, Building,
  ArrowLeft, RefreshCw, Save, TrendingDown, X, Check, Upload
} from 'lucide-react';
import { TRANSACTION_CATEGORIES, getCategoriesByType, TransactionCategory as CategoryInterface, BUDGET_CATEGORIES } from '@/lib/constants/transaction-categories';
import { mapTransactionToBudgetCategory, suggestBudgetCategoryForTransaction } from '@/lib/financial-logic/budget-logic';
import { BudgetImpactPreview } from '@/components/transactions/BudgetImpactPreview';
import { Transaction, TransactionCategory } from '@/types/transaction';
import { transactionBudgetSync } from '@/lib/services/transaction-budget-sync';
import { useToast } from '@/hooks/useToast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface Category {
  id: string;
  name: string;
  icon: any;
  color: string;
  type: 'income' | 'expense' | 'asset' | 'liability';
  supportsAutoPrice?: boolean;
}

// Use the comprehensive transaction categories from the constants
const categories = TRANSACTION_CATEGORIES;

const recurringOptions = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function AddTransactionPage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const t = useTranslations('transactions');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: toastError } = useToast();

  // Tab state
  const [activeTab, setActiveTab] = useState<'basic' | 'details'>('basic');

  // Get query parameters
  const [initialType, setInitialType] = useState<'income' | 'expense' | 'asset' | 'liability'>('expense');
  const [shouldOpenReceipt, setShouldOpenReceipt] = useState(false);
  const [editTransactionId, setEditTransactionId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  useEffect(() => {
    // Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const typeParam = params.get('type') as 'income' | 'expense' | 'asset' | 'liability';
    const receiptParam = params.get('receipt');
    const editParam = params.get('edit');
    
    if (['income', 'expense', 'asset', 'liability'].includes(typeParam)) {
      setInitialType(typeParam);
      setType(typeParam);
    }
    
    if (receiptParam === 'true') {
      setShouldOpenReceipt(true);
      // Automatically trigger file input click after component mounts
      setTimeout(() => {
        const fileInput = document.getElementById('receipt-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.click();
        }
      }, 100);
    }

    // Handle edit mode
    if (editParam) {
      setEditTransactionId(editParam);
      setIsEditMode(true);
      // Load transaction data for editing
      loadTransactionForEdit(editParam);
    }
  }, [user]);

  // Load transaction data for editing
  const loadTransactionForEdit = async (transactionId: string) => {
    if (!user) return;
    
    try {
      const db = getFirebaseDb();
      if (!db) throw new Error('Database not available');

      const { doc, getDoc } = await import('firebase/firestore');
      const transactionRef = doc(db, 'users', user.uid, 'transactions', transactionId);
      const transactionSnap = await getDoc(transactionRef);

      if (transactionSnap.exists()) {
        const data = transactionSnap.data();
        
        // Pre-populate form with existing data
        setType(data.type || 'expense');
        setAmount(data.amount?.toString() || '');
        setSelectedCategory(data.categoryId || data.category || '');
        setDescription(data.description || '');
        
        // Convert Firestore timestamp to date string
        if (data.date) {
          const date = data.date.toDate ? data.date.toDate() : new Date(data.date);
          setDate(date.toISOString().split('T')[0]);
        }
        
        // Set recurring
        setRecurring(data.isRecurring ? (data.recurringConfig?.frequency || 'monthly') : 'none');
        
        // Set asset/liability specific fields
        if (data.assetDetails) {
          setSymbol(data.assetDetails.symbol || '');
          setQuantity(data.assetDetails.quantity?.toString() || '');
          setInstitution(data.assetDetails.institution || '');
        }
        
        if (data.liabilityDetails) {
          setInterestRate(data.liabilityDetails.interestRate?.toString() || '');
          setMinimumPayment(data.liabilityDetails.minimumPayment?.toString() || '');
          setInstitution(data.liabilityDetails.institution || '');
        }

        // Handle custom categories
        if (data.isCustomCategory && data.categoryId) {
          setCustomCategory(data.categoryId);
          setShowCustomCategory(true);
          setSelectedCategory(data.originalCategory || 'other-' + data.type);
        }
      }
    } catch (error) {
      console.error('Error loading transaction for edit:', error);
      toastError('Failed to load transaction data');
    }
  };

  const [type, setType] = useState<'income' | 'expense' | 'asset' | 'liability'>(initialType);
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [recurring, setRecurring] = useState('none');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Asset/Liability specific fields
  const [symbol, setSymbol] = useState(''); // For stocks, crypto, etc.
  const [quantity, setQuantity] = useState(''); // Number of shares/coins
  const [interestRate, setInterestRate] = useState(''); // For liabilities
  const [minimumPayment, setMinimumPayment] = useState(''); // For liabilities
  const [institution, setInstitution] = useState(''); // Bank, broker, etc.
  
  // Custom category fields
  const [customCategory, setCustomCategory] = useState(''); // When user selects "other"
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const filteredCategories = categories.filter(
    cat => cat.type === type
  );

  const handleAmountChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) return;
    
    // Limit decimal places to 2
    if (parts[1]?.length > 2) return;
    
    setAmount(cleanValue);
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setReceipt(file);
    }
  };

  const handleSubmit = async () => {
    // Better validation with specific error messages
    if (!user) {
      toastError('Please log in to add transactions.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toastError('Please enter a valid amount.');
      return;
    }

    if (!selectedCategory) {
      toastError('Please select a category.');
      return;
    }

    if (!date) {
      toastError('Please select a date.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const db = getFirebaseDb();
      if (!db) {
        throw new Error('Firebase database not initialized');
      }
      
      const baseTransaction = {
        type,
        amount: parseFloat(amount),
        categoryId: showCustomCategory && customCategory.trim() 
          ? customCategory.trim() 
          : selectedCategory,
        originalCategory: selectedCategory, // Keep track of the original selection
        isCustomCategory: showCustomCategory && customCategory.trim() ? true : false,
        date: new Date(date),
        description: description.trim() || null,
        currency: userProfile?.currency || 'USD',
        userId: user.uid,
        isRecurring: recurring !== 'none',
        updatedAt: serverTimestamp(),
        // User tracking for family/partner scenarios
        createdBy: user.uid,
        createdByName: user.displayName || userProfile?.displayName || 'Unknown User',
        createdByEmail: user.email,
        // TODO: Implement receipt photo upload to Firebase Storage
        receiptUrl: null,
      };

      let transactionData: any = baseTransaction;

      // Add type-specific fields
      if (type === 'asset' || type === 'liability') {
        if (type === 'asset') {
          transactionData.assetDetails = {
            symbol: symbol || null,
            quantity: quantity ? parseFloat(quantity) : null,
            currentPrice: null, // Will be updated by price service
            institution: institution || null,
          };
        } else if (type === 'liability') {
          transactionData.liabilityDetails = {
            interestRate: interestRate ? parseFloat(interestRate) : null,
            minimumPayment: minimumPayment ? parseFloat(minimumPayment) : null,
            institution: institution || null,
            currentBalance: parseFloat(amount), // For liabilities, amount is the balance
          };
        }
      }

      if (isEditMode && editTransactionId) {
        // Update existing transaction
        const { doc, updateDoc } = await import('firebase/firestore');
        const transactionRef = doc(db, 'users', user.uid, 'transactions', editTransactionId);
        await updateDoc(transactionRef, transactionData);
        console.log('Transaction updated successfully!');
        
        // Sync with budget
        const updatedTransaction = {
          id: editTransactionId,
          ...transactionData,
          userId: user.uid,
        } as Transaction;
        await transactionBudgetSync.syncTransactionWithBudget(updatedTransaction, 'update');
      } else {
        // Create new transaction
        const transactionsCollectionRef = collection(db, 'users', user.uid, 'transactions');
        const newTransactionData = {
          ...transactionData,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
        };
        const docRef = await addDoc(transactionsCollectionRef, newTransactionData);
        console.log('Transaction added successfully!');
        
        // Sync with budget
        const newTransaction = {
          id: docRef.id,
          ...transactionData,
          userId: user.uid,
        } as Transaction;
        await transactionBudgetSync.syncTransactionWithBudget(newTransaction, 'create');
      }
      
      // Redirect to the transactions list page
      router.push(`/${locale}/transactions`);
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'adding'} transaction:`, error);
      toastError(`Failed to ${isEditMode ? 'update' : 'add'} transaction. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Improved validation
  const isCategoryValid = selectedCategory && (!showCustomCategory || (showCustomCategory && customCategory.trim()));
  const isBasicValid = amount && parseFloat(amount) > 0 && isCategoryValid && date;
  const isFormValid = isBasicValid;

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: DollarSign },
    { id: 'details', label: 'Details', icon: FileText }
  ];

  // Build transaction object for preview
  const transactionPreview: Partial<Transaction> = {
    type,
    amount: amount ? parseFloat(amount) : 0,
    categoryId: selectedCategory as TransactionCategory,
    date: date ? new Date(date) : new Date(),
    description: description.trim() || '',
    currency: userProfile?.currency || 'USD',
  };

  return (
    <div className="min-h-screen bg-white relative">
      {/* Glassmorphic Background with Blur */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/30 to-white" />
        <div className="absolute top-0 -left-32 w-[500px] h-[500px] bg-gold/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] bg-primary/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-[1px]" />
      </div>

      <Container size="sm" className="pt-8 pb-32">
        {/* Header */}
        <motion.div {...fadeInUp} className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="w-10 h-10 p-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </GlassButton>
            <h1 className="text-2xl font-light text-primary">
              {isEditMode ? 'Edit Transaction' : 'Add Transaction'}
            </h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassContainer goldBorder className="w-full max-w-lg mx-auto bg-gradient-to-br from-white via-white to-gold/5">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-light text-primary">
                  {isEditMode ? 'Edit Transaction' : 'New Transaction'}
                </h2>
                <div className="flex items-center gap-2">
                  {isBasicValid && (
                    <div className="w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-6">
              <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`
                        flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-all text-sm font-light
                        ${activeTab === tab.id 
                          ? 'bg-white text-primary shadow-sm' 
                          : 'text-primary/60 hover:text-primary/80'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              <AnimatePresence mode="wait">
                {activeTab === 'basic' && (
                  <motion.div
                    key="basic"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    {/* Transaction Type Toggle */}
                    <div>
                      <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                        Transaction Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setType('income')}
                          className={`p-3 rounded-xl transition-all border ${
                            type === 'income'
                              ? 'bg-green-50 border-green-500 shadow-lg'
                              : 'bg-white/50 border-gray-200 hover:bg-white/80'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Plus className={`w-4 h-4 ${
                              type === 'income' ? 'text-green-600' : 'text-primary/60'
                            }`} />
                            <span className={`text-sm font-medium ${
                              type === 'income' ? 'text-green-600' : 'text-primary'
                            }`}>
                              Income
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={() => setType('expense')}
                          className={`p-3 rounded-xl transition-all border ${
                            type === 'expense'
                              ? 'bg-red-50 border-red-500 shadow-lg'
                              : 'bg-white/50 border-gray-200 hover:bg-white/80'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <Minus className={`w-4 h-4 ${
                              type === 'expense' ? 'text-red-600' : 'text-primary/60'
                            }`} />
                            <span className={`text-sm font-medium ${
                              type === 'expense' ? 'text-red-600' : 'text-primary'
                            }`}>
                              Expense
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={() => setType('asset')}
                          className={`p-3 rounded-xl transition-all border ${
                            type === 'asset'
                              ? 'bg-blue-50 border-blue-500 shadow-lg'
                              : 'bg-white/50 border-gray-200 hover:bg-white/80'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <TrendingUp className={`w-4 h-4 ${
                              type === 'asset' ? 'text-blue-600' : 'text-primary/60'
                            }`} />
                            <span className={`text-sm font-medium ${
                              type === 'asset' ? 'text-blue-600' : 'text-primary'
                            }`}>
                              Asset
                            </span>
                          </div>
                        </button>
                        <button
                          onClick={() => setType('liability')}
                          className={`p-3 rounded-xl transition-all border ${
                            type === 'liability'
                              ? 'bg-orange-50 border-orange-500 shadow-lg'
                              : 'bg-white/50 border-gray-200 hover:bg-white/80'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <TrendingDown className={`w-4 h-4 ${
                              type === 'liability' ? 'text-orange-600' : 'text-primary/60'
                            }`} />
                            <span className={`text-sm font-medium ${
                              type === 'liability' ? 'text-orange-600' : 'text-primary'
                            }`}>
                              Debt
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                        Amount
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-primary/40">
                          {userProfile?.currency === 'NGN' ? '₦' : 
                           userProfile?.currency === 'EUR' ? '€' : 
                           userProfile?.currency === 'GBP' ? '£' : '$'}
                        </div>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className="w-full pl-12 pr-4 py-4 text-xl font-light text-primary bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all"
                        />
                      </div>
                      {amount && parseFloat(amount) > 0 && (
                        <p className="text-sm text-primary/60 mt-2 font-light">
                          {formatCurrency(parseFloat(amount), { 
                            currency: userProfile?.currency || 'USD', 
                            locale 
                          })}
                        </p>
                      )}
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                        Category
                      </label>
                      <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                        {filteredCategories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => {
                              setSelectedCategory(category.id);
                              const isOtherCategory = category.id.includes('other');
                              setShowCustomCategory(isOtherCategory);
                              if (!isOtherCategory) {
                                setCustomCategory('');
                              }
                            }}
                            className={`p-3 rounded-xl transition-all border ${
                              selectedCategory === category.id
                                ? 'bg-gold/10 border-gold shadow-lg'
                                : 'bg-white/50 border-gray-200 hover:bg-white/80'
                            }`}
                          >
                            <category.icon className={`w-5 h-5 ${category.color} mx-auto mb-1`} />
                            <p className="text-xs text-primary text-center font-light">{category.name}</p>
                          </button>
                        ))}
                      </div>

                      {/* Custom Category Input */}
                      {showCustomCategory && (
                        <div className="mt-4">
                          <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                            Custom Category Name
                          </label>
                          <div className="relative">
                            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                            <input
                              type="text"
                              placeholder="Enter custom category name"
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 text-primary bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-light"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Asset/Liability specific fields */}
                    {(type === 'asset' || type === 'liability') && (
                      <>
                        {/* Symbol field for assets that support auto-pricing */}
                        {type === 'asset' && categories.find(c => c.id === selectedCategory)?.supportsAutoPrice && (
                          <div>
                            <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                              Symbol <span className="text-primary/30">(e.g., AAPL, BTC, ETH)</span>
                            </label>
                            <div className="relative">
                              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                              <input
                                type="text"
                                placeholder="Enter symbol"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                className="w-full pl-12 pr-4 py-3 text-primary bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-light"
                              />
                            </div>
                          </div>
                        )}

                        {/* Quantity field for assets */}
                        {type === 'asset' && categories.find(c => c.id === selectedCategory)?.supportsAutoPrice && (
                          <div>
                            <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                              Quantity
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="Number of shares/coins"
                                value={quantity}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  const parts = value.split('.');
                                  if (parts.length <= 2 && (!parts[1] || parts[1].length <= 8)) {
                                    setQuantity(value);
                                  }
                                }}
                                className="w-full pl-4 pr-4 py-3 text-primary bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-light"
                              />
                            </div>
                          </div>
                        )}

                        {/* Interest Rate for liabilities */}
                        {type === 'liability' && (
                          <div>
                            <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                              Interest Rate (APR) <span className="text-primary/30">(Optional)</span>
                            </label>
                            <div className="relative">
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/40">%</div>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="5.25"
                                value={interestRate}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  const parts = value.split('.');
                                  if (parts.length <= 2 && (!parts[1] || parts[1].length <= 2)) {
                                    setInterestRate(value);
                                  }
                                }}
                                className="w-full pl-4 pr-12 py-3 text-primary bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-light"
                              />
                            </div>
                          </div>
                        )}

                        {/* Minimum Payment for liabilities */}
                        {type === 'liability' && (
                          <div>
                            <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                              Minimum Monthly Payment <span className="text-primary/30">(Optional)</span>
                            </label>
                            <div className="relative">
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-medium text-primary/40">
                                {userProfile?.currency === 'NGN' ? '₦' : 
                                 userProfile?.currency === 'EUR' ? '€' : 
                                 userProfile?.currency === 'GBP' ? '£' : '$'}
                              </div>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={minimumPayment}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^0-9.]/g, '');
                                  const parts = value.split('.');
                                  if (parts.length <= 2 && (!parts[1] || parts[1].length <= 2)) {
                                    setMinimumPayment(value);
                                  }
                                }}
                                className="w-full pl-12 pr-4 py-3 text-primary bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-light"
                              />
                            </div>
                          </div>
                        )}

                        {/* Institution field */}
                        <div>
                          <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                            Institution <span className="text-primary/30">(Optional)</span>
                          </label>
                          <div className="relative">
                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                            <input
                              type="text"
                              placeholder="Bank, broker, or institution name"
                              value={institution}
                              onChange={(e) => setInstitution(e.target.value)}
                              className="w-full pl-12 pr-4 py-3 text-primary bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-light"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Date Picker */}
                    <div>
                      <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                        Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                        <input
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full pl-12 pr-4 py-3 text-primary bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all font-light"
                        />
                      </div>
                    </div>

                    {/* Budget Impact Preview - Show only for expenses */}
                    {type === 'expense' && isBasicValid && (
                      <BudgetImpactPreview 
                        transaction={transactionPreview}
                      />
                    )}
                  </motion.div>
                )}

                {activeTab === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Description */}
                    <div>
                      <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                        Description <span className="text-primary/30">(Optional)</span>
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-4 w-5 h-5 text-primary/40" />
                        <textarea
                          placeholder="Add a note..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="w-full pl-12 pr-4 py-3 text-primary bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all resize-none font-light"
                        />
                      </div>
                    </div>

                    {/* Recurring Options */}
                    <div>
                      <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                        Recurring Transaction
                      </label>
                      <div className="relative">
                        <Repeat className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                        <select
                          value={recurring}
                          onChange={(e) => setRecurring(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 text-primary bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all appearance-none font-light"
                        >
                          {recurringOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Receipt Upload */}
                    <div>
                      <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-3 block">
                        Receipt <span className="text-primary/30">(Optional)</span>
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-4 bg-white/50 border border-gray-200 rounded-xl hover:bg-white/80 transition-all"
                      >
                        {receipt ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Check className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-primary text-sm">{receipt.name}</p>
                              <p className="text-xs text-primary/60">
                                {(receipt.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <Camera className="w-6 h-6 text-primary/40" />
                            <p className="text-sm text-primary/60 font-light">Add receipt photo</p>
                          </div>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-100">
              <div className="flex gap-3">
                <button
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 bg-gray-100 text-primary/60 rounded-xl hover:bg-gray-200 transition-colors font-light"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className={`flex-1 px-6 py-3 rounded-xl transition-colors font-light flex items-center justify-center gap-2 ${
                    isFormValid && !isSubmitting
                      ? 'bg-gold text-white hover:bg-gold-dark'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Add {type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : type === 'asset' ? 'Asset' : 'Debt'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      </Container>
    </div>
  );
} 