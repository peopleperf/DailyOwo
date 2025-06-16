'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if install was previously dismissed
    const installDismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = installDismissed ? new Date(installDismissed) : null;
    const daysSinceDismissed = dismissedDate 
      ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24) 
      : Infinity;

    // Show prompt again after 7 days
    if (dismissedDate && daysSinceDismissed < 7) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowPrompt(false);
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install prompt error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (isInstalled || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-md"
      >
        <GlassContainer goldBorder glowAnimation className="p-4 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 glass rounded-xl flex items-center justify-center">
                <Icon name="download" size="md" className="text-gold" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-primary mb-1">
                Install DailyOwo
              </h3>
              <p className="text-sm text-primary/70 mb-4">
                Get the full app experience with offline access, push notifications, and faster performance.
              </p>
              
              <div className="flex gap-2">
                <GlassButton
                  variant="primary"
                  size="sm"
                  goldBorder
                  onClick={handleInstall}
                >
                  <Icon name="download" size="sm" className="mr-1" />
                  Install
                </GlassButton>
                
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                >
                  Maybe Later
                </GlassButton>
              </div>
            </div>
            
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 text-primary/40 hover:text-primary/60 transition-colors"
              aria-label="Close"
            >
              <Icon name="close" size="sm" />
            </button>
          </div>
        </GlassContainer>
      </motion.div>
    </AnimatePresence>
  );
} 