'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, AlertCircle, Wand2 } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '../ui/GlassButton';
import { TRANSACTION_CATEGORIES } from '@/lib/constants/transaction-categories';
import { useSmartCategorization, useAnomalyDetection } from '@/hooks/useAI';
import { useAuth } from '@/lib/firebase/auth-context';
import { budgetService } from '@/lib/firebase/budget-service';
import { UserTransactionCategory } from '@/types/transaction';
import { Budget, BudgetCategory } from '@/lib/financial-logic/budget-logic';

interface SmartTransactionFormProps {
  onSubmit: (transaction: any) => void;
  onCancel?: () => void;
}

export function SmartTransactionForm({ onSubmit, onCancel }: SmartTransactionFormProps) {
  const { user, userProfile, loading: authLoading } = useAuth(); // userProfile for app-specific settings, user for Firebase auth
  const { categorize, isLoading: isCategorizing } = useSmartCategorization();
  const anomalyDetection = useAnomalyDetection();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    categoryId: '', 
    categoryType: null as 'global' | 'user' | 'budget' | null, 
    categoryName: '', 
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense',
    merchantName: '',
    notes: ''
  });

  const [categoryInputValue, setCategoryInputValue] = useState(''); 

  const [showNewCategoryPrompt, setShowNewCategoryPrompt] = useState(false);
  const [newCategoryNameForUserPrompt, setNewCategoryNameForUserPrompt] = useState('');
  const [promptAction, setPromptAction] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<SuggestionType[]>([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const globalCategories = TRANSACTION_CATEGORIES.map(cat => ({ id: cat.id, name: cat.name, type: 'global' as 'global' }));
  // Combined type for suggestions
  type SuggestionType = { id: string; name: string; type: 'global' | 'user' | 'budget' };
  
  const [userCategories, setUserCategories] = useState<{ id: string; name: string; type: 'user' }[]>([]);
  const [userCategoriesLoading, setUserCategoriesLoading] = useState(true);
  const [userCategoriesError, setUserCategoriesError] = useState<string | null>(null);

  const [fetchedBudgetCategories, setFetchedBudgetCategories] = useState<{ id: string; name: string; type: 'budget' }[]>([]);
  const [fetchedBudgetCategoriesLoading, setFetchedBudgetCategoriesLoading] = useState(true);
  const [fetchedBudgetCategoriesError, setFetchedBudgetCategoriesError] = useState<string | null>(null);
  const [activeBudget, setActiveBudget] = useState<Budget | null>(null);
  const [isLinkingCategoryToBudget, setIsLinkingCategoryToBudget] = useState(false);

  

  useEffect(() => {
    const fetchUserCategories = async () => {
      if (user) {
        setUserCategoriesLoading(true);
        setUserCategoriesError(null);
        try {
          const token = await user.getIdToken();
          const response = await fetch('/api/user-categories', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to fetch user categories: ${response.status}`);
          }
          const data = await response.json();
          // Ensure data is in the expected format { id, name, type: 'user' }
          const formattedData = data.map((cat: any) => ({ id: cat.id, name: cat.name, type: 'user' as 'user' }));
          setUserCategories(formattedData);
        } catch (err: any) {
          console.error('Error fetching user categories:', err);
          setUserCategoriesError(err.message || 'An unexpected error occurred.');
        }
        setUserCategoriesLoading(false);
      }
    };

    if (!authLoading) { // Only fetch if auth state is resolved
        fetchUserCategories();
    }
  }, [user, authLoading]);

  useEffect(() => {
    const fetchBudgetCategories = async () => {
      if (user) {
        setFetchedBudgetCategoriesLoading(true);
        setFetchedBudgetCategoriesError(null);
        try {
          const fetchedBudget = await budgetService.getActiveBudget(user.uid);
          if (fetchedBudget && fetchedBudget.categories) {
            const transformedBudgetCategories = fetchedBudget.categories.map((cat: BudgetCategory) => ({
              id: cat.id,
              name: cat.name,
              type: 'budget' as 'budget',
            }));
            setFetchedBudgetCategories(transformedBudgetCategories);
            setActiveBudget(fetchedBudget); // Store the active budget
          } else {
            setFetchedBudgetCategories([]);
            setActiveBudget(null);
            // Potentially set an error or a state indicating no active budget was found
          }
        } catch (err: any) {
          console.error('Error fetching budget categories:', err);
          setFetchedBudgetCategoriesError(err.message || 'An unexpected error occurred.');
        }
        setFetchedBudgetCategoriesLoading(false);
      }
    };

    if (!authLoading) { // Only fetch if auth state is resolved
      fetchBudgetCategories();
    }
  }, [user, authLoading]);

  const [aiSuggestion, setAiSuggestion] = useState<{
    category: string;
    confidence: number;
    explanation?: string;
  } | null>(null);

  const [anomalyAlert, setAnomalyAlert] = useState<{
    isAnomalous: boolean;
    reason?: string;
    severity: 'low' | 'medium' | 'high';
  } | null>(null);

  const [showAiFeatures, setShowAiFeatures] = useState(false); // Default to false until profile loads

  // Check if AI is enabled from userProfile
  useEffect(() => {
    if (userProfile) {
      setShowAiFeatures(!!(userProfile.aiSettings?.enabled && userProfile.aiSettings?.features?.categorization));
    } else if (!authLoading && !user) {
      setShowAiFeatures(false); // Not logged in, no AI features
    }
  }, [userProfile, user, authLoading]);

  useEffect(() => {
    const aiEnabled = userProfile?.aiSettings?.enabled ?? true;
    const categorizationEnabled = userProfile?.aiSettings?.features?.categorization ?? true;
    setShowAiFeatures(aiEnabled && categorizationEnabled);
  }, [userProfile]);

  // Auto-categorize when description and amount change
  useEffect(() => {
    const categorizeTransaction = async () => {
      if (!user || !showAiFeatures || !formData.description.trim() || !formData.amount) return;

      try {
        const result = await categorize(
          formData.description,
          Math.abs(parseFloat(formData.amount)),
          formData.merchantName || undefined
        );

        setAiSuggestion({
          category: result.category,
          confidence: result.confidence,
          explanation: result.explanation
        });

        // Auto-apply if confidence is high and user prefers it
        if (result.confidence >= 0.8 && userProfile?.aiSettings?.performance?.autoApply) {
          // Try to find if AI suggested category is known
          const foundGlobal = globalCategories.find(gc => gc.name.toLowerCase() === result.category.toLowerCase());
          if (foundGlobal) {
            setFormData(prev => ({ ...prev, categoryId: foundGlobal.id, categoryType: 'global', categoryName: foundGlobal.name }));
            setCategoryInputValue(foundGlobal.name);
          } else {
            const foundUser = userCategories.find(uc => uc.name.toLowerCase() === result.category.toLowerCase());
            if (foundUser) {
              setFormData(prev => ({ ...prev, categoryId: foundUser.id, categoryType: 'user', categoryName: foundUser.name }));
              setCategoryInputValue(foundUser.name);
            } else {
              // AI suggested a new category name, keep it in suggestion, let user confirm via prompt
              setCategoryInputValue(result.category); // Put AI suggestion in input for user to see
              // Potentially trigger prompt here if desired, or let blur handle it
            }
          }
        }
      } catch (error) {
        console.error('Auto-categorization failed:', error);
        setAiSuggestion(null);
      }
    };

    const timeoutId = setTimeout(categorizeTransaction, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [formData.description, formData.amount, formData.merchantName, categorize, showAiFeatures, userProfile]);

  // Check for anomalies when form is complete
  useEffect(() => {
    const checkAnomaly = async () => {
      if (!user || !showAiFeatures || !user.uid) return; // Ensure user.uid is available
      if (!formData.amount || !categoryInputValue || !formData.description) return; // Use categoryInputValue or formData.categoryName

      try {
        const result = await anomalyDetection.mutateAsync({
          transaction: {
            amount: parseFloat(formData.amount),
            category: formData.categoryName || categoryInputValue, // Use confirmed categoryName or current input
            description: formData.description,
            date: new Date(formData.date)
          },
          userSpendingHistory: [] // This would come from real transaction history
        });

        if (result.isAnomalous) {
          setAnomalyAlert({
            isAnomalous: result.isAnomalous,
            reason: result.reason,
            severity: result.severity
          });
        } else {
          setAnomalyAlert(null);
        }
      } catch (error) {
        console.error('Anomaly detection failed:', error);
      }
    };

    const timeoutId = setTimeout(checkAnomaly, 2000); // Longer debounce for anomaly detection
    return () => clearTimeout(timeoutId);
  }, [formData.amount, formData.categoryName, categoryInputValue, formData.description, formData.date, anomalyDetection, showAiFeatures]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showNewCategoryPrompt && newCategoryNameForUserPrompt) {
      alert(`Please resolve the new category: "${newCategoryNameForUserPrompt}"`);
      return;
    }
    if (!formData.categoryId && categoryInputValue.trim()) {
        handleCategoryInputBlur(); 
        alert(`Please resolve the new category: "${categoryInputValue}"`);
        return;
    }

    const transactionToSubmit = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      categoryId: formData.categoryId,
      categoryType: formData.categoryType,
      date: new Date(formData.date),
      type: formData.type,
      merchantName: formData.merchantName,
      notes: formData.notes,
      aiMetadata: aiSuggestion ? {
        suggestedCategory: aiSuggestion.category, 
        confidence: aiSuggestion.confidence,
        explanation: aiSuggestion.explanation,
        wasAutoApplied: formData.categoryName === aiSuggestion.category && !!formData.categoryId 
      } : undefined,
      anomalyMetadata: anomalyAlert && anomalyAlert.isAnomalous ? {
        isAnomalous: anomalyAlert.isAnomalous,
        reason: anomalyAlert.reason,
        severity: anomalyAlert.severity
      } : undefined
    };
    onSubmit(transactionToSubmit as any); 
  };

  const applySuggestion = () => {
    if (!aiSuggestion) return;
    const foundGlobal = globalCategories.find(gc => gc.name.toLowerCase() === aiSuggestion.category.toLowerCase());
    if (foundGlobal) {
      setFormData(prev => ({ ...prev, categoryId: foundGlobal.id, categoryType: 'global', categoryName: foundGlobal.name }));
      setCategoryInputValue(foundGlobal.name);
    } else {
      const foundUser = userCategories.find(uc => uc.name.toLowerCase() === aiSuggestion.category.toLowerCase());
      if (foundUser) {
        setFormData(prev => ({ ...prev, categoryId: foundUser.id, categoryType: 'user', categoryName: foundUser.name }));
        setCategoryInputValue(foundUser.name);
      } else {
        setCategoryInputValue(aiSuggestion.category);
        setFormData(prev => ({ ...prev, categoryId: '', categoryType: null, categoryName: '' })); 
      }
    }
    setAiSuggestion(null); 
  };

  const handleCategoryInputBlur = () => {
    if (!categoryInputValue.trim()) {
      setShowNewCategoryPrompt(false);
      return;
    }

    const existingGlobal = globalCategories.find(c => c.name.toLowerCase() === categoryInputValue.toLowerCase());
    if (existingGlobal) {
      setFormData(prev => ({ ...prev, categoryId: existingGlobal.id, categoryType: 'global', categoryName: existingGlobal.name }));
      setShowNewCategoryPrompt(false);
      return;
    }
    const existingUser = userCategories.find(c => c.name.toLowerCase() === categoryInputValue.toLowerCase());
    if (existingUser) {
      setFormData(prev => ({ ...prev, categoryId: existingUser.id, categoryType: 'user', categoryName: existingUser.name }));
      setShowNewCategoryPrompt(false);
      return;
    }
    
    if (formData.categoryName?.toLowerCase() !== categoryInputValue.toLowerCase()) {
        setNewCategoryNameForUserPrompt(categoryInputValue);
        setShowNewCategoryPrompt(true);
        setPromptAction(null); 
        setFormData(prev => ({ ...prev, categoryId: '', categoryType: null, categoryName: '' })); 
    }
  };

  // Autocomplete Handlers
  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCategoryInputValue(value);
    // Clear confirmed category when user types, prompt on blur or selection will re-evaluate
    setFormData(prev => ({ ...prev, categoryId: '', categoryType: null, categoryName: '' }));
    setShowNewCategoryPrompt(false); // Hide prompt while typing
    setActiveSuggestionIndex(-1); // Reset active suggestion

    if (value.trim() === '') {
      setSuggestions([]);
      setIsSuggestionsVisible(false);
      return;
    }

    const allSuggestions = [...globalCategories, ...userCategories, ...fetchedBudgetCategories]; // Now fetched and should be in { id, name, type: 'user' } format
    const filteredSuggestions = allSuggestions.filter(cat =>
      cat.name.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filteredSuggestions.slice(0, 10)); // Increased suggestion limit to accommodate more types
    setIsSuggestionsVisible(filteredSuggestions.length > 0);
  };

  const handleSuggestionClick = (suggestion: { id: string; name: string; type: 'global' | 'user' | 'budget' }) => {
    setCategoryInputValue(suggestion.name);
    setFormData(prev => ({
      ...prev,
      categoryId: suggestion.id,
      categoryType: suggestion.type,
      categoryName: suggestion.name,
    }));
    setSuggestions([]);
    setIsSuggestionsVisible(false);
    setShowNewCategoryPrompt(false); // Ensure prompt is hidden
    setActiveSuggestionIndex(-1);
    // Consider focusing next field or doing nothing to allow form review
    document.getElementById('category')?.blur(); // Blur input after selection
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isSuggestionsVisible && !showNewCategoryPrompt) {
        // If enter is pressed, no suggestions are visible, and prompt is not active, trigger blur.
        e.preventDefault();
        handleCategoryInputBlur();
        return;
    }
    
    if (!isSuggestionsVisible || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
          handleSuggestionClick(suggestions[activeSuggestionIndex]);
        } else {
          // If enter is pressed but no suggestion is actively selected via arrows,
          // check for exact match or trigger blur if input is new.
          const exactMatch = suggestions.find(s => s.name.toLowerCase() === categoryInputValue.trim().toLowerCase());
          if (exactMatch) {
              handleSuggestionClick(exactMatch);
          } else if (!showNewCategoryPrompt) {
              handleCategoryInputBlur();
          }
        }
        break;
      case 'Escape':
        setIsSuggestionsVisible(false);
        setActiveSuggestionIndex(-1);
        break;
    }
  };

  const handleCategoryInputFocus = () => {
    if (categoryInputValue.trim() !== '' && suggestions.length > 0 && !formData.categoryId) {
      setIsSuggestionsVisible(true);
    }
  };

  const handlePromptCreateNewBudgetCategory = async (newBudgetName: string, allocation: number) => {
    console.log('Create new budget:', newBudgetName, allocation, 'for tx cat:', newCategoryNameForUserPrompt);
    setShowNewCategoryPrompt(false);
    setPromptAction(null);
  };

  const handlePromptAddToExistingBudget = async (selectedBudgetId: string) => {
    if (!user || !newCategoryNameForUserPrompt || !activeBudget) {
      console.error('Missing user, newCategoryName, or activeBudget for linking.');
      alert('Error: Missing required information (user, category name, or active budget) to link category.');
      return;
    }

    setIsLinkingCategoryToBudget(true);
    try {
      // 1. Create new user-specific transaction category via API
      const token = await user.getIdToken();
      const createCategoryResponse = await fetch('/api/user-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newCategoryNameForUserPrompt }),
      });

      if (!createCategoryResponse.ok) {
        const errorData = await createCategoryResponse.json();
        const errorMessage = errorData.error || 'Failed to create user category';
        console.error('API Error creating category:', errorMessage);
        // alert(`API Error: ${errorMessage}`); // Alert will be handled by the main catch block
        throw new Error(errorMessage);
      }
      const createdUserCategory = await createCategoryResponse.json() as UserTransactionCategory & { type: 'user' };

      // 2. Update the selected budget category to include this new transaction category
      const targetBudgetCategory = activeBudget.categories.find(bc => bc.id === selectedBudgetId);
      if (!targetBudgetCategory) {
        throw new Error('Target budget category not found.');
      }

      const updatedTransactionCategories = Array.from(
        new Set([...(targetBudgetCategory.transactionCategories || []), createdUserCategory.id])
      );

      const updatedBudgetCategories = activeBudget.categories.map(bc => 
        bc.id === selectedBudgetId 
          ? { ...bc, transactionCategories: updatedTransactionCategories } 
          : bc
      );

      await budgetService.updateBudget(user.uid, { 
        id: activeBudget.id, 
        categories: updatedBudgetCategories 
      });

      // 3. Update local state & UI
      setFormData(prev => ({
        ...prev,
        categoryId: createdUserCategory.id,
        categoryName: createdUserCategory.name,
        categoryType: 'user',
      }));
      setCategoryInputValue(createdUserCategory.name);
      
      // Add to local state for autocomplete
      const newUserCatForState = { id: createdUserCategory.id, name: createdUserCategory.name, type: 'user' as 'user' };
      setUserCategories(prev => [...prev, newUserCatForState]);
      // Assuming allCategories is a combined list used for suggestions, update it too
      // setAllCategories(prev => [...prev, newUserCatForState]); 
      // This needs to be handled where allCategories is constructed/updated

      alert(`Successfully linked '${createdUserCategory.name}' to budget category '${targetBudgetCategory.name}'.`);
      console.log(`Successfully linked ${createdUserCategory.name} to budget ${targetBudgetCategory.name}`);

      setShowNewCategoryPrompt(false);
      setNewCategoryNameForUserPrompt('');
      setPromptAction(null);

    } catch (error: any) {
      console.error('Error linking category to budget:', error);
      alert(`Error: ${error.message || 'Failed to link category to budget.'}`);
    } finally {
      setIsLinkingCategoryToBudget(false);
    }
  };

  const handlePromptMarkAsUnbudgeted = async () => {
    console.log('Mark as unbudgeted for tx cat:', newCategoryNameForUserPrompt);
    const tempNewUserCat = { id: 'temp-user-' + Date.now(), name: newCategoryNameForUserPrompt, type: 'user' as 'user' }; 
    userCategories.push(tempNewUserCat); 
    setFormData(prev => ({ ...prev, categoryId: tempNewUserCat.id, categoryType: 'user', categoryName: tempNewUserCat.name }));
    setCategoryInputValue(tempNewUserCat.name);
    setShowNewCategoryPrompt(false);
    setPromptAction(null);
  };

  const handlePromptDecideLater = async () => {
    console.log('Decide later for tx cat:', newCategoryNameForUserPrompt);
    const tempNewUserCat = { id: 'temp-user-' + Date.now(), name: newCategoryNameForUserPrompt, type: 'user' as 'user' }; 
    userCategories.push(tempNewUserCat); 
    setFormData(prev => ({ ...prev, categoryId: tempNewUserCat.id, categoryType: 'user', categoryName: tempNewUserCat.name }));
    setCategoryInputValue(tempNewUserCat.name);
    setShowNewCategoryPrompt(false);
    setPromptAction(null);
  }; 

  const categories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Income',
    'Savings',
    'Investment',
    'Transfer',
    'Travel',
    'Home & Garden',
    'Personal Care',
    'Other'
  ];

  return (
    <GlassContainer className="p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-light text-primary mb-2">Add Transaction</h2>
        {showAiFeatures && (
          <p className="text-sm text-primary/60 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            Smart categorization enabled
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Description Input */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Description *
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="glass-input w-full"
              placeholder="e.g., Coffee at Starbucks"
              required
            />
            {isCategorizing && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Wand2 className="w-4 h-4 text-gold animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Amount *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            className="glass-input w-full"
            placeholder="0.00"
            required
          />
        </div>

        {/* AI Category Suggestion */}
        <AnimatePresence>
          {aiSuggestion && showAiFeatures && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-subtle p-3 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-primary">AI Suggestion</span>
                  <span className="text-xs px-2 py-0.5 bg-gold/20 text-gold rounded-full">
                    {Math.round(aiSuggestion.confidence * 100)}% confident
                  </span>
                </div>
                <GlassButton
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={applySuggestion}
                  disabled={formData.categoryName === aiSuggestion.category && !!formData.categoryId}
                  className="text-xs px-2 py-1"
                >
                  {formData.categoryName === aiSuggestion.category && !!formData.categoryId ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    'Apply'
                  )}
                </GlassButton>
              </div>
              <p className="text-sm text-primary/70">
                <strong>{aiSuggestion.category}</strong>
                {aiSuggestion.explanation && ` - ${aiSuggestion.explanation}`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category Selection */}
        <div className="mb-4 relative">
          <label htmlFor="category" className="block text-sm font-medium text-primary-text mb-1">
            Category
          </label>
          <input
            type="text"
            id="category"
            name="category"
            value={categoryInputValue}
            onChange={handleCategoryInputChange}
            onFocus={handleCategoryInputFocus}
            onBlurCapture={() => {
              // Delay blur processing to allow suggestion click to register
              // onMouseDown on suggestion items will set categoryId, so blur won't trigger prompt if item clicked
              setTimeout(() => {
                if (!formData.categoryId && document.activeElement !== document.getElementById('category')) {
                   // Check if focus is truly lost from input and no categoryId was set by a click
                  const activeElInSuggestions = suggestions.some((_, idx) => document.activeElement === document.getElementById(`suggestion-${idx}`));
                  if(!activeElInSuggestions && !formData.categoryId) {
                      handleCategoryInputBlur();
                  }
                }
              }, 150); // Small delay
            }}
            onKeyDown={handleCategoryKeyDown}
            className="glass-input w-full"
            placeholder="e.g., Groceries, Salary"
            autoComplete="off"
            required={!formData.categoryId && !showNewCategoryPrompt} // Required if no category confirmed and prompt not active
          />
          {isSuggestionsVisible && suggestions.length > 0 && (
            <div className="absolute z-20 w-full mt-1 left-0 right-0" role="listbox">
              <GlassContainer className="p-1 shadow-lg max-h-60 overflow-y-auto glass-suggestion-box">
                <ul className="space-y-0.5">
                  {suggestions.map((suggestion: { id: string; name: string; type: 'global' | 'user' | 'budget' }, index) => (
                    <li
                      key={`${suggestion.type}-${suggestion.id}`}
                      id={`suggestion-${index}`}
                      role="option"
                      aria-selected={index === activeSuggestionIndex}
                      className={`p-2.5 text-sm rounded-lg cursor-pointer transition-colors duration-150 ease-in-out 
                        ${index === activeSuggestionIndex ? 'bg-primary-light/30 text-primary-dark font-medium' : 'hover:bg-primary-light/10 text-primary-text'}`}
                      // Use onMouseDown to handle click before blur takes effect and hides suggestions
                      onMouseDown={(e) => {
                          e.preventDefault(); // Prevent input blur before click is processed
                          handleSuggestionClick(suggestion);
                      }}
                    >
                      {suggestion.name} 
                      <span className={`text-xs ml-1 px-1.5 py-0.5 rounded-full 
                        ${suggestion.type === 'global' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {suggestion.type === 'global' ? 'Global' : 'Custom'}
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassContainer>
            </div>
          )}
        </div>

        {/* Anomaly Alert */}
        <AnimatePresence>
          {anomalyAlert?.isAnomalous && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-3 rounded-lg border-l-4 ${
                anomalyAlert.severity === 'high' 
                  ? 'bg-red-50 border-red-400' 
                  : anomalyAlert.severity === 'medium'
                  ? 'bg-yellow-50 border-yellow-400'
                  : 'bg-blue-50 border-blue-400'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className={`w-4 h-4 ${
                  anomalyAlert.severity === 'high' 
                    ? 'text-red-500' 
                    : anomalyAlert.severity === 'medium'
                    ? 'text-yellow-500'
                    : 'text-blue-500'
                }`} />
                <span className="text-sm font-medium">Unusual Transaction Detected</span>
              </div>
              <p className="text-sm text-gray-600">{anomalyAlert.reason}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Type Selection */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Type
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
              className={`flex-1 p-2 rounded-lg border transition-colors ${
                formData.type === 'expense'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
              className={`flex-1 p-2 rounded-lg border transition-colors ${
                formData.type === 'income'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="glass-input w-full"
          />
        </div>

        {/* Optional Fields */}
        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Merchant (Optional)
          </label>
          <input
            type="text"
            value={formData.merchantName}
            onChange={(e) => setFormData(prev => ({ ...prev, merchantName: e.target.value }))}
            className="glass-input w-full"
            placeholder="e.g., Starbucks"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-primary mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="glass-input w-full"
            rows={2}
            placeholder="Additional notes..."
          />
        </div>

        {/* New Category Prompt UI */}
        {showNewCategoryPrompt && (
          <GlassContainer className="p-3 glass mt-3">
            <p className="text-sm font-medium text-primary mb-1">
              New Category: <span className="font-bold">"{newCategoryNameForUserPrompt}"</span>
            </p>
            <p className="text-xs text-primary/70 mb-3">Link to a budget or save as new?</p>
            
            {promptAction === 'createBudget' && (
              <div className="space-y-2">
                <input placeholder="New Budget Name (e.g., Vacation Fund)" name="newBudgetNamePrompt" className="glass-input w-full text-sm p-2" />
                <input type="number" placeholder="Monthly Allocation" name="newBudgetAllocationPrompt" className="glass-input w-full text-sm p-2" />
                <GlassButton 
                  onClick={() => {
                    const budgetName = (document.querySelector('input[name="newBudgetNamePrompt"]') as HTMLInputElement)?.value;
                    const allocation = parseFloat((document.querySelector('input[name="newBudgetAllocationPrompt"]') as HTMLInputElement)?.value);
                    if (budgetName && allocation) handlePromptCreateNewBudgetCategory(budgetName, allocation);
                  }} 
                  variant="primary" goldBorder fullWidth size="sm">
                    Create & Link Budget
                </GlassButton>
                <GlassButton variant="ghost" onClick={() => setPromptAction(null)} fullWidth size="sm">Back</GlassButton>
              </div>
            )}

            {promptAction === 'addToExistingBudget' && (
              <div className="space-y-2">
                <select name="existingBudgetIdPrompt" className="glass-input w-full text-sm p-2">
                  <option value="">Select existing budget</option>
                  {fetchedBudgetCategories.map(b => <option key={b.id} value={b.id}>{b.name} ({b.type})</option>)}
                  {fetchedBudgetCategoriesLoading && <option disabled>Loading budget categories...</option>}
                  {isLinkingCategoryToBudget && <option disabled>Linking category...</option>}
                  {fetchedBudgetCategoriesError && <option disabled>Error loading budgets</option>}
                </select>
                <GlassButton 
                  onClick={() => {
                    const budgetId = (document.querySelector('select[name="existingBudgetIdPrompt"]') as HTMLSelectElement)?.value;
                    if (budgetId) handlePromptAddToExistingBudget(budgetId);
                  }} 
                  variant="primary" goldBorder fullWidth size="sm"
                  disabled={isLinkingCategoryToBudget || fetchedBudgetCategoriesLoading || !newCategoryNameForUserPrompt.trim()}>
                    Link to Selected Budget
                </GlassButton>
                <GlassButton variant="ghost" onClick={() => setPromptAction(null)} fullWidth size="sm">Back</GlassButton>
              </div>
            )}

            {promptAction === null && (
               <div className="grid grid-cols-2 gap-2">
                  <GlassButton onClick={() => setPromptAction('createBudget')} variant="secondary" goldBorder size="sm">
                    New Budget
                  </GlassButton>
                  <GlassButton onClick={() => setPromptAction('addToExistingBudget')} variant="secondary" size="sm">
                    Existing Budget
                  </GlassButton>
                  <GlassButton onClick={handlePromptMarkAsUnbudgeted} variant="secondary" size="sm">
                    Unbudgeted
                  </GlassButton>
                  <GlassButton onClick={handlePromptDecideLater} variant="ghost" size="sm">
                    Decide Later
                  </GlassButton>
               </div>
            )}
          </GlassContainer>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          {onCancel && (
            <GlassButton
              type="button"
              onClick={onCancel}
              variant="ghost"
              className="flex-1"
            >
              Cancel
            </GlassButton>
          )}
          <GlassButton
            type="submit"
            variant="primary"
            goldBorder
            className="flex-1"
            disabled={!formData.description || !formData.amount || (!formData.categoryId && !categoryInputValue.trim()) || showNewCategoryPrompt}
          >
            Add Transaction
          </GlassButton>
        </div>
      </form>

      {/* AI Features Disabled Notice */}
      {!showAiFeatures && (
        <div className="mt-4 p-3 glass-subtle rounded-lg text-center">
          <p className="text-xs text-primary/60">
            AI features are disabled. Enable them in Profile Settings for smart categorization.
          </p>
        </div>
      )}
    </GlassContainer>
  );
} 