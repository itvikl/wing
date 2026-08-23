'use client';

import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis();
    // Exposed so the vanilla scroll-world engine (SeeWingsExperience) can pause/resume
    // and drive scroll position through Lenis's own state instead of raw window.scrollTo,
    // which Lenis would otherwise fight on its next animation frame.
    (window as typeof window & { __lenis?: Lenis }).__lenis = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      delete (window as typeof window & { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return <>{children}</>;
}
