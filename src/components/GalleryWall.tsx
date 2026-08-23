'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';

type Member = { name: string; initials: string; role: string; bio: string; image: string | null };

// Deterministic entry vectors for the assembly effect (avoids Math.random,
// which would desync between SSR and hydration since this is a client component).
const ENTRY_PRESETS = [
  { x: -70, y: -50, rotate: -9 },
  { x: 70, y: -60, rotate: 7 },
  { x: -50, y: 60, rotate: 6 },
  { x: 60, y: 50, rotate: -7 },
  { x: 0, y: -80, rotate: 4 },
  { x: 0, y: 80, rotate: -4 },
];

export function GalleryWall({
  eyebrow,
  title,
  members,
}: {
  eyebrow: string;
  title: string;
  members: Member[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(sectionRef, { once: true, margin: '-10% 0px -10% 0px' });
  const played = reduceMotion || inView;
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <motion.section
      ref={sectionRef}
      className="overflow-hidden bg-primary-dark py-20 sm:py-28"
      initial={reduceMotion ? undefined : { scale: 1.22, opacity: 0, filter: 'blur(14px)' }}
      animate={played ? { scale: 1, opacity: 1, filter: 'blur(0px)' } : undefined}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformOrigin: '50% 40%' }}
    >
      <div className="mx-auto max-w-4xl px-6 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-accent-light">{eyebrow}</span>
        <h1 className="mt-4 text-balance font-display text-3xl font-semibold text-neutral-100 md:text-4xl">
          {title}
        </h1>
      </div>

      <div className="relative mx-auto mt-16 max-w-5xl px-6 sm:mt-20">
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-1/3"
            initial={{ left: '-20%', opacity: 0 }}
            animate={inView ? { left: '110%', opacity: [0, 0.16, 0] } : undefined}
            transition={{ duration: 1.6, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: 'radial-gradient(closest-side, rgba(255,188,125,0.9), transparent 70%)',
              mixBlendMode: 'screen',
            }}
          />
        )}

        <div className="relative grid grid-cols-2 gap-x-6 gap-y-14 sm:gap-x-10 md:grid-cols-4">
          {members.map((member, index) => (
            <FrameCard
              key={member.name}
              member={member}
              index={index}
              played={played}
              reduceMotion={!!reduceMotion}
              expanded={expanded === index}
              onToggle={() => setExpanded((current) => (current === index ? null : index))}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function FrameCard({
  member,
  index,
  played,
  reduceMotion,
  expanded,
  onToggle,
}: {
  member: Member;
  index: number;
  played: boolean;
  reduceMotion: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const entry = ENTRY_PRESETS[index % ENTRY_PRESETS.length];

  return (
    <motion.div
      className="flex flex-col"
      initial={
        reduceMotion
          ? undefined
          : { opacity: 0, x: entry.x, y: entry.y, rotate: entry.rotate, scale: 0.78, filter: 'blur(6px)' }
      }
      animate={played ? { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, filter: 'blur(0px)' } : undefined}
      transition={{
        duration: 0.6,
        delay: 0.45 + index * 0.1,
        type: 'spring',
        stiffness: 210,
        damping: 20,
      }}
    >
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="group text-start">
        <div className="rounded-[3px] bg-gradient-to-br from-accent-light via-accent to-accent-dark p-[5px] shadow-[0_16px_36px_-14px_rgba(0,0,0,0.65)] transition-transform duration-300 group-hover:-translate-y-1">
          <div className="relative aspect-[3/4] overflow-hidden rounded-[1px] bg-primary">
            {member.image ? (
              <Image src={member.image} alt="" fill unoptimized className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-accent-light">
                {member.initials}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 border-t border-accent/30 pt-3">
          <h2 className="font-display text-base font-semibold text-neutral-100">{member.name}</h2>
          <p className="mt-0.5 text-[0.7rem] uppercase tracking-[0.16em] text-accent-light">
            {member.role}
          </p>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pt-3 text-sm leading-relaxed text-neutral-200">{member.bio}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
