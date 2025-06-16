'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/firebase/auth-context';
import { useLocale } from 'next-intl';
import { X, Target, Home, Car, TrendingUp, Heart, Briefcase, Calendar, DollarSign } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { formatCurrency } from '@/lib/utils/format';

interface Goal {
  name: string;
  category: 'emergency' | 'vacation' | 'home' | 'car' | 'investment' | 'custom';
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  isCompleted: boolean;
}

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  currency: string;
}

const categories = [
  { id: 'emergency', label: 'Emergency Fund', icon: Target, color: 'bg-amber-100 text-amber-600' },
  { id: 'vacation', label: 'Vacation', icon: Heart, color: 'bg-blue-100 text-blue-600' },
  { id: 'home', label: 'Home', icon: Home, color: 'bg-purple-100 text-purple-600' },
  { id: 'car', label: 'Car', icon: Car, color: 'bg-gray-100 text-gray-600' },
  { id: 'investment', label: 'Investment', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
  { id: 'custom', label: 'Custom', icon: Briefcase, color: 'bg-primary/10 text-primary' },
];

export default function AddGoalModal({ isOpen, onClose, onAdd, currency }: AddGoalModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Goal['category']>('emergency');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !targetAmount || !targetDate) return;

    const goal: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name,
      category,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      targetDate: new Date(targetDate),
      monthlyContribution: parseFloat(monthlyContribution) || 0,
      isCompleted: false,
    };

    onAdd(goal);
    
    // Reset form
    setName('');
    setCategory('emergency');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setMonthlyContribution('');
  };

  // Calculate estimated completion
  const calculateMonthlyNeeded = () => {
    if (!targetAmount || !targetDate) return 0;
    
    const target = parseFloat(targetAmount);
    const current = parseFloat(currentAmount) || 0;
    const remaining = Math.max(0, target - current);
    
    // If already completed
    if (remaining === 0) return 0;
    
    const today = new Date();
    const targetDateObj = new Date(targetDate);
    
    // Check if target date has passed
    if (targetDateObj <= today) {
      return -1; // Indicator that date has passed
    }
    
    const monthsRemaining = Math.max(
      1,
      (targetDateObj.getFullYear() - today.getFullYear()) * 12 +
      (targetDateObj.getMonth() - today.getMonth())
    );
    
    return remaining / monthsRemaining;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Modal - Matching TransactionDetailModal positioning */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <GlassContainer 
              goldBorder
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-white to-gold/5"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-light text-primary">Create New Goal</h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/60 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-primary/50" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Goal Name */}
                  <div>
                    <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-2 block">
                      Goal Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Emergency Fund"
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                      required
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-2 block">
                      Category
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id as Goal['category'])}
                            className={`
                              p-3 rounded-xl border transition-all
                              ${category === cat.id 
                                ? 'border-gold bg-gold/10' 
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className="text-xs font-light text-primary">
                                {cat.label}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Amount Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-2 block">
                        Target Amount
                      </label>
                      <input
                        type="number"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-2 block">
                        Already Saved
                      </label>
                      <input
                        type="number"
                        value={currentAmount}
                        onChange={(e) => setCurrentAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Date and Monthly Contribution */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-2 block">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-light tracking-wide uppercase text-primary/40 mb-2 block">
                        Monthly Savings
                      </label>
                      <input
                        type="number"
                        value={monthlyContribution}
                        onChange={(e) => setMonthlyContribution(e.target.value)}
                        placeholder={
                          calculateMonthlyNeeded() === -1 
                            ? "Date has passed" 
                            : calculateMonthlyNeeded().toFixed(2)
                        }
                        className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-primary font-light"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* AI Suggestion */}
                  {targetAmount && targetDate && (
                    <div className="p-4 bg-gold/5 rounded-xl border border-gold/20">
                      <p className="text-sm font-light text-primary">
                        💡 To reach your goal, you'll need to save approximately{' '}
                        <span className="font-medium text-gold">
                          {formatCurrency(calculateMonthlyNeeded(), { currency })}
                        </span>{' '}
                        per month
                      </p>
                    </div>
                  )}
                </form>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 bg-gray-100 text-primary/60 rounded-xl hover:bg-gray-200 transition-colors font-light"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="flex-1 px-6 py-3 bg-gold text-white rounded-xl hover:bg-gold-dark transition-colors font-light"
                  >
                    Create Goal
                  </button>
                </div>
              </div>
            </GlassContainer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 