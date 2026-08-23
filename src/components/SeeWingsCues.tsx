'use client';

import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

type Cue = { eyebrow: string; title: string; body?: string; extra?: { label: string; value: string }[] };

const FADE = 0.22;
// Mirrors SeeWingsSplash's own text fade-out window (0.15 * one viewport height).
// cue[0] is forced to echo the hero splash's exact copy (see getLocaleText's
// cues[0] override in content/store.ts), so without this offset its fade-in
// starts at the same instant the splash starts fading out — the two identical
// captions render on top of each other mid-scroll, most visible on short
// mobile viewports where their vertical positions sit close together.
const SPLASH_CLEAR_VH = 0.15;

function smooth(x: number) {
  const c = Math.min(1, Math.max(0, x));
  return c * c * (3 - 2 * c);
}

function cueOpacity(progress: number, index: number, count: number, trackVh: number) {
  const start = index === 0 ? SPLASH_CLEAR_VH / trackVh : index / count;
  const end = (index + 1) / count;
  const local = Math.min(1, Math.max(0, (progress - start) / (end - start)));
  if (local < FADE) return smooth(local / FADE);
  if (local > 1 - FADE) return smooth((1 - local) / FADE);
  return 1;
}

/**
 * The single flythrough video has no natural chapter breaks, so its
 * scroll range is split into N equal windows — one per landing-page
 * section — each fading its own eyebrow/title in and out in turn.
 */
export function SeeWingsCues({
  cues,
  trackVh,
  ctaLabel,
  ctaHref,
}: {
  cues: Cue[];
  trackVh: number;
  ctaLabel: string;
  ctaHref: string;
}) {
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, (y) => {
    const vh = typeof window === 'undefined' ? 1 : window.innerHeight;
    return Math.min(1, Math.max(0, y / (trackVh * vh)));
  });
  const [active, setActive] = useState(0);
  // This component is scroll-position-driven, entirely separate from the
  // vanilla scroll-world engine's own `.sw-done` hand-off — so without this,
  // whatever cue happened to be visible when the portal lock froze scroll
  // just stayed on screen (independent of the stage's own zoom+dissolve),
  // overlapping the real page underneath. `progress` reaches 1 at exactly
  // the same scroll position the engine's own `isDoneNow` flips at, so
  // driving this off `progress` (instead of the engine's one-shot 'sw:portal'
  // event) keeps it in sync in BOTH directions — scrolling back up past that
  // point un-hides the cues again, which the one-shot event never could.
  const [portalDone, setPortalDone] = useState(false);
  const progressRef = useRef(0);

  useMotionValueEvent(progress, 'change', (p) => {
    const idx = Math.min(cues.length - 1, Math.floor(p * cues.length));
    setActive(idx);
    setPortalDone(p >= 0.999);
    progressRef.current = p;
  });

  // A fast mobile flick can fling the scroll straight through several cue
  // windows before momentum decays, changing the caption faster than it can
  // be read. Once the gesture actually settles (no scroll events for a
  // beat), ease the rest of the way to the nearest cue's fully-visible
  // midpoint instead of leaving the reader stranded on a half-faded one.
  // Scoped to coarse/touch pointers — this is a flick-momentum problem, not
  // a desktop wheel/trackpad one.
  useEffect(() => {
    const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!coarse || reduce) return;

    let timer: ReturnType<typeof setTimeout>;
    let snapping = false;

    function settle() {
      if (snapping) return;
      const p = progressRef.current;
      if (p <= 0 || p >= 0.999) return;
      const idx = Math.min(cues.length - 1, Math.floor(p * cues.length));
      const vh = window.innerHeight;
      const target = ((idx + 0.5) / cues.length) * trackVh * vh;
      const current = window.scrollY;
      if (Math.abs(current - target) < vh * 0.03) return;

      snapping = true;
      const lenis = (window as typeof window & { __lenis?: { scrollTo: (t: number, o?: object) => void } }).__lenis;
      if (lenis) lenis.scrollTo(target, { duration: 0.5 });
      else window.scrollTo({ top: target, behavior: 'smooth' });
      setTimeout(() => { snapping = false; }, 600);
    }

    function onScroll() {
      clearTimeout(timer);
      timer = setTimeout(settle, 150);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [cues.length, trackVh]);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-1/2 z-[25] -translate-y-1/2 px-[clamp(18px,5vw,64px)]"
      style={portalDone ? { opacity: 0, transition: 'opacity .5s ease-in', pointerEvents: 'none' } : undefined}
    >
      <div className="relative max-w-[560px]">
        {cues.map((cue, i) => (
          <CueBlock
            key={cue.title}
            cue={cue}
            progress={progress}
            index={i}
            count={cues.length}
            trackVh={trackVh}
            isLast={i === cues.length - 1}
            active={active === i && !portalDone}
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
          />
        ))}
      </div>
    </div>
  );
}

function CueBlock({
  cue,
  progress,
  index,
  count,
  trackVh,
  isLast,
  active,
  ctaLabel,
  ctaHref,
}: {
  cue: Cue;
  progress: ReturnType<typeof useTransform<number, number>>;
  index: number;
  count: number;
  trackVh: number;
  isLast: boolean;
  active: boolean;
  ctaLabel: string;
  ctaHref: string;
}) {
  const opacity = useTransform(progress, (p) => cueOpacity(p, index, count, trackVh));
  const y = useTransform(progress, (p) => `${(1 - cueOpacity(p, index, count, trackVh)) * -48}px`);

  return (
    <motion.div className="absolute inset-x-0 top-0" style={{ opacity, y }}>
      <span className="font-display text-[.8rem] font-bold uppercase tracking-[0.16em] text-accent-light">
        {cue.eyebrow}
      </span>
      <h2 className="mt-3 font-display text-[clamp(2rem,4.4vw,3.2rem)] font-bold leading-[1.05] text-neutral-100 [text-shadow:0_2px_20px_rgba(5,32,26,0.7)]">
        {cue.title}
      </h2>
      {cue.body && (
        <p className="mt-4 max-w-md text-base text-neutral-200 [text-shadow:0_2px_16px_rgba(5,32,26,0.7)] md:text-lg">
          {cue.body}
        </p>
      )}
      {!!cue.extra?.length && (
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
          {cue.extra.map((field, i) => (
            <div key={i} className="flex gap-1.5 text-sm text-neutral-200 [text-shadow:0_2px_12px_rgba(5,32,26,0.7)]">
              <dt className="font-semibold text-accent-light">{field.label}</dt>
              <dd>{field.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {isLast && (
        <div className="pointer-events-auto mt-7" style={{ pointerEvents: active ? 'auto' : 'none' }}>
          <a
            href={ctaHref}
            className="inline-block rounded-full bg-accent px-8 py-3 text-sm font-semibold text-primary-dark transition-transform hover:-translate-y-0.5"
          >
            {ctaLabel}
          </a>
        </div>
      )}
    </motion.div>
  );
}
