'use client';

import { useEffect } from 'react';
import { Container } from '@/components/layouts/Container';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassButton } from '@/components/ui/GlassButton';
import { Icon } from '@/components/ui/Icon';
import { motion } from 'framer-motion';
import { fadeInUp } from '@/lib/utils/animations';

export default function OfflinePage() {
  useEffect(() => {
    // Try to reconnect when the page comes back online
    const handleOnline = () => {
      window.location.reload();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Container size="sm">
        <motion.div {...fadeInUp}>
          <GlassContainer className="text-center p-8 md:p-12">
            <div className="w-24 h-24 glass-subtle rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Icon name="offline" size="xl" className="text-primary/60" />
            </div>
            
            <h1 className="text-3xl font-bold text-primary mb-4">
              You're Offline
            </h1>
            
            <p className="text-primary/70 mb-8">
              It looks like you've lost your internet connection. Don't worry, DailyOwo works offline too! 
              Your data is saved locally and will sync when you're back online.
            </p>
            
            <div className="space-y-4">
              <GlassButton
                variant="primary"
                goldBorder
                onClick={() => window.location.reload()}
                fullWidth
              >
                <Icon name="refresh" size="sm" className="mr-2" />
                Try Again
              </GlassButton>
              
              <p className="text-sm text-primary/50">
                This page will automatically refresh when your connection is restored.
              </p>
            </div>
            
            <div className="mt-8 p-4 glass-subtle rounded-xl">
              <p className="text-sm text-primary/70 font-medium mb-2">
                What works offline:
              </p>
              <ul className="text-sm text-primary/60 space-y-1">
                <li>• View your cached data</li>
                <li>• Add transactions locally</li>
                <li>• Browse your financial history</li>
                <li>• All changes sync when online</li>
              </ul>
            </div>
          </GlassContainer>
        </motion.div>
      </Container>
    </div>
  );
} 