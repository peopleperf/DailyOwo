'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const router = useRouter();
  const features = [
    {
      icon: 'brain',
      title: 'AI-Powered Intelligence',
      description: 'Our smart system learns your spending patterns and provides personalized insights to help you make better financial decisions.',
      details: [
        'Automatic transaction categorization',
        'Spending pattern analysis',
        'Personalized recommendations',
        'Predictive budgeting insights',
        'Smart financial alerts'
      ]
    },
    {
      icon: 'trending-up',
      title: 'Complete Dashboard',
      description: 'Track your net worth, expenses, and investments all in one beautiful, easy-to-use dashboard.',
      details: [
        'Real-time net worth tracking',
        'Expense monitoring and categorization',
        'Investment portfolio overview',
        'Interactive charts and analytics',
        'Mobile-responsive design'
      ]
    },
    {
      icon: 'target',
      title: 'Smart Goal Setting',
      description: 'Set financial goals and receive intelligent recommendations to achieve them faster than ever before.',
      details: [
        'Emergency fund planning',
        'Savings goal tracking',
        'Investment target setting',
        'Progress visualization',
        'Milestone celebrations'
      ]
    },
    {
      icon: 'zap',
      title: 'Crypto Trading Alerts',
      description: 'Stay ahead of the crypto market with intelligent trading alerts and portfolio monitoring.',
      details: [
        'Real-time price alerts',
        'Portfolio performance tracking',
        'Market trend notifications',
        'Risk management alerts',
        'Trading opportunity signals'
      ]
    },
    {
      icon: 'shield',
      title: 'Bank-Level Security',
      description: 'Your data is protected with enterprise-grade encryption and security measures.',
      details: [
        '256-bit SSL encryption',
        'Two-factor authentication',
        'Read-only bank connections',
        'SOC 2 Type II compliance',
        'Regular security audits'
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 md:inset-8 lg:inset-16 z-50 overflow-hidden"
          >
            <div className="h-full bg-white md:bg-white/95 md:backdrop-blur-xl md:border md:border-gray-200/50 md:rounded-2xl overflow-hidden">
              <div className="flex flex-col h-full">
                {/* Mobile Status Bar Spacer */}
                <div className="h-safe-top bg-gradient-to-r from-gold to-gold-light md:hidden" />
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 lg:p-8 border-b border-gray-200/50 bg-gradient-to-r from-gold to-gold-light md:bg-none">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 md:bg-gradient-to-br md:from-gold md:to-gold-light rounded-xl flex items-center justify-center shadow-lg">
                      <Icon name="lightbulb" size="lg" className="text-white md:text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-light text-white md:text-primary">How DailyOwo Works</h2>
                      <p className="text-white/80 md:text-primary/60 font-light text-sm md:text-base">Smart financial management made simple</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/20 md:hover:bg-gray-100/50 transition-colors"
                  >
                    <Icon name="x" size="lg" className="text-white md:text-primary" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
                  <div className="p-4 md:p-6 lg:p-8">
                    <div className="space-y-6 md:space-y-8">
                      {features.map((feature, index) => (
                        <motion.div
                          key={feature.title}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className="border-b border-gray-100 pb-6 md:pb-8 last:border-b-0"
                        >
                          <div className="flex items-start gap-4 md:gap-6">
                            <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-gold/20 to-primary/20 rounded-xl flex items-center justify-center">
                              <Icon name={feature.icon as any} size="lg" className="text-gold" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg md:text-xl lg:text-2xl font-light text-primary mb-2 md:mb-3">{feature.title}</h3>
                              <p className="text-primary/70 font-light mb-3 md:mb-4 leading-relaxed text-sm md:text-base">{feature.description}</p>
                              
                              {/* Feature Details */}
                              <div className="grid grid-cols-1 gap-2">
                                {feature.details.map((detail, detailIndex) => (
                                  <motion.div
                                    key={detail}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: (index * 0.1) + (detailIndex * 0.05) }}
                                    className="flex items-start gap-2"
                                  >
                                    <div className="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0 mt-2" />
                                    <span className="text-sm font-light text-primary/60 leading-relaxed">{detail}</span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Trust Indicators */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                      className="mt-8 md:mt-12 p-4 md:p-6 bg-gradient-to-br from-gold/5 to-primary/5 rounded-xl"
                    >
                      <h4 className="text-base md:text-lg font-light text-primary mb-3 md:mb-4 text-center">Trusted by thousands</h4>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8 text-primary/60">
                        <div className="flex items-center gap-2">
                          <Icon name="shield" size="sm" className="text-gold" />
                          <span className="text-sm font-light">Bank-level security</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="users" size="sm" className="text-gold" />
                          <span className="text-sm font-light">10,000+ users</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="star" size="sm" className="text-gold" />
                          <span className="text-sm font-light">4.9/5 rating</span>
                        </div>
                      </div>
                    </motion.div>

                    {/* Mobile Safe Area for Footer */}
                    <div className="h-4 md:h-0" />
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="border-t border-gray-200/50 bg-white">
                  <div className="p-4 md:p-6 lg:p-8">
                    <div className="flex flex-col gap-3 md:gap-4">
                      <GlassButton
                        variant="primary"
                        size="lg"
                        goldBorder
                        onClick={() => {
                          onClose();
                          router.push('/auth/register');
                        }}
                        className="w-full py-4 text-lg font-light"
                      >
                        Start Your Journey
                      </GlassButton>
                      <GlassButton
                        variant="ghost"
                        size="lg"
                        onClick={onClose}
                        className="w-full py-4 text-lg font-light md:hidden"
                      >
                        Close
                      </GlassButton>
                    </div>
                  </div>
                  {/* Mobile Safe Area Bottom */}
                  <div className="h-safe-bottom bg-white md:hidden" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}