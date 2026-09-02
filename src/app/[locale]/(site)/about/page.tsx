import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { About } from '@/components/About';

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
  title: 'About — Wings Real Estate',
  description: 'Exclusive real estate opportunities in Jerusalem.',
};

export default async function AboutPage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>
        <About />
      </main>
      <Footer />
    </>
  );
}
