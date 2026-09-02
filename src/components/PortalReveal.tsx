'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/**
 * The real page (Header onward) needs to read as "revealed from behind the
 * flythrough's last scene", not scrolled into view beneath it. So instead of
 * living in normal document flow the whole time — which lets its sticky
 * Header physically creep up from the bottom edge as the user scrolls, and
 * ties its arrival to how far they've scrolled — it's pinned `position:fixed`
 * full-viewport at z-index 5 (between scrollWorld.js's sky at 0 and its
 * stage at 10) for as long as the flythrough hasn't finished. It sits there
 * the whole time, fully painted but invisible behind the opaque video
 * (scrollWorld.js gives sky/stage/topbar/etc `pointer-events:none`, so this
 * layer's own `pointer-events:none` while pinned is what actually stops
 * stray clicks reaching it through those gaps). When the last dive's stage
 * fades on scroll-world's own .sw-done transition, whatever's already
 * sitting there is what gets revealed — no extra scroll distance, no slide.
 *
 * `position:fixed` contributes zero height to the document, though — and
 * naively pinning this content that way shrinks the page's total scroll
 * length by however tall Header+main+Footer are. Since the browser clamps
 * scroll to `scrollHeight - viewportHeight`, that shrink can leave native
 * scroll physically unable to reach scrollWorld.js's own reveal threshold at
 * the tail end of its track — the flythrough's ending becomes unreachable.
 * A plain spacer sized to the content's real (unclipped) height, rendered
 * only while pinned, reserves that same scroll distance so the page's total
 * length never changes across the fixed/static switch.
 *
 * Unpinning (back to normal static flow, real scrolling, real clicks) is
 * gated on scrollWorld.js's 'sw:portal' event plus the same ~700ms it takes
 * that event's own zoom+dissolve to finish and jump the real scroll position
 * to the track's end (see scrollWorld.js's playPortalTransition) — unpinning
 * any earlier would open a gap before the scroll position catches up to it.
 *
 * That handoff only fires once per page load, so scrolling back up into the
 * video and back down again needs its own path: once the initial reveal has
 * happened, pinning instead tracks scroll position directly against
 * `trackVh` (the same threshold scrollWorld.js's own `isDoneNow` uses) —
 * instant both ways, no 700ms wait, since there's no stage animation to sync
 * with on a return trip.
 *
 * Safety nets so this can never leave real content permanently unreachable:
 * reduced-motion visitors skip the gate entirely (unpinned from the start,
 * since the portal lock itself is skipped for them too — see scrollWorld.js),
 * and a <noscript> override covers visitors with JS disabled, since this
 * component can't run at all for them.
 *
 * Being pinned behind the stage only hides this content once the stage
 * actually exists — and scrollWorld.js builds its DOM (and injects its own
 * CSS) imperatively inside a useEffect, not during render, so on the very
 * first paint (the server-rendered HTML, before any client JS has run)
 * there's nothing at z-index 10 yet to cover this layer. Left at its default
 * opacity, that briefly shows the real page on load instead of the video.
 * `mounted` stays false (opacity:0, still otherwise pinned/inert) until one
 * rAF after this component's own effects run — by then scrollWorld.js's
 * synchronous DOM-and-CSS build (in its sibling effect, same commit) is
 * guaranteed to have already happened, so flipping to opacity:1 lands under
 * cover of the now-real stage instead of before it exists.
 */
export function PortalReveal({ children, trackVh }: { children: ReactNode; trackVh: number }) {
  const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [revealed, setRevealed] = useState(reducedMotion);
  const [mounted, setMounted] = useState(false);
  // Reduced-motion visitors bypass the gate entirely and must never be re-pinned by
  // the scroll-position tracking below — that tracking exists only to make the real
  // portal hand-off bidirectional, and previously ran for these visitors too (keyed
  // off the same `revealedOnce` flag), re-hiding content again the instant they
  // scrolled even one pixel before reaching the threshold.
  const skipGate = useRef(reducedMotion());
  const revealedOnce = useRef(skipGate.current);
  const contentRef = useRef<HTMLDivElement>(null);
  const [spacerHeight, setSpacerHeight] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // overflow:hidden on the pinned wrapper clips the *painted* box to one
    // viewport, but scrollHeight still reports the content's true unclipped
    // extent — exactly the number the spacer needs.
    const measure = () => setSpacerHeight(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
        <style>{'.portal-reveal{position:static !important;pointer-events:auto !important;opacity:1 !important;} .portal-reveal-spacer{display:none !important;}'}</style>
      </noscript>
      {!revealed && <div className="portal-reveal-spacer" aria-hidden style={{ height: spacerHeight }} />}
      <div
        ref={contentRef}
        className="portal-reveal"
        style={
          revealed
            ? undefined
            : { position: 'fixed', inset: 0, zIndex: 5, overflow: 'hidden', pointerEvents: 'none', opacity: mounted ? 1 : 0 }
        }
      >
        {children}
      </div>
    </>
  );
}
