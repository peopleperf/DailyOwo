'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Container } from '@/components/layouts/Container';
import { fadeInUp } from '@/lib/utils/animations';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Wallet, 
  PiggyBank, 
  Brain,
  ChevronRight
} from 'lucide-react';

// Import modular tab components
import { IncomeTab } from '@/components/investments/IncomeTab';
import { AssetsTab } from '@/components/investments/AssetsTab';
import { LoanTab } from '@/components/investments/LoanTab';
import { NetworthTab } from '@/components/investments/NetworthTab';
import { SavingsTab } from '@/components/investments/SavingsTab';
import { InsightTab } from '@/components/investments/InsightTab';

export default function PortfolioPage() {
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState('income');

  const tabs = [
    { 
      id: 'income', 
      label: 'Income', 
      icon: DollarSign,
      description: 'Track income sources',
      color: 'text-green-600'
    },
    { 
      id: 'assets', 
      label: 'Assets', 
      icon: TrendingUp,
      description: 'Manage investments & assets',
      color: 'text-blue-600'
    },
    { 
      id: 'loans', 
      label: 'Loans', 
      icon: CreditCard,
      description: 'Monitor debt & liabilities',
      color: 'text-red-600'
    },
    { 
      id: 'networth', 
      label: 'Net Worth', 
      icon: Wallet,
      description: 'Assets minus liabilities',
      color: 'text-purple-600'
    },
    { 
      id: 'savings', 
      label: 'Savings', 
      icon: PiggyBank,
      description: 'Savings goals & progress',
      color: 'text-gold'
    },
    { 
      id: 'insights', 
      label: 'Insights', 
      icon: Brain,
      description: 'AI-powered recommendations',
      color: 'text-indigo-600'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'income':
        return <IncomeTab />;
      case 'assets':
        return <AssetsTab />;
      case 'loans':
        return <LoanTab />;
      case 'networth':
        return <NetworthTab />;
      case 'savings':
        return <SavingsTab />;
      case 'insights':
        return <InsightTab />;
      default:
        return <IncomeTab />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Premium Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/30 to-white" />
        <div className="absolute top-0 -left-32 w-[500px] h-[500px] bg-gold/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
        <div className="absolute bottom-0 -right-32 w-[500px] h-[500px] bg-primary/[0.02] rounded-full mix-blend-multiply filter blur-3xl" />
      </div>

      <Container size="lg" className="py-8 md:py-12 pb-24">
        {/* Header */}
        <motion.div {...fadeInUp} className="mb-8">
          <h1 className="text-3xl font-light text-primary mb-2">Portfolio</h1>
          <p className="text-primary/60 font-light">
            Complete view of your financial portfolio
          </p>
        </motion.div>

        {/* Horizontal Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex gap-4 md:gap-8 border-b border-gray-100 overflow-x-auto pb-0 scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative pb-4 px-1 font-light transition-all whitespace-nowrap flex items-center gap-1 md:gap-2 flex-shrink-0
                    ${activeTab === tab.id ? 'text-primary' : 'text-primary/40 hover:text-primary/60'}
                  `}
                >
                  <Icon className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activePortfolioTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold to-gold-light"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </Container>
    </div>
  );
} 