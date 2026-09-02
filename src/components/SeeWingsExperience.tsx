'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { mountScrollWorld } from '@/lib/scrollWorld';
import { SECTION_VH, CONN_VH, computeTrackVh } from '@/lib/seeWingsTiming';
import { SeeWingsCues } from './SeeWingsCues';
import { SeeWingsSplash } from './SeeWingsSplash';
import type { Locale } from '@/i18n/request';

export type SeeWingsSection = {
  id: string;
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  tags: string[];
};

type Cue = { eyebrow: string; title: string; body?: string; extra?: { label: string; value: string }[] };
type NavLink = { id: string; label: string };
export type SeeWingsMedia = {
  sections: { id: string; still: string; clip: string; stillMobile?: string; clipMobile?: string }[];
  connectors: (string | null)[];
};

const ROUTED_IDS = new Set(['about', 'projects', 'why-us', 'team']);

const GOLD = '#B58238';
const GOLD_LIGHT = '#FFBC7D';

// Mirrors the inline style set on the container div below. scrollWorld.js's
// injected CSS reads `--sw-bg` on html/body too (so the portal hand-off's
// fade-out reveals the right color instead of a bare page background), but
// custom properties only inherit downward — html/body are ANCESTORS of the
// container, so they never see a value set only there and fall back to the
// stylesheet's hardcoded cream default, flashing white mid-transition. These
// are applied straight to documentElement in the effect below to fix that.
const SW_THEME_VARS: Record<string, string> = {
  '--sw-bg': '#05201A',
  '--sw-ink': '#F7F6F3',
  '--sw-ink-soft': 'rgba(247,246,243,0.68)',
  '--sw-accent': GOLD,
};

export function SeeWingsExperience({
  locale,
  sections,
  cues,
  navLinks,
  ctaPrimary,
  brandCta,
  media,
}: {
  locale: Locale;
  sections: SeeWingsSection[];
  cues: Cue[];
  navLinks: NavLink[];
  ctaPrimary: string;
  brandCta: string;
  media: SeeWingsMedia;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const trackVh = computeTrackVh(sections.length, media.connectors);

  useEffect(() => {
    if (!ref.current) return;
    // Idempotent remount guard: mountScrollWorld has no teardown and unconditionally
    // appends its DOM, so React 18 StrictMode's dev-mode double-invoke (and any
    // Fast Refresh re-run) would otherwise stack a second copy on top of the first.
    ref.current.innerHTML = '';
    document.getElementById('sw-css')?.remove();
    const root = document.documentElement;
    Object.entries(SW_THEME_VARS).forEach(([k, v]) => root.style.setProperty(k, v));
    const homeHref = locale === 'en' ? '/' : `/${locale}`;
    const routedHref = (id: string) => (locale === 'en' ? `/${id}` : `/${locale}/${id}`);

    // Mirrors LanguageSwitcher's own logic — this custom-DOM topbar has no
    // access to that React component, so the EN/HE toggle is rebuilt here.
    const pathWithoutLocale = pathname.replace(/^\/(en|he)/, '') || '/';
    const targetLocale = locale === 'en' ? 'he' : 'en';
    const langHref = targetLocale === 'en' ? pathWithoutLocale : `/he${pathWithoutLocale}`;

    const engine = mountScrollWorld(ref.current, {
      // brand omitted on purpose — SeeWingsSplash's flying logo lands exactly
      // where the topbar mark would sit and takes over that role instead.
      cta: { label: brandCta, href: `${homeHref}#contact` },
      lang: { label: targetLocale, href: langHref },
      hint: locale === 'he' ? 'גללו כדי להמריא' : 'scroll to take flight',
      navLinks: navLinks.map((n) => ({
        label: n.label,
        href: ROUTED_IDS.has(n.id) ? routedHref(n.id) : `${homeHref}#${n.id}`,
      })),
      atmosphere: true,
      diveScroll: SECTION_VH,
      connScroll: CONN_VH,
      crossfade: 0.14,
      // Native per-section copy/cta is intentionally omitted — the chapter
      // headlines are rendered by SeeWingsCues instead, driven by the same
      // total scroll range (trackVh).
      sections: sections.map((s, i) => {
        const sceneMedia = media.sections.find((m) => m.id === s.id);
        return {
          id: s.id,
          label: s.label,
          still: sceneMedia?.still || `/scroll-world/img/${s.id}.png`,
          clip: sceneMedia?.clip || `/scroll-world/vid/${s.id}.mp4`,
          stillMobile: sceneMedia?.stillMobile,
          clipMobile: sceneMedia?.clipMobile,
          accent: i === sections.length - 1 ? GOLD_LIGHT : GOLD,
          scroll: SECTION_VH,
          // Was 0.4 — settle harder mid-scene (engine caps this at 0.6) so the
          // camera pauses where the copy peaks instead of drifting through.
          linger: 0.55,
        };
      }),
      connectors: media.connectors,
    });
    // Without this, a remount (StrictMode's dev double-invoke, or any future
    // client-side nav between the two routes that render this component)
    // left the previous instance's scroll/resize listeners, rAF loop, and
    // video Blob URLs running forever against DOM the next mount had already
    // wiped via the innerHTML reset above.
    return () => {
      engine.dispose();
      Object.keys(SW_THEME_VARS).forEach((k) => root.style.removeProperty(k));
    };
  }, [locale, sections, navLinks, brandCta, media, pathname]);

  const homeHref = locale === 'en' ? '/' : `/${locale}`;

  return (
    <>
      <div
        ref={ref}
        style={
          {
            ...SW_THEME_VARS,
            '--sw-font-display': 'var(--font-display)',
            '--sw-font-body': 'var(--font-sans)',
          } as React.CSSProperties
        }
      />
      <SeeWingsSplash
        eyebrow={sections[0].eyebrow}
        title={sections[0].title}
        body={sections[0].body}
        homeHref={homeHref}
        trackVh={trackVh}
      />
      <SeeWingsCues cues={cues} trackVh={trackVh} ctaLabel={ctaPrimary} ctaHref={`${homeHref}#contact`} />
    </>
  );
}
