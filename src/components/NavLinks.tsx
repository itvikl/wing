'use client';

import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type Link = { id: string; label: string };

const ROUTED_IDS = new Set(['about', 'projects', 'why-us', 'team', 'contact']);

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
    <nav className="hidden items-center gap-8 text-sm md:flex">
      {links.map((link) => {
        const isRouted = ROUTED_IDS.has(link.id);
        const routedHref = `${localeBase}/${link.id}`;
        const href = isRouted ? routedHref : onHome ? `#${link.id}` : `${homeHref}#${link.id}`;
        const isActive = isRouted ? pathname.startsWith(routedHref) : active === link.id;

        return (
          <a key={link.id} href={href} className="relative py-1 transition-colors hover:text-accent-light">
            <span className={isActive ? 'text-accent-light' : undefined}>{link.label}</span>
            {isActive && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute inset-x-0 -bottom-1 h-[2px] rounded-full bg-accent-light"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </a>
        );
      })}
    </nav>
  );
}
