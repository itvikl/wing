'use client';

import { useId, useState } from 'react';
import type { LocaleText } from '@/lib/content/schema';
import { PhoneGlyph, WhatsAppGlyph } from './icons';

type FaqText = LocaleText['faq'];

/**
 * The FAQ page body: topic filters, the questions as an accordion grouped by
 * topic, and a card beside them for anything the list doesn't answer. All
 * copy comes from the admin's FAQ section; a topic or question left empty
 * there is skipped.
 */
export function Faq({
  text,
  whatsappHref,
  contactHref,
  phone,
}: {
  text: FaqText;
  whatsappHref: string;
  contactHref: string;
  phone?: { href: string; label: string };
}) {
  const categories = text.categories
    .map((c) => ({ ...c, items: c.items.filter((it) => it.q.trim()) }))
    .filter((c) => c.name.trim() && c.items.length);
  const [cat, setCat] = useState<number | 'all'>('all');
  const [open, setOpen] = useState<string | null>(categories.length ? '0-0' : null);
  const baseId = useId();

  const shown = categories.map((c, ci) => ({ ...c, ci })).filter((c) => cat === 'all' || c.ci === cat);
  const pill = (active: boolean) =>
    `min-h-11 rounded-full border px-5 text-base transition-colors ${
      active ? 'border-accent bg-accent font-semibold text-primary-dark' : 'border-white/20 bg-white/5 text-neutral-100 hover:border-accent-light'
    }`;

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 md:py-24">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
        <span className="text-base uppercase tracking-[0.2em] text-accent-light md:text-lg">{text.eyebrow}</span>
        <h1 className="font-display text-3xl font-semibold leading-tight text-neutral-100 text-balance md:text-5xl">{text.title}</h1>
        {text.intro && <p className="max-w-2xl text-lg leading-relaxed text-neutral-200">{text.intro}</p>}
      </div>

      {categories.length > 1 && (
        <div role="group" aria-label={text.eyebrow} className="mt-10 flex flex-wrap justify-center gap-2.5">
          <button type="button" aria-pressed={cat === 'all'} onClick={() => setCat('all')} className={pill(cat === 'all')}>
            {text.allLabel}
          </button>
          {categories.map((c, ci) => (
            <button key={ci} type="button" aria-pressed={cat === ci} onClick={() => setCat(ci)} className={pill(cat === ci)}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-12 flex flex-wrap items-start gap-8">
        <div className="min-w-0 flex-[999_1_560px] rounded-3xl border border-white/15 bg-primary-dark/60 px-5 pb-6 pt-2 backdrop-blur-xl sm:px-9">
          {shown.map((c) => (
            <section key={c.ci} className="pt-7">
              <h2 className="mb-1 font-display text-xl font-semibold text-accent-light">{c.name}</h2>
              {c.items.map((item, ii) => {
                const key = `${c.ci}-${ii}`;
                const isOpen = open === key;
                const panelId = `${baseId}-${key}`;
                return (
                  <div key={key} className="border-b border-white/10">
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setOpen(isOpen ? null : key)}
                        className="flex min-h-16 w-full items-center justify-between gap-5 py-4 text-start text-lg font-medium leading-snug text-neutral-100"
                      >
                        <span>{item.q}</span>
                        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent-light/50 text-accent-light">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M5 12h14" />
                            {!isOpen && <path d="M12 5v14" />}
                          </svg>
                        </span>
                      </button>
                    </h3>
                    <div id={panelId} hidden={!isOpen}>
                      <p className="whitespace-pre-line pb-6 pe-14 text-base leading-relaxed text-neutral-200 md:text-[17px]">{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </section>
          ))}
        </div>

        <aside className="flex flex-[1_1_300px] flex-col gap-3.5 rounded-3xl border border-accent/45 bg-primary/85 px-7 py-8 backdrop-blur-xl">
          <span className="text-sm uppercase tracking-[0.18em] text-accent-light">{text.asideEyebrow}</span>
          <h2 className="font-display text-2xl font-semibold leading-tight text-neutral-100 md:text-[28px]">{text.asideTitle}</h2>
          {text.asideBody && <p className="text-base leading-relaxed text-neutral-200">{text.asideBody}</p>}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-[#25D366] text-base font-semibold text-[#05201A] transition-transform hover:-translate-y-0.5"
            >
              <WhatsAppGlyph className="h-5 w-5" />
              {text.asideWhatsapp}
            </a>
          )}
          <a href={contactHref} className="flex min-h-12 items-center justify-center rounded-full border border-accent text-base text-accent-light transition-colors hover:bg-accent hover:text-primary-dark">
            {text.asideCall}
          </a>
          {phone && (
            <a href={phone.href} className="flex items-center justify-center gap-2 pt-1 text-base text-neutral-200 hover:text-accent-light">
              <PhoneGlyph className="h-4 w-4 text-accent-light" />
              <span dir="ltr">{phone.label}</span>
            </a>
          )}
        </aside>
      </div>
    </section>
  );
}
