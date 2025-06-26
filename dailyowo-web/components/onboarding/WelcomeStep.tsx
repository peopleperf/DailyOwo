'use client';

import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { fadeInUp } from '@/lib/utils/animations';

interface WelcomeStepProps {
  onNext: (data: any) => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const handleContinue = () => {
    onNext({});
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div {...fadeInUp} className="text-center">
        {/* Premium logo with glow effect */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-12"
        >
          <div className="w-32 h-32 mx-auto glass rounded-3xl flex items-center justify-center relative">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-gold/20 to-gold-dark/20 blur-xl animate-pulse" />
            <span className="text-6xl font-bold text-gradient-gold relative z-10">D</span>
          </div>
        </motion.div>

        {/* Welcome text with better spacing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
            Welcome to DailyOwo
          </h1>
          
          <p className="text-xl text-primary/70 max-w-lg mx-auto leading-relaxed">
            The all-in-one app to manage your finances, powered by AI.
          </p>
        </motion.div>

        {/* Simplified feature highlights - horizontal layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-2">
              <Icon name="ai" size="sm" className="text-gold/70" />
              <p className="text-sm text-primary/60">AI-Powered Insights</p>
            </div>

            <div className="hidden md:block w-px h-8 bg-gray-200/50" />

            <div className="flex items-center gap-2">
              <Icon name="shield" size="sm" className="text-gold/70" />
              <p className="text-sm text-primary/60">Bank-Level Security</p>
            </div>

            <div className="hidden md:block w-px h-8 bg-gray-200/50" />

            <div className="flex items-center gap-2">
              <Icon name="users" size="sm" className="text-gold/70" />
              <p className="text-sm text-primary/60">Family Sharing</p>
            </div>
          </div>
        </motion.div>

        {/* CTA button with better prominence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <GlassButton
            variant="primary"
            size="lg"
            goldBorder
            onClick={handleContinue}
            className="min-w-[280px] py-4 text-lg"
          >
            Get Started
            <Icon name="arrowRight" size="md" className="ml-3" />
          </GlassButton>

          <p className="text-sm text-primary/50">
            Takes less than 2 minutes
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
} 