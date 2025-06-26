'use client';

import React from 'react';
import { AppInitializer } from '@/components/features/AppInitializer';
import { AuthWrapper } from '@/components/features/AuthWrapper';
import { FirebaseSetupNotice } from '@/components/features/FirebaseSetupNotice';
import { GlobalSignOut } from '@/components/ui/GlobalSignOut';
import { ToastProvider } from '@/hooks/useToast';
import { PWAInstallPrompt } from '@/components/features/PWAInstallPrompt';
import { FirestoreErrorBoundary } from '@/components/ui/FirestoreErrorBoundary';
import { OwoAIModal } from '@/components/features/OwoAIModal';
import { OwoAIFloatButton } from '@/components/features/OwoAIFloatButton';
import { useAuth } from '@/lib/firebase/auth-context';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const { user, userProfile, loading } = useAuth();
  const [aiOpen, setAIOpen] = React.useState(false);

  const isPremium = !!userProfile?.aiSettings?.enabled && userProfile?.aiSettings?.features?.insights;
  const userName = userProfile?.firstName || userProfile?.displayName || userProfile?.email?.split('@')[0] || '';

  // Debug logging for authentication state
  React.useEffect(() => {
    console.log('[ClientLayout] Auth state:', { 
      loading, 
      hasUser: !!user, 
      userId: user?.uid,
      path: typeof window !== 'undefined' ? window.location.pathname : 'SSR'
    });
  }, [loading, user]);

  return (
    <FirestoreErrorBoundary>
      <AppInitializer>
        <AuthWrapper>
          <ToastProvider>
            {children}
            <FirebaseSetupNotice />
            <GlobalSignOut />
            <PWAInstallPrompt />
            {/* Owo AI Floating Button and Modal - only render when not loading AND user exists */}
            {!loading && user && (
              <>
                <OwoAIFloatButton
                  onClick={() => setAIOpen(true)}
                  isPremium={!!isPremium}
                  isLoggedIn={!!user}
                />
                <OwoAIModal
                  isOpen={aiOpen}
                  onClose={() => setAIOpen(false)}
                  isPremium={!!isPremium}
                  userName={userName}
                />
              </>
            )}
          </ToastProvider>
        </AuthWrapper>
      </AppInitializer>
    </FirestoreErrorBoundary>
  );
}