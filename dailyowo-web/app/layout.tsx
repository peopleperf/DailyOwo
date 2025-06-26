import { AuthProvider } from '@/lib/firebase/auth-context';
import { BottomNavigation } from '@/components/layouts/BottomNavigation';
import { GlobalSyncStatus } from '@/components/ui/SyncStatusIndicator';
import { FirestoreErrorHandler } from '@/components/ui/FirestoreErrorHandler';
import ClientLayout from '@/app/client-layout';
import { AuthWrapper } from '@/components/features/AuthWrapper';
import './globals.css';

interface Props {
  children: React.ReactNode;
}

export const metadata = {
  title: 'DailyOwo - Smart Finance',
  description: 'Smart financial management for the modern world',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DailyOwo'
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#A67C00'
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#A67C00" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DailyOwo" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        {/* Global sync status bar */}
        <GlobalSyncStatus />
        
        {/* Firestore error handler */}
        <FirestoreErrorHandler />
        
        <AuthProvider>
          <AuthWrapper>
            <ClientLayout>
              {children}
              <BottomNavigation />
            </ClientLayout>
          </AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}