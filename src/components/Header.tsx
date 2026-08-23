import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getSiteMedia } from '@/lib/content/store';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MagneticButton } from './motion/MagneticButton';
import { NavLinks } from './NavLinks';
import { MobileNav } from './MobileNav';

export async function Header() {
  const t = await getTranslations('nav');
  const media = await getSiteMedia();

  const links = [
    { id: 'about', label: t('about') },
    { id: 'projects', label: t('projects') },
    { id: 'why-us', label: t('advantages') },
    { id: 'team', label: t('team') },
    { id: 'contact', label: t('contact') },
  ];

  return (
    <header className="sticky top-0 z-50 bg-primary text-neutral-100">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:gap-6 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src={media.logo} alt="Wings" width={40} height={36} priority unoptimized={media.logo.startsWith('http')} />
        </Link>

        <NavLinks links={links} />

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          <MagneticButton
            href="#contact"
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-primary-dark transition-colors hover:bg-accent-light sm:px-5"
          >
            {t('cta')}
          </MagneticButton>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
