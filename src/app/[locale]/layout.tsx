import type { Metadata } from 'next';
import { didot, hebrewDisplay, hebrewSans } from '@/lib/fonts';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, type Locale } from '@/i18n/request';
import { CustomCursor } from '@/components/motion/CustomCursor';
import { Tracking } from '@/components/Tracking';
import { WhatsAppFab } from '@/components/WhatsAppFab';
import { EmailChooser } from '@/components/EmailChooser';
import { AccessibilityProvider } from '@/components/AccessibilityMenu';
import { A11Y_BOOT_SCRIPT } from '@/lib/a11y';
import { whatsappHref } from '@/lib/contact';
import '../globals.css';

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
          <EmailChooser />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
