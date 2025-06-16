'use client';

import { motion } from 'framer-motion';
import { Brain, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';

export function InsightTab() {
  // Placeholder insights - in the future this would come from AI analysis
  const insights = [
    {
      type: 'optimization',
      icon: TrendingUp,
      title: 'Savings Rate Opportunity',
      description: 'Your current savings rate is excellent at 97.5%. Consider diversifying into investment assets for growth.',
      priority: 'high',
      action: 'Explore investment options in the Assets tab',
      impact: 'High potential for wealth growth'
    },
    {
      type: 'warning',
      icon: AlertTriangle,
      title: 'Emergency Fund Gap',
      description: 'Build an emergency fund covering 3-6 months of expenses for financial security.',
      priority: 'medium',
      action: 'Set aside €300-600 monthly in a high-yield savings account',
      impact: 'Provides financial stability'
    },
    {
      type: 'success',
      icon: CheckCircle,
      title: 'Expense Control',
      description: 'Your expense management is excellent with low monthly spending.',
      priority: 'low',
      action: 'Continue maintaining this spending discipline',
      impact: 'Maintains healthy financial habits'
    }
  ];

  const upcomingFeatures = [
    {
      title: 'AI Spending Analysis',
      description: 'Get personalized insights on spending patterns and optimization opportunities',
      eta: 'Coming Soon'
    },
    {
      title: 'Investment Recommendations',
      description: 'AI-powered portfolio suggestions based on your risk profile and goals',
      eta: 'Coming Soon'
    },
    {
      title: 'Tax Optimization',
      description: 'Smart tax planning recommendations to maximize your after-tax returns',
      eta: 'Coming Soon'
    },
    {
      title: 'Goal Tracking',
      description: 'Intelligent goal setting and progress tracking with actionable steps',
      eta: 'Coming Soon'
    }
  ];

  const getIconColor = (type: string) => {
    switch (type) {
      case 'optimization': return 'text-blue-600';
      case 'warning': return 'text-orange-600';
      case 'success': return 'text-green-600';
      default: return 'text-primary/60';
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'optimization': return 'bg-blue-50 border-blue-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <GlassContainer className="p-6 text-center bg-gradient-to-br from-white via-white to-indigo/5">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <Brain className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <h2 className="text-lg font-light text-primary mb-2">AI-Powered Insights</h2>
          <p className="text-primary/60 font-light">
            Personalized financial recommendations based on your data
          </p>
        </GlassContainer>
      </motion.div>

      {/* Current Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <GlassContainer className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-5 h-5 text-primary/60" />
            <h2 className="text-lg font-light text-primary">Current Insights</h2>
          </div>

          <div className="space-y-4">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`p-6 rounded-xl border-2 ${getBgColor(insight.type)}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-6 h-6 ${getIconColor(insight.type)}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-primary">{insight.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                          insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {insight.priority} priority
                        </span>
                      </div>
                      
                      <p className="text-sm text-primary/70 mb-3">{insight.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary/60">Action:</span>
                          <span className="text-xs text-primary/80">{insight.action}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-primary/60">Impact:</span>
                          <span className="text-xs text-primary/80">{insight.impact}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlassContainer>
      </motion.div>

      {/* Financial Health Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GlassContainer className="p-6">
          <h2 className="text-lg font-light text-primary mb-6">Quick Financial Health Check</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <span className="text-sm text-primary/70">Savings Rate</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Excellent</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <span className="text-sm text-primary/70">Expense Control</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Great</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <span className="text-sm text-primary/70">Emergency Fund</span>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-600">Needs Work</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <span className="text-sm text-primary/70">Debt Management</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">No Debt</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <span className="text-sm text-primary/70">Investment Diversification</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Opportunity</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white/50 rounded-xl">
                <span className="text-sm text-primary/70">Income Stability</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Stable</span>
                </div>
              </div>
            </div>
          </div>
        </GlassContainer>
      </motion.div>

      {/* Coming Soon Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GlassContainer className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-5 h-5 text-primary/60" />
            <h2 className="text-lg font-light text-primary">Coming Soon</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {upcomingFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="p-6 bg-gradient-to-br from-white/80 to-gray-50/80 rounded-xl border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-primary">{feature.title}</h3>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                    {feature.eta}
                  </span>
                </div>
                <p className="text-sm text-primary/70">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </GlassContainer>
      </motion.div>

      {/* Call to Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassContainer className="p-8 text-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50">
          <Brain className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-primary mb-2">AI-Powered Insights Coming Soon</h3>
          <p className="text-primary/60 font-light mb-6">
            We're building advanced AI features to provide personalized financial guidance, 
            investment recommendations, and optimization strategies tailored to your unique situation.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-indigo-600">
            <Clock className="w-4 h-4" />
            <span>Stay tuned for powerful insights to accelerate your financial growth</span>
          </div>
        </GlassContainer>
      </motion.div>
    </div>
  );
} 