import Image from 'next/image';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { getLocaleText, getSiteMedia, hasProjects } from '@/lib/content/store';
import { Sized } from '@/lib/textSize';
import type { ContentLocale } from '@/lib/content/schema';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MagneticButton } from './motion/MagneticButton';
import { NavLinks } from './NavLinks';
import { MobileNav } from './MobileNav';
import { PhoneGlyph } from './icons';
import { telHref } from '@/lib/contact';

export async function Header() {
  const t = await getTranslations('nav');
  const footer = await getTranslations('footer');
  const phoneNumber = footer('phoneNumber');
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
    { id: 'contact', label: t('contact'), size: sizes?.contact },
  ].filter((link) => link.id !== 'projects' || showProjects);

  return (
    <header className="sticky top-0 z-50 bg-primary text-neutral-100">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:gap-6 sm:px-6">
        <Link href={locale === 'en' ? '/' : `/${locale}`} className="flex shrink-0 items-center gap-2">
          <Image src={media.logo} alt="Wings" width={40} height={36} priority unoptimized={media.logo.startsWith('http')} />
        </Link>

        <NavLinks links={links} />

        <div className="flex items-center gap-3 sm:gap-4">
          {/* The number itself from lg up, an icon to tap below that. */}
          {phoneNumber && (
            <a
              href={telHref(phoneNumber)}
              aria-label={`${footer('phone')}: ${phoneNumber}`}
              className="flex h-10 items-center gap-2 rounded-full text-base hover:text-accent-light max-lg:w-10 max-lg:justify-center max-lg:border max-lg:border-white/20"
            >
              <PhoneGlyph className="h-4 w-4 text-accent-light" />
              <span dir="ltr" className="hidden lg:inline">{phoneNumber}</span>
            </a>
          )}
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <MagneticButton
            href={contactHref}
            className="rounded-full bg-accent px-4 py-2 text-base font-medium text-primary-dark transition-colors hover:bg-accent-light sm:px-5"
          >
            <Sized scale={sizes?.cta}>{t('cta')}</Sized>
          </MagneticButton>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
