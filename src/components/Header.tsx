import Image from 'next/image';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { getLocaleText, getSiteMedia, hasProjects } from '@/lib/content/store';
import { Sized } from '@/lib/textSize';
import type { ContentLocale } from '@/lib/content/schema';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NavLinks } from './NavLinks';
import { MobileNav } from './MobileNav';
import { MailGlyph, PhoneGlyph } from './icons';
import { formatPhone, telHref } from '@/lib/contact';

export async function Header() {
  const t = await getTranslations('nav');
  const footer = await getTranslations('footer');
  const faq = await getTranslations('faq');
  const phoneNumber = footer('phoneNumber');
  const emailAddress = footer('emailAddress');
  const media = await getSiteMedia();
  const locale = await getLocale();
  const showProjects = await hasProjects(locale as ContentLocale);
  const contactHref = locale === 'en' ? '/contact' : `/${locale}/contact`;
  // Text sizes aren't strings, so they're read off the content itself rather than through t().
  const sizes = (await getLocaleText(locale as ContentLocale)).nav.sizes;

  const links = [
    { id: 'about', label: t('about'), size: sizes?.about },
    { id: 'projects', label: t('projects'), size: sizes?.projects },
    { id: 'why-us', label: t('advantages'), size: sizes?.advantages },
    { id: 'team', label: t('team'), size: sizes?.team },
    { id: 'faq', label: faq('navLabel') },
    { id: 'contact', label: t('contact'), size: sizes?.contact },
  ].filter((link) => link.id !== 'projects' || showProjects);

  return (
    // The same quiet bar as the flight's topbar on the home page: thin
    // uppercase links, the phone as text, EN | עב, over a dark glass strip
    // with a hairline (sticky, so it needs a ground of its own as pages scroll).
    <header className="sticky top-0 z-50 border-b border-white/10 bg-primary-dark/85 text-neutral-100 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:gap-6 sm:px-6">
        <Link href={locale === 'en' ? '/' : `/${locale}`} className="flex shrink-0 items-center gap-2">
          <Image src={media.logo} alt="Wings" width={40} height={36} priority unoptimized={media.logo.startsWith('http')} />
        </Link>

        <NavLinks links={links} />

        <div className="flex items-center gap-3 sm:gap-5">
          {/* The number itself from lg up, an icon to tap below that. */}
          {phoneNumber && (
            <a
              href={telHref(phoneNumber)}
              aria-label={`${footer('phone')}: ${phoneNumber}`}
              className="flex h-10 min-w-6 items-center justify-center text-sm tracking-[0.08em] text-neutral-100/90 transition-colors hover:text-accent-light"
            >
              <PhoneGlyph className="h-4 w-4 lg:hidden" />
              <span dir="ltr" className="hidden lg:inline">{formatPhone(phoneNumber)}</span>
            </a>
          )}
          {/* An icon only: the address is long, and shows in full in the footer.
              Hidden on small phones, where the bar has no room left beside the
              Contact button (the footer has it). */}
          {emailAddress && (
            <a
              href={`mailto:${emailAddress}`}
              aria-label={`${footer('email')}: ${emailAddress}`}
              title={emailAddress}
              className="hidden h-10 w-6 items-center justify-center text-neutral-100/90 transition-colors hover:text-accent-light sm:flex"
            >
              <MailGlyph className="h-4 w-4" />
            </a>
          )}
          <LanguageSwitcher />
          {/* Phones only: from md the nav's own Contact link does this job. */}
          <a
            href={contactHref}
            className="whitespace-nowrap border border-accent bg-primary-dark/40 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-neutral-100 transition-colors hover:bg-accent hover:text-primary-dark rtl:text-sm rtl:tracking-normal md:hidden"
          >
            <Sized scale={sizes?.cta}>{t('cta')}</Sized>
          </a>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
