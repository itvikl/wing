'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AdminLocaleToggle, jumpToField, useAdminLocale } from '@/components/admin/AdminLocale';
import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextAreaField, TextField } from '@/components/admin/fields';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { RepeatableList } from '@/components/admin/RepeatableList';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { FeatureIcon } from '@/components/project/FeatureIcon';
import type { ProjectPageLabels } from '@/components/project/ProjectPage';
import {
  BLOCK_PRESETS,
  FACT_PRESETS,
  FEATURE_IDS,
  FEATURE_LABELS,
  MAX_FACTS,
  newBlock,
  newFact,
  newPlace,
  projectView,
  publishProblems,
  readiness,
  slugify,
  type ProjectData,
  type ProjectText,
} from '@/lib/projects/schema';
import type { ContentLocale } from '@/lib/content/schema';
import { saveProjectAction } from '../actions';
import { GalleryField } from './GalleryField';
import { ProjectPreview } from './Preview';

export type LeadPreviewLabels = { name: string; phone: string; email: string; submit: string };

/**
 * One project's page, part by part, in the order the page shows them, with
 * the page itself live beside the fields. The admin fills content only: the
 * layout is the template's, the same for every project.
 */
export function ProjectEditor({
  id,
  initial,
  updatedAt,
  labels,
  lead,
  canPublish,
}: {
  id: string;
  initial: ProjectData;
  updatedAt: string;
  labels: Record<ContentLocale, ProjectPageLabels>;
  lead: Record<ContentLocale, LeadPreviewLabels>;
  /** Owners and editors; a limited editor edits content but can't publish or unpublish. */
  canPublish: boolean;
}) {
  const router = useRouter();
  const { locale } = useAdminLocale();
  const [savedData, setSavedData] = useState(initial);

  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm<ProjectData>(initial, async (d) => {
    const result = await saveProjectAction(id, d);
    if (!result.ok) throw new Error(result.error);
    setSavedData(d);
    router.refresh();
  });

  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(savedData), [data, savedData]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const set = (patch: Partial<ProjectData>) => setData((prev) => ({ ...prev, ...patch }));
  const setText = (l: ContentLocale, patch: Partial<ProjectText>) =>
    setData((prev) => ({ ...prev, text: { ...prev.text, [l]: { ...prev.text[l], ...patch } } }));

  const problems = publishProblems(data);
  const checks = readiness(data);
  const name = data.text.he.name.trim() || data.text.en.name.trim() || 'פרויקט חדש';
  // Which side each block's photo lands on, as the page will lay them out.
  const sides = new Map(projectView(data, locale).blocks.map((b) => [b.index, b.side]));
  const liveSlug = savedData.published ? savedData.slug : '';

  // A part's text fields, once per language; the screen's language switch shows one.
  const both = (render: (l: ContentLocale) => ReactNode) => <LocaleTabs he={render('he')} en={render('en')} />;

  return (
    <form onSubmit={handleSubmit}>
      {/* Heading */}
      <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Link href="/admin/content/projects" className="text-sm text-neutral-muted hover:text-primary-dark">
            → כל הפרויקטים
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-primary-dark md:text-[28px]">{name}</h1>
          <p className="mt-1.5 text-sm text-neutral-muted" suppressHydrationWarning>
            {savedData.published ? 'מפורסם באתר' : 'לא מפורסם'}
            {savedData.sold && ' · נמכר'}
            {updatedAt && ` · נשמר לאחרונה ${new Date(updatedAt).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
            {dirty && <span className="text-amber-700"> · יש שינויים שלא נשמרו</span>}
          </p>
        </div>
        {liveSlug && (
          <div className="flex shrink-0 items-center gap-2 text-sm">
            <span className="text-neutral-muted">צפייה באתר:</span>
            <a href={`/he/projects/${liveSlug}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-primary-dark hover:border-accent">
              עברית <span aria-hidden>↗</span>
            </a>
            <a href={`/projects/${liveSlug}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-primary-dark hover:border-accent">
              English <span aria-hidden>↗</span>
            </a>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <AdminLocaleToggle />

          {/* Publishing */}
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
            <div className="flex flex-wrap gap-3">
              <Switch
                checked={data.published}
                disabled={!canPublish || (!data.published && problems.length > 0)}
                onChange={(published) => set({ published })}
                on="מפורסם באתר"
                off="לא מפורסם"
                tone="green"
              />
              <Switch checked={data.sold} onChange={(sold) => set({ sold })} on="נמכר" off="לא נמכר" tone="gold" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-muted">
              {data.published
                ? 'הפרויקט מופיע באתר: כרטיס בעמוד הפרויקטים, ודף משלו.'
                : 'הפרויקט לא מופיע באתר, והכתובת שלו לא נפתחת. אפשר לעבוד עליו בשקט ולפרסם כשהוא מוכן.'}{' '}
              {data.sold && 'כנמכר, הוא נשאר באתר עם תגית "נמכר", ובמקום הטופס מופיע קישור לשאר הפרויקטים. '}
              {data.published !== savedData.published || data.sold !== savedData.sold ? <strong className="font-medium text-amber-700">השינוי ייכנס לתוקף בשמירה.</strong> : null}
            </p>
            {!canPublish && (
              <p className="mt-2 text-sm text-neutral-muted">פרסום והסתרה של פרויקט נעשים על ידי בעלים או עורך.</p>
            )}
            {data.published && problems.length > 0 && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                הפרויקט מסומן לפרסום, אבל חסר: {problems.join(', ')}. השמירה לא תעבור עד שזה יושלם, או שתכבו את הפרסום.
              </p>
            )}

            <div className="mt-5 border-t border-neutral-200 pt-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-primary-dark">מוכנות לפרסום</span>
                <span className="tabular-nums text-neutral-muted">
                  {checks.filter((c) => c.ok).length} מתוך {checks.length}
                </span>
              </div>
              <ul className="grid gap-1 sm:grid-cols-2">
                {checks.map((c) => (
                  <li key={c.label}>
                    <button type="button" onClick={() => jumpToField(c.jump, c.label.startsWith('תרגום') ? 'en' : locale)} className="flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-start text-sm hover:bg-neutral-100">
                      <span
                        aria-hidden
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                          c.ok ? 'bg-green-100 text-green-700' : c.required ? 'bg-amber-100 text-amber-700' : 'border border-dashed border-neutral-300'
                        }`}
                      >
                        {c.ok ? '✓' : c.required ? '!' : ''}
                      </span>
                      <span className={c.ok ? 'text-neutral-muted' : 'text-primary-dark'}>
                        {c.label}
                        {!c.ok && <span className={`ms-1.5 text-xs ${c.required ? 'text-amber-700' : 'text-neutral-muted'}`}>{c.required ? 'חובה' : 'מומלץ'}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <Part id="opening" title="פתיח ופרטים" description="החלק העליון של הדף. השם, השכונה והתמונה הראשית מופיעים גם בכרטיס הפרויקט בעמוד הפרויקטים.">
            {both((l) => (
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label={l === 'he' ? 'שם הפרויקט' : 'Project name'} value={data.text[l].name} jump="name" singleLine onChange={(v) => setText(l, { name: v })} />
                  <TextField label={l === 'he' ? 'שכונה ועיר' : 'Neighbourhood, city'} value={data.text[l].area} jump="area" singleLine onChange={(v) => setText(l, { area: v })} />
                </div>
                <TextAreaField label={l === 'he' ? 'משפט פתיחה (מתחת לשם)' : 'Opening line (under the name)'} value={data.text[l].tagline} jump="tagline" rows={2} onChange={(v) => setText(l, { tagline: v })} />
                <TextField label={l === 'he' ? 'הכפתור בפתיח (גולל לטופס)' : 'Opening button (scrolls to the form)'} value={data.text[l].cta} jump="cta" singleLine onChange={(v) => setText(l, { cta: v })} />
              </div>
            ))}
            <ImageUploadField label="תמונה ראשית (לרוחב, משותפת לשתי השפות)" folder="projects" value={data.heroImage} jump="heroImage" onChange={(url) => set({ heroImage: url })} />
            <div className="grid gap-1.5 text-sm" data-jump-target="slug">
              <label htmlFor="project-slug" className="font-medium text-primary-dark">כתובת הדף</label>
              <div dir="ltr" className="flex items-center rounded-lg border border-neutral-200 bg-white focus-within:border-accent">
                <span className="ps-3 text-neutral-muted">/projects/</span>
                <input
                  id="project-slug"
                  value={data.slug}
                  onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 80) })}
                  placeholder="narcissus-house-rehavia"
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 text-primary-dark focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!slugify(data.text.en.name)}
                  onClick={() => set({ slug: slugify(data.text.en.name) })}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-primary-dark hover:border-accent disabled:opacity-40"
                  title={slugify(data.text.en.name) ? undefined : 'צריך קודם שם באנגלית'}
                >
                  יצירה מהשם באנגלית
                </button>
                <span className="text-xs text-neutral-muted">אותיות באנגלית, מספרים ומקפים. אחרי הפרסום עדיף לא לשנות: קישורים ששותפו יפסיקו לעבוד.</span>
              </div>
            </div>
          </Part>

          <Part id="facts" title="נתונים מהירים" description={`פס קצר מתחת לתמונה הראשית. עד ${MAX_FACTS} נתונים. נתון בלי ערך לא מוצג.`}>
            <RepeatableList
              items={data.facts}
              onChange={(facts) => set({ facts: facts.slice(0, MAX_FACTS) })}
              newItem={() => newFact()}
              addLabel="הוספת נתון"
              renderItem={(fact, update) =>
                both((l) => (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label={l === 'he' ? 'נתון' : 'Label'} value={fact[l].label} singleLine onChange={(v) => update(inLocale(l, { ...fact[l], label: v }))} />
                    <TextField label={l === 'he' ? 'ערך' : 'Value'} value={fact[l].value} singleLine onChange={(v) => update(inLocale(l, { ...fact[l], value: v }))} />
                  </div>
                ))
              }
            />
            <Presets
              label="הוספה מהירה:"
              presets={FACT_PRESETS.filter(([he]) => !data.facts.some((f) => f.he.label === he))}
              disabled={data.facts.length >= MAX_FACTS}
              locale={locale}
              onPick={(he, en) => set({ facts: [...data.facts, newFact(he, en)] })}
            />
          </Part>

          <Part id="blocks" title="תמונה לצד טקסט" description="הלב של הדף. כל בלוק הוא כותרת, טקסט ותמונה לאורך. הצד של התמונה מתחלף לבד, ובלוק בלי תמונה נפרש לרוחב מלא.">
            <RepeatableList
              items={data.blocks}
              onChange={(blocks) => set({ blocks })}
              newItem={() => newBlock()}
              addLabel="הוספת בלוק"
              confirmRemove="למחוק את הבלוק?"
              renderItem={(block, update, i) => (
                <div className="grid gap-4" data-jump-target={`blocks.${i}`}>
                  <p className="text-xs text-neutral-muted">{sideLabel(sides.get(i), locale)}</p>
                  {both((l) => (
                    <div className="grid gap-3">
                      <TextField label={l === 'he' ? 'כותרת' : 'Title'} value={block[l].title} singleLine onChange={(v) => update(inLocale(l, { ...block[l], title: v }))} />
                      <TextAreaField label={l === 'he' ? 'טקסט' : 'Text'} value={block[l].body} rows={5} onChange={(v) => update(inLocale(l, { ...block[l], body: v }))} />
                    </div>
                  ))}
                  <ImageUploadField label="תמונה (לאורך, יחס 4:5)" folder="projects" value={block.image} onChange={(url) => update({ image: url })} />
                </div>
              )}
            />
            <Presets
              label="בלוק עם כותרת מוכנה:"
              presets={BLOCK_PRESETS.filter(([he]) => !data.blocks.some((b) => b.he.title === he))}
              locale={locale}
              onPick={(he, en) => set({ blocks: [...data.blocks, newBlock(he, en)] })}
            />
          </Part>

          <Part id="features" title="מאפיינים" description="מסמנים מה יש בפרויקט. האייקון והשם בשתי השפות קבועים, והסדר באתר הוא הסדר כאן.">
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {FEATURE_IDS.map((fid) => {
                const checked = data.features.includes(fid);
                return (
                  <label key={fid} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border p-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-accent ${checked ? 'border-accent bg-accent/10 text-primary-dark' : 'border-neutral-200 text-neutral-muted hover:border-neutral-300'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => set({ features: checked ? data.features.filter((f) => f !== fid) : FEATURE_IDS.filter((f) => f === fid || data.features.includes(f)) })}
                      className="sr-only"
                    />
                    <FeatureIcon id={fid} className={`h-5 w-5 shrink-0 ${checked ? 'text-accent-dark' : ''}`} />
                    {FEATURE_LABELS[fid][locale]}
                    <span aria-hidden className={`ms-auto flex h-4 w-4 items-center justify-center rounded border text-[10px] ${checked ? 'border-accent bg-accent text-white' : 'border-neutral-300'}`}>{checked ? '✓' : ''}</span>
                  </label>
                );
              })}
            </div>
          </Part>

          <Part id="nearby" title="בסביבה" description="מקומות קרובים וכמה דקות לוקח להגיע. מוצג כרשימה בשתי עמודות.">
            <RepeatableList
              items={data.nearby}
              onChange={(nearby) => set({ nearby })}
              newItem={newPlace}
              addLabel="הוספת מקום"
              renderItem={(place, update) => (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_90px_110px] sm:items-end">
                  {both((l) => (
                    <TextField label={l === 'he' ? 'מקום' : 'Place'} value={place[l].place} singleLine onChange={(v) => update(inLocale(l, { place: v }))} />
                  ))}
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium text-primary-dark">דקות</span>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={place.minutes}
                      onChange={(e) => update({ minutes: Math.min(120, Math.max(1, Number(e.target.value) || 1)) })}
                      className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-primary-dark focus:border-accent focus:outline-none"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm">
                    <span className="font-medium text-primary-dark">איך מגיעים</span>
                    <select value={place.mode} onChange={(e) => update({ mode: e.target.value as 'walk' | 'drive' })} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-primary-dark focus:border-accent focus:outline-none">
                      <option value="walk">ברגל</option>
                      <option value="drive">ברכב</option>
                    </select>
                  </label>
                </div>
              )}
            />
          </Part>

          <Part id="gallery" title="גלריה" description={`6 עד 16 תמונות. הראשונה מוצגת גדולה, ובאתר כל תמונה נפתחת למסך מלא. כרגע ${data.gallery.length}.`}>
            <GalleryField
              images={data.gallery}
              onChange={(gallery) => set({ gallery })}
              onAdd={(urls) => setData((prev) => ({ ...prev, gallery: [...prev.gallery, ...urls] }))}
            />
          </Part>

          <Part id="lead" title="טופס פנייה" description="הטופס בתחתית הדף. כל פנייה ממנו נשלחת עם שם הפרויקט, כך שבלידים וב-CRM רואים מאיזה פרויקט היא הגיעה.">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-primary-dark">
              <input type="checkbox" checked={data.showLeadForm} onChange={(e) => set({ showLeadForm: e.target.checked })} className="h-4 w-4 accent-[#B58238]" />
              להציג טופס פנייה בדף
            </label>
            {data.sold && <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-muted">הפרויקט מסומן ״נמכר״, ולכן במקום הטופס מוצגת הודעה שהוא נמכר, עם קישור לשאר הפרויקטים.</p>}
            {both((l) => (
              <div className="grid gap-3">
                <TextField label={l === 'he' ? 'כותרת מעל הטופס' : 'Heading over the form'} value={data.text[l].leadTitle} jump="leadTitle" onChange={(v) => setText(l, { leadTitle: v })} />
                <TextAreaField label={l === 'he' ? 'טקסט קצר' : 'Short text'} value={data.text[l].leadText} jump="leadText" rows={2} onChange={(v) => setText(l, { leadText: v })} />
              </div>
            ))}
            <p className="text-xs text-neutral-muted">שדות הטופס עצמם (שם, טלפון, שאלות, הסכמה) זהים בכל האתר ונערכים במסך ״צור קשר״.</p>
          </Part>

          <Part id="seo" title="גוגל ושיתוף" description="איך הדף נראה בתוצאות החיפוש. התמונה בשיתוף בוואטסאפ ובפייסבוק היא התמונה הראשית.">
            {both((l) => {
              const title = data.text[l].seoTitle.trim() || (data.text[l].name.trim() ? `${data.text[l].name.trim()} — Wings Real Estate` : '');
              const desc = data.text[l].seoDescription.trim() || data.text[l].tagline.trim();
              return (
                <div className="grid gap-3">
                  <TextField label={l === 'he' ? `כותרת בגוגל (${data.text[l].seoTitle.length}/60)` : `Title in Google (${data.text[l].seoTitle.length}/60)`} value={data.text[l].seoTitle} jump="seoTitle" singleLine onChange={(v) => setText(l, { seoTitle: v })} />
                  <TextAreaField label={l === 'he' ? `תיאור בגוגל (${data.text[l].seoDescription.length}/155)` : `Description in Google (${data.text[l].seoDescription.length}/155)`} value={data.text[l].seoDescription} jump="seoDescription" rows={3} onChange={(v) => setText(l, { seoDescription: v })} />
                  <div className="rounded-xl border border-neutral-200 bg-white p-4 [font-family:Arial,sans-serif]">
                    <div dir="ltr" className="text-end text-xs text-[#4d5156]">wings › projects › {data.slug || '…'}</div>
                    <div className="mt-1 text-lg leading-snug text-[#1a0dab]">{title || (l === 'he' ? 'שם הפרויקט — Wings Real Estate' : 'Project name — Wings Real Estate')}</div>
                    <div className={`mt-1 text-sm leading-relaxed ${desc ? 'text-[#4d5156]' : 'italic text-neutral-400'}`}>
                      {desc || (l === 'he' ? 'בלי תיאור, גוגל יבחר בעצמו טקסט מהדף.' : 'Without a description, Google picks text from the page.')}
                    </div>
                  </div>
                </div>
              );
            })}
          </Part>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-neutral-muted">
            <span>תצוגה מקדימה באתר</span>
            <span className="normal-case tracking-normal">לחיצה על חלק פותחת אותו לעריכה</span>
          </div>
          <div className="overflow-y-auto overflow-x-hidden rounded-2xl border border-neutral-200 shadow-sm lg:max-h-[calc(100vh-6rem)]">
            <ProjectPreview data={data} labels={labels} lead={lead} />
          </div>
        </div>
      </div>

      <SaveBar saving={saving} saved={saved && !dirty} error={error} />
    </form>
  );
}

