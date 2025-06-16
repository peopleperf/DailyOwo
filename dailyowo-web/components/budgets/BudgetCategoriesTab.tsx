'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, ChevronRight, AlertCircle } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { BudgetData, BudgetCategory } from '@/lib/financial-logic/budget-logic';
import { formatCurrency } from '@/lib/utils/format';
import { BudgetCategoryModal } from './BudgetCategoryModal';
import { BudgetRebalanceModal, RebalanceOption } from './BudgetRebalanceModal';
import { BudgetCategoryItem } from './BudgetCategoryItem';
import { budgetService } from '@/lib/firebase/budget-service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { requiresRebalancing, applyBudgetRebalance, convertToCustomBudget, fixBudgetCategoryRemaining } from '@/lib/financial-logic/budget-rebalance-logic';

interface BudgetCategoriesTabProps {
  budgetData: BudgetData;
  currency: string;
  onUpdate: () => void;
}

export function BudgetCategoriesTab({ budgetData, currency, onUpdate }: BudgetCategoriesTabProps) {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  // Rebalancing states
  const [showRebalanceModal, setShowRebalanceModal] = useState(false);
  const [pendingCategoryUpdate, setPendingCategoryUpdate] = useState<{
    categoryId: string;
    newAmount: number;
  } | null>(null);

  // Initialize local state with fixed budget data
  const [localBudgetData, setLocalBudgetData] = useState(() => {
    if (budgetData.currentBudget) {
      // Fix any remaining value discrepancies
      const fixedCategories = fixBudgetCategoryRemaining(budgetData.currentBudget.categories);
      return {
        ...budgetData,
        currentBudget: {
          ...budgetData.currentBudget,
          categories: fixedCategories
        }
      };
    }
    return budgetData;
  });

  // Update local state when budgetData changes
  useEffect(() => {
    if (budgetData.currentBudget) {
      // Fix any remaining value discrepancies
      const fixedCategories = fixBudgetCategoryRemaining(budgetData.currentBudget.categories);
      setLocalBudgetData({
        ...budgetData,
        currentBudget: {
          ...budgetData.currentBudget,
          categories: fixedCategories
        }
      });
    } else {
      setLocalBudgetData(budgetData);
    }
  }, [budgetData]);

  const { currentBudget } = localBudgetData;

  if (!currentBudget) {
    return (
      <div className="text-center py-12">
        <p className="text-primary/60">No budget categories available</p>
      </div>
    );
  }

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEditCategory = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user || !currentBudget) return;
    
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        // Optimistic update - remove category immediately
        const updatedCategories = currentBudget.categories.filter(cat => cat.id !== categoryId);
        setLocalBudgetData({
          ...localBudgetData,
          currentBudget: {
            ...currentBudget,
            categories: updatedCategories
          }
        });

        // Update Firebase in background
        await budgetService.removeBudgetCategory(user.uid, currentBudget.id, categoryId);
        toastSuccess('Category deleted successfully');
        
        // Refresh from server to ensure consistency
        onUpdate();
      } catch (error) {
        console.error('Error deleting category:', error);
        toastError('Failed to delete category', 'Please try again.');
        // Revert optimistic update on error
        setLocalBudgetData(budgetData);
      }
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedCategory(null);
  };

  const handleModalSave = async (categoryData: Partial<BudgetCategory>) => {
    if (!user || !currentBudget) return;
    
    try {
      if (modalMode === 'add') {
        // Create a new category with a unique ID
        const newCategory: BudgetCategory = {
          id: `cat-${Date.now()}`,
          name: categoryData.name || 'New Category',
          type: categoryData.type || 'other',
          allocated: categoryData.allocated || 0,
          spent: 0,
          remaining: categoryData.allocated || 0,
          isOverBudget: false,
          allowRollover: categoryData.allowRollover !== undefined ? categoryData.allowRollover : false,
          rolloverAmount: 0,
          transactionCategories: categoryData.transactionCategories || [],
        };
        
        // Optimistic update - add category immediately
        setLocalBudgetData({
          ...localBudgetData,
          currentBudget: {
            ...currentBudget,
            categories: [...currentBudget.categories, newCategory]
          }
        });

        // Update Firebase in background
        await budgetService.addBudgetCategory(user.uid, currentBudget.id, newCategory);
        toastSuccess('Category added successfully');
        handleModalClose();
        onUpdate();
      } else if (modalMode === 'edit' && selectedCategory) {
        // Check if this edit requires rebalancing
        const amountChanged = categoryData.allocated !== undefined && 
                           categoryData.allocated !== selectedCategory.allocated;
        
        if (amountChanged && requiresRebalancing(currentBudget)) {
          // Store pending update and show rebalance modal
          setPendingCategoryUpdate({
            categoryId: selectedCategory.id,
            newAmount: categoryData.allocated!
          });
          setShowModal(false);
          setShowRebalanceModal(true);
        } else {
          // No rebalancing needed, update directly with optimistic update
          const updates = Object.entries(categoryData).reduce((acc, [key, value]) => {
            if (value !== undefined) {
              (acc as any)[key] = value;
            }
            return acc;
          }, {} as Partial<BudgetCategory>);
          
          // Optimistic update - update category immediately
          const updatedCategories = currentBudget.categories.map(cat => 
            cat.id === selectedCategory.id 
              ? { 
                  ...cat, 
                  ...updates,
                  // Recalculate remaining if allocated was updated
                  remaining: updates.allocated !== undefined 
                    ? updates.allocated - cat.spent 
                    : cat.remaining
                } 
              : cat
          );
          setLocalBudgetData({
            ...localBudgetData,
            currentBudget: {
              ...currentBudget,
              categories: updatedCategories
            }
          });

          // Update Firebase in background
          await budgetService.updateBudgetCategory(
            user.uid, 
            currentBudget.id, 
            selectedCategory.id, 
            updates
          );
          toastSuccess('Category updated successfully');
          handleModalClose();
          onUpdate();
        }
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toastError('Failed to save category', 'Please try again.');
      // Revert optimistic update on error
      setLocalBudgetData(budgetData);
    }
  };

  const handleRebalanceConfirm = async (rebalanceOption: RebalanceOption) => {
    if (!user || !currentBudget || !selectedCategory || !pendingCategoryUpdate) return;

    try {
      let updatedBudget;

      if (rebalanceOption.type === 'switch-method') {
        // Convert to custom budget
        const customBudget = convertToCustomBudget(currentBudget);
        
        // Update the category in the custom budget
        const updatedCategories = customBudget.categories.map(cat => 
          cat.id === pendingCategoryUpdate.categoryId
            ? { ...cat, allocated: pendingCategoryUpdate.newAmount }
            : cat
        );
        
        updatedBudget = {
          ...customBudget,
          categories: updatedCategories
        };

        // Optimistic update
        setLocalBudgetData({
          ...localBudgetData,
          currentBudget: updatedBudget
        });

        // Update Firebase in background
        await budgetService.updateBudget(user.uid, updatedBudget);
        toastSuccess('Switched to custom budget and updated category');
      } else {
        // Apply rebalancing
        const rebalancedCategories = applyBudgetRebalance(
          currentBudget,
          pendingCategoryUpdate.categoryId,
          pendingCategoryUpdate.newAmount,
          rebalanceOption
        );
        
        // Debug logging
        console.log('Rebalanced categories:', rebalancedCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          allocated: cat.allocated,
          spent: cat.spent,
          remaining: cat.remaining
        })));
        
        updatedBudget = {
          ...currentBudget,
          categories: rebalancedCategories
        };

        // Optimistic update - update all affected categories immediately
        setLocalBudgetData({
          ...localBudgetData,
          currentBudget: updatedBudget,
          // Recalculate totals
          totalAllocated: rebalancedCategories.reduce((sum, cat) => sum + cat.allocated, 0),
          totalExpenseAllocated: rebalancedCategories
            .filter(cat => !['savings', 'investments', 'retirement'].includes(cat.type))
            .reduce((sum, cat) => sum + cat.allocated, 0),
          totalSavingsAllocated: rebalancedCategories
            .filter(cat => ['savings', 'investments', 'retirement'].includes(cat.type))
            .reduce((sum, cat) => sum + cat.allocated, 0),
        });

        // Update Firebase in background
        await budgetService.updateBudget(user.uid, {
          id: currentBudget.id,
          categories: rebalancedCategories
        });
        
        toastSuccess('Budget rebalanced successfully');
      }
      
      setShowRebalanceModal(false);
      setPendingCategoryUpdate(null);
      setSelectedCategory(null);
      
      // Refresh from server to ensure consistency
      onUpdate();
    } catch (error) {
      console.error('Error rebalancing budget:', error);
      toastError('Failed to rebalance budget', 'Please try again.');
      // Revert optimistic update on error
      setLocalBudgetData(budgetData);
    }
  };

  const groupedCategories = currentBudget.categories.reduce((acc, category) => {
    const type = category.type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(category);
    return acc;
  }, {} as Record<string, BudgetCategory[]>);

  const categoryGroups = [
    { key: 'housing', label: 'Housing & Utilities', color: 'text-blue-600' },
    { key: 'food', label: 'Food & Dining', color: 'text-green-600' },
    { key: 'transportation', label: 'Transportation', color: 'text-purple-600' },
    { key: 'shopping', label: 'Shopping & Personal', color: 'text-pink-600' },
    { key: 'entertainment', label: 'Entertainment', color: 'text-orange-600' },
    { key: 'savings', label: 'Savings & Investments', color: 'text-gold' },
    { key: 'other', label: 'Other', color: 'text-gray-600' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-light text-primary">Budget Categories</h3>
          <p className="text-sm text-primary/60">Manage your spending categories</p>
        </div>
        <GlassButton
          onClick={handleAddCategory}
          size="sm"
          goldBorder
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </GlassButton>
      </div>

      {/* Method-based budget notice */}
      {currentBudget.method.type !== 'custom' && (
        <div className="p-4 bg-gold/5 border border-gold/20 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-gold" />
            <div>
              <p className="text-sm font-medium text-primary">
                {currentBudget.method.type} Budget Method
              </p>
              <p className="text-xs text-primary/60">
                Category adjustments will require rebalancing to maintain budget ratios
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Categories by Type */}
      <div className="space-y-6">
        {categoryGroups.map(({ key, label, color }) => {
          const categories = groupedCategories[key] || [];
          if (categories.length === 0) return null;

          const totalAllocated = categories.reduce((sum, cat) => sum + cat.allocated, 0);
          const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className={`text-sm font-medium ${color}`}>{label}</h4>
                <div className="text-sm text-primary/60">
                  {formatCurrency(totalSpent, { currency })} / {formatCurrency(totalAllocated, { currency })}
                </div>
              </div>

              <div className="space-y-2">
                {categories.map((category) => (
                  <BudgetCategoryItem
                    key={category.id}
                    category={category}
                    currency={currency}
                    onEdit={() => handleEditCategory(category)}
                    onDelete={() => handleDeleteCategory(category.id)}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {currentBudget.categories.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-primary mb-2">No Categories Yet</h3>
          <p className="text-primary/60 mb-6">Add your first budget category to start tracking</p>
          <GlassButton onClick={handleAddCategory} goldBorder>
            Add Your First Category
          </GlassButton>
        </div>
      )}

      {/* Category Modal */}
      {showModal && (
        <BudgetCategoryModal
          mode={modalMode}
          category={selectedCategory}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      {/* Rebalance Modal */}
      {showRebalanceModal && selectedCategory && pendingCategoryUpdate && (
        <BudgetRebalanceModal
          isOpen={showRebalanceModal}
          onClose={() => {
            setShowRebalanceModal(false);
            setPendingCategoryUpdate(null);
            setSelectedCategory(null);
          }}
          onConfirm={handleRebalanceConfirm}
          originalCategory={selectedCategory}
          newAmount={pendingCategoryUpdate.newAmount}
          budgetMethod={currentBudget.method}
          allCategories={currentBudget.categories}
          currency={currency}
        />
      )}
    </div>
  );
} 