import { getTranslations } from 'next-intl/server';
import { getSiteMedia } from '@/lib/content/store';
import { ProjectsGallery } from './ProjectsGallery';

type TextItem = { title: string; location: string; description: string };

export async function Projects() {
  const t = await getTranslations('projects');
  const media = await getSiteMedia();
  const items = (t.raw('items') as TextItem[]).map((item, index) => ({
    ...item,
    image: media.projects.items[index] ?? null,
  }));

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
