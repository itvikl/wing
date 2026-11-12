import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { getLocaleText, getSiteMedia, hasProjects } from '@/lib/content/store';
import type { TextSizes } from '@/lib/content/schema';
import { SeeWingsExperience, type SeeWingsSection } from '@/components/SeeWingsExperience';
import { formatPhone, telHref } from '@/lib/contact';

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
  const hero = await getTranslations('hero');
  // Text sizes aren't strings, so they're read off the content itself rather than through t().
  const text = await getLocaleText(locale);
  const opening = { eyebrow: hero('eyebrow'), title: hero('headline'), sizes: text.hero.sizes };
  const media = await getSiteMedia();
  const showProjects = await hasProjects(locale);
  const sections = t.raw('sections') as SeeWingsSection[];
  const cues = t.raw('cues') as { eyebrow: string; title: string; body?: string; extra?: { label: string; value: string }[]; sizes?: TextSizes }[];
  const navSizes = text.nav.sizes;
  const phoneNumber = text.footer.phoneNumber.trim();
  const phone = phoneNumber
    ? { href: telHref(phoneNumber), label: formatPhone(phoneNumber), aria: `${text.footer.phone}: ${phoneNumber}` }
    : undefined;
  const emailAddress = text.footer.emailAddress.trim();
  const email = emailAddress
    ? { href: `mailto:${emailAddress}`, label: emailAddress, aria: `${text.footer.email}: ${emailAddress}` }
    : undefined;
  const navLinks = [
    { id: 'about', label: nav('about'), size: navSizes?.about },
    { id: 'projects', label: nav('projects'), size: navSizes?.projects },
    { id: 'why-us', label: nav('advantages'), size: navSizes?.advantages },
    { id: 'team', label: nav('team'), size: navSizes?.team },
    { id: 'faq', label: text.faq.navLabel },
    { id: 'contact', label: nav('contact'), size: navSizes?.contact },
  ].filter((link) => link.id !== 'projects' || showProjects);

  return (
    <SeeWingsExperience
      locale={locale}
      sections={sections}
      cues={cues}
      navLinks={navLinks}
      ctaPrimary={t('ctaPrimary')}
      ctaPrimarySize={text.seeWings.sizes?.ctaPrimary}
      brandCta={nav('cta')}
      brandCtaSize={navSizes?.cta}
      media={media.seeWings}
      opening={opening}
      phone={phone}
      email={email}
    />
  );
}
