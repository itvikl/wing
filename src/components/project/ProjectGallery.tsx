'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The project's photos as a grid, the first one twice the size, each opening
 * full screen with arrows, the keyboard's arrow keys and Escape. Inside the
 * admin's preview (`still`) the grid doesn't open anything.
 */
export function ProjectGallery({
  images,
  alt,
  locale,
  closeLabel,
  still = false,
}: {
  images: string[];
  alt: string;
  locale: string;
  closeLabel: string;
  still?: boolean;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const rtl = locale === 'he';
  const count = images.length;

  const step = useCallback((by: number) => setOpen((i) => (i === null ? i : (i + by + count) % count)), [count]);
  const close = useCallback(() => {
    setOpen(null);
    returnFocus.current?.focus();
  }, []);

  useEffect(() => {
    if (open === null) return;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      // The arrow pointing the way the page reads goes to the next photo.
      if (e.key === 'ArrowLeft') step(rtl ? 1 : -1);
      if (e.key === 'ArrowRight') step(rtl ? -1 : 1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, close, step, rtl]);

  const label = (i: number) => `${alt} — ${i + 1}/${count}`;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={(e) => {
              if (still) return;
              returnFocus.current = e.currentTarget;
              setOpen(i);
            }}
            aria-label={label(i)}
            className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-primary ${
              i === 0 ? 'col-span-2 md:row-span-2 md:aspect-auto' : ''
            }`}
          >
            <Image
              src={src}
              alt=""
              fill
              sizes={i === 0 ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 50vw'}
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div role="dialog" aria-modal aria-label={label(open)} className="fixed inset-0 z-[90] flex items-center justify-center bg-primary-dark/95 p-4 backdrop-blur-sm" onClick={close}>
          <div className="relative h-full max-h-[86vh] w-full max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <Image src={images[open]} alt={label(open)} fill sizes="100vw" className="object-contain" />
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label={closeLabel}
            className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-2xl text-neutral-100 hover:border-accent-light hover:text-accent-light"
          >
            ×
          </button>
          {count > 1 && (
            <>
              <Arrow side="start" rtl={rtl} onClick={() => step(-1)} />
              <Arrow side="end" rtl={rtl} onClick={() => step(1)} />
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm tabular-nums text-neutral-200">
                {open + 1} / {count}
              </span>
            </>
          )}
        </div>
      )}
    </>
  );
}

function Arrow({ side, rtl, onClick }: { side: 'start' | 'end'; rtl: boolean; onClick: () => void }) {
  // "start" is the previous photo: on the right in Hebrew, on the left in English.
  const pointsLeft = (side === 'start') !== rtl;
  return (
    <button
      type="button"
      onClick={(e) => {
        // The backdrop behind closes the photo; an arrow only moves.
        e.stopPropagation();
        onClick();
      }}
      aria-label={side === 'start' ? (rtl ? 'התמונה הקודמת' : 'Previous photo') : rtl ? 'התמונה הבאה' : 'Next photo'}
      className={`absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-primary-dark/60 text-neutral-100 hover:border-accent-light hover:text-accent-light ${
        side === 'start' ? 'start-4' : 'end-4'
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-5 w-5">
        <path d={pointsLeft ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
      </svg>
    </button>
  );
}
