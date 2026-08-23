import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { getSiteMedia } from '@/lib/content/store';
import { SeeWingsExperience, type SeeWingsSection } from '@/components/SeeWingsExperience';

export const metadata: Metadata = {
  title: 'A closer look — Wings Real Estate',
};

export default async function SeeWingsPage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);
  const t = await getTranslations('seeWings');
  const nav = await getTranslations('nav');
  const media = await getSiteMedia();
  const sections = t.raw('sections') as SeeWingsSection[];
  const cues = t.raw('cues') as { eyebrow: string; title: string; body?: string; extra?: { label: string; value: string }[] }[];
  const navLinks = [
    { id: 'about', label: nav('about') },
    { id: 'projects', label: nav('projects') },
    { id: 'why-us', label: nav('advantages') },
    { id: 'team', label: nav('team') },
    { id: 'contact', label: nav('contact') },
  ];

  return (
    <SeeWingsExperience
      locale={locale}
      sections={sections}
      cues={cues}
      navLinks={navLinks}
      ctaPrimary={t('ctaPrimary')}
      brandCta={nav('cta')}
      media={media.seeWings}
    />
  );
}
