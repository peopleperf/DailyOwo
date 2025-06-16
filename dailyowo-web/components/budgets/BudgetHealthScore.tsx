'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';

interface BudgetHealthScoreProps {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  suggestions: string[];
}

export function BudgetHealthScore({ score, status, suggestions }: BudgetHealthScoreProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
    }
  };

  const getStatusBgColor = () => {
    switch (status) {
      case 'excellent': return 'bg-green-100';
      case 'good': return 'bg-blue-100';
      case 'fair': return 'bg-yellow-100';
      case 'poor': return 'bg-red-100';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'excellent': return CheckCircle;
      case 'good': return TrendingUp;
      case 'fair': return AlertCircle;
      case 'poor': return TrendingDown;
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <GlassContainer className="p-4 md:p-6 relative overflow-visible">
      <div className="flex items-center justify-between">
        {/* Left side - Score and Status */}
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="w-10 h-10 md:w-12 md:h-12 bg-gold/10 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5 md:w-6 md:h-6 text-gold" />
          </div>
          
          {/* Score and Status */}
          <div>
            <p className="text-xs text-primary/60 mb-1">Budget Health Score</p>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl md:text-3xl font-light text-primary">
                {score}%
              </h3>
              <div className="flex items-center gap-1">
                <StatusIcon className={`w-4 h-4 ${getStatusColor()}`} />
                <span className={`${getStatusColor()} text-sm capitalize`}>
                  {status}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Suggestions Count */}
        <div className="text-right">
          <div className="flex flex-col items-end gap-1">
            <div className="text-center">
              <p className="text-xs text-primary/60">Suggestions</p>
              <p className="text-lg font-light text-primary">{suggestions.length}</p>
            </div>
            {suggestions.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-xs text-primary/60 hover:text-gold transition-colors">
                  View Suggestions ▼
                </summary>
                
                <motion.div 
                  className="absolute right-0 mt-2 w-64 md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-[9999]"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ zIndex: 9999 }}
                >
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-2 p-2 rounded-lg ${getStatusBgColor()}`}
                      >
                        <StatusIcon className={`w-3 h-3 ${getStatusColor()} flex-shrink-0 mt-0.5`} />
                        <p className="text-xs text-primary/80 leading-relaxed">{suggestion}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </details>
            )}
          </div>
        </div>
      </div>
    </GlassContainer>
  );
} 