import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { getLocaleText } from '@/lib/content/store';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageBackdrop } from '@/components/PageBackdrop';
import { Faq } from '@/components/Faq';
import { formatPhone, localePath, telHref, whatsappHref } from '@/lib/contact';

// Rendered per request like every page under [locale], so an admin edit shows
// up at once (see the note in the home page).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params: { locale } }: { params: { locale: Locale } }): Promise<Metadata> {
  const { faq } = await getLocaleText(locale);
  return { title: `${faq.navLabel} — Wings Real Estate`, description: faq.intro || undefined };
}

export default async function FaqPage({ params: { locale } }: { params: { locale: Locale } }) {
  setRequestLocale(locale);
  const text = await getLocaleText(locale);
  const { faq, footer } = text;
  const phoneNumber = footer.phoneNumber.trim();

  // Google's FAQ rich result: the same questions and answers, as data.
  const questions = faq.categories.flatMap((c) => c.items).filter((it) => it.q.trim() && it.a.trim());
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  };

  return (
    <div className="relative isolate flex min-h-screen min-h-dvh flex-col">
      <PageBackdrop />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <Faq
          text={faq}
          whatsappHref={whatsappHref(footer.whatsappLink, footer.whatsappMessage)}
          contactHref={localePath(locale, '/contact')}
          phone={phoneNumber ? { href: telHref(phoneNumber), label: formatPhone(phoneNumber) } : undefined}
        />
      </main>
      <Footer />
      {questions.length > 0 && (
        <script
          type="application/ld+json"
          // JSON in a script tag: escape "<" so an answer can't close the tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
    </div>
  );
}
