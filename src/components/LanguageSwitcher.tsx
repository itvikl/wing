'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const pathWithoutLocale = pathname.replace(/^\/(en|he)/, '');
  const targetLocale = locale === 'en' ? 'he' : 'en';
  // Always prefixed, English included. The middleware remembers the last
  // locale in a NEXT_LOCALE cookie, so a bare "/" from a Hebrew page got
  // redirected straight back to /he. "/en/..." is what rewrites that cookie
  // (it then redirects on to the unprefixed URL, per localePrefix as-needed).
  const href = `/${targetLocale}${pathWithoutLocale}`;

  return (
    <Link href={href} className="text-sm font-medium uppercase tracking-wide hover:text-accent-light">
      {targetLocale}
    </Link>
  );
}
