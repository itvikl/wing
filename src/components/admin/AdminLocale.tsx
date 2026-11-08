'use client';

import { createContext, useContext, useEffect, useState, type ElementType, type MouseEvent, type ReactNode } from 'react';
import type { ContentLocale } from '@/lib/content/schema';

/**
 * One editing language for the whole admin: every LocaleTabs group and every
 * preview follow it, so a single switch flips the whole screen between Hebrew
 * and English instead of each group's own tabs. Remembered across sections
 * (and visits, per browser).
 */
type AdminLocale = { locale: ContentLocale; setLocale: (locale: ContentLocale) => void; shared: boolean };

const AdminLocaleContext = createContext<AdminLocale | null>(null);
const STORAGE_KEY = 'wings-admin-locale';

export function AdminLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<ContentLocale>('he');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'he' || saved === 'en') setLocaleState(saved);
    } catch {}
  }, []);

  function setLocale(next: ContentLocale) {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }

  return <AdminLocaleContext.Provider value={{ locale, setLocale, shared: true }}>{children}</AdminLocaleContext.Provider>;
}

/** The shared editing language; outside the provider, a local one starting on Hebrew. */
export function useAdminLocale(): AdminLocale {
  const shared = useContext(AdminLocaleContext);
  const [locale, setLocale] = useState<ContentLocale>('he');
  return shared ?? { locale, setLocale, shared: false };
}

/** The screen-wide switch, at the top of every section's fields. */
export function AdminLocaleToggle() {
  const { locale, setLocale } = useAdminLocale();
  return (
    <div className="sticky top-0 z-20 -mx-1 mb-6 flex items-center gap-3 bg-neutral-100/95 px-1 py-3 backdrop-blur">
      <span className="text-sm font-medium text-primary-dark">שפת העריכה:</span>
      <div className="flex gap-1 rounded-full bg-white p-1 shadow-sm">
        {(['he', 'en'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setLocale(value)}
            aria-pressed={locale === value}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              locale === value ? 'bg-primary-dark text-neutral-100' : 'text-neutral-muted hover:bg-neutral-100'
            }`}
          >
            {value === 'he' ? 'עברית' : 'English'}
          </button>
        ))}
      </div>
      <span className="text-xs text-neutral-muted">לחיצה על טקסט בתצוגה המקדימה קופצת לשדה שלו.</span>
    </div>
  );
}

/**
 * Scrolls the form to the field marked data-jump-target={id}, in the
 * language now being edited when the field exists in both, then focuses it
 * and flashes it so the eye lands on it.
 */
export function jumpToField(id: string, locale: ContentLocale) {
  const selector = `[data-jump-target="${CSS.escape(id)}"]`;
  const target =
    document.querySelector<HTMLElement>(`[data-locale="${locale}"] ${selector}`) ??
    document.querySelector<HTMLElement>(selector);
  if (!target) return;
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const input = target.matches('input, textarea')
    ? target
    : target.querySelector<HTMLElement>('input:not([type="file"]), textarea, button');
  input?.focus({ preventScroll: true });
  target.classList.remove('admin-jump-flash');
  void target.offsetWidth; // restart the flash if it's still running
  target.classList.add('admin-jump-flash');
  window.setTimeout(() => target.classList.remove('admin-jump-flash'), 1600);
}

/** A piece of a preview that jumps to the field it shows when clicked. */
export function Jump({
  to,
  as,
  className = '',
  children,
}: {
  to: string;
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  const { locale } = useAdminLocale();
  const Tag = as ?? 'div';
  return (
    <Tag
      className={`${className} cursor-pointer rounded-sm outline-offset-2 hover:outline hover:outline-1 hover:outline-accent-light`}
      onClick={(event: MouseEvent) => {
        // Innermost wins: a title inside a card that itself jumps to the image.
        event.stopPropagation();
        jumpToField(to, locale);
      }}
      title="לחצו כדי לערוך"
    >
      {children}
    </Tag>
  );
}
