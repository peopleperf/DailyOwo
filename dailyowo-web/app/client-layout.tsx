'use client';

import React from 'react';
import { AppInitializer } from '@/components/features/AppInitializer';
import { AuthWrapper } from '@/components/features/AuthWrapper';
import { FirebaseSetupNotice } from '@/components/features/FirebaseSetupNotice';
import { GlobalSignOut } from '@/components/ui/GlobalSignOut';
import { ToastProvider } from '@/hooks/useToast';
import { PWAInstallPrompt } from '@/components/features/PWAInstallPrompt';
import { FirestoreErrorBoundary } from '@/components/ui/FirestoreErrorBoundary';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <FirestoreErrorBoundary>
      <AppInitializer>
        <AuthWrapper>
          <ToastProvider>
            {children}
            <FirebaseSetupNotice />
            <GlobalSignOut />
            <PWAInstallPrompt />
          </ToastProvider>
        </AuthWrapper>
      </AppInitializer>
    </FirestoreErrorBoundary>
  );
} 