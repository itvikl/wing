import { z } from 'zod';
import type { ContentLocale } from '@/lib/content/schema';

/**
 * A project page. Every project fills the same fixed template (see
 * components/project/ProjectPage): the admin writes the content and never
 * picks a layout, so every page on the site reads alike. Each one is its own
 * Firestore doc in `projects`; text sits per language beside anything both
 * languages share (images, minutes, features), the way the admin edits it.
 */

export const FEATURE_IDS = [
  'parking',
  'storage',
  'elevator',
  'sukkahBalcony',
  'garden',
  'safeRoom',
  'shabbatElevator',
  'accessible',
  'centralAc',
  'openView',
] as const;
export type FeatureId = (typeof FEATURE_IDS)[number];

/** A fixed list, so every icon has a name in both languages and none can be mistyped. */
export const FEATURE_LABELS: Record<FeatureId, Record<ContentLocale, string>> = {
  parking: { he: 'חניה', en: 'Parking' },
  storage: { he: 'מחסן', en: 'Storage room' },
  elevator: { he: 'מעלית', en: 'Elevator' },
  sukkahBalcony: { he: 'מרפסת סוכה', en: 'Sukkah balcony' },
  garden: { he: 'גינה פרטית', en: 'Private garden' },
  safeRoom: { he: 'ממ״ד', en: 'Safe room' },
  shabbatElevator: { he: 'מעלית שבת', en: 'Shabbat elevator' },
  accessible: { he: 'נגישות מלאה', en: 'Fully accessible' },
  centralAc: { he: 'מיזוג מרכזי', en: 'Central A/C' },
  openView: { he: 'נוף פתוח', en: 'Open view' },
};

const text = (max: number) => z.string().max(max).default('');
const image = z.string().max(1000).default('');

export const projectTextSchema = z.object({
  name: text(120),
  area: text(120),
  tagline: text(300),
  cta: text(60),
  leadTitle: text(160),
  leadText: text(400),
  seoTitle: text(120),
  seoDescription: text(300),
});
export type ProjectText = z.infer<typeof projectTextSchema>;

const factText = z.object({ label: text(60), value: text(80) });
const blockText = z.object({ title: text(160), body: text(3000) });
const placeText = z.object({ place: text(120) });

export const projectFactSchema = z.object({ he: factText, en: factText });
export const projectBlockSchema = z.object({ image, he: blockText, en: blockText });
export const projectPlaceSchema = z.object({
  minutes: z.number().int().min(1).max(120),
  mode: z.enum(['walk', 'drive']),
  he: placeText,
  en: placeText,
});

export const MAX_FACTS = 6;

export const projectSchema = z.object({
  /** The page's address: /projects/<slug>. */
  slug: z.string().max(80).default(''),
  /** Off: the project is nowhere on the site, and its address is a 404. */
  published: z.boolean().default(false),
  /** Stays on the site with a "sold" tag; the lead form gives way to a closing note. */
  sold: z.boolean().default(false),
  heroImage: image,
  text: z.object({ he: projectTextSchema, en: projectTextSchema }),
  facts: z.array(projectFactSchema).max(MAX_FACTS).default([]),
  blocks: z.array(projectBlockSchema).max(12).default([]),
  features: z.array(z.enum(FEATURE_IDS)).default([]),
  nearby: z.array(projectPlaceSchema).max(16).default([]),
  gallery: z.array(z.string().max(1000)).max(40).default([]),
  showLeadForm: z.boolean().default(true),
});
export type ProjectData = z.infer<typeof projectSchema>;
export type ProjectFact = ProjectData['facts'][number];
export type ProjectBlock = ProjectData['blocks'][number];
export type ProjectPlace = ProjectData['nearby'][number];

/** A stored project: its data plus where it sits in the list. */
export type ProjectRecord = ProjectData & { id: string; order: number; updatedAt: string };

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "Narcissus House, Rehavia" → "narcissus-house-rehavia". Non-Latin letters drop out. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const filled = (value: string) => value.trim().length > 0;

export function fullBlockCount(project: ProjectData): number {
  return project.blocks.filter((b) => filled(b.he.title) && filled(b.he.body) && filled(b.image)).length;
}

