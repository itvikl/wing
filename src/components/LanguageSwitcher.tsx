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
  // "EN | עב" in that order on both sites, the current one in gold and not a
  // link — the same switch as the flight's topbar.
  const item = (code: 'en' | 'he', label: string) =>
    locale === code ? (
      <span lang={code} aria-current="true" className="text-accent-light">{label}</span>
    ) : (
      <Link href={href} prefetch={false} lang={code} aria-label={code === 'en' ? 'English' : 'עברית'} className="transition-colors hover:text-accent-light">
        {label}
      </Link>
    );

  return (
    <span dir="ltr" className="inline-flex items-center gap-2 whitespace-nowrap text-sm tracking-[0.08em] text-neutral-100/90">
      {item('en', 'EN')}
      <span aria-hidden className="opacity-50">|</span>
      {item('he', 'עב')}
    </span>
  );
}
