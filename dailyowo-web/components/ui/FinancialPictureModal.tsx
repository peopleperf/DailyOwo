'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, DollarSign, CreditCard, Home, Car, Briefcase, AlertCircle, CheckCircle } from 'lucide-react';
import { GlassContainer } from './GlassContainer';

interface FinancialPictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasAssets: boolean;
  hasLiabilities: boolean;
  totalAssets: number;
  totalLiabilities: number;
  currency: string;
}

export default function FinancialPictureModal({
  isOpen,
  onClose,
  hasAssets,
  hasLiabilities,
  totalAssets,
  totalLiabilities,
  currency
}: FinancialPictureModalProps) {
  const isComplete = hasAssets && hasLiabilities;
  const completionPercentage = ((hasAssets ? 50 : 0) + (hasLiabilities ? 50 : 0));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <GlassContainer className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isComplete ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-medium text-primary">
                    Complete Your Financial Picture
                  </h2>
                  <p className="text-sm text-primary/60 font-light">
                    {completionPercentage}% complete
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-primary/40" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-light text-primary/60">Setup Progress</span>
                  <span className="text-sm font-medium text-primary">{completionPercentage}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      isComplete 
                        ? 'bg-gradient-to-r from-green-400 to-green-500' 
                        : 'bg-gradient-to-r from-red-400 to-red-500'
                    }`}
                  />
                </div>
              </div>

              {/* Current Status */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-medium text-primary mb-2">Current Net Worth Calculation</h3>
                <p className="text-sm text-primary/70 font-light leading-relaxed">
                  Your net worth is currently calculated from your cash flow (income - expenses). 
                  For a complete and accurate picture, add your assets and debts below.
                </p>
              </div>

              {/* Assets & Liabilities Setup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Assets */}
                <div className={`p-4 rounded-xl border-2 transition-all ${
                  hasAssets 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      hasAssets ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <TrendingUp className={`w-4 h-4 ${
                        hasAssets ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-primary text-sm">Assets</h4>
                      <p className="text-xs text-primary/60">
                        {hasAssets ? `${currency}${totalAssets.toLocaleString()}` : 'Not set up'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-primary/60">
                      <DollarSign className="w-3 h-3" />
                      <span>Bank accounts, savings</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-primary/60">
                      <Briefcase className="w-3 h-3" />
                      <span>Investments, stocks</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-primary/60">
                      <Home className="w-3 h-3" />
                      <span>Property, vehicles</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities */}
                <div className={`p-4 rounded-xl border-2 transition-all ${
                  hasLiabilities 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      hasLiabilities ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      <CreditCard className={`w-4 h-4 ${
                        hasLiabilities ? 'text-green-600' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-primary text-sm">Liabilities</h4>
                      <p className="text-xs text-primary/60">
                        {hasLiabilities ? `${currency}${totalLiabilities.toLocaleString()}` : 'Not set up'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-primary/60">
                      <CreditCard className="w-3 h-3" />
                      <span>Credit cards, loans</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-primary/60">
                      <Home className="w-3 h-3" />
                      <span>Mortgages</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-primary/60">
                      <Car className="w-3 h-3" />
                      <span>Auto loans, other debts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-gold/5 rounded-xl p-4">
                <h3 className="font-medium text-primary mb-2">Why Complete This?</h3>
                <ul className="space-y-2 text-sm text-primary/70 font-light">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>Get your true net worth (Assets - Liabilities)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>Track debt-to-income ratio accurately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>Better financial insights and recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                    <span>Monitor your wealth growth over time</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-100">
              <button 
                onClick={() => {
                  // For now, show an alert. Later this would navigate to assets/liabilities setup
                  alert('Assets & Liabilities management coming soon! This will help you track your complete financial picture.');
                  onClose();
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-gold to-gold-light text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
              >
                Set Up Assets & Debts
              </button>
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 text-primary rounded-xl hover:bg-gray-200 transition-colors text-sm font-light"
              >
                Maybe Later
              </button>
            </div>
          </GlassContainer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 