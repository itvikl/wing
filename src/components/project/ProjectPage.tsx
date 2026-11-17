import Image from 'next/image';
import type { ReactNode } from 'react';
import type { LocaleText } from '@/lib/content/schema';
import type { ProjectView } from '@/lib/projects/schema';
import { FeatureIcon } from './FeatureIcon';
import { ProjectGallery } from './ProjectGallery';

export type ProjectPageLabels = {
  back: string;
  featuresEyebrow: string;
  featuresTitle: string;
  nearbyEyebrow: string;
  nearbyTitle: string;
  galleryEyebrow: string;
  galleryTitle: string;
  walk: string;
  drive: string;
  leadEyebrow: string;
  sold: string;
  soldTitle: string;
  soldBody: string;
  soldCta: string;
  contact: string;
  close: string;
};

/** The template's fixed words, from the projects section's text (and the menu's "contact"). */
export function projectPageLabels(text: LocaleText): ProjectPageLabels {
  const t = text.projects;
  return {
    back: t.pageBack ?? '',
    featuresEyebrow: t.pageFeaturesEyebrow ?? '',
    featuresTitle: t.pageFeaturesTitle ?? '',
    nearbyEyebrow: t.pageNearbyEyebrow ?? '',
    nearbyTitle: t.pageNearbyTitle ?? '',
    galleryEyebrow: t.pageGalleryEyebrow ?? '',
    galleryTitle: t.pageGalleryTitle ?? '',
    walk: t.pageWalk ?? '',
    drive: t.pageDrive ?? '',
    leadEyebrow: t.pageLeadEyebrow ?? '',
    sold: t.pageSold ?? '',
    soldTitle: t.pageSoldTitle ?? '',
    soldBody: t.pageSoldBody ?? '',
    soldCta: t.pageSoldCta ?? '',
    contact: text.nav.contact,
    close: t.close,
  };
}

const EYEBROW = 'text-sm uppercase tracking-[0.22em] text-accent-light rtl:tracking-[0.12em]';
const Rule = ({ className = '' }: { className?: string }) => <div aria-hidden className={`h-px w-14 bg-accent ${className}`} />;

/**
 * One project's page, the same for every project: centered opening type over
 * the main photo in the gold frame, quick facts, photos beside text that swap
 * sides on their own, features, what's nearby, the gallery, then the lead
 * form (or, once sold, a closing note). A part with nothing in it is left out.
 *
 * Used by the site's page and by the admin's live preview. In the preview
 * (`editable`) every part carries data-jump, the field it's edited in, and an
 * empty part shows as a dashed placeholder instead of disappearing.
 */
