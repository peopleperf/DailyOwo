'use client';

import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { fadeInUp } from '@/lib/utils/animations';
import { Shield, Brain, Users, TrendingUp, Smartphone, Globe } from 'lucide-react';

interface PremiumWelcomeStepProps {
  onNext: () => void;
}

const PREMIUM_FEATURES = [
  {
    icon: Brain,
    title: 'AI Financial Advisor',
    description: 'Intelligent insights and personalized recommendations'
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    description: 'Advanced encryption and two-factor authentication'
  },
  {
    icon: Users,
    title: 'Family Collaboration',
    description: 'Share financial goals with privacy controls'
  },
  {
    icon: Globe,
    title: 'Multi-Currency',
    description: 'Support for global currencies and regions'
  }
];

export function PremiumWelcomeStep({ onNext }: PremiumWelcomeStepProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div {...fadeInUp} className="text-center">
        {/* Premium hero section */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-16"
        >
          <div className="w-40 h-40 mx-auto glass rounded-3xl flex items-center justify-center relative mb-8">
            {/* Premium glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold/20 to-gold-dark/20 blur-2xl animate-pulse" />
            <span className="text-7xl font-light text-gradient-gold relative z-10">D</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-light text-primary mb-6 tracking-tight">
            Your financial journey begins
          </h1>
          
          <p className="text-xl md:text-2xl text-primary/70 font-light max-w-2xl mx-auto leading-relaxed">
            The sophisticated financial platform designed for ambitious individuals who value their financial future.
          </p>
        </motion.div>

        {/* Premium value proposition */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-16"
        >
          <GlassContainer className="p-8 md:p-12 bg-gradient-to-br from-white via-white to-gold/5" goldBorder>
            <h2 className="text-2xl md:text-3xl font-light text-primary mb-8">
              Built for sophisticated financial management
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {PREMIUM_FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-start gap-4 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-light text-primary mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm font-light text-primary/60 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassContainer>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gold" />
              <span className="text-sm font-light tracking-wide uppercase text-primary/60">
                256-bit encryption
              </span>
            </div>
            
            <div className="hidden md:block w-px h-8 bg-gray-200/50" />
            
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gold" />
              <span className="text-sm font-light tracking-wide uppercase text-primary/60">
                Two-factor security
              </span>
            </div>
            
            <div className="hidden md:block w-px h-8 bg-gray-200/50" />
            
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-gold" />
              <span className="text-sm font-light tracking-wide uppercase text-primary/60">
                AI-powered insights
              </span>
            </div>
          </div>
        </motion.div>

        {/* Sophisticated CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-6"
        >
          <GlassButton
            variant="primary"
            size="lg"
            goldBorder
            onClick={onNext}
            className="min-w-[320px] py-5 text-lg font-light tracking-wide"
          >
            Begin Setup
            <Icon name="arrowRight" size="md" className="ml-3" />
          </GlassButton>

          <p className="text-sm font-light tracking-wide text-primary/50">
            Setup takes less than 3 minutes
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}