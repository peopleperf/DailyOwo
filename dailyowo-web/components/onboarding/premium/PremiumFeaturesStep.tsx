'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { 
  Brain, 
  Users, 
  Shield, 
  TrendingUp, 
  Bell, 
  Smartphone, 
  Cloud,
  Zap,
  Star,
  ArrowRight
} from 'lucide-react';

interface PremiumFeaturesStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const PREMIUM_FEATURES = [
  {
    id: 'aiInsights',
    icon: Brain,
    title: 'AI Financial Advisor',
    description: 'Get intelligent insights, spending predictions, and personalized recommendations',
    benefits: ['Smart spending analysis', 'Goal achievement predictions', 'Personalized tips'],
    recommended: true,
    enabled: true
  },
  {
    id: 'familySharing',
    icon: Users,
    title: 'Family Financial Management',
    description: 'Share goals and budgets with family members with privacy controls',
    benefits: ['Shared financial goals', 'Family budget tracking', 'Privacy settings'],
    recommended: false,
    enabled: false
  },
  {
    id: 'advancedSecurity',
    icon: Shield,
    title: 'Enhanced Security Suite',
    description: 'Advanced fraud detection and security monitoring',
    benefits: ['Transaction monitoring', 'Suspicious activity alerts', 'Security reports'],
    recommended: true,
    enabled: true
  },
  {
    id: 'premiumInsights',
    icon: TrendingUp,
    title: 'Advanced Analytics',
    description: 'Deep financial analytics and market insights',
    benefits: ['Detailed spending patterns', 'Investment performance', 'Market trends'],
    recommended: true,
    enabled: true
  }
];

const NOTIFICATION_PREFERENCES = [
  {
    id: 'goalProgress',
    icon: TrendingUp,
    title: 'Goal Progress Updates',
    description: 'Weekly progress on your financial goals',
    enabled: true
  },
  {
    id: 'smartInsights',
    icon: Brain,
    title: 'AI Insights',
    description: 'Personalized financial insights and tips',
    enabled: true
  },
  {
    id: 'securityAlerts',
    icon: Shield,
    title: 'Security Alerts',
    description: 'Important account security notifications',
    enabled: true
  },
  {
    id: 'weeklyReports',
    icon: Bell,
    title: 'Weekly Financial Summary',
    description: 'Your financial overview every Monday',
    enabled: false
  }
];

export function PremiumFeaturesStep({ data, onNext, onBack }: PremiumFeaturesStepProps) {
  const [features, setFeatures] = useState(() => {
    const initial: Record<string, boolean> = {};
    PREMIUM_FEATURES.forEach(feature => {
      initial[feature.id] = data.features?.[feature.id] ?? feature.enabled;
    });
    return initial;
  });

  const [notifications, setNotifications] = useState(() => {
    const initial: Record<string, boolean> = {};
    NOTIFICATION_PREFERENCES.forEach(notif => {
      initial[notif.id] = data.notifications?.[notif.id] ?? notif.enabled;
    });
    return initial;
  });

  const handleFeatureToggle = (featureId: string) => {
    setFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  const handleNotificationToggle = (notifId: string) => {
    setNotifications(prev => ({
      ...prev,
      [notifId]: !prev[notifId]
    }));
  };

  const handleContinue = () => {
    onNext({
      features,
      notifications,
      premiumFeaturesConfigured: true
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="w-16 h-16 glass-subtle rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Star className="w-8 h-8 text-gold" />
        </div>
        <h2 className="text-3xl font-light text-primary mb-4">
          Unlock your premium experience
        </h2>
        <p className="text-lg font-light text-primary/70 max-w-2xl mx-auto">
          Customize your DailyOwo experience with intelligent features designed for sophisticated financial management.
        </p>
      </motion.div>

      <div className="space-y-8">
        {/* Premium Features */}
        <GlassContainer className="p-8 md:p-10 bg-gradient-to-br from-white via-white to-gold/5" goldBorder>
          <div className="flex items-center gap-3 mb-8">
            <Zap className="w-6 h-6 text-gold" />
            <h3 className="text-2xl font-light text-primary">
              Premium Features
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {PREMIUM_FEATURES.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass-subtle p-6 rounded-xl border-2 transition-all ${
                  features[feature.id]
                    ? 'border-gold bg-gold/5'
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    features[feature.id] ? 'bg-gold text-white' : 'bg-gray-200 text-gray-500'
                  } transition-colors`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-light text-primary">
                          {feature.title}
                        </h4>
                        {feature.recommended && (
                          <span className="text-xs font-light tracking-wide uppercase bg-gold/10 text-gold px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleFeatureToggle(feature.id)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          features[feature.id] ? 'bg-gold' : 'bg-gray-300'
                        }`}
                      >
                        <motion.div
                          animate={{ x: features[feature.id] ? 24 : 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="w-6 h-6 bg-white rounded-full shadow-md"
                        />
                      </button>
                    </div>
                    
                    <p className="text-sm font-light text-primary/60 mb-3">
                      {feature.description}
                    </p>
                    
                    <ul className="space-y-1">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="text-xs font-light text-primary/50 flex items-center gap-2">
                          <div className="w-1 h-1 bg-gold rounded-full" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassContainer>

        {/* Notification Preferences */}
        <GlassContainer className="p-8 md:p-10">
          <div className="flex items-center gap-3 mb-8">
            <Bell className="w-6 h-6 text-primary" />
            <h3 className="text-2xl font-light text-primary">
              Notification Preferences
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {NOTIFICATION_PREFERENCES.map((notif, index) => (
              <motion.button
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleNotificationToggle(notif.id)}
                className={`glass-subtle p-4 rounded-xl border-2 text-left transition-all ${
                  notifications[notif.id]
                    ? 'border-primary/20 bg-primary/5'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    notifications[notif.id] ? 'bg-primary/10' : 'bg-gray-100'
                  } transition-colors`}>
                    <notif.icon className={`w-5 h-5 ${
                      notifications[notif.id] ? 'text-primary' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-light text-primary mb-1">
                      {notif.title}
                    </h4>
                    <p className="text-sm font-light text-primary/60">
                      {notif.description}
                    </p>
                  </div>
                  
                  <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                    notifications[notif.id]
                      ? 'bg-primary border-primary'
                      : 'border-gray-300'
                  }`}>
                    {notifications[notif.id] && (
                      <Icon name="check" size="xs" className="text-white" />
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Privacy note */}
          <div className="glass-subtle p-4 rounded-xl mt-6 flex items-start gap-3">
            <Shield className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
            <div className="text-sm font-light text-primary/70">
              <p className="font-medium text-primary mb-1">
                Your privacy is paramount
              </p>
              <p>
                All features respect your privacy settings. You can modify these preferences anytime in settings.
              </p>
            </div>
          </div>
        </GlassContainer>

        {/* Actions */}
        <div className="flex justify-between">
          <GlassButton
            variant="ghost"
            onClick={onBack}
            className="font-light"
          >
            <Icon name="arrowLeft" size="sm" className="mr-2" />
            Back
          </GlassButton>
          
          <GlassButton
            variant="primary"
            goldBorder
            onClick={handleContinue}
            className="font-light"
          >
            Complete Setup
            <ArrowRight size={18} className="ml-2" />
          </GlassButton>
        </div>
      </div>
    </div>
  );
}