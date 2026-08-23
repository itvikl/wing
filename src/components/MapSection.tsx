'use client';

import dynamic from 'next/dynamic';
import { Reveal } from './motion/Reveal';

const MapCanvas = dynamic(() => import('./MapCanvas').then((mod) => mod.MapCanvas), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-primary-soft" />,
});

type Pin = { title: string; location: string };

export function MapSection({ eyebrow, title, pins }: { eyebrow: string; title: string; pins: Pin[] }) {
  return (
    <section id="map" className="bg-neutral-100 py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <Reveal>
          <span className="text-xs uppercase tracking-[0.2em] text-accent-dark">{eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl font-semibold text-primary-dark text-balance md:text-4xl">
            {title}
          </h2>
        </Reveal>

        <Reveal index={1} className="mt-10 overflow-hidden rounded-3xl shadow-sm">
          <div className="h-[320px] w-full sm:h-[420px]">
            <MapCanvas pins={pins} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
