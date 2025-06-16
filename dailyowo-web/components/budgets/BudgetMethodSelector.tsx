'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Target, Settings, Check } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';

import { BudgetMethod } from '@/lib/financial-logic/budget-logic';

interface BudgetMethodSelectorProps {
  currentMethod?: BudgetMethod['type'];
  onMethodChange: (method: BudgetMethod['type']) => void;
  monthlyIncome: number;
  currency: string;
}

export function BudgetMethodSelector({ 
  currentMethod = '50-30-20', 
  onMethodChange,
  monthlyIncome,
  currency
}: BudgetMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<BudgetMethod['type']>(currentMethod);

  const methods = [
    {
      id: '50-30-20' as const,
      name: '50/30/20 Rule',
      icon: Calculator,
      description: 'Automatic allocation: 50% needs, 30% wants, 20% savings',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      breakdown: {
        needs: monthlyIncome * 0.5,
        wants: monthlyIncome * 0.3,
        savings: monthlyIncome * 0.2
      }
    },
    {
      id: 'zero-based' as const,
      name: 'Zero-Based',
      icon: Target,
      description: 'Allocate every dollar manually for maximum control',
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      breakdown: null
    },
    {
      id: 'custom' as const,
      name: 'Custom',
      icon: Settings,
      description: 'Create your own allocation percentages',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      breakdown: null
    }
  ];

  const handleMethodSelect = (method: BudgetMethod['type']) => {
    setSelectedMethod(method);
    onMethodChange(method);
  };

  return (
    <div className="space-y-4">
      {/* Method Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {methods.map((method) => {
          const Icon = method.icon;
          const isSelected = selectedMethod === method.id;
          
          return (
            <motion.div
              key={method.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <GlassContainer
                className={`p-3 cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-2 ring-gold shadow-lg' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleMethodSelect(method.id)}
              >
                <div className="relative">
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className={`w-10 h-10 ${method.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${method.color}`} />
                  </div>
                  
                  {/* Title */}
                  <h4 className="text-base font-medium text-primary mb-1">
                    {method.name}
                  </h4>
                  
                  {/* Description */}
                  <p className="text-xs text-primary/60 mb-3 line-clamp-2">
                    {method.description}
                  </p>
                  
                  {/* Breakdown Preview - only for 50-30-20 */}
                  {method.id === '50-30-20' && method.breakdown && monthlyIncome > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-around text-center">
                        <div>
                          <p className="text-[10px] text-primary/60">Needs</p>
                          <p className="text-[11px] font-medium text-primary">50%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-primary/60">Wants</p>
                          <p className="text-[11px] font-medium text-primary">30%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-primary/60">Save</p>
                          <p className="text-[11px] font-medium text-primary">20%</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!monthlyIncome && (
                    <p className="text-xs text-yellow-600 mt-4">
                      Record income to see allocation preview
                    </p>
                  )}
                </div>
              </GlassContainer>
            </motion.div>
          );
        })}
      </div>
      
      {/* Mobile-friendly Info */}
      <div className="md:hidden mt-6">
        <GlassContainer className="p-4 bg-blue-50">
          <p className="text-xs text-blue-700">
            💡 Tip: You can change your budget method anytime. Your existing allocations will be adjusted accordingly.
          </p>
        </GlassContainer>
      </div>
    </div>
  );
} 