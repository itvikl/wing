'use client';

import { WhatsAppGlyph } from './icons';

/**
 * The floating WhatsApp button, on every page and through the whole flight,
 * at the end corner (right in English, left in Hebrew). Renders nothing until
 * a WhatsApp link is set in the admin's Footer section. z-[70] keeps it over
 * the flight's topbar (50), captions (25) and progress bar (60).
 */
export function WhatsAppFab({ href, label }: { href: string; label: string }) {
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group isolate fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] end-5 z-[70] flex h-14 items-center gap-2 rounded-full bg-[#25D366] px-4 text-[#05201A] shadow-[0_10px_30px_-6px_rgba(5,32,26,0.55)] ring-1 ring-black/5 transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-light md:h-12"
    >
      {/* Two rings that spread out of the button and fade, a beat apart, then
          rest (see .wa-pulse in globals.css). Decorative: off for reduced
          motion and the accessibility menu's "stop animations". */}
      <span aria-hidden className="wa-pulse pointer-events-none absolute inset-0 -z-10 rounded-full" />
      <span aria-hidden className="wa-pulse wa-pulse--late pointer-events-none absolute inset-0 -z-10 rounded-full" />
      <WhatsAppGlyph className="h-6 w-6 shrink-0" />
      <span className="hidden text-base font-semibold md:inline">{label}</span>
    </a>
  );
}
