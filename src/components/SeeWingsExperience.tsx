'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { mountScrollWorld } from '@/lib/scrollWorld';
import { SECTION_VH, CONN_VH, computeTrackVh, BOULEVARD_ZOOM, STATION_REST_S, STATION_STILLS, FLIGHT_SECONDS, STEP_PLAYBACK_RATE } from '@/lib/seeWingsTiming';
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

/** The opening screen's copy: Hero's eyebrow and headline. */
export type SeeWingsOpening = { eyebrow: string; title: string };

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
  opening,
  seamlessHandoff = false,
  persistentTopbar = false,
}: {
  locale: Locale;
  sections: SeeWingsSection[];
  cues: Cue[];
  navLinks: NavLink[];
  ctaPrimary: string;
  brandCta: string;
  media: SeeWingsMedia;
  /**
   * The admin's Hero section ("the first banner shown on entering the site").
   * The splash used to read the flythrough's own scene copy instead, so Hero
   * edits only reached cue 0 — a caption that appears after scrolling — and
   * the opening headline never changed. Falls back to the scene copy when
   * Hero is left empty.
   */
  opening?: SeeWingsOpening;
  /**
   * The page parks the clip's own last frame under the stage (the home
   * page's glass LeadForm), so the hand-off dissolves in place instead of
   * zooming: the zoom would push the picture away from its own copy.
   */
  seamlessHandoff?: boolean;
  /**
   * The flight's topbar (and the flying logo in its corner) stays on after
   * the hand-off as the page's only nav, so the bar never swaps for the
   * site's solid Header. For pages that render no Header of their own.
   */
  persistentTopbar?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const trackVh = computeTrackVh(sections.length, media.connectors);
  const openingStill =
    media.sections.find((m) => m.id === sections[0]?.id)?.still || `/scroll-world/img/${sections[0]?.id}.webp`;
  // Server-rendered copy of the opening frame, up until the engine's own
  // poster has decoded. The engine only exists after hydration, so without
  // this the first paint had no picture at all, and the image only started
  // downloading once the JS bundle had run.
  const [ssrPoster, setSsrPoster] = useState(true);

  useEffect(() => {
    if (!ref.current) return;
    // Every visit opens on the alley. The browser otherwise restores the last
    // scroll position on reload, which lands mid-flight or on the lead form
    // and then gets yanked back once the first-frame gate shuts scroll.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    if (!window.location.hash) window.scrollTo(0, 0);
    // Idempotent remount guard: mountScrollWorld has no teardown and unconditionally
    // appends its DOM, so React 18 StrictMode's dev-mode double-invoke (and any
    // Fast Refresh re-run) would otherwise stack a second copy on top of the first.
    ref.current.innerHTML = '';
    document.getElementById('sw-css')?.remove();
    const root = document.documentElement;
    Object.entries(SW_THEME_VARS).forEach(([k, v]) => root.style.setProperty(k, v));
    const homeHref = locale === 'en' ? '/' : `/${locale}`;
    const routedHref = (id: string) => (locale === 'en' ? `/${id}` : `/${locale}/${id}`);

    // Mirrors LanguageSwitcher's own logic (always locale-prefixed) — this
    // custom-DOM topbar has no
    // access to that React component, so the EN/HE toggle is rebuilt here.
    const pathWithoutLocale = pathname.replace(/^\/(en|he)/, '');
    const targetLocale = locale === 'en' ? 'he' : 'en';
    const langHref = `/${targetLocale}${pathWithoutLocale}`;

    // Phones and tablets scrub freely: people swipe a lot there, and every
    // swipe should move the flight. Stepping (and the idle-snap back onto a
    // stop) made most swipes feel like they did nothing. Mouse and trackpad
    // keep the stop-to-stop flight.
    const touch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    const engine = mountScrollWorld(ref.current, {
      // brand omitted on purpose — SeeWingsSplash's flying logo lands exactly
      // where the topbar mark would sit and takes over that role instead.
      cta: { label: brandCta, href: `${homeHref}#contact` },
      lang: { label: targetLocale, href: langHref },
      keepTopbar: persistentTopbar,
      hint: locale === 'he' ? 'גללו כדי להמריא' : 'scroll to take flight',
      loadingHint: locale === 'he' ? 'טוען את החוויה' : 'loading the experience',
      menuLabel: locale === 'he' ? 'תפריט' : 'Menu',
      navLinks: navLinks.map((n) => ({
        label: n.label,
        href: ROUTED_IDS.has(n.id) ? routedHref(n.id) : `${homeHref}#${n.id}`,
      })),
      atmosphere: true,
      // Whole-file download, not streaming: compared side by side on real
      // phones (the old ?nostream switch), streaming stalled whenever a swipe
      // ran ahead of the ranges fetched so far and then jumped forward, while
      // a clip already in memory scrubs smoothly. The cost is a longer wait
      // before scroll opens (6.4MB phone clip, 21MB desktop).
      stream: false,
      diveScroll: SECTION_VH,
      connScroll: CONN_VH,
      crossfade: 0.14,
      // Fractions of the total track (not seconds — the engine is agnostic to
      // seconds-per-track, see scrollWorld.js's idle-snap comment). Valid only
      // because there's a single continuous section with no connectors today,
      // so "fraction of this clip" and "fraction of the whole track" are the
      // same number; re-derive if a second scene/connector ever returns.
      restBeats: touch ? [] : STATION_REST_S.map((s) => s / FLIGHT_SECONDS),
      // Each wheel burst / arrow key flies to the next rest beat instead of
      // scrubbing freely (see scrollWorld.js's step-scroll).
      stepScroll: !touch,
      // Seconds a step takes to cross the whole track — the same
      // single-section assumption as restBeats above.
      stepTrackSeconds: FLIGHT_SECONDS / STEP_PLAYBACK_RATE,
      // Trial switch, not a setting: ?flow=boost lets a gesture mid-flight
      // speed the camera on to a further stop (or turn it back) instead of
      // being ignored, so both behaviours can be compared side by side.
      stepInterrupt: new URLSearchParams(window.location.search).get('flow') === 'boost' ? 'boost' : 'lock',
      // Native per-section copy/cta is intentionally omitted — the chapter
      // headlines are rendered by SeeWingsCues instead, driven by the same
      // total scroll range (trackVh).
      sections: sections.map((s, i) => {
        const sceneMedia = media.sections.find((m) => m.id === s.id);
        return {
          id: s.id,
          label: s.label,
          still: sceneMedia?.still || `/scroll-world/img/${s.id}.webp`,
          clip: sceneMedia?.clip || `/scroll-world/vid/${s.id}.mp4`,
          stillMobile: sceneMedia?.stillMobile,
          clipMobile: sceneMedia?.clipMobile,
          accent: i === sections.length - 1 ? GOLD_LIGHT : GOLD,
          scroll: SECTION_VH,
          // Only the single current flight scene has a boulevard to crop; a
          // future second scene wouldn't automatically inherit this window.
          zoomBeats: i === 0 ? [BOULEVARD_ZOOM] : undefined,
          restStills: i === 0 ? STATION_STILLS : undefined,
          // Linear on purpose. linger (was 0.55) eases scroll→time so the
          // camera settles mid-scene, which suited three short dives with one
          // caption each. With one 15s flight and six captions, mid-scene is
          // the climb up the facade: the clip dropped to ~45% speed there and
          // read as stuck while you kept scrolling, and the caption windows
          // (cut in clip seconds, see CUE_BEATS_S) drifted off the picture.
          linger: 0,
        };
      }),
      connectors: media.connectors,
    });
    // Every link to #contact (the topbar CTA, the last caption's button, the
    // Contact nav item) flies to the end of the flight on a page whose lead
    // form sits beneath it: a plain hash jump can't reach the form while
    // PortalReveal keeps it pinned behind the stage. Pages without the form
    // (/see-wings) still navigate home as before.
    const onContactClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a');
      if (!link || link.hash !== '#contact' || link.pathname !== window.location.pathname) return;
      if (!document.getElementById('contact')) return;
      if (engine.flyToEnd?.()) e.preventDefault();
    };
    document.addEventListener('click', onContactClick, true);
    let cancelled = false;
    Promise.resolve(engine.firstPainted).then(() => { if (!cancelled) setSsrPoster(false); });
    // Without this, a remount (StrictMode's dev double-invoke, or any future
    // client-side nav between the two routes that render this component)
    // left the previous instance's scroll/resize listeners, rAF loop, and
    // video Blob URLs running forever against DOM the next mount had already
    // wiped via the innerHTML reset above.
    return () => {
      cancelled = true;
      document.removeEventListener('click', onContactClick, true);
      engine.dispose();
      Object.keys(SW_THEME_VARS).forEach((k) => root.style.removeProperty(k));
    };
  }, [locale, sections, navLinks, brandCta, media, pathname, persistentTopbar]);

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
            ...(seamlessHandoff ? { '--sw-handoff-scale': '1' } : {}),
          } as React.CSSProperties
        }
      />
      {/* Same box and framing as the engine's .sw-scene__still (object-position
          per breakpoint included), one layer above its stage, so handing over
          to it doesn't move a pixel. Faded rather than unmounted, so even a
          sub-pixel difference between the two decodes dissolves instead of
          snapping. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- must match the engine's plain <img> exactly */}
      <img
        src={openingStill}
        alt=""
        aria-hidden
        fetchPriority="high"
        className="pointer-events-none fixed inset-0 z-[11] h-full w-full object-cover transition-opacity duration-700 ease-out [object-position:center_42%] max-[860px]:[object-position:center_46%] max-[860px]:portrait:[object-position:center_44%]"
        style={{ opacity: ssrPoster ? 1 : 0 }}
      />
      <SeeWingsSplash
        eyebrow={opening?.title ? opening.eyebrow : sections[0].eyebrow}
        title={opening?.title || sections[0].title}
        homeHref={homeHref}
        trackVh={trackVh}
        persist={persistentTopbar}
      />
      <SeeWingsCues cues={cues} trackVh={trackVh} ctaLabel={ctaPrimary} ctaHref={`${homeHref}#contact`} />
    </>
  );
}
