'use client';

import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Sized } from '@/lib/textSize';

type Link = { id: string; label: string; size?: number };

const ROUTED_IDS = new Set(['about', 'projects', 'why-us', 'team', 'faq', 'contact']);

export function NavLinks({ links }: { links: Link[] }) {
  const [active, setActive] = useState<string | null>(null);
  const locale = useLocale();
  const pathname = usePathname();
  const localeBase = locale === 'en' ? '' : `/${locale}`;
  const homeHref = localeBase || '/';
  const onHome = pathname === homeHref;

  useEffect(() => {
    if (!onHome) return;
    const sections = links
      .filter((link) => !ROUTED_IDS.has(link.id))
      .map((link) => document.getElementById(link.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [links, onHome]);

  return (
    <nav className="hidden items-center gap-5 whitespace-nowrap text-[13px] uppercase tracking-[0.1em] rtl:tracking-[0.02em] md:flex lg:gap-10 lg:text-[15px] lg:tracking-[0.12em]">
      {links.map((link) => {
        const isRouted = ROUTED_IDS.has(link.id);
        const routedHref = `${localeBase}/${link.id}`;
        const href = isRouted ? routedHref : onHome ? `#${link.id}` : `${homeHref}#${link.id}`;
        const isActive = isRouted ? pathname.startsWith(routedHref) : active === link.id;

        return (
          <a key={link.id} href={href} className="relative py-1 text-neutral-100/90 transition-colors hover:text-accent-light">
            <span className={isActive ? 'text-accent-light' : undefined}><Sized scale={link.size}>{link.label}</Sized></span>
            {isActive && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute inset-x-0 -bottom-1 h-px bg-accent-light"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </a>
        );
      })}
    </nav>
  );
}
