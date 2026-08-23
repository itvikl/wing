import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getLocaleText } from '@/lib/content/store';
import type { AbstractIntlMessages } from 'next-intl';

export const locales = ['en', 'he'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  if (!locales.includes(requested as Locale)) notFound();
  const locale = requested as Locale;

  return {
    locale,
    // LocaleText (Zod-inferred) types arrays precisely (e.g. projects.items),
    // which AbstractIntlMessages' recursive string-map type doesn't allow —
    // next-intl's own t.raw() handles arrays fine at runtime regardless.
    messages: (await getLocaleText(locale)) as unknown as AbstractIntlMessages,
  };
});
