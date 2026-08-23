import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Projects } from '@/components/Projects';

export const metadata: Metadata = {
  title: 'Opportunities — Wings Real Estate',
  description: 'Exclusive real estate opportunities in Jerusalem.',
};

export default async function ProjectsPage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>
        <Projects />
      </main>
      <Footer />
    </>
  );
}
