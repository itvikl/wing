'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

// scrollWorld.js draws its own progress bar (.sw-scrollbar) at this exact
// fixed position while the flythrough is active, so this one stays hidden
// until scroll has cleared that track — otherwise the two disagree (this one
// tracks the whole page, .sw-scrollbar only the flythrough) and visibly
// stack, most obviously for prefers-reduced-motion visitors where the real
// page is revealed immediately instead of gating this behind the portal
// hand-off (see PortalReveal).
export function ScrollProgress({ trackVh }: { trackVh: number }) {
  const { scrollYProgress, scrollY } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  const opacity = useTransform(scrollY, (y) => {
    if (typeof window === 'undefined') return 0;
    return y >= trackVh * window.innerHeight - 1 ? 1 : 0;
  });

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-accent rtl:origin-right"
      style={{ scaleX, opacity }}
      aria-hidden
    />
  );
}
