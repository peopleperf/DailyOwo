'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, TrendingUp, Calendar, DollarSign, Home, Car, Briefcase, Heart, MoreHorizontal, Brain, Lightbulb, CheckCircle, AlertCircle } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { useAuth } from '@/lib/firebase/auth-context';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';
import { formatCurrency } from '@/lib/utils/format';
import AddGoalModal from '@/components/goals/AddGoalModal';
import GoalCard from '@/components/goals/GoalCard';
import EmptyState from '@/components/ui/EmptyState';

interface Goal {
  id: string;
  userId: string;
  name: string;
  category: 'emergency' | 'vacation' | 'home' | 'car' | 'investment' | 'custom';
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  isCompleted: boolean;
  createdAt: any;
  updatedAt: any;
}

const categoryIcons = {
  emergency: Target,
  vacation: Heart,
  home: Home,
  car: Car,
  investment: TrendingUp,
  custom: Briefcase
};

export default function GoalsPage() {
  const { user, userProfile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'insights'>('all');
  const [showAIInsights, setShowAIInsights] = useState(false);

  // Fetch goals from Firestore
  useEffect(() => {
    if (!user) return;

    const db = getFirebaseDb();
    if (!db) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'goals'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData: Goal[] = [];
      snapshot.forEach((doc) => {
        goalsData.push({
          id: doc.id,
          ...doc.data(),
          targetDate: doc.data().targetDate?.toDate() || new Date(),
        } as Goal);
      });
      
      // Sort by completion status and then by created date
      goalsData.sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) {
          return a.isCompleted ? 1 : -1;
        }
        return b.createdAt?.toMillis() - a.createdAt?.toMillis();
      });
      
      setGoals(goalsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Add new goal
  const handleAddGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    const db = getFirebaseDb();
    if (!db) return;

    try {
      await addDoc(collection(db, 'goals'), {
        ...goalData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  // Update goal progress
  const handleUpdateProgress = async (goalId: string, newAmount: number) => {
    const db = getFirebaseDb();
    if (!db) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    try {
      await updateDoc(doc(db, 'goals', goalId), {
        currentAmount: newAmount,
        isCompleted: newAmount >= goal.targetAmount,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  // Delete goal
  const handleDeleteGoal = async (goalId: string) => {
    const db = getFirebaseDb();
    if (!db) return;

    try {
      await deleteDoc(doc(db, 'goals', goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  // Filter goals
  const filteredGoals = goals.filter(goal => {
    if (activeFilter === 'active') return !goal.isCompleted;
    if (activeFilter === 'completed') return goal.isCompleted;
    return true;
  });

  const activeGoals = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);

  // AI Insights calculations
  const generateAIInsights = () => {
    if (goals.length === 0) return [];

    const insights = [];
    const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    // Progress insight
    if (overallProgress >= 75) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: 'Excellent Progress!',
        message: `You're ${overallProgress.toFixed(0)}% of the way to achieving all your goals. Keep up the momentum!`
      });
    } else if (overallProgress >= 50) {
      insights.push({
        type: 'progress',
        icon: TrendingUp,
        title: 'Steady Progress',
        message: `You're halfway there! ${overallProgress.toFixed(0)}% complete across all goals.`
      });
    } else if (overallProgress >= 25) {
      insights.push({
        type: 'warning',
        icon: AlertCircle,
        title: 'Building Momentum',
        message: `You've made a good start at ${overallProgress.toFixed(0)}%. Consider increasing monthly contributions.`
      });
    } else {
      insights.push({
        type: 'info',
        icon: Lightbulb,
        title: 'Getting Started',
        message: 'Set up automatic transfers to build consistent saving habits.'
      });
    }

    // Completion insight
    if (completedGoals.length > 0) {
      insights.push({
        type: 'success',
        icon: Target,
        title: 'Goals Achieved',
        message: `Congratulations! You've completed ${completedGoals.length} goal${completedGoals.length > 1 ? 's' : ''}.`
      });
    }

    // Category insight
    const categories = goals.reduce((acc, goal) => {
      acc[goal.category] = (acc[goal.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categories).sort(([,a], [,b]) => b - a)[0];
    if (topCategory) {
      insights.push({
        type: 'info',
        icon: Brain,
        title: 'Focus Area',
        message: `Most of your goals are ${topCategory[0].replace('_', ' ')} related. Consider diversifying your financial objectives.`
      });
    }

    return insights.slice(0, 3); // Show max 3 insights
  };

  const aiInsights = generateAIInsights();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="relative mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-primary">
                Financial Goals
              </h1>
              <p className="text-primary/60 font-light mt-2">
                Track your path to financial freedom
              </p>
            </div>
            
            {/* Create Goal Button - Top right on mobile, inline on desktop */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="
                md:relative absolute top-0 right-0
                px-6 py-3 
                bg-white/50 
                border border-gold/30 
                rounded-xl 
                flex items-center gap-2 
                hover:border-gold/50 
                hover:shadow-lg 
                transition-all
                text-primary
                font-light
                z-10
              "
            >
              <Plus className="w-5 h-5 text-gold" />
              Create Goal
            </motion.button>
          </div>
        </div>

        {/* Premium Tabs with Gold Underline - Matching Dashboard Style */}
        <div className="flex gap-8 mb-10 border-b border-gray-100">
          {[
            { id: 'all', label: 'All Goals', icon: Target, count: goals.length },
            { id: 'active', label: 'Active', icon: TrendingUp, count: activeGoals.length },
            { id: 'completed', label: 'Completed', icon: CheckCircle, count: completedGoals.length },
            { id: 'insights', label: 'Insights', icon: Brain }
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              className="relative pb-4 transition-all"
            >
              <div className={`flex items-center gap-2 text-sm font-medium ${
                activeFilter === tab.id ? 'text-primary' : 'text-primary/40'
              }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {(tab.count || 0) > 0 && tab.id !== 'insights' && (
                  <span className="ml-1 text-xs">({tab.count})</span>
                )}
              </div>
              {activeFilter === tab.id && (
                <motion.div
                  layoutId="activeGoalsTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold via-gold-light to-gold"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Summary Stats - Always on one line */}
        {goals.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <GlassContainer className="p-3 md:p-4 text-center">
                <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
                  Total Goals
                </p>
                <p className="text-xl md:text-2xl lg:text-3xl font-light text-primary">
                  {goals.length}
                </p>
              </GlassContainer>
              
              <GlassContainer className="p-3 md:p-4 text-center">
                <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
                  Total Target
                </p>
                <p className="text-xl md:text-2xl lg:text-3xl font-light text-gold">
                  {formatCurrency(
                    goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
                    { currency: userProfile?.currency || 'USD' }
                  )}
                </p>
              </GlassContainer>
              
              <GlassContainer className="p-3 md:p-4 text-center">
                <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
                  Total Saved
                </p>
                <p className="text-xl md:text-2xl lg:text-3xl font-light text-primary">
                  {formatCurrency(
                    goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
                    { currency: userProfile?.currency || 'USD' }
                  )}
                </p>
              </GlassContainer>
            </div>
          </div>
        )}

        {/* Goals Grid - Only show when not on Insights tab */}
        {activeFilter !== 'insights' && (
          <>
            {filteredGoals.length === 0 ? (
              <EmptyState
                icon={Target}
                title={
                  activeFilter === 'completed' ? 'No completed goals yet' :
                  activeFilter === 'active' ? 'No active goals' :
                  'No goals yet'
                }
                description={
                  activeFilter === 'completed' ? 'Complete your first goal to see it here' :
                  activeFilter === 'active' ? 'All your goals are completed!' :
                  'Set your first financial milestone'
                }
                action={
                  activeFilter === 'completed' ? undefined : {
                    label: "Create Goal",
                    onClick: () => setShowAddModal(true)
                  }
                }
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredGoals.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onUpdate={handleUpdateProgress}
                      onDelete={handleDeleteGoal}
                      currency={userProfile?.currency || 'USD'}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}

        {/* AI Advisory Page - Only show when Insights tab is active */}
        {activeFilter === 'insights' && (
          <div className="space-y-6">
            <GlassContainer className="p-8 text-center">
              <Brain className="w-16 h-16 text-gold mx-auto mb-4" />
              <h3 className="text-xl font-light text-primary mb-2">AI Goal Advisory Coming Soon</h3>
              <p className="text-primary/60 font-light max-w-md mx-auto">
                Get personalized recommendations and strategies to achieve your financial goals faster, 
                based on your income, expenses, and saving patterns.
              </p>
            </GlassContainer>
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      <AddGoalModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddGoal}
        currency={userProfile?.currency || 'USD'}
      />
    </>
  );
} 