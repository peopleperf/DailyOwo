import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {locales} from '@/i18n';
import { BottomNavigation } from '@/components/layouts/BottomNavigation';
import { GlobalSyncStatus } from '@/components/ui/SyncStatusIndicator';
import { FirestoreErrorHandler } from '@/components/ui/FirestoreErrorHandler';
import ClientLayout from '@/app/client-layout';

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  // Handle params as Promise for Next.js 15
  const { locale } = await params;
  
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <>
      {/* Global sync status bar */}
      <GlobalSyncStatus />
      
      {/* Firestore error handler */}
      <FirestoreErrorHandler />
      
      <NextIntlClientProvider messages={messages}>
        <ClientLayout>
          {children}
          <BottomNavigation />
        </ClientLayout>
      </NextIntlClientProvider>
    </>
  );
} 