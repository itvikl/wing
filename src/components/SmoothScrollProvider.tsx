'use client';

import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // wheelMultiplier scales how far a single wheel/trackpad tick moves the
    // page — below 1 slows scrolling down without changing touch behavior
    // (touchMultiplier is separate and left at its default).
    const lenis = new Lenis({ wheelMultiplier: 0.6 });
    // Exposed so the vanilla scroll-world engine (SeeWingsExperience) can pause/resume
    // and drive scroll position through Lenis's own state instead of raw window.scrollTo,
    // which Lenis would otherwise fight on its next animation frame.
    (window as typeof window & { __lenis?: Lenis }).__lenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      delete (window as typeof window & { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return <>{children}</>;
}
