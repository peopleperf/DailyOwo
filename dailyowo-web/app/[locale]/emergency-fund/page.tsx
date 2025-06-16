'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAuth } from '@/lib/firebase/auth-context';
import { formatCurrency } from '@/lib/utils/format';
import { useFinancialData } from '@/hooks/useFinancialData';
import { 
  Shield, 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Brain,
  Home,
  Car,
  Utensils,
  Heart,
  Zap,
  CreditCard,
  Phone,
  Wifi,
  Plus,
  Minus,
  Lightbulb,
  Target,
  Calendar,
  DollarSign
} from 'lucide-react';

// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';

interface ExpenseCategory {
  id: string;
  name: string;
  icon: any;
  amount: number;
  isEssential: boolean;
}

interface AIRecommendation {
  type: 'increase' | 'decrease' | 'maintain';
  reason: string;
  suggestedMonths: number;
  confidence: number;
}

export default function EmergencyFundPage() {
  const router = useRouter();
  const locale = useLocale();
  const { user, userProfile, loading: authLoading } = useAuth();
  const financialData = useFinancialData();

  // All hooks must be called before any conditional returns
  const { monthlyIncome, monthlyExpenses, savingsRate } = financialData;

  // Calculator state
  const [monthsToCover, setMonthsToCover] = useState(6);
  const [customExpenses, setCustomExpenses] = useState<ExpenseCategory[]>([
    { id: 'housing', name: 'Rent/Mortgage', icon: Home, amount: 1200, isEssential: true },
    { id: 'utilities', name: 'Utilities', icon: Zap, amount: 200, isEssential: true },
    { id: 'groceries', name: 'Groceries', icon: Utensils, amount: 400, isEssential: true },
    { id: 'insurance', name: 'Insurance', icon: Shield, amount: 150, isEssential: true },
    { id: 'transport', name: 'Transportation', icon: Car, amount: 300, isEssential: true },
    { id: 'debt', name: 'Debt Payments', icon: CreditCard, amount: 200, isEssential: true },
    { id: 'phone', name: 'Phone/Internet', icon: Phone, amount: 100, isEssential: true },
    { id: 'healthcare', name: 'Healthcare', icon: Heart, amount: 150, isEssential: true },
  ]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push(`/${locale}/auth/login`);
      } else if (!userProfile?.onboardingCompleted) {
        router.push(`/${locale}/onboarding`);
      }
    }
  }, [user, userProfile, authLoading, router, locale]);

  // Calculate essential expenses
  const totalEssentialExpenses = customExpenses
    .filter(expense => expense.isEssential)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate emergency fund target
  const emergencyFundTarget = totalEssentialExpenses * monthsToCover;

  // Current emergency fund (simplified - could be from a specific savings account)
  const currentEmergencyFund = monthlyIncome * 0.5; // Placeholder

  // Progress towards goal
  const progressPercentage = emergencyFundTarget > 0 
    ? Math.min((currentEmergencyFund / emergencyFundTarget) * 100, 100) 
    : 0;

  // Monthly savings needed to reach goal in 12 months
  const remainingAmount = Math.max(0, emergencyFundTarget - currentEmergencyFund);
  const targetMonths = 12; // Could be made configurable
  const monthlySavingsNeeded = targetMonths > 0 ? remainingAmount / targetMonths : 0;

  // AI Recommendations based on financial patterns
  const generateAIRecommendation = (): AIRecommendation => {
    const incomeToExpenseRatio = monthlyIncome > 0 ? monthlyExpenses / monthlyIncome : 1;
    const savingsCapacity = monthlyIncome - monthlyExpenses;
    const actualSavingsRate = typeof savingsRate === 'object' ? savingsRate.savingsRate : savingsRate;
    
    // Analyze spending patterns and financial stability
    if (actualSavingsRate < 10) {
      return {
        type: 'increase',
        reason: 'Your low savings rate indicates financial vulnerability. Consider increasing your emergency fund to 8-12 months.',
        suggestedMonths: 9,
        confidence: 85
      };
    } else if (actualSavingsRate > 30 && incomeToExpenseRatio < 0.6) {
      return {
        type: 'decrease',
        reason: 'Your high savings rate and low expense ratio suggest you could maintain a smaller emergency fund (3-4 months) and invest the difference.',
        suggestedMonths: 4,
        confidence: 75
      };
    } else if (monthlyExpenses > monthlyIncome * 0.8) {
      return {
        type: 'increase',
        reason: 'Your high expense-to-income ratio suggests higher financial risk. Consider 8-10 months of expenses.',
        suggestedMonths: 8,
        confidence: 90
      };
    } else {
      return {
        type: 'maintain',
        reason: 'Your financial profile suggests the standard 6 months emergency fund is appropriate for your situation.',
        suggestedMonths: 6,
        confidence: 80
      };
    }
  };

  const aiRecommendation = generateAIRecommendation();

  const updateExpenseAmount = (id: string, newAmount: number) => {
    setCustomExpenses(prev => 
      prev.map(expense => 
        expense.id === id ? { ...expense, amount: Math.max(0, newAmount) } : expense
      )
    );
  };

  const addCustomExpense = () => {
    const newExpense: ExpenseCategory = {
      id: `custom-${Date.now()}`,
      name: 'Custom Expense',
      icon: DollarSign,
      amount: 0,
      isEssential: true
    };
    setCustomExpenses(prev => [...prev, newExpense]);
  };

  const removeExpense = (id: string) => {
    setCustomExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'increase': return 'text-primary';
      case 'decrease': return 'text-primary/60';
      default: return 'text-gold';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'increase': return AlertTriangle;
      case 'decrease': return TrendingUp;
      default: return CheckCircle;
    }
  };

  // Early return after all hooks
  if (authLoading || !user || !userProfile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-gold" />
          </div>
          <p className="text-primary/60 font-light">Loading Emergency Fund Calculator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      <Container size="lg" className="py-8 md:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-light text-primary">
                Emergency Fund Calculator
              </h1>
              <p className="text-primary/50 font-light">
                Plan for financial security with AI-powered recommendations
              </p>
            </div>
          </div>
        </motion.div>

        {/* Current Status Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <GlassContainer className="p-6 bg-gradient-to-br from-green-50 to-white">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-medium text-primary">Target Amount</h3>
                <p className="text-xs text-primary/50">{monthsToCover} months of expenses</p>
              </div>
            </div>
            <p className="text-2xl font-light text-primary">
              {formatCurrency(emergencyFundTarget, { currency: userProfile.currency || 'USD', locale })}
            </p>
          </GlassContainer>

          <GlassContainer className="p-6 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h3 className="font-medium text-primary">Current Fund</h3>
                <p className="text-xs text-primary/50">{progressPercentage.toFixed(1)}% of target</p>
              </div>
            </div>
            <p className="text-2xl font-light text-primary">
              {formatCurrency(currentEmergencyFund, { currency: userProfile.currency || 'USD', locale })}
            </p>
          </GlassContainer>

          <GlassContainer className="p-6 bg-gradient-to-br from-gold/10 to-white">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-8 h-8 text-gold" />
              <div>
                <h3 className="font-medium text-primary">Monthly Savings</h3>
                <p className="text-xs text-primary/50">To reach goal in 12 months</p>
              </div>
            </div>
            <p className="text-2xl font-light text-primary">
              {formatCurrency(monthlySavingsNeeded, { currency: userProfile.currency || 'USD', locale })}
            </p>
          </GlassContainer>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <GlassContainer className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-primary">Emergency Fund Progress</h3>
              <span className="text-sm text-primary/60">{progressPercentage.toFixed(1)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className="bg-gradient-to-r from-gold to-gold-dark h-4 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-primary/60">
              <span>{formatCurrency(0, { currency: userProfile.currency || 'USD', locale })}</span>
              <span>{formatCurrency(emergencyFundTarget, { currency: userProfile.currency || 'USD', locale })}</span>
            </div>
          </GlassContainer>
        </motion.div>

        {/* AI Recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <GlassContainer className="p-6 bg-gradient-to-br from-purple-50 to-white border-purple-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-primary">AI Recommendation</h3>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    {aiRecommendation.confidence}% confidence
                  </span>
                </div>
                <p className="text-primary/70 mb-3">{aiRecommendation.reason}</p>
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = getRecommendationIcon(aiRecommendation.type);
                    return <Icon className={`w-4 h-4 ${getRecommendationColor(aiRecommendation.type)}`} />;
                  })()}
                  <span className={`text-sm font-medium ${getRecommendationColor(aiRecommendation.type)}`}>
                    Suggested: {aiRecommendation.suggestedMonths} months of expenses
                  </span>
                  {aiRecommendation.suggestedMonths !== monthsToCover && (
                    <GlassButton
                      size="sm"
                      onClick={() => setMonthsToCover(aiRecommendation.suggestedMonths)}
                      className="ml-2"
                    >
                      Apply
                    </GlassButton>
                  )}
                </div>
              </div>
            </div>
          </GlassContainer>
        </motion.div>

        {/* Calculator Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <GlassContainer className="p-6">
            <h3 className="font-medium text-primary mb-6">Emergency Fund Calculator</h3>
            
            {/* Months to Cover Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-primary/70 mb-3">
                Months of Expenses to Cover
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMonthsToCover(Math.max(1, monthsToCover - 1))}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4 text-primary" />
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-light text-primary">{monthsToCover}</span>
                  <p className="text-sm text-primary/50">months</p>
                </div>
                <button
                  onClick={() => setMonthsToCover(monthsToCover + 1)}
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4 text-primary" />
                </button>
              </div>
              <div className="flex justify-center gap-2 mt-4">
                {[3, 6, 9, 12].map(months => (
                  <button
                    key={months}
                    onClick={() => setMonthsToCover(months)}
                    className={`px-3 py-1 text-xs rounded-full transition-all ${
                      monthsToCover === months 
                        ? 'bg-gold text-white' 
                        : 'bg-gray-100 text-primary/60 hover:bg-gray-200'
                    }`}
                  >
                    {months}m
                  </button>
                ))}
              </div>
            </div>
          </GlassContainer>
        </motion.div>

        {/* Essential Expenses Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GlassContainer className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-primary">Monthly Essential Expenses</h3>
              <GlassButton size="sm" onClick={addCustomExpense}>
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </GlassButton>
            </div>

            <div className="space-y-4 mb-6">
              {customExpenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <expense.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={expense.name}
                      onChange={(e) => {
                        setCustomExpenses(prev => 
                          prev.map(exp => 
                            exp.id === expense.id ? { ...exp, name: e.target.value } : exp
                          )
                        );
                      }}
                      className="font-medium text-primary bg-transparent border-none outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary/50">$</span>
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => updateExpenseAmount(expense.id, parseFloat(e.target.value) || 0)}
                      className="w-20 text-right font-medium text-primary bg-white border border-gray-200 rounded-lg px-2 py-1 text-sm"
                    />
                  </div>
                  {expense.id.startsWith('custom-') && (
                    <button
                      onClick={() => removeExpense(expense.id)}
                      className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-primary">Total Monthly Essential Expenses</span>
                <span className="text-xl font-light text-primary">
                  {formatCurrency(totalEssentialExpenses, { currency: userProfile.currency || 'USD', locale })}
                </span>
              </div>
            </div>
          </GlassContainer>
        </motion.div>

        {/* Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <GlassContainer className="p-6 bg-gradient-to-br from-yellow-50 to-white">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-600" />
              <h3 className="font-medium text-primary">Emergency Fund Tips</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-primary/70">
              <div>
                <h4 className="font-medium text-primary mb-2">Building Your Fund</h4>
                <ul className="space-y-1">
                  <li>• Start with $1,000 as your initial goal</li>
                  <li>• Automate transfers to a separate savings account</li>
                  <li>• Use windfalls (tax refunds, bonuses) to boost your fund</li>
                  <li>• Keep funds in a high-yield savings account</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-primary mb-2">When to Use It</h4>
                <ul className="space-y-1">
                  <li>• Job loss or reduced income</li>
                  <li>• Major medical expenses</li>
                  <li>• Essential home or car repairs</li>
                  <li>• Unexpected family emergencies</li>
                </ul>
              </div>
            </div>
          </GlassContainer>
        </motion.div>
      </Container>
    </div>
  );
} 