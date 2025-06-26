'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { Icon } from '@/components/ui/Icon';
import { Target, TrendingUp, Home, Car, Plane, Heart, GraduationCap, Shield } from 'lucide-react';

interface FinancialAspirationsStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const GOAL_TEMPLATES = [
  {
    id: 'emergency',
    icon: Shield,
    title: 'Emergency Fund',
    description: '3-6 months of expenses for security',
    color: 'bg-blue-500',
    suggested: true
  },
  {
    id: 'house',
    icon: Home,
    title: 'Dream Home',
    description: 'Save for your perfect home',
    color: 'bg-green-500'
  },
  {
    id: 'travel',
    icon: Plane,
    title: 'Travel Fund',
    description: 'Explore the world in style',
    color: 'bg-purple-500'
  },
  {
    id: 'car',
    icon: Car,
    title: 'Vehicle Purchase',
    description: 'Your next car or upgrade',
    color: 'bg-red-500'
  },
  {
    id: 'education',
    icon: GraduationCap,
    title: 'Education',
    description: 'Invest in learning and growth',
    color: 'bg-indigo-500'
  },
  {
    id: 'wedding',
    icon: Heart,
    title: 'Wedding',
    description: 'Your special day celebration',
    color: 'bg-pink-500'
  }
];

export function FinancialAspirationsStep({ data, onNext, onBack }: FinancialAspirationsStepProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.selectedGoals || []);
  const [primaryGoal, setPrimaryGoal] = useState(data.primaryGoal || '');
  const [monthlyAmount, setMonthlyAmount] = useState(data.monthlyAmount || '');
  const [currentSavings, setCurrentSavings] = useState(data.currentSavings || '');

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => {
      const updated = prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId];
      
      // Auto-select emergency fund as primary if selected and no primary exists
      if (goalId === 'emergency' && !prev.includes(goalId) && !primaryGoal) {
        setPrimaryGoal(goalId);
      }
      
      return updated;
    });
  };

  const handleContinue = () => {
    // Create goal data structure
    const goals = selectedGoals.map(goalId => {
      const template = GOAL_TEMPLATES.find(g => g.id === goalId);
      return {
        id: goalId,
        title: template?.title || '',
        isPrimary: goalId === primaryGoal,
        template: true
      };
    });

    onNext({
      selectedGoals,
      primaryGoal,
      monthlyAmount: monthlyAmount ? parseFloat(monthlyAmount) : undefined,
      currentSavings: currentSavings ? parseFloat(currentSavings) : undefined,
      goals,
      financialAspirationsComplete: true
    });
  };

  const currencySymbol = data.currencySymbol || '$';

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Target className="w-8 h-8 text-gold" />
        </div>
        <h2 className="text-3xl font-light text-primary mb-4">
          What are your financial aspirations?
        </h2>
        <p className="text-lg font-light text-primary/70 max-w-2xl mx-auto">
          Select the goals that matter most to you. We'll help you create actionable plans to achieve them.
        </p>
      </motion.div>

      <GlassContainer className="p-8 md:p-10 bg-gradient-to-br from-white via-white to-gold/5" goldBorder>
        <div className="space-y-10">
          {/* Goal Selection */}
          <div>
            <h3 className="text-xl font-light text-primary mb-6">
              Choose your financial goals
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {GOAL_TEMPLATES.map((goal, index) => (
                <motion.button
                  key={goal.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  onClick={() => handleGoalToggle(goal.id)}
                  className={`glass-subtle p-5 rounded-xl border-2 text-left transition-all ${
                    selectedGoals.includes(goal.id)
                      ? 'border-gold bg-gold/5 shadow-md'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedGoals.includes(goal.id) ? goal.color : 'bg-gray-200'
                    } transition-colors`}>
                      <goal.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-light text-primary">
                          {goal.title}
                        </h4>
                        {goal.suggested && (
                          <span className="text-xs font-light tracking-wide uppercase bg-gold/10 text-gold px-2 py-0.5 rounded-full">
                            Suggested
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-light text-primary/60">
                        {goal.description}
                      </p>
                    </div>
                    <div className="mt-1">
                      <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                        selectedGoals.includes(goal.id)
                          ? 'bg-gold border-gold'
                          : 'border-gray-300'
                      }`}>
                        {selectedGoals.includes(goal.id) && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-full h-full flex items-center justify-center"
                          >
                            <Icon name="check" size="xs" className="text-white" />
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Primary Goal Selection */}
          {selectedGoals.length > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              <h3 className="text-xl font-light text-primary mb-4">
                Which goal is your top priority?
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedGoals.map((goalId) => {
                  const goal = GOAL_TEMPLATES.find(g => g.id === goalId);
                  return (
                    <button
                      key={goalId}
                      onClick={() => setPrimaryGoal(goalId)}
                      className={`glass-subtle p-4 rounded-xl border-2 transition-all ${
                        primaryGoal === goalId
                          ? 'border-gold bg-gold/5'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      {goal && <goal.icon className="w-6 h-6 text-primary mx-auto mb-2" />}
                      <p className="text-sm font-light text-primary">{goal?.title}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Financial Context (Optional) */}
          {selectedGoals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="overflow-hidden"
            >
              <h3 className="text-xl font-light text-primary mb-6">
                Help us personalize your journey <span className="text-sm font-light text-primary/50">(optional)</span>
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-light tracking-wide uppercase text-primary/60 mb-3">
                    How much can you save monthly?
                  </label>
                  <GlassInput
                    type="text"
                    value={monthlyAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d.]/g, '');
                      setMonthlyAmount(value);
                    }}
                    placeholder="500"
                    icon={<TrendingUp size={18} className="text-primary/40" />}
                    className="text-lg font-light"
                  />
                  <p className="text-xs font-light text-primary/50 mt-2">
                    We'll suggest realistic timelines for your goals
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-light tracking-wide uppercase text-primary/60 mb-3">
                    Current total savings
                  </label>
                  <GlassInput
                    type="text"
                    value={currentSavings}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d.]/g, '');
                      setCurrentSavings(value);
                    }}
                    placeholder="5000"
                    icon={<span className="text-primary/40 text-sm">{currencySymbol}</span>}
                    className="text-lg font-light"
                  />
                  <p className="text-xs font-light text-primary/50 mt-2">
                    Helps us understand your starting point
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Motivational note */}
          {selectedGoals.length > 0 && (
            <div className="glass-subtle p-4 rounded-xl flex items-start gap-3">
              <Target className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
              <div className="text-sm font-light text-primary/70">
                <p>
                  You can add specific target amounts and deadlines for each goal after setup. 
                  We'll help you create detailed action plans with AI-powered insights.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-10">
          <GlassButton
            variant="ghost"
            onClick={onBack}
            className="font-light"
          >
            <Icon name="arrowLeft" size="sm" className="mr-2" />
            Back
          </GlassButton>
          <div className="flex gap-3">
            {selectedGoals.length === 0 && (
              <GlassButton
                variant="ghost"
                onClick={() => onNext({ skipFinancialGoals: true })}
                className="font-light"
              >
                Skip for Now
              </GlassButton>
            )}
            <GlassButton
              variant="primary"
              goldBorder
              onClick={handleContinue}
              disabled={selectedGoals.length === 0}
              className="font-light"
            >
              Continue
              <Icon name="arrowRight" size="sm" className="ml-2" />
            </GlassButton>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
}