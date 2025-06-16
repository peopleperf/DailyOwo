import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';
import {locales, defaultLocale} from '../i18n';

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always'
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const {Link, redirect, usePathname, useRouter} = createNavigation(routing); 