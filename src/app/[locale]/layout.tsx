import type { Metadata } from 'next';
import { Frank_Ruhl_Libre, Heebo } from 'next/font/google';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/request';
import { CustomCursor } from '@/components/motion/CustomCursor';
import '../globals.css';

// Google's latin cut of GFS Didot, self-hosted: next/font/google only knows the
// font's greek subset, so it would never preload the one this site reads in.
const didot = localFont({
  src: '../fonts/GFSDidot-latin.woff2',
  weight: '400',
  variable: '--font-didot',
  display: 'swap',
  // The generated metric-matched fallback is local Times New Roman for every
  // character, Hebrew included, so it would win over the Hebrew fonts below.
  adjustFontFallback: false,
});

// GFS Didot has no Hebrew glyphs, so Hebrew falls through to these, character
// by character: see --font-display and --font-sans in globals.css.
const hebrewDisplay = Frank_Ruhl_Libre({
  subsets: ['hebrew'],
  weight: ['500', '600', '700'],
  variable: '--font-hebrew-display',
  display: 'swap',
});

const hebrewSans = Heebo({
  subsets: ['hebrew'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-hebrew-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wings Real Estate — Jerusalem',
  description: 'Exclusive real estate opportunities in Jerusalem.',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: Locale };
}) {
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className={`${didot.variable} ${hebrewDisplay.variable} ${hebrewSans.variable}`}>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages}>
          <CustomCursor />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
