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

  // No prefetch: the middleware rewrites that cookie on the prefetch's response
  // too, so merely rendering this link on an English page turned the cookie to
  // Hebrew, and the next bare link (/about) was redirected to /he/about.
  return (
    <Link href={href} prefetch={false} className="text-base font-medium uppercase tracking-wide hover:text-accent-light">
      {targetLocale}
    </Link>
  );
}
