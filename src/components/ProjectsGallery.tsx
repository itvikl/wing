'use client';

import Image from 'next/image';
import { useRef, type MouseEvent as ReactMouseEvent } from 'react';
import { Reveal } from './motion/Reveal';
import { TiltCard } from './motion/TiltCard';
import { Sized } from '@/lib/textSize';
import type { TextSizes } from '@/lib/content/schema';

type Item = { title: string; location: string; image: string | null; href: string; sold: boolean };

const PATTERNS = [
  'repeating-linear-gradient(135deg, rgba(181,130,56,0.25) 0px, rgba(181,130,56,0.25) 1px, transparent 1px, transparent 24px)',
  'repeating-linear-gradient(45deg, rgba(255,188,125,0.2) 0px, rgba(255,188,125,0.2) 1px, transparent 1px, transparent 22px)',
  'repeating-radial-gradient(circle at 30% 30%, rgba(181,130,56,0.25) 0px, transparent 40px)',
];

/** A drag of more than this many pixels scrolls the row instead of opening the card it started on. */
const DRAG_THRESHOLD = 6;

export function ProjectsGallery({
  eyebrow,
  title,
  viewDetailsLabel,
  soldLabel,
  sizes,
  items,
}: {
  eyebrow: string;
  title: string;
  viewDetailsLabel: string;
  soldLabel: string;
  /** The section's text sizes. */
  sizes?: TextSizes;
  items: Item[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false });

  function handlePointerDown(event: ReactMouseEvent<HTMLDivElement>) {
    if (!scrollerRef.current) return;
    drag.current = { down: true, startX: event.clientX, startScroll: scrollerRef.current.scrollLeft, moved: false };
  }

  function handlePointerMove(event: ReactMouseEvent<HTMLDivElement>) {
    if (!drag.current.down || !scrollerRef.current) return;
    const delta = event.clientX - drag.current.startX;
    if (Math.abs(delta) > DRAG_THRESHOLD) drag.current.moved = true;
    scrollerRef.current.scrollLeft = drag.current.startScroll - delta;
  }

  function endDrag() {
    drag.current.down = false;
  }

  return (
    <section id="projects" className="py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <Reveal>
          <span className="text-base uppercase tracking-[0.2em] text-accent-light md:text-lg"><Sized scale={sizes?.eyebrow}>{eyebrow}</Sized></span>
          <h2 className="mt-4 font-display text-3xl font-semibold text-neutral-100 text-balance md:text-4xl">
            <Sized scale={sizes?.title}>{title}</Sized>
          </h2>
        </Reveal>
      </div>

      <div
        ref={scrollerRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        className={`no-scrollbar mt-12 flex cursor-grab gap-6 overflow-x-auto px-6 pb-6 active:cursor-grabbing sm:px-[max(1.5rem,calc((100vw-72rem)/2))] ${
          items.length < 3 ? 'sm:justify-center' : ''
        }`}
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {items.map((item, index) => (
          <TiltCard key={item.href} className="w-[80vw] shrink-0 sm:w-[420px]">
            <a
              href={item.href}
              draggable={false}
              onClick={(event) => {
                // The end of a drag across the row isn't a click on the card.
                if (drag.current.moved) event.preventDefault();
              }}
              className="group relative block aspect-[4/5] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-soft to-primary-dark text-start"
              style={{ scrollSnapAlign: 'start' }}
            >
              {item.image && (
                <Image
                  src={item.image}
                  alt=""
                  fill
                  draggable={false}
                  className="object-cover opacity-70 transition-opacity duration-500 group-hover:opacity-85"
                  sizes="(min-width: 640px) 420px, 80vw"
                />
              )}
              <div
                aria-hidden
                className="absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-60"
                style={{ backgroundImage: PATTERNS[index % PATTERNS.length] }}
              />
              {item.sold && soldLabel && (
                <span className="absolute start-6 top-6 bg-accent px-3 py-1 text-sm font-medium uppercase tracking-[0.14em] text-primary-dark rtl:tracking-normal">
                  {soldLabel}
                </span>
              )}
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-neutral-100">
                <h3 className="font-display text-2xl font-semibold">{item.title}</h3>
                {item.location && <p className="mt-1 text-base text-neutral-200">{item.location}</p>}
                <span className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-accent-light px-5 py-2 text-base text-accent-light transition-colors group-hover:bg-accent-light group-hover:text-primary-dark">
                  <Sized scale={sizes?.viewDetails}>{viewDetailsLabel}</Sized>
                </span>
              </div>
            </a>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}
