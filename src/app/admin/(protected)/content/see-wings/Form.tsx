'use client';

import Link from 'next/link';
import { LocaleTabs } from '@/components/admin/LocaleTabs';
import { TextField, TextAreaField } from '@/components/admin/fields';
import { VideoUploadField } from '@/components/admin/VideoUploadField';
import { RepeatableList } from '@/components/admin/RepeatableList';
import { SectionLayout } from '@/components/admin/SectionLayout';
import { SaveBar } from '@/components/admin/SaveBar';
import { useSectionForm } from '@/components/admin/useSectionForm';
import { saveSeeWingsText, saveSeeWingsMedia, type SeeWingsText } from './actions';
import { SeeWingsPreview } from './Preview';
import type { ContentLocale, SeeWingsMediaSection } from '@/lib/content/schema';

type SectionText = SeeWingsText['sections'][number];
type Cue = SeeWingsText['cues'][number];

type SceneRow = {
  id: string;
  he: Omit<SectionText, 'id' | 'tags'>;
  en: Omit<SectionText, 'id' | 'tags'>;
  tagsHe: string;
  tagsEn: string;
  still: string;
  clip: string;
};
type CueRow = { he: Cue; en: Cue };

type Data = {
  cta: Record<ContentLocale, { ctaPrimary: string; ctaSecondary: string }>;
  scenes: SceneRow[];
  /** Cues after the first — the first cue is Hero's eyebrow/headline and isn't editable here. */
  cues: CueRow[];
  connectors: (string | null)[];
};

const BLANK_SCENE_TEXT: Omit<SectionText, 'id' | 'tags'> = { label: '', eyebrow: '', title: '', body: '' };
const BLANK_CUE: Cue = { eyebrow: '', title: '', body: '', extra: [] };
const BLANK_CUE_FIELD = { label: '', value: '' };

function ReadOnlyMediaPreview({ still, clip }: { still: string; clip: string }) {
  return (
    <div>
      <span className="block text-sm font-medium text-primary-dark">תמונת רקע וסרטון טיסה</span>
      <div className="mt-2 flex items-center gap-4">
        {still ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={still} alt="" className="h-20 w-20 shrink-0 rounded-lg border border-neutral-200 object-cover" />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-200 text-center text-xs text-neutral-muted">
            אין תמונה
          </div>
        )}
        {clip ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video src={clip} muted className="h-20 w-32 shrink-0 rounded-lg border border-neutral-200 object-cover" />
        ) : (
          <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-lg border border-dashed border-neutral-200 text-center text-xs text-neutral-muted">
            אין סרטון
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-neutral-muted">קבועים בקוד — לא ניתנים לעריכה מכאן.</p>
    </div>
  );
}

