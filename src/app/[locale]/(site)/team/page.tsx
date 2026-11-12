import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { getLocaleText, getSiteMedia } from '@/lib/content/store';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageBackdrop } from '@/components/PageBackdrop';
import { TeamProfiles } from '@/components/TeamProfiles';

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
  title: 'Meet the team — Wings Real Estate',
  description: 'The people behind every address at Wings Real Estate, Jerusalem.',
};

export default async function TeamPage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);

  const media = await getSiteMedia();
  const text = await getLocaleText(locale);

  return (
    // At least one screen tall with the content stretching, so a short page
    // still puts the Footer at the bottom of the screen. dvh tracks a phone's
    // URL bar; min-h-screen is the fallback where dvh isn't supported.
    <div className="relative isolate flex min-h-screen min-h-dvh flex-col">
      <PageBackdrop />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <TeamProfiles team={text.team} images={media.team.members} />
      </main>
      <Footer />
    </div>
  );
}
