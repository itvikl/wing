'use client';

import { useState } from 'react';
import { WhatsAppGlyph } from '../icons';

/**
 * A phone's bottom bar on a project page: get details, WhatsApp, share. It
 * stands in for the floating WhatsApp button (hidden while this bar is on the
 * page, see globals.css), so nothing floats over the photos or the form.
 */
export function ProjectBar({
  ctaLabel,
  ctaHref,
  whatsappHref,
  whatsappLabel,
  shareLabel,
  sharedLabel,
  title,
}: {
  ctaLabel: string;
  ctaHref: string;
  whatsappHref: string;
  whatsappLabel: string;
  shareLabel: string;
  sharedLabel: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Closed the share sheet, or no clipboard: nothing to do.
    }
  }

  const item = 'flex min-h-[60px] flex-col items-center justify-center gap-0.5 text-xs font-medium text-neutral-100';

  return (
    <nav
      data-project-bar
      aria-label={ctaLabel}
      className="fixed inset-x-0 bottom-0 z-[65] grid grid-cols-[1.5fr_1fr_1fr] border-t border-accent-light/30 bg-primary-dark pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <a href={ctaHref} className="flex min-h-[60px] items-center justify-center bg-accent px-3 text-[15px] font-medium text-primary-dark">
        {ctaLabel}
      </a>
      {whatsappHref ? (
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={item}>
          <WhatsAppGlyph className="h-5 w-5 text-[#25D366]" />
          {whatsappLabel}
        </a>
      ) : (
        <span />
      )}
      <button type="button" onClick={share} className={item}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" />
        </svg>
        <span role="status">{copied ? sharedLabel : shareLabel}</span>
      </button>
    </nav>
  );
}
