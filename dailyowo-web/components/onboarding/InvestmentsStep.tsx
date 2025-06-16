'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';

interface InvestmentsStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
}

const investmentTypes = [
  {
    id: 'stocks',
    name: 'Stocks & Shares',
    icon: 'lineChart',
    description: 'Individual stocks, ETFs, mutual funds',
    color: 'bg-blue-500',
  },
  {
    id: 'bonds',
    name: 'Bonds & Fixed Income',
    icon: 'shield',
    description: 'Government bonds, corporate bonds',
    color: 'bg-green-500',
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    icon: 'dollar',
    description: 'Bitcoin, Ethereum, other digital assets',
    color: 'bg-orange-500',
  },
  {
    id: 'realEstate',
    name: 'Real Estate',
    icon: 'housing',
    description: 'Properties, REITs, land',
    color: 'bg-purple-500',
  },
  {
    id: 'retirement',
    name: 'Retirement Accounts',
    icon: 'piggyBank',
    description: '401(k), IRA, pension plans',
    color: 'bg-indigo-500',
  },
  {
    id: 'other',
    name: 'Other Investments',
    icon: 'briefcase',
    description: 'Art, collectibles, business ownership',
    color: 'bg-pink-500',
  },
];

export function InvestmentsStep({ data, onNext, onBack, onSkip }: InvestmentsStepProps) {
  const [hasInvestments, setHasInvestments] = useState(data.hasInvestments || false);
  const [selectedInvestments, setSelectedInvestments] = useState<Record<string, boolean>>(
    data.investments || {}
  );

  const handleToggleInvestment = (id: string) => {
    setSelectedInvestments(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
    if (!hasInvestments) {
      setHasInvestments(true);
    }
  };

  const handleContinue = () => {
    onNext({
      hasInvestments,
      investments: selectedInvestments,
    });
  };

  const hasSelectedAny = Object.values(selectedInvestments).some(v => v);

  return (
    <GlassContainer className="p-8 md:p-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">
          Do you have investments to track?
        </h2>
        <p className="text-primary/70">
          We'll help you monitor your portfolio performance
        </p>
      </div>

      {!hasInvestments && !hasSelectedAny && (
        <div className="text-center py-8 mb-6">
          <div className="w-24 h-24 mx-auto mb-6 glass-subtle rounded-full flex items-center justify-center">
            <Icon name="lineChart" size="2xl" className="text-gold" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-3">
            Build your complete financial picture
          </h3>
          <p className="text-primary/70 mb-8 max-w-md mx-auto">
            Track all your investments in one place and see your true net worth grow over time.
          </p>
          <div className="flex gap-3 justify-center">
            <GlassButton
              variant="ghost"
              onClick={onSkip}
            >
              No investments yet
            </GlassButton>
            <GlassButton
              variant="primary"
              goldBorder
              onClick={() => setHasInvestments(true)}
            >
              Yes, I have investments
            </GlassButton>
          </div>
        </div>
      )}

      {(hasInvestments || hasSelectedAny) && (
        <div>
          <p className="text-center text-primary/70 mb-6">
            Select all that apply (you can add details later)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {investmentTypes.map((type, index) => (
              <motion.button
                key={type.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleToggleInvestment(type.id)}
                className={`glass-subtle p-4 rounded-xl border-2 text-left transition-all ${
                  selectedInvestments[type.id]
                    ? 'border-gold bg-gold/5'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedInvestments[type.id] ? type.color : 'bg-gray-200'
                  } transition-colors`}>
                    <Icon 
                      name={type.icon} 
                      size="md" 
                      className="text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-1">
                      {type.name}
                    </h3>
                    <p className="text-sm text-primary/60">
                      {type.description}
                    </p>
                  </div>
                  <div className="mt-1">
                    <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                      selectedInvestments[type.id]
                        ? 'bg-gold border-gold'
                        : 'border-gray-300'
                    }`}>
                      {selectedInvestments[type.id] && (
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

          <div className="glass-subtle p-4 rounded-xl flex items-start gap-3">
            <Icon name="info" size="sm" className="text-gold mt-0.5" />
            <div className="text-sm text-primary/70">
              <p>
                Don't worry about exact values now. You can add specific investments and their current values after setup.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between mt-10">
        <GlassButton
          variant="ghost"
          onClick={onBack}
        >
          <Icon name="arrowLeft" size="sm" className="mr-2" />
          Back
        </GlassButton>
        <div className="flex gap-3">
          {!hasSelectedAny && (
            <GlassButton
              variant="ghost"
              onClick={onSkip}
            >
              Skip
            </GlassButton>
          )}
          <GlassButton
            variant="primary"
            goldBorder
            onClick={handleContinue}
          >
            Continue
            <Icon name="arrowRight" size="sm" className="ml-2" />
          </GlassButton>
        </div>
      </div>
    </GlassContainer>
  );
} 