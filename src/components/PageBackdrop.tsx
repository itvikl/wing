import Image from 'next/image';

/**
 * The Old City alley the flight opens on, dimmed to the brand green, behind
 * the inner pages. Fixed, so it holds still while the page scrolls; the page's
 * wrapper must be `isolate` so -z-10 keeps it above the body's own background.
 */
export function PageBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <Image
        src="/scroll-world/img/main.webp"
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
