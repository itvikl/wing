import type { Metadata } from 'next';
import { Frank_Ruhl_Libre, Heebo } from 'next/font/google';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/request';
import { CustomCursor } from '@/components/motion/CustomCursor';
import { Tracking } from '@/components/Tracking';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { AccessibilityProvider } from '@/components/AccessibilityMenu';
import { A11Y_BOOT_SCRIPT } from '@/lib/a11y';
import { whatsappHref } from '@/lib/contact';
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
  const footer = await getTranslations('footer');
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  // Read at request time (not NEXT_PUBLIC_, which is baked in at build), so
  // the pixel can be switched on in apphosting.yaml without a code change.
  const pixelId = process.env.META_PIXEL_ID?.trim();

  return (
    // suppressHydrationWarning: the boot script below adds the visitor's saved
    // accessibility classes (a11y-*) to <html> before React hydrates.
    <html
      lang={locale}
      dir={dir}
      className={`${didot.variable} ${hebrewDisplay.variable} ${hebrewSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: A11Y_BOOT_SCRIPT }} />
      </head>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages}>
          <CustomCursor />
          <AccessibilityProvider>{children}</AccessibilityProvider>
          <WhatsAppFab href={whatsappHref(footer('whatsappLink'), footer('whatsappMessage'))} label={footer('whatsapp')} />
          <Tracking pixelId={pixelId} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
