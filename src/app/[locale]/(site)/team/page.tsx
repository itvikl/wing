import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { getSiteMedia } from '@/lib/content/store';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { GalleryWall } from '@/components/GalleryWall';

export const metadata: Metadata = {
  title: 'Meet the team — Wings Real Estate',
  description: 'The people behind every address at Wings Real Estate, Jerusalem.',
};

type Member = { name: string; initials: string; role: string; bio: string };

export default async function TeamPage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);

  const t = await getTranslations('team');
  const media = await getSiteMedia();
  const members = (t.raw('members') as Member[]).map((member, index) => ({
    ...member,
    image: media.team.members[index] ?? null,
  }));

  return (
    <>
      <Header />
      <main>
        <GalleryWall eyebrow={t('eyebrow')} title={t('title')} members={members} />
      </main>
      <Footer />
    </>
  );
}
