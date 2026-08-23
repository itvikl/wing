import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { About } from '@/components/About';

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
