import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Skip all internal paths (_next, _vercel, etc.)
    '/((?!_next|_vercel|.*\\..*).*)',
    // Optional: only run on root (/) or locale-prefixed paths
    // '/', '/(en|es|fr|it|pt|de|nl|yo|sw|ar)/:path*'
  ]
}; 