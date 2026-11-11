'use client';

import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Runs for reduced-motion visitors too. The flight's stop-to-stop steps
    // are timed by Lenis; without it they fell back to native smooth scroll,
    // which the browser makes instant when the OS has animations turned off,
    // so each step teleported the camera to the next stop.

    // wheelMultiplier scales how far a single wheel/trackpad tick moves the
    // page (touchMultiplier is separate and left at its default, so this is a
    // desktop-only knob). It sat at 0.6 to slow the flight down back when the
    // flythrough was three short clips. Against the single 15s render that
    // became the wrong lever twice over: at 0.6 a wheel notch advanced the clip
    // by ~0.033s, so scrubbing the whole flight took roughly 460 notches and
    // the video read as barely moving while you scrolled. Restored to 1 (Lenis'
    // own default — smoothed, but tracking the OS scroll distance) and the pace
    // is now carried by SECTION_VH alone, where it belongs.
    // respectReducedMotion: Lenis' own default makes every scrollTo instant
    // under reduced motion, which is the same teleport described above.
    const lenis = new Lenis({ wheelMultiplier: 1, respectReducedMotion: false });
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
