import Image from 'next/image';

export const DEFAULT_BACKDROP = '/scroll-world/img/main.webp';

/**
 * The Old City alley the flight opens on (or, on a project page, that
 * project's own photo), dimmed to the brand green, behind the inner pages.
 * Fixed, so it holds still while the page scrolls; the page's wrapper must be
 * `isolate` so -z-10 keeps it above the body's own background.
 */
export function PageBackdrop({ src = DEFAULT_BACKDROP }: { src?: string }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Image
        src={src}
        alt=""
        fill
        priority
        sizes="100vw"
        className="scale-105 object-cover blur-[2px]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary-dark/80 via-primary-dark/85 to-primary-dark/95" />
    </div>
  );
}
