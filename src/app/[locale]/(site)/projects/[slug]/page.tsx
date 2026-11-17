import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/request';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PageBackdrop } from '@/components/PageBackdrop';
import { LeadForm } from '@/components/LeadForm';
import { ProjectPage, projectPageLabels } from '@/components/project/ProjectPage';
import { QuickLeadForm } from '@/components/project/QuickLeadForm';
import { ProjectBar } from '@/components/project/ProjectBar';
import { getLocaleText } from '@/lib/content/store';
import { getPublishedProjectBySlug } from '@/lib/projects/store';
import { projectView } from '@/lib/projects/schema';
import { localePath, whatsappHref } from '@/lib/contact';

// Rendered per request, like every page under [locale]: see projects/page.tsx.
export const dynamic = 'force-dynamic';

type Params = { params: { locale: Locale; slug: string } };

export async function generateMetadata({ params: { locale, slug } }: Params): Promise<Metadata> {
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return {};
  const view = projectView(project, locale);
  const title = view.seoTitle || `${view.name} — Wings Real Estate`;
  const description = view.seoDescription || view.tagline || undefined;
  return {
    title,
    description,
    openGraph: { title, description, images: view.heroImage ? [view.heroImage] : undefined },
  };
}

/** A project's page: one fixed template, filled from the project's own doc. Unpublished is a 404. */
export default async function ProjectRoute({ params: { locale, slug } }: Params) {
  setRequestLocale(locale);
  const project = await getPublishedProjectBySlug(slug);
  if (!project) notFound();

  const text = await getLocaleText(locale);
  const view = projectView(project, locale);
  const labels = projectPageLabels(text);
  // Leads carry the Hebrew name, so the CRM shows one name per project in both languages.
  const leadProject = project.text.he.name || view.name;
  const formOn = !view.sold && view.showLeadForm;

  return (
    <div className="relative isolate flex min-h-screen min-h-dvh flex-col">
      <PageBackdrop src={view.backdropImage || undefined} />
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1">
        <ProjectPage
          view={view}
          labels={labels}
          locale={locale}
          projectsHref={localePath(locale, '/projects')}
          contactHref={localePath(locale, '/contact')}
          quickForm={<QuickLeadForm title={labels.quickTitle} text={labels.quickText} sentText={labels.quickSent} project={leadProject} />}
          leadForm={
            <LeadForm
              compact
              sizes={text.leadForm.sizes}
              eyebrow={labels.leadEyebrow}
              title={view.leadTitle}
              intro={view.leadText}
              submitLabel={labels.leadSubmit}
              project={leadProject}
            />
          }
          bar={
            <ProjectBar
              ctaLabel={labels.barCta}
              ctaHref={formOn ? '#contact' : localePath(locale, '/contact')}
              whatsappHref={whatsappHref(text.footer.whatsappLink, text.footer.whatsappMessage)}
              whatsappLabel={text.footer.whatsapp}
              shareLabel={labels.share}
              sharedLabel={labels.shared}
              title={view.name}
            />
          }
        />
      </main>
      <Footer />
    </div>
  );
}
