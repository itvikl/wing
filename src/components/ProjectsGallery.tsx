'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale } from 'next-intl';
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Reveal } from './motion/Reveal';
import { TiltCard } from './motion/TiltCard';
import { MagneticButton } from './motion/MagneticButton';

type Item = { title: string; location: string; description: string; image?: string | null };

const PATTERNS = [
  'repeating-linear-gradient(135deg, rgba(181,130,56,0.25) 0px, rgba(181,130,56,0.25) 1px, transparent 1px, transparent 24px)',
  'repeating-linear-gradient(45deg, rgba(255,188,125,0.2) 0px, rgba(255,188,125,0.2) 1px, transparent 1px, transparent 22px)',
  'repeating-radial-gradient(circle at 30% 30%, rgba(181,130,56,0.25) 0px, transparent 40px)',
];

export function ProjectsGallery({
  eyebrow,
  title,
  ctaLabel,
  viewDetailsLabel,
  closeLabel,
  items,
}: {
  eyebrow: string;
  title: string;
  ctaLabel: string;
  viewDetailsLabel: string;
  closeLabel: string;
  items: Item[];
}) {
  const locale = useLocale();
  const contactHref = locale === 'en' ? '/contact' : `/${locale}/contact`;
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ down: boolean; startX: number; startScroll: number }>({
    down: false,
    startX: 0,
    startScroll: 0,
  });

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenIndex(null);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  function handlePointerDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (!scrollerRef.current) return;
    dragState.current = { down: true, startX: event.clientX, startScroll: scrollerRef.current.scrollLeft };
  }

  function handlePointerMove(event: ReactMouseEvent<HTMLDivElement>) {
    if (!dragState.current.down || !scrollerRef.current) return;
    const delta = event.clientX - dragState.current.startX;
    scrollerRef.current.scrollLeft = dragState.current.startScroll - delta;
  }

  function endDrag() {
    dragState.current.down = false;
  }

  const active = openIndex !== null ? items[openIndex] : null;

  return (
    <section id="projects" className="bg-neutral-bg py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <Reveal>
          <span className="text-xs uppercase tracking-[0.2em] text-accent-dark">{eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl font-semibold text-primary-dark text-balance md:text-4xl">
            {title}
          </h2>
        </Reveal>

        <Reveal index={1} className="mt-4">
          <p className="text-sm text-neutral-muted">{viewDetailsLabel} →</p>
        </Reveal>
      </div>

      <div
        ref={scrollerRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        className="no-scrollbar mt-10 flex cursor-grab gap-6 overflow-x-auto px-6 pb-6 active:cursor-grabbing sm:px-[max(1.5rem,calc((100vw-72rem)/2))]"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.map((item, index) => (
          <TiltCard
            key={item.title}
            className="w-[80vw] shrink-0 sm:w-[420px]"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative block aspect-[4/5] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-soft to-primary-dark text-start"
              style={{ scrollSnapAlign: 'start' }}
            >
              {item.image && (
                <Image
                  src={item.image}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-85"
                  sizes="(min-width: 640px) 420px, 80vw"
                />
              )}
              <div
                aria-hidden
                className="absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-60"
                style={{ backgroundImage: PATTERNS[index % PATTERNS.length] }}
              />
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-neutral-100">
                <h3 className="font-display text-2xl font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-neutral-200">{item.location}</p>
                <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-accent-light px-5 py-2 text-sm text-accent-light transition-colors group-hover:bg-accent-light group-hover:text-primary-dark">
                  {viewDetailsLabel}
                </span>
              </div>
            </button>
          </TiltCard>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              aria-hidden
              className="absolute inset-0 bg-primary-dark/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpenIndex(null)}
            />
            <motion.div
              role="dialog"
              aria-modal
              className="relative max-h-[88dvh] w-full max-w-2xl overflow-y-auto overflow-x-hidden rounded-3xl bg-neutral-bg text-start shadow-2xl"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-primary via-primary-soft to-primary-dark"
                style={{ backgroundImage: PATTERNS[(openIndex ?? 0) % PATTERNS.length] }}
              >
                {active.image && (
                  <Image src={active.image} alt="" fill unoptimized className="object-cover opacity-80" sizes="672px" />
                )}
                <button
                  type="button"
                  onClick={() => setOpenIndex(null)}
                  aria-label={closeLabel}
                  className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary-dark/60 text-neutral-100 backdrop-blur transition-colors hover:bg-primary-dark"
                >
                  ×
                </button>
              </div>
              <div className="p-8">
                <span className="text-xs uppercase tracking-[0.2em] text-accent-dark">{active.location}</span>
                <h3 className="mt-3 font-display text-2xl font-semibold text-primary-dark">{active.title}</h3>
                <p className="mt-4 text-neutral-muted">{active.description}</p>
                <MagneticButton
                  href={contactHref}
                  className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-sm font-medium text-primary-dark transition-colors hover:bg-accent-light"
                >
                  {ctaLabel}
                </MagneticButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
