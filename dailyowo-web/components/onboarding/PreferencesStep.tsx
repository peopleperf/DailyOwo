'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { Bell, BellOff, FileText, TrendingUp } from 'lucide-react';

interface PreferencesStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  features?: {
    offlineMode: boolean;
    cloudSync: boolean;
    aiInsights: boolean;
  };
}

interface Preference {
  id: string;
  icon: string;
  title: string;
  description: string;
  recommended?: boolean;
}

const FEATURES: Preference[] = [
  {
    id: 'offlineMode',
    icon: 'wifiOff',
    title: 'Offline Mode',
    description: 'Access your data without an internet connection.',
  },
  {
    id: 'cloudSync',
    icon: 'cloud',
    title: 'Cloud Sync',
    description: 'Keep your data synced across all devices.',
    recommended: true,
  },
  {
    id: 'aiInsights',
    icon: 'ai',
    title: 'AI Financial Advisor',
    description: 'Get smart insights and recommendations.',
    recommended: true,
  },
];

const NOTIFICATIONS = [
  {
    id: 'budgetAlerts',
    icon: Bell,
    title: 'Budget Alerts',
    description: 'Get notified when you\'re close to budget limits',
  },
  {
    id: 'goalReminders',
    icon: TrendingUp,
    title: 'Goal Reminders',
    description: 'Stay on track with your financial goals',
  },
  {
    id: 'weeklyReports',
    icon: FileText,
    title: 'Weekly Reports',
    description: 'Receive weekly summaries of your finances',
  },
];

export function PreferencesStep({ data, onNext, onBack, features }: PreferencesStepProps) {
  
  const [featurePrefs, setFeaturePrefs] = useState({
    offlineMode: features?.offlineMode ?? true,
    cloudSync: features?.cloudSync ?? true,
    aiInsights: features?.aiInsights ?? true,
  });

  const [notifications, setNotifications] = useState({
    budgetAlerts: data.notificationSettings?.budgetAlerts ?? true,
    goalReminders: data.notificationSettings?.goalReminders ?? true,
    weeklyReports: data.notificationSettings?.weeklyReports ?? false,
  });

  const handleFeatureToggle = (prefId: string) => {
    setFeaturePrefs(prev => ({
      ...prev,
      [prefId]: !prev[prefId as keyof typeof prev]
    }));
  };

  const handleNotificationToggle = (notifId: string) => {
    setNotifications(prev => ({
      ...prev,
      [notifId]: !prev[notifId as keyof typeof prev]
    }));
  };

  const handleContinue = () => {
    onNext({
      features: featurePrefs,
      notificationSettings: notifications,
    });
  };

  return (
    <GlassContainer className="p-8 md:p-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-primary mb-2">
          Customize Your Experience
        </h2>
        <p className="text-primary/70">
          Tailor DailyOwo to your needs.
        </p>
      </div>

      {/* Features Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <Icon name="settings" size="sm" />
          App Features
        </h3>
        <div className="space-y-4">
          {FEATURES.map((feature) => (
            <motion.button
              key={feature.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleFeatureToggle(feature.id)}
              className={`w-full glass-subtle p-4 rounded-xl border-2 transition-all text-left ${
                featurePrefs[feature.id as keyof typeof featurePrefs]
                  ? 'border-gold bg-gold/5'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 ${featurePrefs[feature.id as keyof typeof featurePrefs] ? 'text-gold' : 'text-primary/60'}`}>
                  <Icon name={feature.icon as any} size="lg" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-semibold text-primary mb-1">
                      {feature.title}
                    </h3>
                    {feature.recommended && (
                      <span className="ml-2 text-xs font-medium text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-primary/60">
                    {feature.description}
                  </p>
                </div>
                <div className="mt-1">
                  <div className={`w-12 h-6 rounded-full transition-colors ${
                    featurePrefs[feature.id as keyof typeof featurePrefs] ? 'bg-gold' : 'bg-gray-300'
                  }`}>
                    <motion.div
                      animate={{
                        x: featurePrefs[feature.id as keyof typeof featurePrefs] ? 24 : 0
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-6 h-6 bg-white rounded-full shadow-md"
                    />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Notifications Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h3>
        <div className="space-y-4">
          {NOTIFICATIONS.map((notif) => (
            <motion.button
              key={notif.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleNotificationToggle(notif.id)}
              className={`w-full glass-subtle p-4 rounded-xl border-2 transition-all text-left ${
                notifications[notif.id as keyof typeof notifications]
                  ? 'border-primary/20 bg-primary/5'
                  : 'border-transparent hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`mt-1 ${notifications[notif.id as keyof typeof notifications] ? 'text-primary' : 'text-primary/60'}`}>
                  <notif.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-primary mb-1">
                    {notif.title}
                  </h3>
                  <p className="text-sm text-primary/60">
                    {notif.description}
                  </p>
                </div>
                <div className="mt-1">
                  <div className={`w-12 h-6 rounded-full transition-colors ${
                    notifications[notif.id as keyof typeof notifications] ? 'bg-primary' : 'bg-gray-300'
                  }`}>
                    <motion.div
                      animate={{
                        x: notifications[notif.id as keyof typeof notifications] ? 24 : 0
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="w-6 h-6 bg-white rounded-full shadow-md"
                    />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Privacy note */}
      <div className="glass-subtle p-4 rounded-xl mb-8 flex items-start gap-3">
        <Icon name="shield" size="sm" className="text-gold mt-0.5" />
        <div>
          <h4 className="font-medium text-primary mb-1">Your Privacy is Our Priority</h4>
          <p className="text-sm text-primary/70">
            We will never share your financial data without your consent.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <GlassButton
          variant="ghost"
          onClick={onBack}
        >
          <Icon name="arrowLeft" size="sm" className="mr-2" />
          Back
        </GlassButton>
        <GlassButton
          variant="primary"
          goldBorder
          onClick={handleContinue}
        >
          Continue
          <Icon name="arrowRight" size="sm" className="ml-2" />
        </GlassButton>
      </div>
    </GlassContainer>
  );
} 