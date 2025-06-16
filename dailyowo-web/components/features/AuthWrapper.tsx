'use client';

import { AuthProvider } from '@/lib/firebase/auth-context';
import { CASLProvider } from '@/lib/auth/casl-provider';
import { AuthDiagnostics } from '@/components/auth/AuthDiagnostics';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CASLProvider>
        {children}
        {process.env.NODE_ENV === 'development' && <AuthDiagnostics />}
      </CASLProvider>
    </AuthProvider>
  );
} 