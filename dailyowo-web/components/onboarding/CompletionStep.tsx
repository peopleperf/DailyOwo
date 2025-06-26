'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { formatCurrency, formatPercentage } from '@/lib/utils/format';
import { CheckCircle, TrendingUp, Wallet, Target, Shield, Sparkles, Star, ChevronRight, LayoutDashboard, Brain, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CompletionStepProps {
  data: any;
  onComplete: () => void;
  isLoading?: boolean;
}

export function CompletionStep({ data, onComplete, isLoading = false }: CompletionStepProps) {
  const [showContent, setShowContent] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai-insights'>('overview');

  // Trigger confetti on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A67C00', '#262659', '#FFD700', '#4169E1']
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Calculate financial metrics
  const monthlyIncome = parseFloat(data.monthlyIncome) || 0;
  const monthlyExpenses = parseFloat(data.monthlyExpenses) || 0;
  const currentSavings = parseFloat(data.currentSavings) || 0;
  const currentDebt = parseFloat(data.currentDebt) || 0;
  
  const monthlySavings = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
  const netWorth = currentSavings - currentDebt;
  const emergencyFundMonths = monthlyExpenses > 0 ? currentSavings / monthlyExpenses : 0;

  const insights = [
    {
      icon: TrendingUp,
      title: 'Net Worth',
      value: formatCurrency(netWorth, { currency: data.currency }),
      subtitle: netWorth >= 0 ? 'Looking strong!' : 'Let\'s improve this',
      color: netWorth >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: netWorth >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100',
      iconBg: netWorth >= 0 ? 'bg-green-500' : 'bg-red-500'
    },
    {
      icon: Wallet,
      title: 'Monthly Savings',
      value: formatCurrency(monthlySavings, { currency: data.currency }),
      subtitle: monthlySavings >= 0 ? 'Every bit counts!' : 'Time to optimize',
      color: monthlySavings >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: monthlySavings >= 0 ? 'from-green-50 to-green-100' : 'from-red-50 to-red-100',
      iconBg: monthlySavings >= 0 ? 'bg-green-500' : 'bg-red-500'
    },
    {
      icon: Target,
      title: 'Savings Rate',
      value: formatPercentage(savingsRate),
      subtitle: savingsRate >= 20 ? 'Excellent rate!' : 'Room to grow',
      color: savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600',
      bgColor: savingsRate >= 20 ? 'from-green-50 to-green-100' : savingsRate >= 10 ? 'from-yellow-50 to-yellow-100' : 'from-red-50 to-red-100',
      iconBg: savingsRate >= 20 ? 'bg-green-500' : savingsRate >= 10 ? 'bg-yellow-500' : 'bg-red-500'
    },
    {
      icon: Shield,
      title: 'Emergency Fund',
      value: `${emergencyFundMonths.toFixed(1)} months`,
      subtitle: emergencyFundMonths >= 6 ? 'Well protected!' : 'Build your safety net',
      color: emergencyFundMonths >= 6 ? 'text-green-600' : emergencyFundMonths >= 3 ? 'text-yellow-600' : 'text-red-600',
      bgColor: emergencyFundMonths >= 6 ? 'from-green-50 to-green-100' : emergencyFundMonths >= 3 ? 'from-yellow-50 to-yellow-100' : 'from-red-50 to-red-100',
      iconBg: emergencyFundMonths >= 6 ? 'bg-green-500' : emergencyFundMonths >= 3 ? 'bg-yellow-500' : 'bg-red-500'
    }
  ];

  const getRecommendations = () => {
    const recommendations = [];
    
    if (savingsRate < 10) {
      recommendations.push({
        icon: 'trendingUp',
        title: 'Boost Your Savings Rate',
        text: 'Your savings rate is a bit low. Try to identify areas where you can cut back on spending to increase your monthly savings.',
        color: 'yellow'
      });
    } else if (savingsRate < 20) {
      recommendations.push({
        icon: 'target',
        title: 'Level Up Your Savings',
        text: 'You\'re doing well! Let\'s push for 20% to accelerate your wealth building.',
        color: 'yellow'
      });
    }
    
    if (emergencyFundMonths < 3) {
      recommendations.push({
        icon: 'shield',
        title: 'Build Your Emergency Fund',
        text: 'Aim for at least 3 months of expenses in an easily accessible savings account. This will protect you from unexpected events.',
        color: 'red'
      });
    }
    
    if (currentDebt > monthlyIncome * 0.5 && currentDebt > 0) {
      recommendations.push({
        icon: 'bomb',
        title: 'Tackle High-Interest Debt',
        text: 'If you have high-interest debt (like credit cards), focus on paying it down aggressively. This can save you a lot in interest payments.',
        color: 'red'
      });
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        icon: 'star',
        title: "You're Off to a Great Start!",
        text: 'Your finances are looking solid. Keep up the good work! Explore the dashboard to track your progress and discover more insights.',
        color: 'green'
      });
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
    { id: 'ai-insights' as const, label: 'AI Insights', icon: Brain }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7 }}
      className="max-w-3xl mx-auto"
    >
      <GlassContainer className="p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gold/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-2xl" />
        
        <div className="text-center mb-10 relative z-10">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-gradient-to-br from-gold to-gold-dark rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              You're All Set!
            </h2>
            <p className="text-lg text-primary/70 max-w-md mx-auto">
              Welcome to DailyOwo! Your financial dashboard is ready.
            </p>
          </motion.div>
        </div>

        {showContent && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center gap-2 mb-8 p-1 bg-primary/5 rounded-xl"
            >
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'overview' ? 'bg-white shadow text-primary' : 'text-primary/60 hover:bg-primary/10'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('ai-insights')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${activeTab === 'ai-insights' ? 'bg-white shadow text-primary' : 'text-primary/60 hover:bg-primary/10'}`}
              >
                AI Insights
              </button>
            </motion.div>

            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {insights.map((insight, index) => (
                      <motion.div
                        key={insight.title}
                        initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        className={`bg-gradient-to-br ${insight.bgColor} p-5 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 ${insight.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
                            <insight.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-600">{insight.title}</p>
                            <p className={`text-2xl font-bold ${insight.color} mt-1`}>
                              {insight.value}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{insight.subtitle}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-10"
                  >
                    <h3 className="text-lg font-bold text-primary mb-4">What's next?</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { icon: 'plus', text: 'Track daily expenses' },
                        { icon: 'target', text: 'Set financial goals' },
                        { icon: 'piggyBank', text: 'Build emergency fund' },
                        { icon: 'barChart', text: 'Track net worth' }
                      ].map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.6 + index * 0.05 }}
                          whileHover={{ scale: 1.05 }}
                          className="glass-subtle p-4 rounded-lg cursor-pointer hover:shadow-sm transition-all"
                        >
                          <Icon name={item.icon as any} size="sm" className="text-gold mb-2" />
                          <p className="text-xs text-primary/80">{item.text}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 'ai-insights' && (
                <motion.div
                  key="ai-insights"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-yellow-400 flex items-center justify-center shadow-lg">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-primary">Personalized Recommendations</h3>
                    </div>
                    <p className="text-sm text-primary/60">Based on your financial profile, here's what we suggest:</p>
                  </div>
                  
                  <div className="space-y-4 mb-10">
                    {recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        className="glass-subtle p-5 rounded-xl hover:shadow-md transition-all group cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rec.color === 'red' ? 'bg-red-100' : rec.color === 'yellow' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                            <Icon 
                              name={rec.icon as any} 
                              size="sm" 
                              className={`${rec.color === 'red' ? 'text-red-600' : rec.color === 'yellow' ? 'text-yellow-600' : 'text-green-600'}`}
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-primary mb-1">{rec.title}</h4>
                            <p className="text-sm text-primary/70">{rec.text}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-primary/30 group-hover:text-primary/50 transition-colors" />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="p-4 bg-gradient-to-br from-gold/10 to-transparent rounded-xl">
                    <h4 className="font-semibold text-primary mb-2">Coming Soon: AI-Powered Features</h4>
                    <ul className="text-sm text-primary/70 space-y-1">
                      <li>• Smart spending analysis with category insights</li>
                      <li>• Automated budget recommendations</li>
                      <li>• Predictive cash flow forecasting</li>
                      <li>• Personalized investment suggestions</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="text-center mt-10"
            >
              <GlassButton
                variant="primary"
                goldBorder
                onClick={onComplete}
                disabled={isLoading}
                className="min-w-[240px] h-14 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Go to Dashboard
                    <Icon name="arrowRight" size="sm" className="ml-2" />
                  </>
                )}
              </GlassButton>
              <p className="text-sm text-primary/50 mt-4">
                You can always update your settings later
              </p>
            </motion.div>
          </>
        )}
      </GlassContainer>
    </motion.div>
  );
} 