import { requireSection } from '@/lib/auth/session';
import { canPublish } from '@/lib/auth/roles';
import { SectionHeader } from '@/components/admin/SectionHeader';
import { getContent } from '@/lib/content/store';
import { legacyProjectCount, listProjects } from '@/lib/projects/store';
import { publishProblems } from '@/lib/projects/schema';
import { ProjectList, type ProjectRow } from './ProjectList';
import { ProjectsLabelsForm } from './Form';
import type { ProjectsLabels } from './actions';

export default async function ProjectsAdminPage() {
  const session = await requireSection('projects');
  const [content, projects] = await Promise.all([getContent(), listProjects()]);
  const legacyCount = projects.length ? 0 : await legacyProjectCount();

  const rows: ProjectRow[] = projects.map((p) => ({
    id: p.id,
    name: p.text.he.name.trim() || p.text.en.name.trim(),
    area: p.text.he.area.trim(),
    slug: p.slug,
    published: p.published,
    sold: p.sold,
    heroImage: p.heroImage,
    problems: publishProblems(p),
    updatedAt: p.updatedAt,
  }));

  const labels = (locale: 'he' | 'en'): ProjectsLabels => {
    const { items: _items, ...rest } = content.text[locale].projects;
    return { ...rest, empty: rest.empty ?? '', sizes: rest.sizes ?? {} };
  };

  return (
    <div>
      <SectionHeader sectionKey="projects" />
      <ProjectList rows={rows} legacyCount={legacyCount} canPublish={canPublish(session)} />

      <details className="group mt-12 rounded-2xl border border-neutral-200 bg-white px-5 py-4 open:pb-0">
        <summary className="cursor-pointer list-none text-base font-semibold text-primary-dark">
          <span className="me-2 inline-block transition-transform group-open:rotate-90" aria-hidden>
            ‹
          </span>
          כותרות ומילים קבועות
          <span className="ms-2 text-sm font-normal text-neutral-muted">הכותרת מעל הכרטיסים, והמילים שחוזרות בכל דף פרויקט</span>
        </summary>
        <ProjectsLabelsForm initial={{ he: labels('he'), en: labels('en') }} />
      </details>
    </div>
  );
}