/** What still blocks publishing, worded for the admin. Empty means it can go live. */
export function publishProblems(project: ProjectData): string[] {
  const problems: string[] = [];
  const he = project.text.he;
  if (!filled(he.name)) problems.push('שם הפרויקט');
  if (!filled(he.area)) problems.push('שכונה');
  if (!filled(project.heroImage)) problems.push('תמונה ראשית');
  if (!SLUG_RE.test(project.slug)) problems.push('כתובת לדף');
  const blocks = fullBlockCount(project);
  if (blocks < 2) problems.push(`שני בלוקים מלאים: כותרת, טקסט ותמונה (יש ${blocks})`);
  return problems;
}

/**
 * Every English field that is still empty while its Hebrew one is filled,
 * by the part of the page it belongs to. Until it's filled, the English page
 * shows the Hebrew text in its place.
 */
export function missingEnglish(project: ProjectData): string[] {
  const parts = new Set<string>();
  const check = (part: string, he: Record<string, string>, en: Record<string, string>) => {
    for (const key of Object.keys(he)) if (filled(he[key]) && !filled(en[key] ?? '')) parts.add(part);
  };
  const { he, en } = project.text;
  check('פתיח', { name: he.name, area: he.area, tagline: he.tagline, cta: he.cta }, { name: en.name, area: en.area, tagline: en.tagline, cta: en.cta });
  project.facts.forEach((f) => check('נתונים', f.he, f.en));
  project.blocks.forEach((b) => check('תמונה לצד טקסט', b.he, b.en));
  project.nearby.forEach((n) => check('בסביבה', n.he, n.en));
  check('טופס פנייה', { a: he.leadTitle, b: he.leadText }, { a: en.leadTitle, b: en.leadText });
  check('גוגל ושיתוף', { a: he.seoTitle, b: he.seoDescription }, { a: en.seoTitle, b: en.seoDescription });
  return [...parts];
}

export type Readiness = { label: string; ok: boolean; required: boolean; jump: string };

/** The admin's checklist: what publishing needs, then what makes the page better. */
export function readiness(project: ProjectData): Readiness[] {
  const he = project.text.he;
  const blocks = fullBlockCount(project);
  const facts = project.facts.filter((f) => filled(f.he.label) && filled(f.he.value)).length;
  const english = missingEnglish(project);
  return [
    { label: 'שם הפרויקט', ok: filled(he.name), required: true, jump: 'name' },
    { label: 'שכונה', ok: filled(he.area), required: true, jump: 'area' },
    { label: 'תמונה ראשית', ok: filled(project.heroImage), required: true, jump: 'heroImage' },
    { label: 'כתובת לדף', ok: SLUG_RE.test(project.slug), required: true, jump: 'slug' },
    { label: `שני בלוקים מלאים (יש ${blocks})`, ok: blocks >= 2, required: true, jump: 'blocks' },
    { label: '3 נתונים מהירים לפחות', ok: facts >= 3, required: false, jump: 'facts' },
    { label: `6 תמונות בגלריה (יש ${project.gallery.length})`, ok: project.gallery.length >= 6, required: false, jump: 'gallery' },
    { label: 'תיאור לגוגל', ok: filled(he.seoDescription), required: false, jump: 'seoDescription' },
    { label: english.length ? `תרגום לאנגלית: ${english.join(', ')}` : 'תרגום לאנגלית', ok: !english.length, required: false, jump: 'name' },
  ];
}

const fact = (he: string, en: string): ProjectFact => ({ he: { label: he, value: '' }, en: { label: en, value: '' } });
const block = (he: string, en: string): ProjectBlock => ({ image: '', he: { title: he, body: '' }, en: { title: en, body: '' } });

export const FACT_PRESETS: [he: string, en: string][] = [
  ['סטטוס בנייה', 'Status'],
  ['חדרים', 'Rooms'],
  ['שטח', 'Size'],
  ['מסירה', 'Handover'],
  ['מחיר החל מ־', 'Starting from'],
  ['קומות', 'Floors'],
  ['יחידות דיור', 'Units'],
];
export const BLOCK_PRESETS: [he: string, en: string][] = [
  ['מיקום', 'Location'],
  ['הדירות', 'The apartments'],
  ['אדריכלות', 'Architecture'],
  ['חוויית מגורים', 'Living here'],
  ['מפרט טכני', 'Specifications'],
  ['על היזם', 'The developer'],
];
export const newFact = (he = '', en = '') => fact(he, en);
export const newBlock = (he = '', en = '') => block(he, en);
export const newPlace = (): ProjectPlace => ({ minutes: 5, mode: 'walk', he: { place: '' }, en: { place: '' } });

