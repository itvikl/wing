import Image from 'next/image';
import type { ReactNode } from 'react';
import type { LocaleText } from '@/lib/content/schema';
import type { ProjectView } from '@/lib/projects/schema';
import { FeatureIcon } from './FeatureIcon';
import { ProjectGallery } from './ProjectGallery';
import { ProjectMap } from './ProjectMap';
import { UnitTypes, type UnitLabels } from './UnitTypes';

export type ProjectPageLabels = UnitLabels & {
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
  leadSubmit: string;
  sold: string;
  soldTitle: string;
  soldBody: string;
  soldCta: string;
  contact: string;
  close: string;
  quickTitle: string;
  quickText: string;
  quickSent: string;
  statusEyebrow: string;
  statusUpdated: string;
  unitsEyebrow: string;
  unitsTitle: string;
  barCta: string;
  share: string;
  shared: string;
};

/** The template's fixed words, from the projects section's text (and the menu's "contact"). */
export function projectPageLabels(text: LocaleText): ProjectPageLabels {
  const t = text.projects;
  const v = (value: string | undefined) => value ?? '';
  return {
    back: v(t.pageBack),
    featuresEyebrow: v(t.pageFeaturesEyebrow),
    featuresTitle: v(t.pageFeaturesTitle),
    nearbyEyebrow: v(t.pageNearbyEyebrow),
    nearbyTitle: v(t.pageNearbyTitle),
    galleryEyebrow: v(t.pageGalleryEyebrow),
    galleryTitle: v(t.pageGalleryTitle),
    walk: v(t.pageWalk),
    drive: v(t.pageDrive),
    leadEyebrow: v(t.pageLeadEyebrow),
    leadSubmit: v(t.pageLeadSubmit),
    sold: v(t.pageSold),
    soldTitle: v(t.pageSoldTitle),
    soldBody: v(t.pageSoldBody),
    soldCta: v(t.pageSoldCta),
    contact: text.nav.contact,
    close: t.close,
    quickTitle: v(t.pageQuickTitle),
    quickText: v(t.pageQuickText),
    quickSent: v(t.pageQuickSent),
    statusEyebrow: v(t.pageStatusEyebrow),
    statusUpdated: v(t.pageStatusUpdated),
    unitsEyebrow: v(t.pageUnitsEyebrow),
    unitsTitle: v(t.pageUnitsTitle),
    sqm: v(t.pageSqm),
    floor: v(t.pageFloor),
    floors: v(t.pageFloors),
    left: v(t.pageUnitsLeft),
    soldOut: v(t.pageUnitsSoldOut),
    total: v(t.pageUnitsTotal),
    planNote: v(t.pagePlanNote),
    planCta: v(t.pagePlanCta),
    planSoon: v(t.pagePlanSoon),
    barCta: v(t.pageBarCta),
    share: v(t.pageShare),
    shared: v(t.pageShared),
  };
}

// Small labels in the display serif, as on the rest of the site's headings.
// Wide letter-spacing only for Latin capitals; Hebrew letters stay together.
const EYEBROW = 'font-display text-[15px] font-medium uppercase tracking-[0.18em] text-accent-light rtl:tracking-normal';
const Rule = ({ className = '' }: { className?: string }) => <div aria-hidden className={`h-px w-14 bg-accent ${className}`} />;
/** Number ranges (85–210, 1–4) keep reading low to high inside a right-to-left line. */
const Ltr = ({ children }: { children: string }) => (/\d[–-]\d/.test(children) ? <bdi dir="ltr">{children}</bdi> : <>{children}</>);

