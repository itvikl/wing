import 'server-only';
import { cache } from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth/session';
import { defaultContent } from './defaults';
import {
  TEXT_SECTION_SCHEMAS,
  type ContentLocale,
  type LocaleText,
  type SeeWingsMediaSection,
  type SiteContent,
  type TextSectionKey,
} from './schema';

const contentDoc = () => adminDb.collection('content').doc('site');

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;
  if (Array.isArray(base)) return (Array.isArray(override) ? override : base) as T;
  if (isPlainObject(base) && isPlainObject(override)) {
    const result: Record<string, unknown> = { ...base };
    for (const key of Object.keys(override)) {
      result[key] = deepMerge((base as Record<string, unknown>)[key], override[key]);
    }
    return result as T;
  }
  return (override as T) ?? base;
}

/** Per-request-deduped read of the site content doc, merged over the static-JSON fallback. */
export const getContent = cache(async (): Promise<SiteContent> => {
  const snap = await contentDoc().get();
  const stored = snap.exists ? snap.data() : null;
  const content = deepMerge(defaultContent, stored);
  // deepMerge swaps arrays wholesale, so a stored sections array (saved before
  // the admin form carried the phone encodes through) hid the default
  // clipMobile and phones fell back to the 21MB desktop clip. Fill each
  // stored scene's missing phone fields from the default scene with its id.
  const defaultSections = defaultContent.media.seeWings.sections;
  content.media.seeWings.sections = content.media.seeWings.sections.map((section) => {
    const fallback = defaultSections.find((d) => d.id === section.id);
    if (!fallback) return section;
    return {
      ...section,
      stillMobile: section.stillMobile || fallback.stillMobile,
      clipMobile: section.clipMobile || fallback.clipMobile,
    };
  });
  return content;
});

export async function getLocaleText(locale: ContentLocale): Promise<LocaleText> {
  const content = await getContent();
  const text = content.text[locale];

  // Hero is the opening screen (logo, eyebrow, headline). The flight's first
  // caption (cues[0]) used to be bound to it: Hero's eyebrow and headline
  // again, with Hero's subheadline as its body. It's edited as a caption of
  // its own now, but content saved before that still has a placeholder there,
  // so until the See Wings page has saved it once (firstCueOwn) it keeps
  // echoing Hero. Enforced here so every reader (site + admin) sees one truth.
  const [firstCue, ...restCues] = text.seeWings.cues;
  if (!firstCue || text.seeWings.firstCueOwn) return text;

  return {
    ...text,
    seeWings: {
      ...text.seeWings,
      cues: [
        {
          ...firstCue,
          eyebrow: text.hero.eyebrow,
          title: text.hero.headline,
          body: text.hero.subheadline.join(' ').trim(),
        },
        ...restCues,
      ],
    },
  };
}

export async function getSiteMedia() {
  const content = await getContent();
  return content.media;
}

export async function updateTextSection<K extends TextSectionKey>(locale: ContentLocale, section: K, data: unknown) {
  await requireAdmin();
  const schema = TEXT_SECTION_SCHEMAS[section];
  const parsed = schema.parse(data);
  await contentDoc().set({ text: { [locale]: { [section]: parsed } } }, { merge: true });
}

export async function updateLogo(url: string) {
  await requireAdmin();
  await contentDoc().set({ media: { logo: url } }, { merge: true });
}

export async function updateVideoPoster(url: string) {
  await requireAdmin();
  await contentDoc().set({ media: { video: { poster: url } } }, { merge: true });
}

/**
 * The projects section's own words (the gallery's heading, the project page
 * template's fixed labels), both languages in one write. The old cards
 * (`items`) are left as they are: merge keeps any field not written.
 */
export async function updateProjectsLabels(he: unknown, en: unknown) {
  await requireAdmin();
  const schema = TEXT_SECTION_SCHEMAS.projects.omit({ items: true });
  const parsedHe = schema.parse(he);
  const parsedEn = schema.parse(en);
  await contentDoc().set({ text: { he: { projects: parsedHe }, en: { projects: parsedEn } } }, { merge: true });
}

/** Text (both locales) + images written in one Firestore call so a mid-save failure can never leave them out of sync. */
export async function updateTeamSection(he: unknown, en: unknown, images: (string | null)[]) {
  await requireAdmin();
  const schema = TEXT_SECTION_SCHEMAS.team;
  const parsedHe = schema.parse(he);
  const parsedEn = schema.parse(en);
  await contentDoc().set(
    { text: { he: { team: parsedHe }, en: { team: parsedEn } }, media: { team: { members: images } } },
    { merge: true },
  );
}

export async function updateSeeWingsMedia(sections: SeeWingsMediaSection[], connectors: (string | null)[]) {
  await requireAdmin();
  await contentDoc().set({ media: { seeWings: { sections, connectors } } }, { merge: true });
}
