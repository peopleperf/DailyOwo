'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  BarChart3, 
  Lightbulb, 
  Wallet, 
  TrendingUp, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  User
} from 'lucide-react';
import { Container } from '@/components/layouts/Container';
import { CompletionStep } from '@/components/onboarding/CompletionStep';
import { FinancialProfileTab } from '@/components/dashboard/FinancialProfileTab';
import { GlassContainer } from '@/components/ui/GlassContainer';
import LineChart from '@/components/ui/charts/LineChart';
import DoughnutChart from '@/components/ui/charts/DoughnutChart';
import BarChart from '@/components/ui/charts/BarChart';
import { useAuth } from '@/lib/firebase/auth-context';
import { useFinancialData } from '@/hooks/useFinancialData';
import { formatCurrency } from '@/lib/utils/format';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import FinancialPictureModal from '@/components/ui/FinancialPictureModal';
import FinancialHealthModal from '@/components/ui/FinancialHealthModal';
import CircularProgress from '@/components/ui/CircularProgress';

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const financialData = useFinancialData();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [netWorthFilter, setNetWorthFilter] = useState('month');
  const [incomeExpenseFilter, setIncomeExpenseFilter] = useState('month');
  const [spendingFilter, setSpendingFilter] = useState('week');
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);

  // Pull to refresh functionality
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  // Extract financial data early to avoid reference errors
  const {
    netWorth: netWorthData,
    income: incomeData,
    expenses: expensesData,
    savingsRate: savingsRateData,
    debtRatio: debtRatioData,
    financialHealthScore,
    recentTransactions,
    emergencyFundMonths,
    isLoading: financialLoading,
    error: financialError
  } = financialData;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    setPullDistance(0);
    setIsPulling(false);
  };

  const pullProgress = Math.min(pullDistance / 100, 1);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && startY.current > 0) {
        currentY.current = e.touches[0].clientY;
        const distance = Math.max(0, currentY.current - startY.current);
        
        if (distance > 10) {
          setIsPulling(true);
          setPullDistance(Math.min(distance, 120));
        }
      }
    };

    const handleTouchEnd = () => {
      if (isPulling && pullDistance > 80) {
        handleRefresh();
      } else {
        setIsPulling(false);
        setPullDistance(0);
      }
      startY.current = 0;
      currentY.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance]);

  // Auto-refresh data when page is focused or navigated to
  useEffect(() => {
    const handleFocus = () => {
      // Force refresh financial data by reloading the page
      if (!financialLoading && document.visibilityState === 'visible') {
        window.location.reload();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !financialLoading) {
        // Page became visible, refresh data after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    // Add event listeners for page focus and visibility changes
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [financialLoading]);

  // Auto-refresh every 10 minutes when page is active
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden && !financialLoading) {
        window.location.reload();
      }
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
  }, [financialLoading]);

    const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'financialProfile', label: 'Financial Profile', icon: User },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = () => {
    // Try to get from firstName field first, then displayName, then email
    return userProfile?.firstName || 
           userProfile?.displayName?.split(' ')[0] || 
           user?.displayName?.split(' ')[0] || 
           user?.email?.split('@')[0] || 
           'there';
  };

  // Financial data already extracted above

  // Extract individual values for backward compatibility
  const netWorth = netWorthData.netWorth;
  const monthlyIncome = incomeData.monthlyIncome;
  const monthlyExpenses = expensesData.monthlyExpenses;
  const savingsRate = savingsRateData.savingsRate;
  const incomeGrowth = incomeData.growthPercentage || 0;
  const expenseGrowth = expensesData.growthPercentage || 0;
  const netWorthGrowth = netWorthData.growthPercentage || 0;
  const totalAssets = netWorthData.totalAssets;
  const totalLiabilities = netWorthData.totalLiabilities;

  const getIncomeVsExpenses = () => {
    // For now, show current month data - in a real app you'd have historical data
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
    
    if (incomeExpenseFilter === 'year') {
      return {
        labels: [currentMonth],
        datasets: [
          {
            label: 'Income',
            data: [monthlyIncome],
            borderColor: '#A67C00',
            backgroundColor: 'rgba(166, 124, 0, 0.05)',
            tension: 0.4,
          },
          {
            label: 'Expenses',
            data: [monthlyExpenses],
            borderColor: '#262659',
            backgroundColor: 'rgba(38, 38, 89, 0.05)',
            tension: 0.4,
          }
        ]
      };
    }
    return {
      labels: [currentMonth],
      datasets: [
        {
          label: 'Income',
          data: [monthlyIncome],
          borderColor: '#A67C00',
          backgroundColor: 'rgba(166, 124, 0, 0.05)',
          tension: 0.4,
        },
        {
          label: 'Expenses',
          data: [monthlyExpenses],
          borderColor: '#262659',
          backgroundColor: 'rgba(38, 38, 89, 0.05)',
          tension: 0.4,
        }
      ]
    };
  };

  const getNetWorthTrend = () => {
    // For now, show current month data - in a real app you'd have historical data
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
    
    if (netWorthFilter === 'year') {
      return {
        labels: [currentMonth],
        datasets: [{
          label: 'Net Worth',
          data: [netWorth],
          borderColor: '#A67C00',
          backgroundColor: 'rgba(166, 124, 0, 0.1)',
          fill: true,
          tension: 0.4,
        }]
      };
    }
    return {
      labels: [currentMonth],
      datasets: [{
        label: 'Net Worth',
        data: [netWorth],
        borderColor: '#A67C00',
        backgroundColor: 'rgba(166, 124, 0, 0.1)',
        fill: true,
        tension: 0.4,
      }]
    };
  };

  const getSpendingTrend = () => {
    // For now, show current month data - in a real app you'd have historical data
    const currentPeriod = spendingFilter === 'month' ? 'Today' : 'This Week';
    
    if (spendingFilter === 'month') {
      return {
        labels: [currentPeriod],
        datasets: [{
          label: 'Daily Spending',
          data: [monthlyExpenses / 30], // Average daily spending
          borderColor: '#262659',
          backgroundColor: 'rgba(38, 38, 89, 0.05)',
          fill: true,
          tension: 0.4,
        }]
      };
    }
    return {
      labels: [currentPeriod],
      datasets: [{
        label: 'Weekly Spending',
        data: [monthlyExpenses / 4], // Average weekly spending
        borderColor: '#262659',
        backgroundColor: 'rgba(38, 38, 89, 0.05)',
        fill: true,
        tension: 0.4,
      }]
    };
  };

  // Real assets vs liabilities data
  const assetsVsLiabilities = {
    labels: totalAssets === 0 && totalLiabilities === 0 
      ? ['No Data Available'] 
      : ['Assets', 'Liabilities'],
    datasets: [{
      data: totalAssets === 0 && totalLiabilities === 0 
        ? [1] // Show placeholder when no data
        : [totalAssets || 0.01, totalLiabilities || 0.01], // Prevent 0 values that break charts
      backgroundColor: totalAssets === 0 && totalLiabilities === 0 
        ? ['#E5E7EB'] // Gray for no data
        : ['#A67C00', '#262659'],
      borderWidth: 0,
    }]
  };

  // Real spending by category (simplified for now - in real app you'd aggregate by category)
  const monthlySpending = {
    labels: ['Total Expenses'],
    datasets: [{
      label: 'Monthly Spending',
      data: [monthlyExpenses],
      backgroundColor: 'rgba(166, 124, 0, 0.8)',
      borderRadius: 8,
    }]
  };

  // Show error if financial data failed to load
  if (financialError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <span className="text-4xl font-bold text-gradient-gold">!</span>
          </div>
          <p className="text-primary/60 mb-4">Failed to load financial data</p>
          <button
            onClick={() => window.location.reload()}
            className="text-gold hover:text-gold-dark transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Calculate real metrics
  const netIncome = monthlyIncome - monthlyExpenses;
  
  // Use the calculated debt ratio from modular logic
  const debtToIncomeRatio = debtRatioData.debtToIncomeRatio;

  // Financial picture completion status
  const hasAssets = totalAssets > 0;
  const hasLiabilities = totalLiabilities > 0;
  const isFinancialPictureComplete = hasAssets && hasLiabilities;

  return (
    <div className="min-h-screen bg-white relative">
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ 
              opacity: 1, 
              y: pullDistance / 2,
              rotate: isRefreshing ? 360 : pullProgress * 360,
            }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ 
              opacity: { duration: 0.2 },
              rotate: isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}
            }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
              <RefreshCw className={`w-6 h-6 text-gold ${isRefreshing ? 'animate-spin' : ''}`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Container size="lg" className="py-8 md:py-12 pb-24">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
          style={{ transform: `translateY(${pullDistance}px)` }}
        >
          <h1 className="text-2xl md:text-3xl font-light text-primary mb-2">
            {getGreeting()}, <span className="font-semibold">{getFirstName()}</span>
          </h1>
          <p className="text-primary/50 font-light">
            Your journey to financial freedom continues
          </p>
        </motion.div>

        {/* Premium Tabs with Gold Underline */}
        <div className="flex gap-8 mb-10 border-b border-gray-100">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              className="relative pb-4 transition-all"
            >
              <div className={`flex items-center gap-2 text-sm font-medium ${
                activeTab === tab.id ? 'text-primary' : 'text-primary/40'
              }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </div>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold via-gold-light to-gold"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Net Worth Card - Premium with Status Indicator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GlassContainer className="p-8 md:p-10 bg-gradient-to-br from-white via-white to-gold/5" goldBorder glowAnimation>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-primary/40 text-sm font-light tracking-wide uppercase">Net Worth</p>
                        <button
                          onClick={() => setShowFinancialModal(true)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all hover:scale-110 ${
                            isFinancialPictureComplete 
                              ? 'bg-green-100 hover:bg-green-200' 
                              : 'bg-red-100 hover:bg-red-200'
                          }`}
                          title={isFinancialPictureComplete ? 'Financial picture complete' : 'Complete your financial picture'}
                        >
                          {isFinancialPictureComplete ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                      </div>
                      <h2 className="text-5xl md:text-6xl font-light text-primary mb-3">
                        {formatCurrency(netWorth, { currency: userProfile?.currency || 'USD', locale })}
                      </h2>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gold" />
                        <span className="text-gold font-light text-sm">
                          {netWorthGrowth > 0 ? '+' : ''}{netWorthGrowth.toFixed(1)}% this month
                        </span>
                        <span className="text-xs text-primary/50 ml-2">
                          ({totalAssets === 0 && totalLiabilities === 0 ? 'Cash Flow' : 'Assets - Debts'})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="w-16 h-16 md:w-28 md:h-28 bg-gradient-to-br from-gold/10 to-gold/5 rounded-full flex items-center justify-center">
                        <Wallet className="w-8 h-8 md:w-14 md:h-14 text-gold" />
                      </div>
                    </div>
                  </div>
                </GlassContainer>
              </motion.div>

              {/* Financial Health Score - Premium Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <GlassContainer className="p-6 md:p-8 bg-gradient-to-br from-white via-white to-gold/5 hover:shadow-xl transition-all cursor-pointer" goldBorder onClick={() => setShowHealthModal(true)}>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-primary/40 font-light tracking-wide uppercase">Financial Health Score</p>
                        <div className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center hover:bg-gold/30 transition-all">
                          <Info className="w-3 h-3 text-gold" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Score Display */}
                      <div className="flex flex-col items-center justify-center">
                        <CircularProgress 
                          percentage={financialHealthScore.score}
                          size={120}
                          strokeWidth={8}
                        />
                        <p className="mt-3 text-sm text-primary/60">
                          <span className={`font-medium ${
                            financialHealthScore.rating === 'excellent' ? 'text-green-600' :
                            financialHealthScore.rating === 'good' ? 'text-blue-600' :
                            financialHealthScore.rating === 'fair' ? 'text-yellow-600' :
                            financialHealthScore.rating === 'needs-improvement' ? 'text-orange-600' :
                            'text-red-600'
                          }`}>
                            {financialHealthScore.rating.replace('-', ' ')}
                          </span>
                        </p>
                      </div>
                      
                      {/* Component Scores */}
                      <div className="md:col-span-2 space-y-3">
                        <h3 className="text-sm font-medium text-primary mb-2">Score Breakdown</h3>
                        {Object.entries(financialHealthScore.componentScores).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-sm text-primary/60 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <div className="flex items-center gap-3">
                              <div className="w-24 bg-gray-100 rounded-full h-2">
                                <div 
                                  className="bg-gold h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${value}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-primary min-w-[30px] text-right">
                                {value}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {financialHealthScore.recommendations.length > 0 && (
                      <div className="mt-6 p-3 bg-primary/5 rounded-lg">
                        <p className="text-xs text-primary/80">
                          💡 {financialHealthScore.recommendations[0]}
                        </p>
                      </div>
                    )}
                  </div>
                </GlassContainer>
              </motion.div>

              {/* Key Metrics Grid - Premium Style */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-4"
              >
                <GlassContainer className="p-6 hover:shadow-lg transition-shadow">
                  <p className="text-xs text-primary/40 mb-2 font-light tracking-wide uppercase">Income</p>
                  <p className="text-2xl font-light text-primary">
                    {formatCurrency(monthlyIncome, { currency: userProfile?.currency || 'USD', locale })}
                  </p>
                  <p className="text-xs text-gold mt-2">
                    {incomeGrowth > 0 ? '+' : ''}{incomeGrowth}% vs last month
                  </p>
                </GlassContainer>

                <GlassContainer className="p-6 hover:shadow-lg transition-shadow">
                  <p className="text-xs text-primary/40 mb-2 font-light tracking-wide uppercase">Expenses</p>
                  <p className="text-2xl font-light text-primary">
                    {formatCurrency(monthlyExpenses, { currency: userProfile?.currency || 'USD', locale })}
                  </p>
                  <p className="text-xs text-primary/50 mt-2">
                    {expenseGrowth > 0 ? '+' : ''}{expenseGrowth}% vs last month
                  </p>
                </GlassContainer>

                <GlassContainer className="p-6 hover:shadow-lg transition-shadow">
                  <p className="text-xs text-primary/40 mb-2 font-light tracking-wide uppercase">Savings Rate</p>
                  <p className="text-2xl font-light text-gold">{savingsRate}%</p>
                  <p className="text-xs text-primary/50 mt-2">
                    {savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs Work'}
                  </p>
                </GlassContainer>

                <GlassContainer className="p-6 hover:shadow-lg transition-shadow">
                  <p className="text-xs text-primary/40 mb-2 font-light tracking-wide uppercase">Debt Ratio</p>
                  <p className="text-2xl font-light text-primary">{debtToIncomeRatio}%</p>
                  <p className="text-xs text-primary/50 mt-2">
                    {debtToIncomeRatio === 0 ? 'Debt Free' : debtToIncomeRatio <= 36 ? 'Manageable' : 'High'}
                  </p>
                </GlassContainer>
              </motion.div>

              {/* Recent Activity - Premium List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GlassContainer className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-light tracking-wide uppercase text-primary/60">Recent Activity</h3>
                    <button
                      onClick={() => router.push(`/${locale}/transactions`)}
                      className="text-xs text-gold hover:text-gold-dark transition-colors"
                    >
                      View All →
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {recentTransactions.length > 0 ? recentTransactions.map((transaction, index) => (
                      <motion.div 
                        key={index} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-1 h-8 rounded-full ${
                            transaction.type === 'income' ? 'bg-gold' : 'bg-gray-200'
                          }`} />
                          <div>
                            <span className="text-primary block font-light">{transaction.description}</span>
                            <span className="text-xs text-primary/40">{transaction.date.toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={`font-light ${
                          transaction.type === 'income' ? 'text-gold' : 'text-primary'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatCurrency(transaction.amount, { 
                            currency: transaction.currency || userProfile?.currency || 'USD', 
                            locale 
                          })}
                        </span>
                      </motion.div>
                    )) : (
                      <div className="text-center py-8">
                        <p className="text-primary/40 font-light">No recent transactions</p>
                        <button
                          onClick={() => router.push(`/${locale}/transactions/new`)}
                          className="text-gold hover:text-gold-dark transition-colors text-sm mt-2"
                        >
                          Add your first transaction →
                        </button>
                      </div>
                    )}
                  </div>
                </GlassContainer>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Net Worth Trend */}
              <GlassContainer className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-light tracking-wide uppercase text-primary/60">Net Worth Trend</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNetWorthFilter('month')}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        netWorthFilter === 'month' 
                          ? 'bg-gold text-white' 
                          : 'text-primary/40 hover:text-primary'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setNetWorthFilter('year')}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        netWorthFilter === 'year' 
                          ? 'bg-gold text-white' 
                          : 'text-primary/40 hover:text-primary'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
                <LineChart
                  data={getNetWorthTrend()}
                  height={300}
                  currency={userProfile?.currency || 'USD'}
                />
              </GlassContainer>

              {/* Income vs Expenses Chart */}
              <GlassContainer className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-light tracking-wide uppercase text-primary/60">Income vs Expenses</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIncomeExpenseFilter('month')}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        incomeExpenseFilter === 'month' 
                          ? 'bg-gold text-white' 
                          : 'text-primary/40 hover:text-primary'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setIncomeExpenseFilter('year')}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        incomeExpenseFilter === 'year' 
                          ? 'bg-gold text-white' 
                          : 'text-primary/40 hover:text-primary'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
                <LineChart
                  data={getIncomeVsExpenses()}
                  height={300}
                  currency={userProfile?.currency || 'USD'}
                />
              </GlassContainer>

              {/* Assets vs Liabilities & Monthly Spending */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <GlassContainer className="p-6">
                  <h3 className="text-sm font-light tracking-wide uppercase text-primary/60 mb-6">Asset Allocation</h3>
                  <DoughnutChart
                    data={assetsVsLiabilities}
                    height={250}
                    currency={userProfile?.currency || 'USD'}
                  />
                  {totalAssets === 0 && totalLiabilities === 0 && (
                    <div className="text-center mt-4">
                      <p className="text-xs text-primary/40 font-light">
                        Add assets and liabilities to see your allocation
                      </p>
                      <button
                        onClick={() => setShowFinancialModal(true)}
                        className="text-xs text-gold hover:text-gold-dark transition-colors mt-1"
                      >
                        Complete Financial Profile →
                      </button>
                    </div>
                  )}
                </GlassContainer>

                <GlassContainer className="p-6">
                  <h3 className="text-sm font-light tracking-wide uppercase text-primary/60 mb-6">Category Breakdown</h3>
                  <BarChart
                    data={monthlySpending}
                    height={250}
                    currency={userProfile?.currency || 'USD'}
                  />
                </GlassContainer>
              </div>

              {/* Interactive Spending Trend */}
              <GlassContainer className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-light tracking-wide uppercase text-primary/60">Spending Pattern</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSpendingFilter('week')}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        spendingFilter === 'week' 
                          ? 'bg-gold text-white' 
                          : 'text-primary/40 hover:text-primary'
                      }`}
                    >
                      Weekly
                    </button>
                    <button
                      onClick={() => setSpendingFilter('month')}
                      className={`px-3 py-1 text-xs rounded-full transition-all ${
                        spendingFilter === 'month' 
                          ? 'bg-gold text-white' 
                          : 'text-primary/40 hover:text-primary'
                      }`}
                    >
                      Daily
                    </button>
                  </div>
                </div>
                <LineChart
                  data={getSpendingTrend()}
                  height={300}
                  currency={userProfile?.currency || 'USD'}
                />
              </GlassContainer>
            </motion.div>
          )}

          {activeTab === 'financialProfile' && (
            <FinancialProfileTab />
          )}

          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <GlassContainer className="p-8 text-center">
                <Lightbulb className="w-16 h-16 text-gold mx-auto mb-4" />
                <h3 className="text-xl font-light text-primary mb-2">AI Insights Coming Soon</h3>
                <p className="text-primary/60 font-light">
                  Personalized financial insights and recommendations based on your spending patterns.
                </p>
              </GlassContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      {/* Financial Picture Modal */}
      <FinancialPictureModal
        isOpen={showFinancialModal}
        onClose={() => setShowFinancialModal(false)}
        hasAssets={hasAssets}
        hasLiabilities={hasLiabilities}
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
        currency={userProfile?.currency || 'USD'}
      />

      {/* Financial Health Score Modal */}
      <FinancialHealthModal
        isOpen={showHealthModal}
        onClose={() => setShowHealthModal(false)}
        healthScore={financialHealthScore}
      />
    </div>
  );
} 