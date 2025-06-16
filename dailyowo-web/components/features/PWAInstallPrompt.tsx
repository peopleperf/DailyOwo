'use client';

import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Comprehensive mobile detection
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Check for mobile devices
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i;
      const isMobileDevice = mobileRegex.test(userAgent);
      
      // Also check viewport width as a fallback
      const isMobileViewport = window.innerWidth <= 768;
      
      // Check for touch support
      const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Consider it mobile if any of these conditions are true
      return isMobileDevice || (isMobileViewport && hasTouchSupport);
    };

    const mobile = checkIfMobile();
    setIsMobile(mobile);
    
    // If not mobile, don't proceed with any PWA prompt logic
    if (!mobile) {
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Enhanced check if already installed
    const checkInstalled = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.matchMedia('(display-mode: fullscreen)').matches ||
             (window.navigator as any).standalone === true ||
             document.referrer.includes('android-app://');
    };
    
    const installed = checkInstalled();
    setIsInstalled(installed);
    
    if (installed) return;

    // Check if user has dismissed permanently
    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed-time');
    if (dismissedTime) {
      const dismissedDate = new Date(dismissedTime);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Don't show for 30 days after dismissal
      if (daysSinceDismissed < 30) {
        return;
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay (5 seconds for better UX)
      setTimeout(() => {
        // Check again if not installed and not dismissed
        if (!checkInstalled() && !localStorage.getItem('pwa-prompt-dismissed-time')) {
          setShowPrompt(true);
        }
      }, 5000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show custom prompt if not in standalone mode
    if (isIOSDevice && !installed) {
      setTimeout(() => {
        if (!localStorage.getItem('pwa-prompt-dismissed-time')) {
          setShowPrompt(true);
        }
      }, 5000);
    }

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowPrompt(false);
    });

    // Handle window resize to detect if user switches between mobile/desktop
    const handleResize = () => {
      const stillMobile = checkIfMobile();
      if (!stillMobile) {
        setShowPrompt(false);
      }
      setIsMobile(stillMobile);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      // Track installation
      localStorage.setItem('pwa-install-prompted', new Date().toISOString());
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal time to not show again for 30 days
    localStorage.setItem('pwa-prompt-dismissed-time', new Date().toISOString());
  };

  const handleNotNow = () => {
    setShowPrompt(false);
    // Just hide for this session, will show again next time
    sessionStorage.setItem('pwa-prompt-hidden', 'true');
  };

  // Check if hidden for this session
  useEffect(() => {
    if (sessionStorage.getItem('pwa-prompt-hidden') === 'true') {
      setShowPrompt(false);
    }
  }, []);

  // Don't render if installed or not on mobile
  if (isInstalled || !isMobile) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40"
        >
          <GlassContainer 
            variant="dark" 
            goldBorder 
            glowAnimation
            className="p-4 md:p-6 shadow-2xl"
          >
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
              aria-label="Close permanently"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 glass rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-gold/20 to-gold/10">
                {isIOS ? (
                  <Share size={20} className="text-gold" />
                ) : (
                  <Download size={20} className="text-gold" />
                )}
              </div>
              
              <div className="flex-1 pr-6">
                <h3 className="font-semibold text-white text-sm md:text-base mb-1">
                  Install DailyOwo
                </h3>
                <p className="text-xs md:text-sm text-white/80 mb-3">
                  {isIOS 
                    ? 'Add to your home screen for the best experience'
                    : 'Get quick access and work offline'
                  }
                </p>

                {!isIOS ? (
                  <div className="flex gap-2">
                    <GlassButton
                      variant="primary"
                      size="sm"
                      goldBorder
                      onClick={handleInstall}
                      className="text-xs md:text-sm"
                    >
                      Install Now
                    </GlassButton>
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={handleNotNow}
                      className="text-white/80 hover:text-white text-xs md:text-sm"
                    >
                      Not Now
                    </GlassButton>
                  </div>
                ) : (
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={handleNotNow}
                    className="text-white/80 hover:text-white text-xs"
                  >
                    Got it
                  </GlassButton>
                )}
              </div>
            </div>

            {isIOS && (
              <div className="mt-3 p-2.5 glass rounded-lg">
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium">1.</span>
                    <span>Tap</span>
                    <div className="w-4 h-4 rounded border border-white/30 flex items-center justify-center">
                      <Share size={10} />
                    </div>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="font-medium">2.</span>
                    <span>Add to Home Screen</span>
                  </span>
                </div>
              </div>
            )}

            <div className="absolute bottom-2 right-3">
              <button
                onClick={handleDismiss}
                className="text-xs text-white/40 hover:text-white/60 transition-colors underline"
              >
                Don't show again
              </button>
            </div>
          </GlassContainer>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 