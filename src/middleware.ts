import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'he'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  // The site always opens in English: no Accept-Language guess and no
  // NEXT_LOCALE cookie, so "/" is English for everyone and Hebrew lives
  // only under /he. Every Hebrew link carries that prefix itself.
  localeDetection: false,
});

export const config = {
  matcher: ['/((?!api|admin|_next|_vercel|.*\\..*).*)'],
};
