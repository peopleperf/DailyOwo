'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, AlertCircle, Check, Calendar, Tag, DollarSign, Store, Plus, Trash2, Sparkles, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassInput } from '@/components/ui/GlassInput';
import { ExtractedReceiptData, ReceiptLineItem, ReceiptScanResult } from '@/types/receipt';
import { TRANSACTION_CATEGORIES } from '@/lib/constants/transaction-categories';
import { useAuth } from '@/lib/firebase/auth-context';
import { getFirebaseDb } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Transaction } from '@/types/transaction';
import { useToast } from '@/hooks/useToast';
import { formatCurrency } from '@/lib/utils/format';
import { AICategoryMapper, suggestCategories } from '@/lib/services/ai-category-mapper';
import { transactionBudgetSync } from '@/lib/services/transaction-budget-sync';
import { budgetCategoryRepair } from '@/lib/services/budget-category-repair';

interface ReceiptReviewModalProps {
  scanResult: ReceiptScanResult;
  onClose: () => void;
  onSave: (transactions: Transaction[]) => void;
}

export function ReceiptReviewModal({ scanResult, onClose, onSave }: ReceiptReviewModalProps) {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Form data
  const [merchantName, setMerchantName] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [total, setTotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [tip, setTip] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [category, setCategory] = useState<string>('other-expense');
  const [items, setItems] = useState<ReceiptLineItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [currency, setCurrency] = useState('EUR');
  
  // AI category suggestions
  const [categorySuggestions, setCategorySuggestions] = useState<Array<{
    categoryId: string;
    confidence: number;
    reason: string;
  }>>([]);
  const [budgetImpact, setBudgetImpact] = useState<any>(null);
  
  // Initialize form with extracted data
  useEffect(() => {
    if (scanResult.success && scanResult.data) {
      const data = scanResult.data;
      setMerchantName(data.merchantName);
      setDate(data.date);
      setTotal(data.total);
      setTax(data.tax);
      setTip(data.tip || 0);
      setSubtotal(data.subtotal);
      setItems(data.items);
      setPaymentMethod(data.paymentMethod || '');
      setCurrency(data.currency || 'EUR');
      
      // Use AI to suggest categories
      const suggestions = suggestCategories(
        data.merchantCategory,
        data.items,
        data.merchantName
      );
      setCategorySuggestions(suggestions);
      
      // Set the highest confidence category
      if (suggestions.length > 0) {
        setCategory(suggestions[0].categoryId);
      } else {
        setCategory(suggestCategory(data.merchantName));
      }
    }
  }, [scanResult]);

  // Update budget impact when category or amount changes
  useEffect(() => {
    if (user && category && total > 0) {
      const previewTransaction = {
        type: 'expense' as const,
        amount: total,
        categoryId: category,
        date: date,
      };
      
      transactionBudgetSync.previewBudgetImpact(previewTransaction, user.uid)
        .then(impact => setBudgetImpact(impact))
        .catch(err => console.error('Error previewing budget impact:', err));
    }
  }, [category, total, date, user]);

  // Recalculate total when tax, tip, or subtotal changes
  useEffect(() => {
    const newTotal = subtotal + tax + tip;
    setTotal(newTotal);
  }, [subtotal, tax, tip]);

  // Suggest category based on merchant name
  function suggestCategory(merchant: string): string {
    const lowerMerchant = merchant.toLowerCase();
    if (lowerMerchant.includes('supermarket') || lowerMerchant.includes('mercado')) return 'groceries';
    if (lowerMerchant.includes('restaurant') || lowerMerchant.includes('cafe')) return 'dining-out';
    if (lowerMerchant.includes('gas') || lowerMerchant.includes('petrol')) return 'transportation';
    return 'other-expense';
  }

  // Recalculate total when items change
  function recalculateTotal() {
    const newSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    setSubtotal(newSubtotal);
    // The total will be recalculated by the useEffect for [subtotal, tax, tip]
  }

  // Update line item
  function updateItem(index: number, updates: Partial<ReceiptLineItem>) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    
    // Recalculate item total if quantity or unit price changes
    if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setItems(newItems);
    
    // Recalculate receipt total
    recalculateTotal();
  }

  // Add new line item
  function addItem() {
    setItems([...items, {
      id: `new-${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      confidence: 1.0 // New items are manually added, so confidence is high
    }]);
  }

  // Remove line item
  function removeItem(index: number) {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    
    // Recalculate receipt total
    recalculateTotal();
  }

  // Save as transactions
  async function handleSave() {
    if (!user) {
      toastError('You must be logged in to save transactions.');
      return;
    }

    setIsSaving(true);
    const db = await getFirebaseDb();
    if (!db) {
      toastError('Could not connect to the database.');
      setIsSaving(false);
      return;
    }

    const transactionsCollection = collection(db, 'users', user.uid, 'transactions');
    const savedTransactions: Transaction[] = [];

    try {
      // Attempt to repair budget categories
      try {
        await budgetCategoryRepair.repairAllUserBudgets(user.uid);
        toastSuccess('Successfully repaired budget categories.');
      } catch (repairError) {
        console.error('Budget category repair failed:', repairError);
        toastError('Failed to repair budget categories.');
        // Decide if you want to stop the save process if repair fails
        // For now, we'll continue
      }
      
      // Option 1: Save as a single transaction
      const mainTransaction = {
        userId: user.uid,
        amount: total,
        type: 'expense',
        date: date.toISOString(),
        merchant: merchantName,
        description: `Receipt from ${merchantName}`,
        categoryId: category,
        receiptUrl: scanResult.success ? (scanResult.data as any)?.imageUrl : undefined,
        items: items.map(item => ({ ...item, id: item.id || `item-${Date.now()}` })),
        paymentMethod: mapPaymentMethod(paymentMethod),
        currency,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(transactionsCollection, mainTransaction);
      const savedTx = { 
        ...mainTransaction, 
        id: docRef.id, 
        date: date,
        createdAt: new Date(),
        updatedAt: new Date(),
        categoryType: 'user',
        isRecurring: false,
        createdBy: user.uid
      } as Transaction;
      savedTransactions.push(savedTx);

      // Sync with budget - Placeholder for correct method
      // await transactionBudgetSync.syncOnAdd(savedTx);
      // Temporarily removed due to type error

      // Option 2: Could also save each line item as a separate transaction
      // This is more complex and depends on user preference.
      // For now, we save as one transaction.

      toastSuccess('Transaction(s) saved successfully!');
      onSave(savedTransactions);
      onClose();
    } catch (error) {
      console.error('Error saving transaction: ', error);
      toastError('Failed to save transaction(s).');
    } finally {
      setIsSaving(false);
    }
  }

  // Map payment method string to allowed values
  function mapPaymentMethod(method: string): "cash" | "credit" | "debit" | "bank-transfer" | "mobile-payment" | "other" | undefined {
    const lowerMethod = method.toLowerCase();
    if (lowerMethod.includes('cash')) return 'cash';
    if (lowerMethod.includes('credit')) return 'credit';
    if (lowerMethod.includes('debit') || lowerMethod.includes('card')) return 'debit';
    if (lowerMethod.includes('transfer') || lowerMethod.includes('bank')) return 'bank-transfer';
    if (lowerMethod.includes('mobile') || lowerMethod.includes('apple') || lowerMethod.includes('google') || lowerMethod.includes('paypal')) return 'mobile-payment';
    if (method.trim() !== '') return 'other';
    return undefined;
  }

  // Get confidence indicator color
  function getConfidenceColor(confidence: number) {
    if (confidence > 0.8) return 'text-green-500';
    if (confidence > 0.6) return 'text-yellow-500';
    return 'text-red-500';
  }

  if (!scanResult.success) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center"
        >
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Scan Failed</h3>
          <p className="text-gray-600 mb-4">{scanResult.error}</p>
          <Button onClick={onClose} className="w-full">
            Try Again
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!scanResult.data) {
    return null; // Should not happen if success is true, but as a safeguard.
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Review Receipt</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {/* Confidence Score & Warnings */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Confidence Score</h3>
              <p className={`font-bold text-lg ${getConfidenceColor(scanResult.data.confidence.overall)}`}>
                {(scanResult.data.confidence.overall * 100).toFixed(0)}%
              </p>
            </div>
            {scanResult.warnings && scanResult.warnings.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-yellow-800">Warnings</h4>
                <ul className="list-disc list-inside text-sm text-yellow-700 mt-1">
                  {scanResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Main Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Merchant, Date, Category */}
            <div className="space-y-6">
              {/* Merchant */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Merchant Name</label>
                <GlassInput
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  placeholder="e.g., Starbucks"
                  className="w-full"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <GlassInput
                  type="date"
                  value={date.toISOString().split('T')[0]}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-gold focus:border-gold"
                >
                  {TRANSACTION_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                
                {/* AI Suggestions */}
                {categorySuggestions.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      AI Suggestions
                    </h4>
                    <div className="mt-2 space-y-1">
                      {categorySuggestions.map(suggestion => (
                        <button 
                          key={suggestion.categoryId}
                          onClick={() => setCategory(suggestion.categoryId)}
                          className={`w-full text-left p-2 rounded-md transition-colors text-sm ${category === suggestion.categoryId ? 'bg-blue-100 font-semibold' : 'hover:bg-blue-100/70'}`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{TRANSACTION_CATEGORIES.find(c => c.id === suggestion.categoryId)?.name || suggestion.categoryId}</span>
                            <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${getConfidenceColor(suggestion.confidence)} bg-opacity-10`}>
                              {(suggestion.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{suggestion.reason}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Summary */}
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg border h-full">
                <h3 className="font-semibold text-gray-800 mb-4 text-center">Summary</h3>
                <div className="space-y-3">
                  {/* Subtotal */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <GlassInput 
                      type="number" 
                      value={subtotal}
                      onChange={e => setSubtotal(parseFloat(e.target.value) || 0)}
                      className="w-28 text-right"
                    />
                  </div>
                  {/* Tax */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tax</span>
                    <GlassInput 
                      type="number" 
                      value={tax}
                      onChange={e => setTax(parseFloat(e.target.value) || 0)}
                      className="w-28 text-right"
                    />
                  </div>
                  {/* Tip */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Tip</span>
                    <GlassInput 
                      type="number" 
                      value={tip}
                      onChange={e => setTip(parseFloat(e.target.value) || 0)}
                      className="w-28 text-right"
                    />
                  </div>
                  <div className="border-t border-gray-200 my-2"></div>
                  {/* Total */}
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span className="text-gray-800">Total</span>
                    <span className="text-navy">{formatCurrency(total, { currency })}</span>
                  </div>
                  {/* Payment Method */}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm text-gray-600">Payment Method</span>
                    <GlassInput 
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value)}
                      placeholder={'Unspecified'}
                      className="w-28 text-right"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 mb-2">Line Items</h3>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-gray-50">
                  <div className="col-span-5">
                    <GlassInput
                      value={item.description}
                      onChange={(e) => updateItem(index, { description: e.target.value })}
                      placeholder={'Description'}
                      className="w-full"
                    />
                  </div>
                  <div className="col-span-2">
                    <GlassInput
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, { quantity: parseInt(e.target.value) || 1 })}
                      placeholder={'Qty'}
                      className="w-full text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <GlassInput
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                      placeholder={'Unit Price'}
                      className="w-full text-right"
                    />
                  </div>
                  <div className="col-span-2 text-right font-medium">
                    {formatCurrency(item.totalPrice, { currency })}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                      <Trash2 className="w-4 h-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" onClick={addItem} className="mt-2">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          {/* AI Analysis of Raw Text */}
          {scanResult.data.rawText && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-semibold text-gray-700 mb-2">AI Analysis</h4>
              <p className="text-xs text-gray-500 whitespace-pre-wrap font-mono bg-white p-2 rounded">
                {scanResult.data.rawText}
              </p>
              
              {scanResult.warnings && scanResult.warnings
                .filter(w => !w.includes('AI Insights'))
                .map((warning, idx) => (
                  <p key={idx} className="text-xs text-amber-600 mt-2">{warning}</p>
                ))
              }
              
              {scanResult.warnings && scanResult.warnings
                .filter(w => w.includes('AI Insights'))
                .map(w => w.replace('AI Insights: ', ''))
                .map((insight, idx) => (
                  <div key={idx} className="text-xs text-gray-700 mt-2">
                    {insight.split(';').map((suggestion, sidx) => (
                      <div key={sidx} className="flex items-start gap-2 mt-1">
                        <span className="text-gold mt-0.5">•</span>
                        <span>{suggestion.trim()}</span>
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}
          
          {/* Budget Impact Preview */}
          {budgetImpact && budgetImpact.impacts && budgetImpact.impacts.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-navy mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Budget Impact
              </h4>
              
              <div className="space-y-2">
                {budgetImpact.impacts.map((impact: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{impact.categoryName}</span>
                    <div className="flex items-center gap-2">
                      <span className={impact.isOverBudget ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {formatCurrency(impact.amountUsed, { currency })}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className={`${impact.percentageUsed > 80 ? 'text-amber-600' : 'text-gray-600'}`}>
                        {Math.round(impact.percentageUsed)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {budgetImpact.warnings && budgetImpact.warnings.length > 0 && (
                <div className="mt-3 space-y-1">
                  {budgetImpact.warnings.map((warning: string, idx: number) => (
                    <p key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </p>
                  ))}
                </div>
              )}
              
              {budgetImpact.suggestions && budgetImpact.suggestions.length > 0 && (
                <div className="mt-3 space-y-1">
                  {budgetImpact.suggestions.map((suggestion: string, idx: number) => (
                    <p key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{suggestion}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4">
          <p className="text-sm text-gray-600 mb-4 text-center">
            Please review all details and select the appropriate category before confirming
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !merchantName || total <= 0}
              className="flex-1 !bg-navy !hover:bg-navy/90 !text-white"
            >
              {isSaving ? 'Saving...' : 'Confirm & Save'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
