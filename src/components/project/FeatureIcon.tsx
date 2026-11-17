import type { FeatureId } from '@/lib/projects/schema';

const PATHS: Record<FeatureId, string> = {
  parking: 'M7 3h10a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM10 17V8h3a3 3 0 0 1 0 6h-3',
  storage: 'M3 8l9-5 9 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM7 20v-7h10v7M7 16.5h10',
  elevator: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 10l3-3 3 3M9 14l3 3 3-3',
  sukkahBalcony: 'M3 10h18M5 10V7l7-4 7 4v3M6 10v9M10 10v9M14 10v9M18 10v9M3 19h18',
  garden: 'M12 21V11M12 11C12 6 8 4 4 4c0 5 3 7 8 7zM12 14c0-4 3-6 8-6 0 4-3 6-8 6z',
  safeRoom: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  shabbatElevator: 'M8 21V11M16 21V11M5 21h14M8 8c-1-1-1-2.2 0-4 1 1.8 1 3 0 4zM16 8c-1-1-1-2.2 0-4 1 1.8 1 3 0 4z',
  accessible: 'M12 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 7.5v5.5h4.5l2 5M12 10H8M9.5 13.2a5 5 0 1 0 5.8 6',
  centralAc: 'M12 2v20M3.5 7l17 10M20.5 7l-17 10M9 4l3 2 3-2M9 20l3-2 3 2',
  openView: 'M2 20l6-9 4 5 3-4 7 8zM17 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
};

export function FeatureIcon({ id, className }: { id: FeatureId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d={PATHS[id]} />
    </svg>
  );
}
