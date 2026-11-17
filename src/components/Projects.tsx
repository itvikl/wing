import { getLocale, getTranslations } from 'next-intl/server';
import { getLocaleText } from '@/lib/content/store';
import { getPublishedProjects } from '@/lib/projects/store';
import { projectView } from '@/lib/projects/schema';
import type { ContentLocale } from '@/lib/content/schema';
import { localePath } from '@/lib/contact';
import { Sized } from '@/lib/textSize';
import { ProjectsGallery } from './ProjectsGallery';

/** The projects page: a card per published project, each opening that project's page. */
export async function Projects() {
  const t = await getTranslations('projects');
  const locale = (await getLocale()) as ContentLocale;
  const text = await getLocaleText(locale);
  // Text sizes aren't strings, so they're read off the content itself rather than through t().
  const sizes = text.projects.sizes;
  const items = (await getPublishedProjects()).map((project) => {
    const view = projectView(project, locale);
    return {
      title: view.name,
      location: view.area,
      image: view.heroImage || null,
      href: localePath(locale, `/projects/${project.slug}`),
      sold: project.sold,
    };
  });
  // Nothing published: a plain message, without the section's heading. The
  // menus hide their link to this page too (see hasPublishedProjects), so
  // this only greets someone arriving by an old or typed URL.
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
      viewDetailsLabel={t('viewDetails')}
      soldLabel={text.projects.pageSold ?? ''}
      sizes={sizes}
      items={items}
    />
  );
}
