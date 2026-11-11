'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';

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
 * Unpinning (back to normal static flow, real scrolling, real clicks) waits
 * for scrollWorld.js's 'sw:portal-done' event, which it fires right before
 * jumping the real scroll position to the track's end (see its
 * playPortalTransition). The unpin is flushed synchronously inside that
 * listener so it lands in the same task as the jump. This used to run on a
 * 700ms timer of its own, matched by hand to the engine's; whenever React's
 * render landed between the two, one frame painted the content static while
 * scroll still sat at the threshold, ~625px below where it belonged.
 *
 * The content is at least one viewport tall for the same reason: the jump
 * targets the top of this content, and anything shorter left the browser
 * unable to scroll that far, so the header settled 56px down with an empty
 * band above it. lvh rather than vh: once a phone's URL bar has slid away the
 * visible area is taller than 100vh, which left a strip of bare body below.
 *
 * That handoff only fires once per page load, so scrolling back up into the
 * video and back down again needs its own path: once the initial reveal has
 * happened, pinning instead tracks scroll position directly — instant both
 * ways, no 700ms wait, since there's no stage animation to sync with on a
 * return trip. The threshold is where this content's own top edge sits in
 * the document (the zero-height marker below), not `trackVh`: scrollWorld.js
 * pads its track ~0.7vh past the point the stage goes `.sw-done`, and
 * unpinning at the stage's threshold left that padding on screen as a blank
 * band of track background above the Header. Staying pinned until the real
 * top edge arrives keeps the Header at the viewport top through that band.
 *
 * The gate runs the same for reduced-motion visitors: scrollWorld.js plays the
 * flight (and its portal hand-off) for everyone, since the visitor's own
 * scroll drives it. Bypassing the gate for them also seeded `revealed` from
 * matchMedia during render, which the server can't match, so hydration broke.
 *
 * Safety net so this can never leave real content permanently unreachable:
 * a <noscript> override covers visitors with JS disabled, since this
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
export function PortalReveal({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const revealedOnce = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
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
    const onPortalDone = () => {
      revealedOnce.current = true;
      flushSync(() => setRevealed(true));
    };
    window.addEventListener('sw:portal-done', onPortalDone);
    return () => window.removeEventListener('sw:portal-done', onPortalDone);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only needs to arm once
  }, []);

  useEffect(() => {
    function onScroll() {
      if (!revealedOnce.current || !markerRef.current) return;
      setRevealed(markerRef.current.getBoundingClientRect().top <= 1);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <noscript>
        <style>{'.portal-reveal{position:static !important;pointer-events:auto !important;opacity:1 !important;} .portal-reveal-spacer{display:none !important;}'}</style>
      </noscript>
      {/* Always in flow, so it marks this content's top edge whether pinned or not. */}
      <div ref={markerRef} aria-hidden />
      {!revealed && <div className="portal-reveal-spacer" aria-hidden style={{ height: spacerHeight }} />}
      <div
        ref={contentRef}
        className="portal-reveal min-h-screen min-h-lvh"
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
