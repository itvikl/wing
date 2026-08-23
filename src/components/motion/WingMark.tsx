'use client';

import { motion, useReducedMotion } from 'framer-motion';

const strokes = [
  { d: 'M8,92 C28,64 38,24 92,8', delay: 0 },
  { d: 'M18,86 C32,66 40,36 68,20', delay: 0.15 },
  { d: 'M28,80 C38,68 44,52 58,36', delay: 0.3 },
];

export function WingMark({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden
    >
      {strokes.map((stroke) => (
        <motion.path
          key={stroke.d}
          d={stroke.d}
          initial={reduceMotion ? undefined : { pathLength: 0, opacity: 0 }}
          animate={reduceMotion ? undefined : { pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: stroke.delay, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </svg>
  );
}
