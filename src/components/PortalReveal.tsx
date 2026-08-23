'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * The real page (Header onward) lives in normal document flow right after
 * the video's fixed-height track. Because Header is `position:sticky`, it
 * physically enters the viewport from the bottom as soon as scroll comes
 * within one viewport-height of the track's end — well before the portal
 * lock in scrollWorld.js ever triggers, since that only fires once the
 * dive's own scroll range is fully spent. No amount of fixing the lock
 * itself prevents that early peek, because it isn't scroll-locked at all.
 *
 * So instead of letting raw scroll position control this content's
 * visibility, it starts fully hidden (same on server and first client
 * render — no flash) and only fades in ~700ms after scrollWorld.js's
 * 'sw:portal' fires (matching the stage's own zoom+dissolve length), once
 * the hand-off has actually happened.
 *
 * That one-shot event only ever fires once per page load though — it can't
 * tell this component to hide again if the visitor scrolls back up into the
 * video and then back down. Without reacting to scroll position after that
 * first reveal, the real page stays permanently visible underneath, bleeding
 * through the video on the way back up. So once the initial cinematic reveal
 * has happened, this switches to tracking `trackVh` directly (the same
 * threshold scrollWorld.js's own `isDoneNow` uses) — instant, no 700ms wait,
 * since there's no stage animation to sync with on return trips.
 *
 * Safety nets so this can never leave real content permanently invisible:
 * reduced-motion visitors skip the gate entirely (revealed from the start,
 * since the portal lock itself is skipped for them too — see scrollWorld.js),
 * and a <noscript> override covers visitors with JS disabled, since this
 * component can't run at all for them.
 */
export function PortalReveal({ children, trackVh }: { children: ReactNode; trackVh: number }) {
  const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [revealed, setRevealed] = useState(reducedMotion);
  // Reduced-motion visitors bypass the gate entirely and must never be re-hidden by
  // the scroll-position tracking below — that tracking exists only to make the real
  // portal hand-off bidirectional, and previously ran for these visitors too (keyed
  // off the same `revealedOnce` flag), hiding content again the instant they scrolled
  // even one pixel before reaching the threshold.
  const skipGate = useRef(reducedMotion());
  const revealedOnce = useRef(skipGate.current);

  useEffect(() => {
    if (revealedOnce.current) return;
    let timer: ReturnType<typeof setTimeout>;
    const onPortal = () => {
      timer = setTimeout(() => {
        revealedOnce.current = true;
        setRevealed(true);
      }, 700);
    };
    window.addEventListener('sw:portal', onPortal);
    return () => {
      window.removeEventListener('sw:portal', onPortal);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only needs to arm once
  }, []);

  useEffect(() => {
    if (skipGate.current) return;
    function onScroll() {
      if (!revealedOnce.current) return;
      setRevealed(window.scrollY >= trackVh * window.innerHeight - 1);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [trackVh]);

  return (
    <>
      <noscript>
        <style>{'.portal-reveal{opacity:1 !important;transform:none !important;pointer-events:auto !important;}'}</style>
      </noscript>
      <div
        className="portal-reveal"
        style={{
          opacity: revealed ? 1 : 0,
          transform: revealed ? 'scale(1)' : 'scale(0.985)',
          transformOrigin: 'center top',
          transition: revealed ? 'opacity .5s ease-out, transform .5s ease-out' : undefined,
          pointerEvents: revealed ? 'auto' : 'none',
        }}
      >
        {children}
      </div>
    </>
  );
}
