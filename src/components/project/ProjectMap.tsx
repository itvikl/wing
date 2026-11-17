/**
 * The neighbourhood map in the site's colours: the real streets around the
 * building (OpenStreetMap, stored with the project when it was placed; see
 * lib/projects/streetMap) drawn as gold lines on the brand green, parks a
 * shade lighter, and a pin with the project's name at the centre. Plain SVG:
 * no map service is called when the page is viewed.
 */

/** Half the width the map shows, in metres, per closeness setting. */
const HALF_WIDTH: Record<number, number> = { 14: 1100, 15: 800, 16: 560, 17: 380 };

export function ProjectMap({
  streets,
  zoom,
  label,
  className = '',
}: {
  streets: { major: string; minor: string; parks: string };
  zoom: number;
  label: string;
  className?: string;
}) {
  const hw = HALF_WIDTH[zoom] ?? 560;
  const hh = Math.round(hw * 0.72);

  return (
    <div className={`relative isolate overflow-hidden bg-primary ${className}`}>
      <svg
        aria-hidden
        viewBox={`${-hw} ${-hh} ${hw * 2} ${hh * 2}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {streets.parks && <path d={streets.parks} fill="rgba(58, 110, 80, 0.45)" stroke="none" />}
        {streets.minor && (
          <path d={streets.minor} fill="none" stroke="rgba(214, 160, 90, 0.42)" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        )}
        {streets.major && (
          <path d={streets.major} fill="none" stroke="#D6A05A" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {/* Soft edge toward the text beside it */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(6,43,35,0.65)_100%)]" />

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
        <span aria-hidden className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-light/20" />
        <span aria-hidden className="relative block h-4 w-4 rounded-full border-2 border-primary-dark bg-accent-light" />
        {label && (
          <span className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-bg px-3 py-1.5 font-display text-base font-semibold text-primary-dark shadow-lg after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-neutral-bg after:content-['']">
            {label}
          </span>
        )}
      </div>

      <p className="absolute bottom-1 end-2 z-10 text-[10px] text-neutral-100/60" dir="ltr">
        ©{' '}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-100">
          OpenStreetMap
        </a>{' '}
        contributors
      </p>
    </div>
  );
}
