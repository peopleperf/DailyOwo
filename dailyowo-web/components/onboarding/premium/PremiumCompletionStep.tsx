'use client';

import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { 
  CheckCircle, 
  ArrowRight, 
  Target, 
  Brain, 
  Shield, 
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface PremiumCompletionStepProps {
  data: any;
  onComplete: () => void;
  isLoading: boolean;
}

export function PremiumCompletionStep({ data, onComplete, isLoading }: PremiumCompletionStepProps) {
  const completedFeatures = [
    {
      icon: CheckCircle,
      title: 'Account Secured',
      description: data.twoFactorEnabled 
        ? 'Two-factor authentication enabled' 
        : 'Basic security configured'
    },
    {
      icon: Target,
      title: 'Goals Identified',
      description: data.selectedGoals?.length > 0 
        ? `${data.selectedGoals.length} financial goals selected`
        : 'Ready to set your first goals'
    },
    {
      icon: Brain,
      title: 'AI Features Ready',
      description: data.features?.aiInsights 
        ? 'AI advisor activated for insights'
        : 'Intelligence features configured'
    },
    {
      icon: TrendingUp,
      title: 'Analytics Enabled',
      description: 'Advanced financial tracking ready'
    }
  ];

  const nextSteps = [
    'Add your first transaction to start tracking',
    'Set specific amounts and deadlines for your goals',
    'Connect bank accounts for automatic syncing',
    'Explore AI insights and recommendations'
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 mx-auto mb-8 relative"
        >
          <div className="w-24 h-24 glass rounded-full flex items-center justify-center relative">
            {/* Premium glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/30 to-gold-dark/30 blur-xl animate-pulse" />
            <CheckCircle className="w-12 h-12 text-gold relative z-10" />
          </div>
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-light text-primary mb-6 tracking-tight">
            Welcome to your financial command center
          </h1>
          <p className="text-xl font-light text-primary/70 max-w-2xl mx-auto leading-relaxed">
            Your DailyOwo platform is configured and ready to help you achieve your financial aspirations.
          </p>
        </motion.div>

        {/* Setup Summary */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <GlassContainer className="p-8 md:p-10 bg-gradient-to-br from-white via-white to-gold/5" goldBorder>
            <div className="flex items-center gap-3 mb-8">
              <Sparkles className="w-6 h-6 text-gold" />
              <h2 className="text-2xl font-light text-primary">
                Your premium setup is complete
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {completedFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 glass-subtle rounded-xl"
                >
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-light text-primary mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm font-light text-primary/60">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Profile Summary */}
            <div className="glass-subtle p-6 rounded-xl border border-gold/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-light text-primary">
                  Profile Summary
                </h3>
                <span className="text-xs font-light tracking-wide uppercase bg-gold/10 text-gold px-3 py-1 rounded-full">
                  Premium
                </span>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
                    Display Name
                  </p>
                  <p className="font-light text-primary">
                    {data.displayName || 'User'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
                    Region
                  </p>
                  <p className="font-light text-primary">
                    {data.currencySymbol} {data.currency}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-light tracking-wide uppercase text-primary/40 mb-1">
                    Security
                  </p>
                  <p className="font-light text-primary">
                    {data.twoFactorEnabled ? '2FA Enabled' : 'Standard'}
                  </p>
                </div>
              </div>
            </div>
          </GlassContainer>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <GlassContainer className="p-8">
            <h3 className="text-xl font-light text-primary mb-6">
              Recommended next steps
            </h3>
            <div className="space-y-3">
              {nextSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.05 }}
                  className="flex items-center gap-3 text-left"
                >
                  <div className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-light text-gold">{index + 1}</span>
                  </div>
                  <p className="font-light text-primary/80">
                    {step}
                  </p>
                </motion.div>
              ))}
            </div>
          </GlassContainer>
        </motion.div>

        {/* Launch Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <GlassButton
            variant="primary"
            size="lg"
            goldBorder
            onClick={onComplete}
            disabled={isLoading}
            className="min-w-[320px] py-5 text-lg font-light tracking-wide"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Launch Dashboard
                <ArrowRight size={20} className="ml-3" />
              </>
            )}
          </GlassButton>

          <p className="text-sm font-light tracking-wide text-primary/50 mt-4">
            Your financial journey begins now
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}