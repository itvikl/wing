'use client';

import { useEffect, useRef } from 'react';
import { mountScrollWorld } from '@/lib/scrollWorld';
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
// Effective scroll length (in viewport-heights) of the single flythrough dive —
// mirrors the last-section `scroll` override below, shared with SeeWingsCues so
// the chapter windows line up with the actual track length.
// Raised from 4 so each scene takes longer to scroll through — it was reading
// as "flying by" immediately instead of settling into an experience.
// Raised again from 5.5: on mobile, a single hard flick's scroll distance is
// fixed by the OS's own momentum physics, not by this constant — so the only
// lever that actually slows the *story* down relative to a flick is giving it
// more scroll runway to cover. At 5.5 a hard flick could blow past several
// chapters (captions flashing by unread, camera cuts feeling like a fast-
// forward) before momentum decayed. This was tried the other way first (a
// scroll-settle "snap back to the nearest caption") but that fought the
// reader's own scroll direction and felt worse than the problem it fixed —
// slowing the underlying pace is the more honest fix.
export const TRACK_VH = 9;

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

  useEffect(() => {
    if (!ref.current) return;
    // Idempotent remount guard: mountScrollWorld has no teardown and unconditionally
    // appends its DOM, so React 18 StrictMode's dev-mode double-invoke (and any
    // Fast Refresh re-run) would otherwise stack a second copy on top of the first.
    ref.current.innerHTML = '';
    document.getElementById('sw-css')?.remove();
    const homeHref = locale === 'en' ? '/' : `/${locale}`;
    const routedHref = (id: string) => (locale === 'en' ? `/${id}` : `/${locale}/${id}`);

    mountScrollWorld(ref.current, {
      // brand omitted on purpose — SeeWingsSplash's flying logo lands exactly
      // where the topbar mark would sit and takes over that role instead.
      cta: { label: brandCta, href: `${homeHref}#contact` },
      hint: locale === 'he' ? 'גללו כדי להמריא' : 'scroll to take flight',
      navLinks: navLinks.map((n) => ({
        label: n.label,
        href: ROUTED_IDS.has(n.id) ? routedHref(n.id) : `${homeHref}#${n.id}`,
      })),
      atmosphere: true,
      diveScroll: TRACK_VH,
      // Was 0.85 — the connector clips are the "flight" between scenes, and at
      // that length they blew past in a couple of scroll ticks. This slows the
      // between-scene motion down to match the dives instead of whooshing past.
      connScroll: 1.3,
      crossfade: 0.14,
      // Native per-section copy/cta is intentionally omitted — a single video has
      // no per-property text of its own, so SeeWingsCues renders the chapter
      // headlines instead, driven by the same scroll range (TRACK_VH).
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
          scroll: TRACK_VH,
          // Was 0.4 — settle harder mid-scene (engine caps this at 0.6) so the
          // camera pauses where the copy peaks instead of drifting through.
          linger: 0.55,
        };
      }),
      connectors: media.connectors,
    });
  }, [locale, sections, navLinks, brandCta, media]);

  const homeHref = locale === 'en' ? '/' : `/${locale}`;

  return (
    <>
      <div
        ref={ref}
        style={
          {
            '--sw-bg': '#05201A',
            '--sw-ink': '#F7F6F3',
            '--sw-ink-soft': 'rgba(247,246,243,0.68)',
            '--sw-accent': GOLD,
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
        trackVh={TRACK_VH}
      />
      <SeeWingsCues cues={cues} trackVh={TRACK_VH} ctaLabel={ctaPrimary} ctaHref={`${homeHref}#contact`} />
    </>
  );
}
