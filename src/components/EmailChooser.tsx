'use client';

import { useLocale } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

/**
 * On a computer, a mailto: link only works when a mail app is set as the
 * system's default; with none (common: people use Gmail or Outlook in the
 * browser) the click does nothing useful. So every mailto: link on the site
 * (footer, header, the flight's topbar and menu) opens this small chooser
 * instead: Gmail, Outlook, the mail app, or copy the address. Phones and
 * tablets keep the plain link, which opens their mail app.
 */

const COPY = {
  he: { title: 'שליחת מייל', gmail: 'Gmail', outlook: 'Outlook', app: 'אפליקציית המייל במחשב', copy: 'העתקת הכתובת', copied: 'הכתובת הועתקה', close: 'סגירה' },
  en: { title: 'Send an email', gmail: 'Gmail', outlook: 'Outlook', app: 'Mail app on this computer', copy: 'Copy address', copied: 'Address copied', close: 'Close' },
} as const;

type Open = { address: string; x: number; y: number };

export function EmailChooser() {
  const locale = useLocale();
  const copy = locale === 'he' ? COPY.he : COPY.en;
  const [open, setOpen] = useState<Open | null>(null);
  const [copied, setCopied] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = (event.target as Element | null)?.closest?.('a[href^="mailto:"]') as HTMLAnchorElement | null;
      if (!link) return;
      if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
      const address = decodeURIComponent(link.getAttribute('href')!.slice('mailto:'.length).split('?')[0]);
      if (!address) return;
      event.preventDefault();
      const rect = link.getBoundingClientRect();
      returnFocus.current = link;
      setCopied(false);
      setOpen({ address, x: rect.left + rect.width / 2, y: rect.bottom });
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('a,button')?.focus();
    const close = () => setOpen(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        returnFocus.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  if (!open) return null;

  const to = encodeURIComponent(open.address);
  const width = 260;
  const height = 250;
  // Under the link when it fits, above it near the bottom of the screen
  // (the footer); always inside the window.
  const left = Math.min(Math.max(12, open.x - width / 2), window.innerWidth - width - 12);
  const below = open.y + 8 + height < window.innerHeight;
  const top = below ? open.y + 8 : Math.max(12, open.y - height - 48);

  const item =
    'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-start text-[15px] text-neutral-100 transition-colors hover:bg-white/10 focus-visible:bg-white/10';

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(open!.address);
      setCopied(true);
      window.setTimeout(() => setOpen(null), 1200);
    } catch {
      // No clipboard access: the address is shown in the panel to copy by hand.
    }
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={copy.title}
      style={{ left, top, width }}
      className="fixed z-[130] rounded-2xl border border-accent/30 bg-primary-dark p-2 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-2">
        <span dir="ltr" className="truncate text-sm text-accent-light">{open.address}</span>
        <button
          type="button"
          aria-label={copy.close}
          onClick={() => setOpen(null)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg text-neutral-200 hover:bg-white/10"
        >
          ×
        </button>
      </div>
      <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${to}`} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(null)} className={item}>
        {copy.gmail}
      </a>
      <a href={`https://outlook.live.com/mail/0/deeplink/compose?to=${to}`} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(null)} className={item}>
        {copy.outlook}
      </a>
      {/* Its own click handler prevents default first, so the document
          listener above lets it through instead of reopening this panel. */}
      <a href={`mailto:${open.address}`} onClick={(e) => { e.preventDefault(); setOpen(null); window.location.href = `mailto:${open.address}`; }} className={item}>
        {copy.app}
      </a>
      <button type="button" onClick={copyAddress} className={item} aria-live="polite">
        {copied ? `✓ ${copy.copied}` : copy.copy}
      </button>
    </div>
  );
}