export function ProjectPage({
  view,
  labels,
  locale,
  projectsHref,
  contactHref,
  leadForm,
  editable = false,
}: {
  view: ProjectView;
  labels: ProjectPageLabels;
  locale: string;
  projectsHref: string;
  contactHref: string;
  /** The form itself: the site's live LeadForm, or a still stand-in in the admin. */
  leadForm: ReactNode;
  editable?: boolean;
}) {
  const jump = (id: string) => (editable ? { 'data-jump': id } : {});
  const ghost = (id: string, label: string) =>
    editable ? (
      <div {...jump(id)} className="mx-auto mt-16 max-w-6xl px-6">
        <div className="rounded-2xl border border-dashed border-white/25 p-5 text-center text-base text-neutral-200/70">{label} · ריק, לא יוצג באתר</div>
      </div>
    ) : null;
  const backArrow = locale === 'he' ? '→' : '←';
  const showForm = !view.sold && view.showLeadForm;

  return (
    <article className="pb-24 font-sans text-neutral-100 md:pb-28">
      {/* Opening */}
      <section className="mx-auto flex max-w-6xl flex-col items-center px-6 pt-8 text-center md:pt-12">
        <a href={projectsHref} className="self-start border-b border-accent-light/40 pb-1 text-sm text-neutral-200 transition-colors hover:text-accent-light">
          <span aria-hidden>{backArrow}</span> {labels.back}
        </a>
        <div {...jump('area')} className="mt-8 md:mt-10">
          {view.area && <span className={EYEBROW}>{view.area}</span>}
        </div>
        <h1 {...jump('name')} className="mt-5 max-w-4xl font-display text-5xl font-semibold leading-[1.05] text-neutral-100 text-balance md:text-7xl">
          {view.name || (editable ? 'שם הפרויקט' : '')}
        </h1>
        <Rule className="mt-7" />
        {view.tagline && (
          <p {...jump('tagline')} className="mt-6 max-w-2xl text-lg font-light leading-relaxed text-neutral-100 md:text-[21px]">
            {view.tagline}
          </p>
        )}
        {showForm && view.cta && (
          <a {...jump('cta')} href="#contact" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-accent px-8 text-base font-medium text-primary-dark transition-colors hover:bg-accent-light">
            {view.cta}
          </a>
        )}
        <div aria-hidden className="mt-8 h-10 w-px bg-gradient-to-b from-accent/0 to-accent md:h-12" />
        <div {...jump('heroImage')} className="relative aspect-[4/3] w-full overflow-hidden rounded border-[3px] border-accent bg-primary sm:aspect-[21/9]">
          {view.heroImage ? (
            <Image src={view.heroImage} alt={view.name} fill priority sizes="(min-width: 1152px) 1104px, 100vw" className="object-cover" />
          ) : (
            editable && <span className="absolute inset-0 flex items-center justify-center text-base text-neutral-200/70">אין תמונה ראשית</span>
          )}
          {view.sold && (
            <span className="absolute start-4 top-4 bg-accent px-4 py-1.5 text-sm font-medium uppercase tracking-[0.14em] text-primary-dark rtl:tracking-normal">
              {labels.sold}
            </span>
          )}
        </div>
      </section>

      {/* Quick facts */}
      {view.facts.length ? (
        <dl {...jump('facts')} className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-8 px-6 pt-12 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] md:gap-10 md:pt-14">
          {view.facts.map((f) => (
            <div key={f.index} className="border-t border-accent pt-5">
              <dt className="text-[13px] uppercase tracking-[0.18em] text-accent-light rtl:tracking-[0.1em]">{f.label}</dt>
              <dd className="mt-2 font-display text-2xl text-neutral-100 md:text-3xl">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        ghost('facts', 'נתונים מהירים')
      )}

      {/* Photo beside text */}
      {view.blocks.length ? (
        <div className="mx-auto flex max-w-6xl flex-col gap-14 px-6 pt-14 md:gap-[72px] md:pt-[72px]">
          {view.blocks.map((b) =>
            b.side === 'full' ? (
              <section key={b.index} {...jump(`blocks.${b.index}`)} className="mx-auto max-w-3xl text-center">
                {b.title && <h2 className="font-display text-3xl font-semibold leading-tight text-neutral-100 text-balance md:text-[46px]">{b.title}</h2>}
                <Rule className="mx-auto my-7" />
                {b.body && <p className="whitespace-pre-line text-lg font-light leading-[1.85] text-neutral-200 md:text-xl">{b.body}</p>}
              </section>
            ) : (
              <section key={b.index} {...jump(`blocks.${b.index}`)} className="grid items-center gap-7 md:grid-cols-2 md:gap-14">
                <div className={`relative aspect-[4/3] overflow-hidden rounded border-[3px] border-accent bg-primary ${b.side === 'end' ? 'md:order-last' : ''}`}>
                  <Image src={b.image} alt={b.title} fill sizes="(min-width: 1152px) 520px, (min-width: 768px) 45vw, 100vw" className="object-cover" />
                </div>
                <div className="min-w-0">
                  {b.title && <h2 className="font-display text-3xl font-semibold leading-tight text-neutral-100 text-balance md:text-[46px]">{b.title}</h2>}
                  <Rule className="my-7" />
                  {b.body && <p className="whitespace-pre-line text-lg font-light leading-[1.85] text-neutral-200 md:text-xl">{b.body}</p>}
                </div>
              </section>
            ),
          )}
        </div>
      ) : (
        ghost('blocks', 'תמונה לצד טקסט')
      )}

      {/* Features */}
      {view.features.length ? (
        <section {...jump('features')} className="mx-auto max-w-6xl px-6 pt-16 md:pt-[72px]">
          <div className="rounded-3xl border border-white/10 bg-primary/80 p-7 backdrop-blur-xl md:p-10">
            <span className={EYEBROW}>{labels.featuresEyebrow}</span>
            <h2 className="mt-2 font-display text-2xl font-semibold text-neutral-100 md:text-[28px]">{labels.featuresTitle}</h2>
            <ul className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-3.5">
              {view.features.map((f) => (
                <li key={f.id} className="flex flex-col items-start gap-3 rounded-2xl bg-white/5 p-4 text-base text-neutral-100 sm:flex-row sm:items-center">
                  <FeatureIcon id={f.id} className="h-6 w-6 shrink-0 text-accent-light" />
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        ghost('features', 'מאפיינים')
      )}

      {/* Nearby */}
      {view.nearby.length ? (
        <section {...jump('nearby')} className="mx-auto max-w-6xl px-6 pt-16 md:pt-[72px]">
          <SectionHead eyebrow={labels.nearbyEyebrow} title={labels.nearbyTitle} />
          <ul className="mx-auto mt-10 grid max-w-4xl gap-x-16 md:mt-14 md:grid-cols-2">
            {view.nearby.map((n) => (
              <li key={n.index} className="flex items-baseline justify-between gap-4 border-b border-white/10 py-4 text-lg text-neutral-100">
                <span>{n.place}</span>
                <span className="whitespace-nowrap text-base tabular-nums text-accent-light">
                  {n.minutes} {n.mode === 'drive' ? labels.drive : labels.walk}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        ghost('nearby', 'בסביבה')
      )}

      {/* Gallery */}
      {view.gallery.length ? (
        <section {...jump('gallery')} className="mx-auto max-w-6xl px-6 pt-16 md:pt-[72px]">
          <SectionHead eyebrow={labels.galleryEyebrow} title={labels.galleryTitle} />
          <div className="mt-10 md:mt-14">
            <ProjectGallery images={view.gallery} alt={view.name} locale={locale} closeLabel={labels.close} still={editable} />
          </div>
        </section>
      ) : (
        ghost('gallery', 'גלריה')
      )}

      {/* Contact, or once sold, a closing note */}
      {view.sold ? (
        <section {...jump('lead')} className="mx-auto mt-16 max-w-6xl px-6 md:mt-[72px]">
          <div className="w-full border-t border-white/10 pt-12 md:flex md:items-center md:justify-between md:gap-10">
            <div>
              <span className={EYEBROW}>{labels.sold}</span>
              <h2 className="mt-3 font-display text-3xl font-semibold text-neutral-100 md:text-4xl">{labels.soldTitle}</h2>
              <p className="mt-3 text-lg font-light text-neutral-200">{labels.soldBody}</p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-8 md:mt-0 md:shrink-0">
              <a href={projectsHref} className="border-b border-accent-light/60 pb-1 text-lg text-neutral-100 transition-colors hover:text-accent-light">
                {labels.soldCta}
              </a>
              <a href={contactHref} className="flex h-[54px] items-center bg-accent px-8 text-lg font-medium text-primary-dark transition-colors hover:bg-accent-light">
                {labels.contact}
              </a>
            </div>
          </div>
        </section>
      ) : showForm ? (
        <div {...jump('lead')} className="mt-14 md:mt-[72px]">
          {leadForm}
        </div>
      ) : (
        ghost('lead', 'טופס פנייה (כבוי)')
      )}
    </article>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {eyebrow && <span className={EYEBROW}>{eyebrow}</span>}
      {title && <h2 className="font-display text-3xl font-semibold text-neutral-100 text-balance md:text-4xl">{title}</h2>}
    </div>
  );
}