/** A new project starts from the template: the usual facts and blocks, waiting to be filled. */
export function blankProject(): ProjectData {
  const emptyText = projectTextSchema.parse({});
  return {
    slug: '',
    published: false,
    sold: false,
    heroImage: '',
    text: {
      he: { ...emptyText, cta: 'אני רוצה לשמוע פרטים', leadTitle: 'רוצים לשמוע עוד?', leadText: 'השאירו פרטים ונחזור אליכם עם תוכניות ומחירון.' },
      en: { ...emptyText, cta: 'I’d like to hear more', leadTitle: 'Want to hear more?', leadText: 'Leave your details and we’ll get back to you with plans and prices.' },
    },
    facts: [fact('סטטוס בנייה', 'Status'), fact('חדרים', 'Rooms'), fact('שטח', 'Size'), fact('מסירה', 'Handover')],
    blocks: [block('מיקום', 'Location'), block('הדירות', 'The apartments'), block('חוויית מגורים', 'Living here')],
    features: [],
    nearby: [],
    gallery: [],
    showLeadForm: true,
  };
}

/* ------------------------------------------------------------------ */
/* One language's view of a project, as the page shows it.            */
/* ------------------------------------------------------------------ */

export type BlockSide = 'start' | 'end' | 'full';

export type ProjectView = {
  slug: string;
  sold: boolean;
  heroImage: string;
  showLeadForm: boolean;
  name: string;
  area: string;
  tagline: string;
  cta: string;
  leadTitle: string;
  leadText: string;
  seoTitle: string;
  seoDescription: string;
  facts: { label: string; value: string; index: number }[];
  /** Image blocks alternate sides on their own; a block with no image runs full width. */
  blocks: { title: string; body: string; image: string; side: BlockSide; index: number }[];
  features: { id: FeatureId; label: string }[];
  nearby: { place: string; minutes: number; mode: 'walk' | 'drive'; index: number }[];
  gallery: string[];
};

/** English falls back to the Hebrew field until it's translated, so no part of the page goes blank. */
export function projectView(project: ProjectData, locale: ContentLocale): ProjectView {
  const pick = (he: string, en: string) => (locale === 'en' && filled(en) ? en : he).trim();
  const t = (key: keyof ProjectText) => pick(project.text.he[key], project.text.en[key]);

  let imageCount = 0;
  const blocks = project.blocks
    .map((b, index) => ({ title: pick(b.he.title, b.en.title), body: pick(b.he.body, b.en.body), image: b.image.trim(), index }))
    .filter((b) => b.title || b.body || b.image)
    .map((b) => ({ ...b, side: (b.image ? (imageCount++ % 2 === 0 ? 'start' : 'end') : 'full') as BlockSide }));

  return {
    slug: project.slug,
    sold: project.sold,
    heroImage: project.heroImage.trim(),
    showLeadForm: project.showLeadForm,
    name: t('name'),
    area: t('area'),
    tagline: t('tagline'),
    cta: t('cta'),
    leadTitle: t('leadTitle'),
    leadText: t('leadText'),
    seoTitle: t('seoTitle'),
    seoDescription: t('seoDescription'),
    facts: project.facts
      .map((f, index) => ({ label: pick(f.he.label, f.en.label), value: pick(f.he.value, f.en.value), index }))
      .filter((f) => f.label && f.value),
    blocks,
    features: FEATURE_IDS.filter((id) => project.features.includes(id)).map((id) => ({ id, label: FEATURE_LABELS[id][locale] })),
    nearby: project.nearby
      .map((n, index) => ({ place: pick(n.he.place, n.en.place), minutes: n.minutes, mode: n.mode, index }))
      .filter((n) => n.place),
    gallery: project.gallery.filter(filled),
  };
}
