import { getLocale, getTranslations } from 'next-intl/server';
import { getLocaleText, getSiteMedia } from '@/lib/content/store';
import type { ContentLocale } from '@/lib/content/schema';
import { Sized } from '@/lib/textSize';
import { ProjectsGallery } from './ProjectsGallery';

type TextItem = { title: string; location: string; description: string; sizes?: Record<string, number> };

export async function Projects() {
  const t = await getTranslations('projects');
  const media = await getSiteMedia();
  // Text sizes aren't strings, so they're read off the content itself rather than through t().
  const sizes = (await getLocaleText((await getLocale()) as ContentLocale)).projects.sizes;
  const items = (t.raw('items') as TextItem[])
    .map((item, index) => ({ ...item, image: media.projects.items[index] ?? null }))
    // Images are matched by position, so blank rows are dropped only after.
    .filter((item) => item.title.trim());
  // Nothing published: a plain message, without the section's heading. The
  // nav hides its link to this page too (see hasProjects), so this only
  // greets someone arriving by an old or typed URL.
  if (!items.length) {
    return (
      <section id="projects" className="flex min-h-[60vh] items-center justify-center px-6 py-24">
        <p className="text-center text-xl text-neutral-200"><Sized scale={sizes?.empty}>{t('empty')}</Sized></p>
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
      sizes={sizes}
      items={items}
    />
  );
}
