import { adminSection } from '@/lib/admin/sections';

/**
 * Every admin screen's heading: its name, one line on what it edits, and
 * links to the page it edits on the live site, in both languages.
 */
export function SectionHeader({ sectionKey, note }: { sectionKey: string; note?: string }) {
  const section = adminSection(sectionKey);
  const link = 'inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-primary-dark transition-colors hover:border-accent';

  return (
    <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-primary-dark md:text-[28px]">{section.label}</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-neutral-muted">{section.description}</p>
        {note && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-accent-dark">{note}</p>}
      </div>
      {section.sitePath && (
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm text-neutral-muted">צפייה באתר:</span>
          <a href={`/he${section.sitePath === '/' ? '' : section.sitePath}`} target="_blank" rel="noopener noreferrer" className={link}>
            עברית <span aria-hidden>↗</span>
          </a>
          <a href={section.sitePath} target="_blank" rel="noopener noreferrer" className={link}>
            English <span aria-hidden>↗</span>
          </a>
        </div>
      )}
    </div>
  );
}