function monthYear(value: string, locale: string) {
  const [y, m] = value.split('-').map(Number);
  if (!y || !m) return '';
  try {
    return new Intl.DateTimeFormat(locale === 'he' ? 'he-IL' : 'en-GB', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
  } catch {
    return value;
  }
}

/**
 * One project's page, the same for every project:
 *   the opening photo across the whole screen with the name, tags, the spec
 *   line and the button on it, and a short form on its lower edge (desktop);
 *   where sales stand; photos beside text, each from the other side; the
 *   apartment types with a typical plan; features; the neighbourhood (a map
 *   in the site's colours, a paragraph and what's how many minutes away);
 *   the gallery; then the lead form (or, once sold, a closing note). On a
 *   phone a bottom bar stands in for the floating buttons. A part with
 *   nothing in it is left out.
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
  quickForm,
  bar,
  editable = false,
}: {
  view: ProjectView;
  labels: ProjectPageLabels;
  locale: string;
  projectsHref: string;
  contactHref: string;
  /** The form itself: the site's live LeadForm, or a still stand-in in the admin. */
  leadForm: ReactNode;
  /** The short form on the opening photo's edge (desktop). */
  quickForm?: ReactNode;
  /** The phone's bottom bar. */
  bar?: ReactNode;
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
  const showQuick = showForm && view.showQuickForm && !!quickForm;
  const hasArea = !!view.location || !!view.areaText || view.nearby.length > 0;
  const updated = view.statusDate ? monthYear(view.statusDate, locale) : '';

  return (
    <article className="pb-24 font-sans text-neutral-100 md:pb-28">
      {/* Opening: the photo is the whole first screen */}
      <section
        {...jump('heroImage')}
        className="relative isolate flex h-[min(calc(100svh-4.5rem),56rem)] min-h-[36rem] items-end overflow-hidden bg-primary"
      >
        {view.heroImage ? (
          <Image src={view.heroImage} alt={view.name} fill priority sizes="100vw" className="-z-20 object-cover" />
        ) : (
          editable && <span className="absolute inset-0 -z-20 flex items-center justify-center text-base text-neutral-200/70">אין תמונה ראשית</span>
        )}
        <div aria-hidden className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(5,32,26,0.6)_0%,rgba(5,32,26,0)_22%,rgba(5,32,26,0.35)_45%,rgba(5,32,26,0.94)_100%)] max-md:bg-[linear-gradient(to_bottom,rgba(5,32,26,0.55)_0%,rgba(5,32,26,0.2)_22%,rgba(5,32,26,0.78)_50%,rgba(5,32,26,0.95)_100%)]" />

        <div className="absolute inset-x-0 top-0">
          <div className="mx-auto max-w-6xl px-6 pt-6 md:pt-8">
            <a href={projectsHref} className="border-b border-accent-light/50 pb-1 text-sm text-neutral-100 transition-colors hover:text-accent-light">
              <span aria-hidden>{backArrow}</span> {labels.back}
            </a>
          </div>
        </div>

        <div className={`mx-auto w-full max-w-6xl px-6 pb-12 ${showQuick ? 'md:pb-[10.5rem]' : 'md:pb-20'}`}>
          <div className="flex max-w-2xl flex-col items-start gap-4 [text-shadow:0_1px_14px_rgba(5,32,26,0.55)]">
            {(view.badges.length > 0 || view.sold) && (
              <div {...jump('badges')} className="flex flex-wrap gap-2">
                {view.sold && <span className="rounded-full bg-accent px-3.5 py-1 font-display text-sm font-medium text-primary-dark">{labels.sold}</span>}
                {view.badges.map((b) => (
                  <span key={b.index} className="rounded-full border border-accent-light/50 bg-primary-dark/45 px-3.5 py-1 font-display text-sm text-accent-light backdrop-blur-md">
                    {b.text}
                  </span>
                ))}
              </div>
            )}
            {view.area && (
              <span {...jump('area')} className={EYEBROW}>
                {view.area}
              </span>
            )}
            <h1 {...jump('name')} className="font-display text-5xl font-semibold leading-[1.05] text-neutral-100 text-balance md:text-[5.5rem]">
              {view.name || (editable ? 'שם הפרויקט' : '')}
            </h1>
            <Rule className="my-1" />
            {view.tagline && (
              <p {...jump('tagline')} className="max-w-xl text-lg font-light leading-relaxed text-neutral-100 md:text-[22px]">
                {view.tagline}
              </p>
            )}
            {view.facts.length > 0 && (
              <dl {...jump('facts')} className="mt-1 grid grid-cols-2 gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:gap-y-4 sm:gap-x-0">
                {view.facts.map((f) => (
                  <div
                    key={f.index}
                    className="flex flex-col-reverse gap-1 sm:me-6 sm:border-e sm:border-accent-light/45 sm:pe-6 sm:last:me-0 sm:last:border-0 sm:last:pe-0"
                  >
                    <dt className="font-display text-sm font-medium text-accent-light">{f.label}</dt>
                    <dd className="font-display text-3xl leading-none text-neutral-100 md:text-4xl">
                      <Ltr>{f.value}</Ltr>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
            {showForm && view.cta && (
              <a {...jump('cta')} href="#contact" className="mt-3 inline-flex min-h-12 items-center rounded-full bg-accent px-8 text-base font-medium text-primary-dark transition-colors hover:bg-accent-light">
                {view.cta}
              </a>
            )}
          </div>
        </div>
      </section>

      {showQuick && (
        <div {...jump('quickForm')} className="relative z-10 mx-auto -mt-[5.5rem] hidden max-w-6xl px-6 md:block">
          {quickForm}
        </div>
      )}

      {/* Where sales stand */}
      {view.status.length ? (
        <section {...jump('status')} className="mx-auto max-w-6xl px-6 pt-16 md:pt-[72px]">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <span className={EYEBROW}>{labels.statusEyebrow}</span>
            {updated && (
              <span className="text-sm font-light text-neutral-200/75">
                {labels.statusUpdated}: {updated}
              </span>
            )}
          </div>
          <dl className="mt-6 grid gap-8 md:grid-cols-3 md:gap-10">
            {view.status.map((st) => (
              <div key={st.index} className="flex flex-col gap-2 border-t border-accent/55 pt-6">
                <dt className="font-display text-[17px] font-medium text-accent-light">{st.label}</dt>
                <dd className="m-0 flex flex-col gap-2">
                  <span className="font-display text-5xl leading-none text-neutral-100 tabular-nums md:text-6xl">
                    <Ltr>{st.value}</Ltr>
                  </span>
                  {st.note && <span className="text-base font-light leading-relaxed text-neutral-200/80">{st.note}</span>}
                  {st.bar !== null && (
                    <span role="img" aria-label={`${st.bar}%`} className="mt-1 block h-0.5 max-w-[14rem] overflow-hidden bg-white/15">
                      <span className="block h-full bg-accent-light" style={{ width: `${st.bar}%` }} />
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : (
        ghost('status', 'מצב השיווק')
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

      {/* Apartment types */}
      {view.units.length ? (
        <section {...jump('units')} className="mx-auto max-w-6xl px-6 pt-16 md:pt-[72px]">
          <div className="mb-9 flex flex-col gap-3">
            <span className={EYEBROW}>{labels.unitsEyebrow}</span>
            <h2 className="font-display text-3xl font-semibold text-neutral-100 md:text-[44px]">{labels.unitsTitle}</h2>
          </div>
          <UnitTypes units={view.units} labels={labels} still={editable} />
        </section>
      ) : (
        ghost('units', 'סוגי דירות')
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

      {/* The neighbourhood: map, a paragraph, and what's nearby */}
      {hasArea ? (
        <section {...jump('location')} className="mt-16 border-y border-white/10 bg-primary/90 md:mt-[72px]">
          <div className={`grid ${view.location ? 'md:grid-cols-2' : ''}`}>
            <div className={`flex flex-col justify-center gap-5 px-6 py-12 md:py-14 ${view.location ? 'md:ps-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))] md:pe-12' : 'mx-auto w-full max-w-6xl'}`}>
              <span className={EYEBROW}>{labels.nearbyEyebrow}</span>
              {view.area && <h2 className="font-display text-3xl font-semibold text-neutral-100 md:text-[44px]">{view.area}</h2>}
              <Rule />
              {view.areaText && (
                <p {...jump('areaText')} className="max-w-xl whitespace-pre-line text-lg font-light leading-[1.8] text-neutral-200">
                  {view.areaText}
                </p>
              )}
              {view.nearby.length > 0 && (
                <ul {...jump('nearby')} className="mt-2 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                  {view.nearby.map((n) => (
                    <li key={n.index} className="flex items-center gap-3">
                      <ModeIcon mode={n.mode} />
                      <span className="flex flex-col">
                        <span className="font-display text-[17px] font-medium text-neutral-100">{n.place}</span>
                        <span className="text-sm font-light text-neutral-200/75">
                          {n.minutes} {n.mode === 'drive' ? labels.drive : labels.walk}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {view.location && (
              <ProjectMap streets={view.location.streets} zoom={view.location.zoom} label={view.name} className="min-h-[20rem] md:min-h-[30rem]" />
            )}
          </div>
        </section>
      ) : (
        ghost('location', 'השכונה ומפה')
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
        <div {...jump('lead')} className="mt-10 md:mt-14">
          {leadForm}
        </div>
      ) : (
        ghost('lead', 'טופס פנייה (כבוי)')
      )}

      {bar}
    </article>
  );
}

function ModeIcon({ mode }: { mode: 'walk' | 'drive' }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-accent-light" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {mode === 'drive' ? (
        <path d="M5 17h14M6 17v2M18 17v2M4 13l2-5.5A2 2 0 0 1 7.9 6h8.2a2 2 0 0 1 1.9 1.5L20 13v4H4zM7.5 14h.01M16.5 14h.01" />
      ) : (
        <path d="M13 4.5a1.5 1.5 0 1 0 0-.01M10 21l2-6-2-3 1-5 3 3h3M9 11l-2 3" />
      )}
    </svg>
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
