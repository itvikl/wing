import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { getSiteMedia } from '@/lib/content/store';
import { SeeWingsExperience, TRACK_VH, type SeeWingsSection } from '@/components/SeeWingsExperience';
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { PortalReveal } from '@/components/PortalReveal';
import { ScrollProgress } from '@/components/ScrollProgress';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { About } from '@/components/About';
import { Projects } from '@/components/Projects';
import { WhyUs } from '@/components/WhyUs';
import { Team } from '@/components/Team';
import { LeadForm } from '@/components/LeadForm';

export default async function HomePage({ params: { locale } }: { params: { locale: Locale } }) {
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
    <>
      <SeeWingsExperience
        locale={locale}
        sections={sections}
        cues={cues}
        navLinks={navLinks}
        ctaPrimary={t('ctaPrimary')}
        brandCta={nav('cta')}
        media={media.seeWings}
      />

      <SmoothScrollProvider>
        <PortalReveal trackVh={TRACK_VH}>
          <ScrollProgress />
          <Header />
          <main>
            <About />
            <Projects />
            <WhyUs />
            <Team />
            <LeadForm />
          </main>
          <Footer />
        </PortalReveal>
      </SmoothScrollProvider>
    </>
  );
}
