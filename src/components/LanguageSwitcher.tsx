'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  const pathWithoutLocale = pathname.replace(/^\/(en|he)/, '') || '/';
  const targetLocale = locale === 'en' ? 'he' : 'en';
  const href = targetLocale === 'en' ? pathWithoutLocale : `/he${pathWithoutLocale}`;

  return (
    <Link href={href} className="text-sm font-medium uppercase tracking-wide hover:text-accent-light">
      {targetLocale}
    </Link>
  );
}
