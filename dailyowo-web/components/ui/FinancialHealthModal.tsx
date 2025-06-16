'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';
import { FinancialHealthScore } from '@/lib/financial-logic/financial-health-logic';
import CircularProgress from './CircularProgress';

interface FinancialHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  healthScore: FinancialHealthScore;
}

export default function FinancialHealthModal({ isOpen, onClose, healthScore }: FinancialHealthModalProps) {
  const components = [
    {
      name: 'Net Worth',
      description: 'Your total assets minus liabilities',
      weight: 30,
      score: healthScore.componentScores.netWorth,
      tips: [
        'Build emergency fund (3-6 months expenses)',
        'Pay down high-interest debt',
        'Invest in diversified assets'
      ]
    },
    {
      name: 'Income',
      description: 'Monthly earnings and stability',
      weight: 25,
      score: healthScore.componentScores.income,
      tips: [
        'Diversify income sources',
        'Negotiate salary increases',
        'Develop passive income streams'
      ]
    },
    {
      name: 'Expenses',
      description: 'Spending control and efficiency',
      weight: 20,
      score: healthScore.componentScores.spending,
      tips: [
        'Track all expenses',
        'Reduce discretionary spending',
        'Optimize fixed costs'
      ]
    },
    {
      name: 'Savings Rate',
      description: 'Percentage of income saved',
      weight: 15,
      score: healthScore.componentScores.savings,
      tips: [
        'Aim for 20%+ savings rate',
        'Automate savings transfers',
        'Increase savings with raises'
      ]
    },
    {
      name: 'Debt Ratio',
      description: 'Debt management effectiveness',
      weight: 10,
      score: healthScore.componentScores.debt,
      tips: [
        'Keep debt-to-income below 36%',
        'Pay more than minimums',
        'Avoid new high-interest debt'
      ]
    }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (score >= 60) return <TrendingUp className="w-5 h-5 text-blue-600" />;
    if (score >= 40) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <TrendingDown className="w-5 h-5 text-red-600" />;
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-4 right-4 top-[5%] bottom-[5%] md:left-1/2 md:-translate-x-1/2 md:top-[10%] md:bottom-[10%] md:w-full md:max-w-2xl bg-white rounded-2xl shadow-xl z-50 overflow-hidden"
          >
            <div className="h-full flex flex-col max-h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                  <h2 className="text-2xl font-light text-primary">Financial Health Score</h2>
                  <p className="text-sm text-primary/60">How your {healthScore.score}/100 score is calculated</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-primary/60" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Overall Score */}
                <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-primary mb-1">Your Overall Score</h3>
                      <p className="text-sm text-primary/60">{healthScore.summary}</p>
                    </div>
                    <div className={`text-3xl font-bold ${getScoreColor(healthScore.score)}`}>
                      {healthScore.score}/100
                    </div>
                  </div>
                  <CircularProgress 
                    percentage={healthScore.score}
                    size={100}
                    strokeWidth={8}
                    showPercentage={false}
                  />
                </div>

                {/* Score Components */}
                <div className="space-y-4 mb-6">
                  <h3 className="text-lg font-medium text-primary">Score Breakdown</h3>
                  {components.map((component) => (
                    <div key={component.name} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-primary">{component.name}</h4>
                          <p className="text-sm text-primary/60">{component.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getScoreIcon(component.score)}
                          <span className={`text-lg font-semibold ${getScoreColor(component.score)}`}>
                            {component.score}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-primary/60 mb-1">
                          <span>Weight: {component.weight}%</span>
                          <span>Contribution: {Math.round(component.score * component.weight / 100)} points</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gold h-2 rounded-full transition-all duration-500"
                            style={{ width: `${component.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculation Formula */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-primary mb-2">How It's Calculated</h3>
                  <p className="text-sm text-primary/80 mb-3">
                    Your financial health score is a weighted average of five key components:
                  </p>
                  <div className="space-y-2 text-sm text-primary/70">
                    <p>
                      <strong>Formula:</strong> Net Worth (30%) + Income (25%) + Expenses (20%) + Savings Rate (15%) + Debt Ratio (10%) = {healthScore.score}/100
                    </p>
                    <p className="text-xs text-primary/60 mt-2">
                      Each component is scored 0-100 based on financial best practices and your personal situation.
                    </p>
                  </div>
                </div>

                {/* Improvement Tips */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-primary">Ways to Improve</h3>
                  {components
                    .filter(c => c.score < 80)
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 3)
                    .map((component) => (
                      <div key={component.name} className="bg-yellow-50 rounded-lg p-4">
                        <h4 className="font-medium text-primary mb-2">
                          Improve {component.name} (Currently {component.score}/100)
                        </h4>
                        <ul className="space-y-1">
                          {component.tips.map((tip, index) => (
                            <li key={index} className="text-sm text-primary/70 flex items-start">
                              <span className="text-gold mr-2">•</span>
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>

                {/* Recommendations */}
                {healthScore.recommendations.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h3 className="text-lg font-medium text-primary">Personalized Recommendations</h3>
                    <div className="space-y-2">
                      {healthScore.recommendations.slice(0, 5).map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-primary/80">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 