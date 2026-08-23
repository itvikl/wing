import Image from 'next/image';
import { Reveal } from './motion/Reveal';
import { MagneticButton } from './motion/MagneticButton';

export function VideoContent({
  eyebrow,
  title,
  cta,
  href,
  poster,
}: {
  eyebrow: string;
  title: string;
  cta: string;
  href: string;
  poster: string;
}) {
  return (
    <section id="video" className="bg-neutral-bg py-16 sm:py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Reveal>
          <span className="text-xs uppercase tracking-[0.2em] text-accent-dark">{eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl font-semibold text-primary-dark text-balance md:text-4xl">
            {title}
          </h2>
        </Reveal>

        <Reveal index={1} className="mt-10">
          <MagneticButton
            href={href}
            className="group relative block aspect-video overflow-hidden rounded-3xl bg-primary-dark"
          >
            <Image
              src={poster}
              alt=""
              fill
              unoptimized={poster.startsWith('http')}
              className="object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-95"
              sizes="(min-width: 768px) 896px, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/70 via-primary-dark/10 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <PlayGlyph />
              <p className="text-sm font-medium tracking-wide text-neutral-100">{cta}</p>
            </div>
          </MagneticButton>
        </Reveal>
      </div>
    </section>
  );
}

function PlayGlyph() {
  return (
    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary-dark shadow-lg transition-colors group-hover:bg-accent-light">
      <svg viewBox="0 0 24 24" className="ms-1 h-6 w-6" fill="currentColor" aria-hidden>
        <path d="M8 5v14l11-7z" />
      </svg>
    </span>
  );
}
