import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { getLocaleText } from '@/lib/content/store';
import { LegalPage } from '@/components/LegalPage';

// Rendered per request like every page under [locale], so an admin edit shows
// up at once (see the note in the home page).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params: { locale } }: { params: { locale: Locale } }): Promise<Metadata> {
  const { legal } = await getLocaleText(locale);
  return { title: `${legal.privacyTitle} — Wings Real Estate` };
}

export default async function PrivacyPage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);
  const { legal } = await getLocaleText(locale);
  return <LegalPage title={legal.privacyTitle} paragraphs={legal.privacy} />;
}
