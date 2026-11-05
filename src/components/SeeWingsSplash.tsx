'use client';

import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import { flightVh } from '@/lib/seeWingsTiming';

const BIG_HEIGHT = 128; // px, matches the md:h-32 splash size
const SMALL_HEIGHT = 40; // px, lands at roughly the header logo's size
const LOGO_ASPECT = 153 / 136;
const SMALL_WIDTH = SMALL_HEIGHT * LOGO_ASPECT;
const BIG_WIDTH = BIG_HEIGHT * LOGO_ASPECT;
const TARGET_TOP = 20; // px from viewport top, roughly the topbar's vertical center
const TARGET_SIDE = 28; // px from the inline-start edge (left in LTR, right in RTL)
const FLIGHT_END = 0.22; // fraction of the 0.5vh fade window where the flight completes

/**
 * Centered logo, eyebrow and headline shown only at the very top of the page.
 * The line that used to sit under them now opens the flight's first caption. As soon as
 * scrolling begins, the mark itself flies up into the header's top corner
 * (replacing the topbar's own brand mark, which this suppresses via the
 * `brand` config being omitted) while the tagline text simply fades out.
 *
 * The flight math needs real window dimensions, which don't exist during SSR —
 * so the logo renders as a plain centered (unanimated) mark until mounted,
 * identical in both markups, and only switches to the motion-driven version
 * once the client can measure the viewport (invisible swap: both look the same).
 */
export function SeeWingsSplash({
  eyebrow,
  title,
  homeHref,
  trackVh,
  persist = false,
}: {
  eyebrow: string;
  title: string;
  homeHref: string;
  trackVh: number;
  /** Keep the mark in the topbar corner after the hand-off (no Header logo to defer to). */
  persist?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { scrollY } = useScroll();

  // Once the real page hands off (PortalReveal fades in the site's own Header,
  // with its own logo), this flying mark needs to get out of the way — it has
  // nowhere left to be, and without this it just sits on top of the real logo
  // forever, doubled. Driven off actual scroll position (matching the engine's
  // own `isDoneNow` threshold) rather than a one-shot 'sw:portal' event, so
  // scrolling back up past that point correctly brings the mark back too.
  const [portalDone, setPortalDone] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => {
    if (typeof window === 'undefined' || persist) return;
    setPortalDone(y >= trackVh * flightVh() - 1);
  });

  const progress = useTransform(scrollY, (y) => {
    if (typeof window === 'undefined') return 0;
    const vh = window.innerHeight;
    return Math.min(1, Math.max(0, y / (0.5 * vh) / FLIGHT_END));
  });

  const textOpacity = useTransform(scrollY, (y) => {
    if (typeof window === 'undefined') return 1;
    const vh = window.innerHeight;
    return Math.max(0, 1 - y / (0.15 * vh));
  });

  const scale = useTransform(progress, [0, 1], [BIG_HEIGHT / SMALL_HEIGHT, 1]);
  // The box being transformed is SMALL_HEIGHT/SMALL_WIDTH-sized and scales up
  // from a `top left` origin, so at rest (progress 0, scale BIG/SMALL) its
  // visual footprint is BIG_HEIGHT/BIG_WIDTH — centering must target that
  // visual size, not the untransformed box, or the logo lands off-center
  // (previously using SMALL_HEIGHT/SMALL_WIDTH here left it ~44px too low).
  const x = useTransform(progress, (p) => {
    if (typeof window === 'undefined') return 0;
    const isRtl = document.documentElement.dir === 'rtl';
    const targetLeft = isRtl ? window.innerWidth - TARGET_SIDE - SMALL_WIDTH : TARGET_SIDE;
    const centerLeft = window.innerWidth / 2 - BIG_WIDTH / 2;
    return centerLeft + (targetLeft - centerLeft) * p;
  });
  const y = useTransform(progress, (p) => {
    if (typeof window === 'undefined') return 0;
    const centerTop = window.innerHeight / 2 - BIG_HEIGHT / 2;
    return centerTop + (TARGET_TOP - centerTop) * p;
  });

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[26]"
      aria-hidden={false}
      style={portalDone ? { opacity: 0, transition: 'opacity .5s ease-in', pointerEvents: 'none' } : undefined}
    >
      {/* Brand-green scrim behind the mark and copy, so they hold up against a
          bright still (the lit arch sits right behind the headline). Lives here
          rather than as a filter on the opening still, which has to stay
          pixel-identical to the engine's for the hand-off; fades with the copy. */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{
          opacity: mounted ? textOpacity : 1,
          background:
            'radial-gradient(ellipse 80% 55% at 50% 56%, rgba(5,32,26,0.5) 0%, rgba(5,32,26,0.3) 45%, rgba(5,32,26,0) 78%), linear-gradient(to top, rgba(5,32,26,0.5), rgba(5,32,26,0) 45%)',
        }}
      />
      {mounted ? (
        <motion.a
          href={homeHref}
          aria-label="Wings"
          className="pointer-events-auto fixed left-0 top-0 block"
          style={{
            x,
            y,
            scale,
            transformOrigin: 'top left',
            height: SMALL_HEIGHT,
            width: SMALL_WIDTH,
            pointerEvents: portalDone ? 'none' : 'auto',
          }}
        >
          <img src="/brand/logo.png" alt="Wings" className="h-full w-full drop-shadow-[0_4px_28px_rgba(5,32,26,0.65)]" />
        </motion.a>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <img
            src="/brand/logo.png"
            alt="Wings"
            style={{ height: BIG_HEIGHT }}
            className="w-auto drop-shadow-[0_4px_28px_rgba(5,32,26,0.65)]"
          />
        </div>
      )}

      <motion.div
        className="absolute inset-x-0 flex flex-col items-center gap-6 px-6 text-center"
        style={{
          opacity: mounted ? textOpacity : 1,
          // On short mobile viewports, anchoring purely below the logo (50% + fixed
          // offset) can push a long title down far enough to collide with the
          // fixed "01 / N" scene counter and the scroll hint pinned near the bottom.
          // min() keeps the natural centered position on tall screens but pulls the
          // block up once the viewport is too short to fit both without overlap.
          top: `min(calc(50% + ${BIG_HEIGHT / 2 + 20}px), calc(100dvh - 260px))`,
        }}
      >
        <div>
          <span className="splash-eyebrow block font-display text-base font-bold uppercase tracking-[0.2em] text-accent-light [text-shadow:0_1px_2px_rgba(5,32,26,0.95),0_0_12px_rgba(5,32,26,0.7)] [-webkit-text-stroke:0.25px_currentColor] md:text-lg">
            {eyebrow}
          </span>
          <h1 className="splash-title max-w-2xl font-display text-3xl font-bold leading-tight text-neutral-100 [text-shadow:0_1px_2px_rgba(5,32,26,0.95),0_0_14px_rgba(5,32,26,0.7),0_2px_24px_rgba(5,32,26,0.7)] [-webkit-text-stroke:0.45px_currentColor] md:text-5xl">
            {title}
          </h1>
        </div>
      </motion.div>
    </div>
  );
}
