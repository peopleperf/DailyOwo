'use client';

import { motion } from 'framer-motion';
import { Lightbulb, ArrowRight } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';

interface BudgetOptimizationCardProps {
  recommendation: {
    title: string;
    description: string;
    impact: string;
    category: string;
  };
  onApply: () => void;
}

export function BudgetOptimizationCard({ recommendation, onApply }: BudgetOptimizationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <GlassContainer className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-gold" />
          </div>
          
          <div className="flex-1">
            <h5 className="text-sm font-medium text-primary mb-1">
              {recommendation.title}
            </h5>
            <p className="text-xs text-primary/60 mb-2">
              {recommendation.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-green-600">
                {recommendation.impact}
              </span>
              <span className="text-xs text-primary/40">
                {recommendation.category}
              </span>
            </div>
          </div>

          <GlassButton
            onClick={onApply}
            size="sm"
            goldBorder
            className="flex items-center gap-1"
          >
            Apply
            <ArrowRight className="w-3 h-3" />
          </GlassButton>
        </div>
      </GlassContainer>
    </motion.div>
  );
} 