import {notFound} from 'next/navigation';
import {getRequestConfig} from 'next-intl/server';

// Can be imported from a shared config
export const locales = ['en', 'es', 'fr', 'it', 'pt', 'de', 'nl', 'yo', 'sw', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  pt: 'Português',
  de: 'Deutsch',
  nl: 'Nederlands',
  yo: 'Yorùbá',
  sw: 'Kiswahili',
  ar: 'العربية'
};

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async (params) => {
  // In Next.js 15 with next-intl, we need to await the requestLocale
  let locale = params.locale;
  
  // If locale is undefined, try to get it from requestLocale
  if (!locale && params.requestLocale) {
    locale = await params.requestLocale;
  }
  
  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as any)) {
    notFound();
  }
  
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
}); 