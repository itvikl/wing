import { getTranslations } from 'next-intl/server';
import { getSiteMedia } from '@/lib/content/store';
import { ProjectsGallery } from './ProjectsGallery';

type TextItem = { title: string; location: string; description: string };

export async function Projects() {
  const t = await getTranslations('projects');
  const media = await getSiteMedia();
  const items = (t.raw('items') as TextItem[])
    .map((item, index) => ({ ...item, image: media.projects.items[index] ?? null }))
    // Images are matched by position, so blank rows are dropped only after.
    .filter((item) => item.title.trim());
  // Nothing published: a plain message, without the section's heading. The
  // nav hides its link to this page too (see hasProjects), so this only
  // greets someone arriving by an old or typed URL.
  if (!items.length) {
    return (
      <section id="projects" className="flex min-h-[60vh] items-center justify-center bg-neutral-bg px-6 py-24">
        <p className="text-center text-lg text-neutral-muted">{t('empty')}</p>
      </section>
    );
  }

  return (
    <ProjectsGallery
      eyebrow={t('eyebrow')}
      title={t('title')}
      ctaLabel={t('cta')}
      viewDetailsLabel={t('viewDetails')}
      closeLabel={t('close')}
      items={items}
    />
  );
}
