'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type Link = { id: string; label: string };

export function NavLinks({ links }: { links: Link[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = links
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
  }, [links]);

  return (
    <nav className="hidden items-center gap-8 text-sm md:flex">
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="relative py-1 transition-colors hover:text-accent-light"
        >
          <span className={active === link.id ? 'text-accent-light' : undefined}>{link.label}</span>
          {active === link.id && (
            <motion.span
              layoutId="nav-indicator"
              className="absolute inset-x-0 -bottom-1 h-[2px] rounded-full bg-accent-light"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </a>
      ))}
    </nav>
  );
}