function sideLabel(side: 'start' | 'end' | 'full' | undefined, locale: ContentLocale) {
  if (!side) return 'ריק: לא יוצג באתר עד שיהיה בו תוכן.';
  if (side === 'full') return 'אין תמונה: הטקסט נפרש לרוחב מלא.';
  // The page's start side is the right in Hebrew and the left in English.
  const right = (side === 'start') === (locale === 'he');
  return right ? 'באתר: התמונה מימין והטקסט משמאל.' : 'באתר: התמונה משמאל והטקסט מימין.';
}

function Part({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section id={`part-${id}`} data-jump-target={id} className="mt-6 scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
      <h2 className="text-lg font-semibold text-primary-dark">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-muted">{description}</p>
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

function Presets({
  label,
  presets,
  locale,
  disabled = false,
  onPick,
}: {
  label: string;
  presets: [string, string][];
  locale: ContentLocale;
  disabled?: boolean;
  onPick: (he: string, en: string) => void;
}) {
  if (!presets.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-xs text-neutral-muted">{label}</span>
      {presets.map(([he, en]) => (
        <button
          key={he}
          type="button"
          disabled={disabled}
          onClick={() => onPick(he, en)}
          className="rounded-full border border-dashed border-neutral-300 px-3 py-1 text-neutral-muted hover:border-accent hover:text-primary-dark disabled:opacity-40"
        >
          {locale === 'he' ? he : en}
        </button>
      ))}
    </div>
  );
}

function Switch({
  checked,
  onChange,
  on,
  off,
  tone,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  on: string;
  off: string;
  tone: 'green' | 'gold';
  disabled?: boolean;
}) {
  const active = tone === 'green' ? 'border-green-600/30 bg-green-50 text-green-800' : 'border-accent/40 bg-accent/10 text-accent-dark';
  const track = tone === 'green' ? 'bg-green-600' : 'bg-accent';
  return (
    <label className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium ${checked ? active : 'border-neutral-200 text-neutral-muted'} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden className={`relative h-5 w-9 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${checked ? track : 'bg-neutral-200'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'start-[18px]' : 'start-0.5'}`} />
      </span>
      {checked ? on : off}
    </label>
  );
}

/** A patch for one language's half of a row: { he: … } or { en: … }. */
function inLocale<T>(l: ContentLocale, value: T): { he: T } | { en: T } {
  return l === 'he' ? { he: value } : { en: value };
}
