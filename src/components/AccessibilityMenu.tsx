'use client';

import { MotionConfig } from 'framer-motion';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { localePath } from '@/lib/contact';
import { A11Y_STORAGE_KEY as STORAGE_KEY, A11Y_TEXT_STEPS as TEXT_STEPS, A11Y_TOGGLES as TOGGLES, type A11yToggle as Toggle } from '@/lib/a11y';

/**
 * The site's accessibility menu (bottom start corner, opposite the WhatsApp
 * button) plus a "skip to main content" link. Each setting is a class on
 * <html> styled in globals.css (a11y-*), saved in this browser only, and put
 * back before first paint by A11Y_BOOT_SCRIPT so a returning visitor never
 * sees the page flash at the wrong size or contrast.
 */

type Settings = { text: number } & Partial<Record<Toggle, boolean>>;

const COPY = {
  he: {
    open: 'פתיחת תפריט נגישות',
    title: 'תפריט נגישות',
    close: 'סגירת תפריט הנגישות',
    textSize: 'גודל טקסט',
    smaller: 'הקטנת טקסט',
    larger: 'הגדלת טקסט',
    contrast: 'ניגודיות גבוהה',
    mono: 'גווני אפור',
    links: 'הדגשת קישורים',
    font: 'גופן קריא',
    still: 'עצירת אנימציות',
    cursor: 'סמן גדול',
    reset: 'איפוס',
    statement: 'הצהרת נגישות',
    skip: 'דילוג לתוכן הראשי',
  },
  en: {
    open: 'Open accessibility menu',
    title: 'Accessibility',
    close: 'Close accessibility menu',
    textSize: 'Text size',
    smaller: 'Smaller text',
    larger: 'Larger text',
    contrast: 'High contrast',
    mono: 'Grayscale',
    links: 'Highlight links',
    font: 'Readable font',
    still: 'Stop animations',
    cursor: 'Large cursor',
    reset: 'Reset',
    statement: 'Accessibility statement',
    skip: 'Skip to main content',
  },
} as const;

function read(): Settings {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Settings;
    return { ...parsed, text: Math.min(TEXT_STEPS.length - 1, Math.max(0, Number(parsed.text) || 0)) };
  } catch {
    return { text: 0 };
  }
}

function apply(settings: Settings) {
  const classes = document.documentElement.classList;
  TEXT_STEPS.forEach((_, i) => classes.toggle(`a11y-text-${i}`, i > 0 && settings.text === i));
  TOGGLES.forEach((key) => classes.toggle(`a11y-${key}`, !!settings[key]));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Blocked storage: the settings still hold for this page view.
  }
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const copy = locale === 'he' ? COPY.he : COPY.en;
  const pathname = usePathname();
  const [settings, setSettings] = useState<Settings>({ text: 0 });
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setSettings(read()), []);

  const update = useCallback((next: Settings) => {
    setSettings(next);
    apply(next);
  }, []);

  // Escape closes and hands focus back to the button; so does a click outside.
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  // On the home page the main content (the lead form) sits at the end of the
  // flight: "#contact" is caught by the flight, which flies there.
  const onHome = pathname === '/' || pathname === `/${locale}`;
  const skipHref = onHome ? '#contact' : '#main-content';

  const toggle = (key: Toggle) => update({ ...settings, [key]: !settings[key] });

  return (
    <MotionConfig reducedMotion={settings.still ? 'always' : 'user'}>
      <a
        href={skipHref}
        className="fixed start-4 top-4 z-[120] -translate-y-24 rounded-full bg-accent px-5 py-3 text-base font-semibold text-primary-dark shadow-lg transition-transform focus:translate-y-0"
      >
        {copy.skip}
      </a>

      {children}

      <button
        ref={buttonRef}
        type="button"
        aria-label={copy.open}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        // Stacked above the WhatsApp button in the same corner: 16px over its
        // 56px circle (phones) / 48px pill (md+), centered on the circle.
        className="fixed bottom-[calc(1.25rem+72px+env(safe-area-inset-bottom))] end-6 z-[70] flex h-12 w-12 md:bottom-[calc(1.25rem+64px+env(safe-area-inset-bottom))] md:end-5 items-center justify-center rounded-full bg-primary-dark text-accent-light shadow-[0_10px_30px_-6px_rgba(5,32,26,0.55)] ring-1 ring-accent/50 transition-transform hover:-translate-y-0.5"
      >
        <AccessibilityGlyph className="h-6 w-6" />
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label={copy.title}
          className="fixed bottom-[calc(1.25rem+128px+env(safe-area-inset-bottom))] end-5 z-[71] md:bottom-[calc(1.25rem+120px+env(safe-area-inset-bottom))] w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-accent/30 bg-primary-dark p-4 text-neutral-100 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)]"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{copy.title}</h2>
            <button
              type="button"
              aria-label={copy.close}
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-white/10"
            >
              ×
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
            <span className="text-sm">{copy.textSize}</span>
            <div className="flex items-center gap-1" dir="ltr">
              <button
                type="button"
                aria-label={copy.smaller}
                disabled={settings.text === 0}
                onClick={() => update({ ...settings, text: settings.text - 1 })}
                className="h-9 w-9 rounded-full border border-white/20 text-sm hover:border-accent-light disabled:opacity-30"
              >
                A−
              </button>
              <span className="w-12 text-center text-sm tabular-nums" aria-live="polite">
                {TEXT_STEPS[settings.text]}%
              </span>
              <button
                type="button"
                aria-label={copy.larger}
                disabled={settings.text === TEXT_STEPS.length - 1}
                onClick={() => update({ ...settings, text: settings.text + 1 })}
                className="h-9 w-9 rounded-full border border-white/20 text-base hover:border-accent-light disabled:opacity-30"
              >
                A+
              </button>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {TOGGLES.map((key) => (
              <button
                key={key}
                type="button"
                aria-pressed={!!settings[key]}
                onClick={() => toggle(key)}
                className={`min-h-11 rounded-xl px-3 py-2 text-start text-sm transition-colors ${
                  settings[key] ? 'bg-accent font-semibold text-primary-dark' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {copy[key]}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
            <button type="button" onClick={() => update({ text: 0 })} className="rounded-full px-3 py-1.5 hover:bg-white/10">
              {copy.reset}
            </button>
            <a href={localePath(locale, '/accessibility')} className="underline underline-offset-2 hover:text-accent-light">
              {copy.statement}
            </a>
          </div>
        </div>
      )}
    </MotionConfig>
  );
}

/** Lucide's "accessibility" figure (ISC). */
function AccessibilityGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <circle cx="16" cy="4" r="1" />
      <path d="m18 19 1-7-6 1" />
      <path d="m5 8 3-3 5.5 3-2.36 3.5" />
      <path d="M4.24 14.5a5 5 0 0 0 6.88 6" />
      <path d="M13.76 17.5a5 5 0 0 0-6.88-6" />
    </svg>
  );
}