function splitTags(value: string): string[] {
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function toSceneRows(he: SectionText[], en: SectionText[], media: SeeWingsMediaSection[]): SceneRow[] {
  const length = Math.max(he.length, en.length, media.length);
  return Array.from({ length }, (_, i) => {
    const heS = he[i];
    const enS = en[i];
    const m = media[i];
    return {
      id: heS?.id || enS?.id || m?.id || `scene-${i + 1}`,
      he: heS ? { label: heS.label, eyebrow: heS.eyebrow, title: heS.title, body: heS.body } : { ...BLANK_SCENE_TEXT },
      en: enS ? { label: enS.label, eyebrow: enS.eyebrow, title: enS.title, body: enS.body } : { ...BLANK_SCENE_TEXT },
      tagsHe: (heS?.tags ?? []).join(', '),
      tagsEn: (enS?.tags ?? []).join(', '),
      still: m?.still ?? '',
      clip: m?.clip ?? '',
    };
  });
}

function toCueRows(he: Cue[], en: Cue[]): CueRow[] {
  // Index 0 is Hero-derived and excluded — see saveSeeWingsText call below.
  const heRest = he.slice(1);
  const enRest = en.slice(1);
  const length = Math.max(heRest.length, enRest.length);
  return Array.from({ length }, (_, i) => ({
    he: { ...BLANK_CUE, ...heRest[i] },
    en: { ...BLANK_CUE, ...enRest[i] },
  }));
}

export function SeeWingsForm({
  initial,
}: {
  initial: {
    he: SeeWingsText;
    en: SeeWingsText;
    hero: Record<ContentLocale, { eyebrow: string; headline: string }>;
    media: { sections: SeeWingsMediaSection[]; connectors: (string | null)[] };
  };
}) {
  async function save(data: Data) {
    const heSections: SectionText[] = data.scenes.map((s) => ({
      id: s.id,
      label: s.he.label,
      eyebrow: s.he.eyebrow,
      title: s.he.title,
      body: s.he.body,
      tags: splitTags(s.tagsHe),
    }));
    const enSections: SectionText[] = data.scenes.map((s) => ({
      id: s.id,
      label: s.en.label,
      eyebrow: s.en.eyebrow,
      title: s.en.title,
      body: s.en.body,
      tags: splitTags(s.tagsEn),
    }));

    await saveSeeWingsText('he', {
      sections: heSections,
      cues: [{ eyebrow: initial.hero.he.eyebrow, title: initial.hero.he.headline, body: '', extra: [] }, ...data.cues.map((c) => c.he)],
      ctaPrimary: data.cta.he.ctaPrimary,
      ctaSecondary: data.cta.he.ctaSecondary,
    });
    await saveSeeWingsText('en', {
      sections: enSections,
      cues: [{ eyebrow: initial.hero.en.eyebrow, title: initial.hero.en.headline, body: '', extra: [] }, ...data.cues.map((c) => c.en)],
      ctaPrimary: data.cta.en.ctaPrimary,
      ctaSecondary: data.cta.en.ctaSecondary,
    });
    await saveSeeWingsMedia(
      data.scenes.map((s) => ({ id: s.id, still: s.still, clip: s.clip })),
      data.connectors.slice(0, Math.max(0, data.scenes.length - 1)),
    );
  }

  const { data, setData, saving, saved, error, handleSubmit } = useSectionForm<Data>(
    {
      cta: {
        he: { ctaPrimary: initial.he.ctaPrimary, ctaSecondary: initial.he.ctaSecondary },
        en: { ctaPrimary: initial.en.ctaPrimary, ctaSecondary: initial.en.ctaSecondary },
      },
      scenes: toSceneRows(initial.he.sections, initial.en.sections, initial.media.sections),
      cues: toCueRows(initial.he.cues, initial.en.cues),
      connectors: initial.media.connectors,
    },
    save,
  );

  function ctaFields(locale: ContentLocale) {
    const value = data.cta[locale];
    const update = (patch: Partial<typeof value>) =>
      setData((prev) => ({ ...prev, cta: { ...prev.cta, [locale]: { ...prev.cta[locale], ...patch } } }));
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="כפתור ראשי" value={value.ctaPrimary} onChange={(v) => update({ ctaPrimary: v })} />
        <TextField label="כפתור משני" value={value.ctaSecondary} onChange={(v) => update({ ctaSecondary: v })} />
      </div>
    );
  }

  const fields = (
    <div>
      <section>
        <h2 className="text-lg font-semibold text-primary-dark">כפתורים</h2>
        <div className="mt-3">
          <LocaleTabs he={ctaFields('he')} en={ctaFields('en')} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-primary-dark">סצנות הטיסה</h2>
        <p className="mt-1 text-sm text-neutral-muted">
          הטקסט של כל סצנה ניתן לעריכה כאן. תמונת הרקע והסרטון עצמם מנוהלים ישירות בקוד ולא ניתנים
          להחלפה מכאן — לעדכון הסרטון פנה/י למפתח.
        </p>
        <div className="mt-4">
          <RepeatableList<SceneRow>
            items={data.scenes}
            onChange={(scenes) => setData((prev) => ({ ...prev, scenes }))}
            newItem={() => ({
              id: `scene-${data.scenes.length + 1}`,
              he: { ...BLANK_SCENE_TEXT },
              en: { ...BLANK_SCENE_TEXT },
              tagsHe: '',
              tagsEn: '',
              still: '',
              clip: '',
            })}
            addLabel="הוספת סצנה"
            locked
            renderItem={(scene, updateScene) => (
              <div className="grid gap-4">
                <p className="text-xs text-neutral-muted">מזהה סצנה: {scene.id}</p>
                <LocaleTabs
                  he={
                    <div className="grid gap-3">
                      <TextField label="תווית ניווט" value={scene.he.label} onChange={(v) => updateScene({ he: { ...scene.he, label: v } })} />
                      <TextField label="תגית עליונה" value={scene.he.eyebrow} onChange={(v) => updateScene({ he: { ...scene.he, eyebrow: v } })} />
                      <TextField label="כותרת" value={scene.he.title} onChange={(v) => updateScene({ he: { ...scene.he, title: v } })} />
                      <TextAreaField label="טקסט" value={scene.he.body} onChange={(v) => updateScene({ he: { ...scene.he, body: v } })} />
                      <TextField label="תגיות (מופרדות בפסיק)" value={scene.tagsHe} onChange={(v) => updateScene({ tagsHe: v })} />
                    </div>
                  }
                  en={
                    <div className="grid gap-3">
                      <TextField label="Nav label" value={scene.en.label} onChange={(v) => updateScene({ en: { ...scene.en, label: v } })} />
                      <TextField label="Eyebrow" value={scene.en.eyebrow} onChange={(v) => updateScene({ en: { ...scene.en, eyebrow: v } })} />
                      <TextField label="Title" value={scene.en.title} onChange={(v) => updateScene({ en: { ...scene.en, title: v } })} />
                      <TextAreaField label="Body" value={scene.en.body} onChange={(v) => updateScene({ en: { ...scene.en, body: v } })} />
                      <TextField label="Tags (comma-separated)" value={scene.tagsEn} onChange={(v) => updateScene({ tagsEn: v })} />
                    </div>
                  }
                />
                <ReadOnlyMediaPreview still={scene.still} clip={scene.clip} />
              </div>
            )}
          />
        </div>
      </section>

      {data.scenes.length > 1 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-primary-dark">מעברים בין סצנות</h2>
          <p className="mt-1 text-sm text-neutral-muted">סרטון קצר שמחבר בין סוף סצנה אחת לתחילת הבאה (אופציונלי).</p>
          <div className="mt-4 grid gap-4">
            {data.scenes.slice(0, -1).map((scene, index) => (
              <VideoUploadField
                key={scene.id}
                label={`מעבר: ${scene.he.label || scene.id} → ${data.scenes[index + 1].he.label || data.scenes[index + 1].id}`}
                folder="see-wings-connectors"
                value={data.connectors[index] ?? ''}
                onChange={(url) =>
                  setData((prev) => {
                    const next = [...prev.connectors];
                    while (next.length <= index) next.push(null);
                    next[index] = url || null;
                    return { ...prev, connectors: next };
                  })
                }
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-primary-dark">כותרות מתחלפות (Cues)</h2>
        <p className="mt-1 text-sm text-neutral-muted">הטקסטים שמתחלפים בתחתית המסך תוך כדי גלילה.</p>

        <div className="mt-4 rounded-xl border border-dashed border-neutral-200 bg-neutral-100 p-4">
          <p className="text-xs text-neutral-muted">
            הכותרת הראשונה מגיעה אוטומטית מעמוד{' '}
            <Link href="/admin/content/hero" className="font-medium text-accent-dark underline">
              ראשי (Hero)
            </Link>{' '}
            — תגית: <span className="font-medium text-primary-dark">{initial.hero.he.eyebrow || '—'}</span>, כותרת:{' '}
            <span className="font-medium text-primary-dark">{initial.hero.he.headline || '—'}</span>
          </p>
        </div>

        <div className="mt-4">
          <RepeatableList<CueRow>
            items={data.cues}
            onChange={(cues) => setData((prev) => ({ ...prev, cues }))}
            newItem={() => ({ he: { ...BLANK_CUE }, en: { ...BLANK_CUE } })}
            addLabel="הוספת כותרת"
            renderItem={(cue, updateCue) => (
              <LocaleTabs
                he={
                  <div className="grid gap-3">
                    <TextField label="תגית עליונה" value={cue.he.eyebrow} onChange={(v) => updateCue({ he: { ...cue.he, eyebrow: v } })} />
                    <TextField label="כותרת" value={cue.he.title} onChange={(v) => updateCue({ he: { ...cue.he, title: v } })} />
                    <TextAreaField label="טקסט" value={cue.he.body} onChange={(v) => updateCue({ he: { ...cue.he, body: v } })} />
                    <div>
                      <span className="text-sm font-medium text-primary-dark">שדות נוספים</span>
                      <div className="mt-1.5">
                        <RepeatableList<{ label: string; value: string }>
                          items={cue.he.extra}
                          onChange={(extra) => updateCue({ he: { ...cue.he, extra } })}
                          newItem={() => ({ ...BLANK_CUE_FIELD })}
                          addLabel="הוספת שדה"
                          renderItem={(field, updateField) => (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <TextField label="שם השדה" value={field.label} onChange={(v) => updateField({ label: v })} />
                              <TextField label="ערך" value={field.value} onChange={(v) => updateField({ value: v })} />
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                }
                en={
                  <div className="grid gap-3">
                    <TextField label="Eyebrow" value={cue.en.eyebrow} onChange={(v) => updateCue({ en: { ...cue.en, eyebrow: v } })} />
                    <TextField label="Title" value={cue.en.title} onChange={(v) => updateCue({ en: { ...cue.en, title: v } })} />
                    <TextAreaField label="Body" value={cue.en.body} onChange={(v) => updateCue({ en: { ...cue.en, body: v } })} />
                    <div>
                      <span className="text-sm font-medium text-primary-dark">Extra fields</span>
                      <div className="mt-1.5">
                        <RepeatableList<{ label: string; value: string }>
                          items={cue.en.extra}
                          onChange={(extra) => updateCue({ en: { ...cue.en, extra } })}
                          newItem={() => ({ ...BLANK_CUE_FIELD })}
                          addLabel="Add field"
                          renderItem={(field, updateField) => (
                            <div className="grid gap-3 sm:grid-cols-2">
                              <TextField label="Field name" value={field.label} onChange={(v) => updateField({ label: v })} />
                              <TextField label="Value" value={field.value} onChange={(v) => updateField({ value: v })} />
                            </div>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                }
              />
            )}
          />
        </div>
      </section>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="mt-8">
      <SectionLayout
        fields={fields}
        preview={
          <SeeWingsPreview
            heroCue={{
              he: { eyebrow: initial.hero.he.eyebrow, title: initial.hero.he.headline },
              en: { eyebrow: initial.hero.en.eyebrow, title: initial.hero.en.headline },
            }}
            scenes={data.scenes}
            cues={data.cues}
            cta={data.cta}
          />
        }
      />
      <SaveBar saving={saving} saved={saved} error={error} />
    </form>
  );
}
