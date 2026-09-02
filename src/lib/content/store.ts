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
  return deepMerge(defaultContent, stored);
});

export async function getLocaleText(locale: ContentLocale): Promise<LocaleText> {
  const content = await getContent();
  const text = content.text[locale];

  // The flight experience's first on-screen caption (cues[0]) is the only place
  // Hero's eyebrow/headline actually render on the live site — see admin's Hero
  // page. Enforced here so every reader (site + admin previews) sees one truth.
  const [firstCue, ...restCues] = text.seeWings.cues;
  if (!firstCue) return text;

  return {
    ...text,
    seeWings: {
      ...text.seeWings,
      cues: [{ ...firstCue, eyebrow: text.hero.eyebrow, title: text.hero.headline }, ...restCues],
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

/** Text (both locales) + images written in one Firestore call so a mid-save failure can never leave them out of sync. */
export async function updateProjectsSection(he: unknown, en: unknown, images: (string | null)[]) {
  await requireAdmin();
  const schema = TEXT_SECTION_SCHEMAS.projects;
  const parsedHe = schema.parse(he);
  const parsedEn = schema.parse(en);
  await contentDoc().set(
    { text: { he: { projects: parsedHe }, en: { projects: parsedEn } }, media: { projects: { items: images } } },
    { merge: true },
  );
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
