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

  // The flight experience's first caption (cues[0]) echoes Hero's eyebrow and
  // headline, and is the only place Hero's subheadline renders: the opening
  // screen shows just the logo, eyebrow and headline, and the line under them
  // waits for the flight's first stop. Enforced here so every reader (site +
  // admin previews) sees one truth.
  const [firstCue, ...restCues] = text.seeWings.cues;
  if (!firstCue) return text;

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

/**
 * Whether the admin has published any opportunities. A row with no title is
 * a blank one left in the list, not a project. With none, every nav link to
 * the Opportunities page disappears and the page itself shows a short notice.
 */
export async function hasProjects(locale: ContentLocale) {
  const text = await getLocaleText(locale);
  return text.projects.items.some((item) => item.title.trim());
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
