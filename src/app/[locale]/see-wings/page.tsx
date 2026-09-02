import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { getSiteMedia } from '@/lib/content/store';
import { SeeWingsExperience, type SeeWingsSection } from '@/components/SeeWingsExperience';

// Every string on the site comes from the Firestore content doc (see
// i18n/request.ts -> getLocaleText). That's a raw Admin SDK read, not a fetch,
// so Next can't tie it to a cache tag: prerendered pages keep serving whatever
// was in Firestore at build time, and revalidatePath() only clears the on-disk
// ISR cache of the one Cloud Run instance that ran the admin action. Rendering
// per request is what actually makes an admin save show up on the live site.
// Route segment config does not cascade from the layout, so every page under
// [locale] needs this line.
export const dynamic = 'force-dynamic';

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
