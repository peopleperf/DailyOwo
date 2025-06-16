'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, PiggyBank, Target } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { useAuth } from '@/hooks/useAuth';
import { budgetService } from '@/lib/firebase/budget-service';
import { BudgetMethod } from '@/lib/financial-logic/budget-logic';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface BudgetEmptyStateProps {
  onBudgetCreated: () => void;
}

export function BudgetEmptyState({ onBudgetCreated }: BudgetEmptyStateProps) {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<BudgetMethod['type']>('50-30-20');

  const handleCreateBudget = async () => {
    if (!user || !monthlyIncome) return;

    setIsCreating(true);
    try {
      const method: BudgetMethod = {
        type: selectedMethod,
        allocations: {}
      };

      await budgetService.createBudget(
        user.uid,
        method,
        parseFloat(monthlyIncome)
      );

      onBudgetCreated();
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Failed to create budget. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickStart = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      // Create a sample budget with $5000 monthly income
      await budgetService.setupSampleBudget(user.uid);
      onBudgetCreated();
    } catch (error) {
      console.error('Error creating sample budget:', error);
      alert('Failed to create budget. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (showForm) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <GlassContainer className="p-8">
          <h2 className="text-2xl font-light text-primary mb-6">Create Your Budget</h2>
          
          {/* Monthly Income */}
          <div className="mb-6">
            <label className="text-sm font-medium text-primary/60 mb-2 block">
              Monthly Income
            </label>
            <GlassInput
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="Enter your monthly income"
              className="text-lg"
            />
          </div>

          {/* Budget Method */}
          <div className="mb-6">
            <label className="text-sm font-medium text-primary/60 mb-3 block">
              Budget Method
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedMethod('50-30-20')}
                className={`p-4 rounded-lg border transition-all ${
                  selectedMethod === '50-30-20'
                    ? 'bg-gold/10 border-gold text-primary'
                    : 'bg-white border-gray-200 text-primary/70 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium mb-1">50/30/20</div>
                <div className="text-xs">50% Needs, 30% Wants, 20% Savings</div>
              </button>
              <button
                onClick={() => setSelectedMethod('zero-based')}
                className={`p-4 rounded-lg border transition-all ${
                  selectedMethod === 'zero-based'
                    ? 'bg-gold/10 border-gold text-primary'
                    : 'bg-white border-gray-200 text-primary/70 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium mb-1">Zero-Based</div>
                <div className="text-xs">Allocate every dollar</div>
              </button>
              <button
                onClick={() => setSelectedMethod('custom')}
                className={`p-4 rounded-lg border transition-all ${
                  selectedMethod === 'custom'
                    ? 'bg-gold/10 border-gold text-primary'
                    : 'bg-white border-gray-200 text-primary/70 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium mb-1">Custom</div>
                <div className="text-xs">Create your own</div>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <GlassButton
              variant="secondary"
              onClick={() => setShowForm(false)}
              disabled={isCreating}
              className="flex-1"
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={handleCreateBudget}
              goldBorder
              disabled={!monthlyIncome || isCreating}
              className="flex-1"
            >
              {isCreating ? <LoadingSpinner size="sm" /> : 'Create Budget'}
            </GlassButton>
          </div>
        </GlassContainer>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <div className="max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wallet className="w-12 h-12 text-gold" />
        </div>
        
        <h2 className="text-2xl font-light text-primary mb-4">
          Start Your Budget Journey
        </h2>
        
        <p className="text-primary/60 mb-8 max-w-md mx-auto">
          Take control of your finances with a personalized budget that helps you track spending, save money, and achieve your goals.
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <GlassContainer className="p-4">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm text-primary mb-1">Track Spending</h3>
            <p className="text-xs text-primary/60">See where your money goes</p>
          </GlassContainer>
          
          <GlassContainer className="p-4">
            <PiggyBank className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm text-primary mb-1">Save More</h3>
            <p className="text-xs text-primary/60">Build your emergency fund</p>
          </GlassContainer>
          
          <GlassContainer className="p-4">
            <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-medium text-sm text-primary mb-1">Reach Goals</h3>
            <p className="text-xs text-primary/60">Achieve financial freedom</p>
          </GlassContainer>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <GlassButton
            onClick={() => setShowForm(true)}
            goldBorder
            className="px-8"
            disabled={isCreating}
          >
            Create My Budget
          </GlassButton>
          
          <GlassButton
            variant="secondary"
            onClick={handleQuickStart}
            className="px-8"
            disabled={isCreating}
          >
            {isCreating ? <LoadingSpinner size="sm" /> : 'Quick Start with Sample'}
          </GlassButton>
        </div>
      </div>
    </motion.div>
  );
} 