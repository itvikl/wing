import type { ReactNode } from 'react';
import { AdminLocaleToggle } from './AdminLocale';

export function SectionLayout({
  fields,
  preview,
  languages = true,
}: {
  fields: ReactNode;
  preview: ReactNode;
  /** false for a section with nothing per language (the logo), so no switch is shown. */
  languages?: boolean;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div>
        {languages && <AdminLocaleToggle />}
        {fields}
      </div>
      <div className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-muted">תצוגה מקדימה באתר</div>
        <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">{preview}</div>
      </div>
    </div>
  );
}

/** Small note shown under a preview when a field genuinely isn't rendered live yet. */
export function PreviewNote({ children }: { children: ReactNode }) {
  return <p className="border-t border-dashed border-neutral-200 bg-neutral-100 p-3 text-xs text-neutral-muted">{children}</p>;
}
