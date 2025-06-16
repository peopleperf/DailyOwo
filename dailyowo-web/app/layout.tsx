import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
// Analytics import removed - not installed
import { AuthProvider } from '@/lib/firebase/auth-context';
import './globals.css';
import { ErrorBoundary, AsyncErrorBoundary } from '@/lib/utils/error-boundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DailyOwo - Your Premium Financial Companion',
  description: 'Track income, expenses, and investments with AI-powered insights. Manage your finances with style.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#262659',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192x192.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <AsyncErrorBoundary>
            <AuthProvider>
              {children}
            </AuthProvider>
          </AsyncErrorBoundary>
        </ErrorBoundary>

      </body>
    </html>
  );
}
