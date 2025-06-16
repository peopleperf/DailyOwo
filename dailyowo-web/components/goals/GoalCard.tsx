'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Home, Car, TrendingUp, Heart, Briefcase, MoreVertical, Edit2, Trash2, Plus, Check } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { formatCurrency } from '@/lib/utils/format';
import { useAuth } from '@/lib/firebase/auth-context';
import { useLocale } from 'next-intl';

interface Goal {
  id: string;
  name: string;
  category: 'emergency' | 'vacation' | 'home' | 'car' | 'investment' | 'custom';
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  isCompleted: boolean;
}

interface GoalCardProps {
  goal: Goal;
  onUpdate: (goalId: string, newAmount: number) => void;
  onDelete: (goalId: string) => void;
  currency: string;
}

const categoryIcons = {
  emergency: Target,
  vacation: Heart,
  home: Home,
  car: Car,
  investment: TrendingUp,
  custom: Briefcase
};

const categoryColors = {
  emergency: 'text-amber-600',
  vacation: 'text-blue-600',
  home: 'text-purple-600',
  car: 'text-gray-600',
  investment: 'text-green-600',
  custom: 'text-primary'
};

export default function GoalCard({ goal, onUpdate, onDelete, currency }: GoalCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [addAmount, setAddAmount] = useState('');

  const Icon = categoryIcons[goal.category];
  const progress = goal.targetAmount > 0 
    ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
    : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  
  // Calculate time remaining with better edge case handling
  let monthsRemaining = 0;
  let isOnTrack = true;
  
  if (goal.targetDate && remaining > 0) {
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const monthsUntilTarget = Math.max(0, 
      (targetDate.getFullYear() - today.getFullYear()) * 12 + 
      (targetDate.getMonth() - today.getMonth())
    );
    
    if (goal.monthlyContribution > 0) {
      monthsRemaining = Math.ceil(remaining / goal.monthlyContribution);
      isOnTrack = monthsRemaining <= monthsUntilTarget;
    } else {
      // No monthly contribution set
      monthsRemaining = monthsUntilTarget;
      isOnTrack = false;
    }
  }

  const handleAddContribution = () => {
    const amount = parseFloat(addAmount);
    if (!isNaN(amount) && amount > 0) {
      onUpdate(goal.id, goal.currentAmount + amount);
      setAddAmount('');
      setIsEditing(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      className="relative"
    >
      <GlassContainer 
        className={`
          p-6 h-full
          ${goal.isCompleted ? 'opacity-75' : ''}
          hover:shadow-xl transition-all duration-300
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`
              w-10 h-10 rounded-xl 
              ${goal.isCompleted ? 'bg-green-100' : 'bg-gold/10'} 
              flex items-center justify-center
            `}>
              <Icon className={`
                w-5 h-5 
                ${goal.isCompleted ? 'text-green-600' : 'text-gold'}
              `} />
            </div>
            <div>
              <h3 className="font-light text-lg text-primary">{goal.name}</h3>
              <p className="text-xs text-primary/40 font-light capitalize">
                {goal.category.replace('_', ' ')}
              </p>
            </div>
          </div>
          
          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-primary/40" />
            </button>
            
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10"
              >
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left text-sm font-light"
                >
                  <Plus className="w-4 h-4" />
                  Add Funds
                </button>
                <button
                  onClick={() => {
                    onDelete(goal.id);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 w-full text-left text-sm font-light text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-3">
          {/* Amount Display */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <p className="text-2xl font-light text-primary">
                {formatCurrency(goal.currentAmount, { currency })}
              </p>
              <p className="text-sm font-light text-primary/60">
                of {formatCurrency(goal.targetAmount, { currency })}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`
                  h-full rounded-full
                  ${goal.isCompleted 
                    ? 'bg-gradient-to-r from-green-400 to-green-500' 
                    : 'bg-gradient-to-r from-gold/60 to-gold'
                  }
                `}
              />
            </div>
            <p className="text-xs font-light text-primary/40 mt-1">
              {progress.toFixed(0)}% complete
            </p>
          </div>

          {/* Status Info */}
          {goal.isCompleted ? (
            <div className="flex items-center gap-2 pt-2">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-sm font-light text-green-600">Goal achieved!</p>
            </div>
          ) : (
            <div className="pt-2 space-y-1">
              <p className="text-sm font-light text-primary/60">
                {formatCurrency(remaining, { currency })} remaining
              </p>
              {monthsRemaining > 0 && goal.monthlyContribution > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-light text-primary/40">
                    ~{monthsRemaining} months at current rate
                  </p>
                  {goal.targetDate && !isOnTrack && (
                    <p className="text-xs font-light text-red-600">
                      ⚠️ Behind schedule - increase contributions
                    </p>
                  )}
                </div>
              )}
              {goal.monthlyContribution === 0 && remaining > 0 && (
                <p className="text-xs font-light text-amber-600">
                  Set monthly contribution to track progress
                </p>
              )}
            </div>
          )}

          {/* Quick Add Form */}
          {isEditing && !goal.isCompleted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-3 border-t border-gray-100"
            >
              <div className="flex gap-2">
                <input
                  type="number"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Amount to add"
                  className="flex-1 px-3 py-2 bg-white/50 border border-gray-200 rounded-lg text-sm font-light focus:outline-none focus:border-gold"
                  autoFocus
                />
                <button
                  onClick={handleAddContribution}
                  className="px-4 py-2 bg-gold/10 text-gold rounded-lg hover:bg-gold/20 transition-colors text-sm font-light"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setAddAmount('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-primary/60 rounded-lg hover:bg-gray-200 transition-colors text-sm font-light"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </GlassContainer>
    </motion.div>
  );
} 