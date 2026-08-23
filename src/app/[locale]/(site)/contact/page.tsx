import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LeadForm } from '@/components/LeadForm';

export const metadata: Metadata = {
  title: 'Contact — Wings Real Estate',
  description: 'Exclusive real estate opportunities in Jerusalem.',
};

export default async function ContactPage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main>
        <LeadForm />
      </main>
      <Footer />
    </>
  );
}
