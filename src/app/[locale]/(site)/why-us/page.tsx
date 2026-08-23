import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhyUs } from '@/components/WhyUs';

export const metadata: Metadata = {
  title: 'Why Wings — Wings Real Estate',
  description: 'Exclusive real estate opportunities in Jerusalem.',
};

export default async function WhyUsPage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>
        <WhyUs />
      </main>
      <Footer />
    </>
  );
}
