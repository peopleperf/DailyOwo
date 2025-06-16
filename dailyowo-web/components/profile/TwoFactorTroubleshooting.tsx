'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  Clock, 
  Smartphone, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';

interface TroubleshootingProps {
  onRetry?: () => void;
  onResetSetup?: () => void;
}

export function TwoFactorTroubleshooting({ onRetry, onResetSetup }: TroubleshootingProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const troubleshootingItems = [
    {
      id: 'time-sync',
      title: 'Time Synchronization Issues',
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10',
      description: 'Your device time might be out of sync',
      solutions: [
        'Check if your device time is correct',
        'Enable automatic date & time in your device settings',
        'Try refreshing your authenticator app',
        'Wait 30 seconds and try a new code'
      ]
    },
    {
      id: 'app-issues',
      title: 'Authenticator App Problems',
      icon: Smartphone,
      color: 'text-green-600',
      bgColor: 'bg-green-500/10',
      description: 'Issues with your authenticator app',
      solutions: [
        'Make sure you scanned the QR code correctly',
        'Try manually entering the secret key instead',
        'Check if you have multiple accounts in your app',
        'Restart your authenticator app',
        'Use a different authenticator app (Google, Authy, Microsoft)'
      ]
    },
    {
      id: 'code-entry',
      title: 'Code Entry Problems',
      icon: RefreshCw,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10',
      description: 'Problems entering the verification code',
      solutions: [
        'Make sure you\'re entering exactly 6 digits',
        'Don\'t include spaces or dashes',
        'Use a fresh code (codes expire every 30 seconds)',
        'Double-check you\'re looking at the right account in your app',
        'Try typing slowly to avoid mistakes'
      ]
    },
    {
      id: 'backup-codes',
      title: 'Use Backup Codes',
      icon: AlertTriangle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10',
      description: 'If nothing else works',
      solutions: [
        'Use one of your backup codes instead',
        'Backup codes are one-time use only',
        'Each backup code is 8 characters with a dash (XXXX-XXXX)',
        'Save your remaining backup codes after use'
      ]
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6 text-yellow-600" />
        </div>
        <h3 className="text-lg font-medium text-primary mb-2">Having trouble with 2FA?</h3>
        <p className="text-sm text-primary/60">
          Try these common solutions to fix verification code issues
        </p>
      </div>

      <div className="space-y-3">
        {troubleshootingItems.map((item) => {
          const isExpanded = expandedItems.includes(item.id);
          const Icon = item.icon;
          
          return (
            <div key={item.id} className="glass-subtle rounded-xl overflow-hidden">
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${item.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-primary">{item.title}</h4>
                    <p className="text-xs text-primary/60">{item.description}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-primary/60" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-primary/60" />
                )}
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <div className="pl-11 space-y-2">
                        {item.solutions.map((solution, index) => (
                          <div key={index} className="flex items-start gap-2 text-sm text-primary/70">
                            <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{solution}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-primary/10">
        <div className="flex gap-3">
          {onRetry && (
            <GlassButton
              onClick={onRetry}
              variant="primary"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </GlassButton>
          )}
          {onResetSetup && (
            <GlassButton
              onClick={onResetSetup}
              variant="ghost"
              className="flex-1"
            >
              Start Over
            </GlassButton>
          )}
        </div>
      </div>

      <div className="p-3 glass-subtle rounded-xl">
        <h4 className="font-medium text-primary mb-2 text-sm">Quick Tips:</h4>
        <ul className="text-xs text-primary/60 space-y-1">
          <li>• Codes change every 30 seconds - use fresh codes</li>
          <li>• Make sure your device time is accurate</li>
          <li>• Don't type spaces or special characters</li>
          <li>• Keep your backup codes in a safe place</li>
        </ul>
      </div>
    </div>
  );
} 