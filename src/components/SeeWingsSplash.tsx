'use client';

import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

const BIG_HEIGHT = 128; // px, matches the md:h-32 splash size
const SMALL_HEIGHT = 40; // px, lands at roughly the header logo's size
const LOGO_ASPECT = 153 / 136;
const SMALL_WIDTH = SMALL_HEIGHT * LOGO_ASPECT;
const BIG_WIDTH = BIG_HEIGHT * LOGO_ASPECT;
const TARGET_TOP = 20; // px from viewport top, roughly the topbar's vertical center
const TARGET_SIDE = 28; // px from the inline-start edge (left in LTR, right in RTL)
const FLIGHT_END = 0.22; // fraction of the 0.5vh fade window where the flight completes

/**
 * Centered logo + tagline shown only at the very top of the page. As soon as
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
  body,
  homeHref,
  trackVh,
}: {
  eyebrow: string;
  title: string;
  body: string;
  homeHref: string;
  trackVh: number;
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
    if (typeof window === 'undefined') return;
    setPortalDone(y >= trackVh * window.innerHeight - 1);
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
        style={{ opacity: mounted ? textOpacity : 1, top: `calc(50% + ${BIG_HEIGHT / 2 + 32}px)` }}
      >
        <div>
          <span className="block font-display text-xs font-bold uppercase tracking-[0.2em] text-accent-light">
            {eyebrow}
          </span>
          <h1 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight text-neutral-100 [text-shadow:0_2px_24px_rgba(5,32,26,0.7)] md:text-5xl">
            {title}
          </h1>
          {body && (
            <p className="mx-auto mt-4 max-w-xl text-base text-neutral-200 [text-shadow:0_2px_16px_rgba(5,32,26,0.7)] md:text-lg">
              {body}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
