'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Reveal({
  children,
  className,
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  const reduceMotion = useReducedMotion();

  // Always the same element with the same `initial`, whatever the visitor's
  // motion setting. The server can't know that setting, so it renders the
  // hidden starting state; rendering a plain <div> on the client instead (as
  // this once did for reduced motion) made React keep the server's
  // `opacity:0` forever, since hydration doesn't patch mismatched attributes.
  // On machines with animations turned off in the OS, every inner page came
  // up empty. Reduced motion now just reveals instantly.
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={
        reduceMotion ? { duration: 0 } : { duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}
