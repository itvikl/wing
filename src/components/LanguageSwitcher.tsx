'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const pathWithoutLocale = pathname.replace(/^\/(en|he)/, '');
  const targetLocale = locale === 'en' ? 'he' : 'en';
  // Always prefixed, English included: "/en/..." redirects on to the
  // unprefixed URL (localePrefix as-needed). This used to matter for the
  // NEXT_LOCALE cookie; the middleware no longer detects locales, so it's
  // now just a working link either way.
  const href = `/${targetLocale}${pathWithoutLocale}`;

  // No prefetch: kept from when the middleware set a locale cookie on the
  // prefetch's response too, which flipped the next bare link to Hebrew.
  return (
    <Link href={href} prefetch={false} className="text-base font-medium uppercase tracking-wide hover:text-accent-light">
      {targetLocale}
    </Link>
  );
}
