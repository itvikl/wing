'use client';

import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';

type Link = { id: string; label: string };

const ROUTED_IDS = new Set(['about', 'projects', 'why-us', 'team', 'contact']);

export function MobileNav({ links }: { links: Link[] }) {
  const [open, setOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const localeBase = locale === 'en' ? '' : `/${locale}`;
  const homeHref = localeBase || '/';
  const onHome = pathname === homeHref;

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 shrink-0 items-center justify-center"
      >
        <span className="sr-only">Menu</span>
        <span className="flex flex-col items-center gap-[5px]">
          <span
            className={`block h-[2px] w-5 rounded-full bg-current transition-transform duration-200 ${open ? 'translate-y-[7px] rotate-45' : ''}`}
          />
          <span
            className={`block h-[2px] w-5 rounded-full bg-current transition-opacity duration-200 ${open ? 'opacity-0' : ''}`}
          />
          <span
            className={`block h-[2px] w-5 rounded-full bg-current transition-transform duration-200 ${open ? '-translate-y-[7px] -rotate-45' : ''}`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-primary-soft bg-primary px-6 py-6 shadow-lg">
          <nav className="flex flex-col gap-1 text-base">
            {links.map((link) => {
              const href = ROUTED_IDS.has(link.id)
                ? `${localeBase}/${link.id}`
                : onHome
                  ? `#${link.id}`
                  : `${homeHref}#${link.id}`;

              return (
                <a
                  key={link.id}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 transition-colors hover:bg-primary-soft hover:text-accent-light"
                >
                  {link.label}
                </a>
              );
            })}
          </nav>
          <div className="mt-4 border-t border-primary-soft pt-4">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </div>
  );
}
