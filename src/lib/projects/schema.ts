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
const count = z.number().int().min(0).max(999).nullable().default(null);

export const projectTextSchema = z.object({
  name: text(120),
  area: text(120),
  tagline: text(300),
  cta: text(60),
  leadTitle: text(160),
  leadText: text(400),
  seoTitle: text(120),
  seoDescription: text(300),
  /** A paragraph about the neighbourhood, beside the map. */
  areaText: text(1200),
});
export type ProjectText = z.infer<typeof projectTextSchema>;

const factText = z.object({ label: text(60), value: text(80) });
const blockText = z.object({ title: text(160), body: text(3000) });
const placeText = z.object({ place: text(120) });
const badgeText = z.object({ text: text(60) });
const statusText = z.object({ label: text(60), value: text(40), note: text(120) });
const unitText = z.object({ title: text(60), outdoor: text(80) });

export const projectFactSchema = z.object({ he: factText, en: factText });
export const projectBlockSchema = z.object({ image, he: blockText, en: blockText });
export const projectPlaceSchema = z.object({
  minutes: z.number().int().min(1).max(120),
  mode: z.enum(['walk', 'drive']),
  he: placeText,
  en: placeText,
});
/** A short tag on the opening photo ("Exclusively marketed by Wings"). */
export const projectBadgeSchema = z.object({ he: badgeText, en: badgeText });
/** One figure of where sales stand ("67%", "Summer 2028"); `bar` (0–100) draws a progress line. */
export const projectStatusSchema = z.object({
  bar: z.number().int().min(0).max(100).nullable().default(null),
  he: statusText,
  en: statusText,
});
/** One apartment type: a row of "Apartment types", with its typical plan. */
export const projectUnitSchema = z.object({
  /** The big mark at the row's start: "3", "4", "PH". */
  code: text(6),
  /** m², the same in both languages: "85–92". */
  size: text(30),
  /** "1–4", or one floor. */
  floors: text(30),
  /** How many of this type the building has, and how many are still for sale. */
  total: count,
  left: count,
  plan: image,
  he: unitText,
  en: unitText,
});
/** Where the building is: the neighbourhood map centres on it. */
export const projectLocationSchema = z.object({
  lat: z.number().min(-90).max(90).nullable().default(null),
  lng: z.number().min(-180).max(180).nullable().default(null),
  zoom: z.number().int().min(13).max(18).default(16),
  /** What the admin searched for, kept so it can be searched again. */
  address: text(200),
  /** The streets and parks around it as SVG paths (see projects/streetMap), drawn once when it's placed. */
  streets: z
    .object({ major: text(400_000), minor: text(400_000), parks: text(200_000) })
    .default({}),
});

export const MAX_FACTS = 6;
export const MAX_BADGES = 3;
export const MAX_STATUS = 3;
export const MAX_UNITS = 10;

export const projectSchema = z.object({
  /** The page's address: /projects/<slug>. */
  slug: z.string().max(80).default(''),
  /** Off: the project is nowhere on the site, and its address is a 404. */
  published: z.boolean().default(false),
  /** Stays on the site with a "sold" tag; the lead form gives way to a closing note. */
  sold: z.boolean().default(false),
  heroImage: image,
  /** Behind the whole page, blurred and dimmed. Empty: the hero image is used. */
  backdropImage: image,
  text: z.object({ he: projectTextSchema, en: projectTextSchema }),
  badges: z.array(projectBadgeSchema).max(MAX_BADGES).default([]),
  /** The spec line on the opening photo: value over label, "30 / Apartments". */
  facts: z.array(projectFactSchema).max(MAX_FACTS).default([]),
  status: z.array(projectStatusSchema).max(MAX_STATUS).default([]),
  /** The month the sales figures are true for, "2026-11"; shown as "last updated". */
  statusDate: z.string().regex(/^(\d{4}-\d{2})?$/).default(''),
  blocks: z.array(projectBlockSchema).max(12).default([]),
  units: z.array(projectUnitSchema).max(MAX_UNITS).default([]),
  features: z.array(z.enum(FEATURE_IDS)).default([]),
  location: projectLocationSchema.default({}),
  nearby: z.array(projectPlaceSchema).max(16).default([]),
  gallery: z.array(z.string().max(1000)).max(40).default([]),
  showLeadForm: z.boolean().default(true),
  /** The short name/phone/email strip on the edge of the opening photo (desktop). */
  showQuickForm: z.boolean().default(true),
});
export type ProjectData = z.infer<typeof projectSchema>;
export type ProjectFact = ProjectData['facts'][number];
export type ProjectBlock = ProjectData['blocks'][number];
export type ProjectPlace = ProjectData['nearby'][number];
export type ProjectBadge = ProjectData['badges'][number];
export type ProjectStatus = ProjectData['status'][number];
export type ProjectUnit = ProjectData['units'][number];

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
  project.badges.forEach((b) => check('תגיות', b.he, b.en));
  project.facts.forEach((f) => check('נתונים בפתיח', f.he, f.en));
  project.status.forEach((st) => check('מצב השיווק', st.he, st.en));
  project.blocks.forEach((b) => check('תמונה לצד טקסט', b.he, b.en));
  project.units.forEach((u) => check('סוגי דירות', u.he, u.en));
  check('השכונה', { a: he.areaText }, { a: en.areaText });
  project.nearby.forEach((n) => check('השכונה', n.he, n.en));
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
    { label: '3 נתונים בפתיח לפחות', ok: facts >= 3, required: false, jump: 'facts' },
    { label: 'מצב השיווק', ok: project.status.some((st) => filled(st.he.value)), required: false, jump: 'status' },
    { label: 'סוגי דירות', ok: project.units.some((u) => filled(u.he.title)), required: false, jump: 'units' },
    { label: 'מפת השכונה', ok: project.location.lat !== null && !!(project.location.streets.major || project.location.streets.minor), required: false, jump: 'location' },
    { label: `6 תמונות בגלריה (יש ${project.gallery.length})`, ok: project.gallery.length >= 6, required: false, jump: 'gallery' },
    { label: 'תיאור לגוגל', ok: filled(he.seoDescription), required: false, jump: 'seoDescription' },
    { label: english.length ? `תרגום לאנגלית: ${english.join(', ')}` : 'תרגום לאנגלית', ok: !english.length, required: false, jump: 'name' },
  ];
}

const fact = (he: string, en: string): ProjectFact => ({ he: { label: he, value: '' }, en: { label: en, value: '' } });
const block = (he: string, en: string): ProjectBlock => ({ image: '', he: { title: he, body: '' }, en: { title: en, body: '' } });

// Facts sit on the opening photo as value over label: "30" over "Apartments".
export const FACT_PRESETS: [he: string, en: string][] = [
  ['דירות', 'Apartments'],
  ['חדרים', 'Rooms'],
  ['מ״ר', 'm²'],
  ['קומות', 'Floors'],
  ['אכלוס', 'Handover'],
  ['מחיר החל מ־', 'From'],
];
export const BADGE_PRESETS: [he: string, en: string][] = [
  ['בשיווק בלעדי של Wings', 'Exclusively marketed by Wings'],
  ['בשיווק', 'Now selling'],
  ['דירות אחרונות', 'Final apartments'],
  ['מחירי השקה', 'Launch prices'],
];
export const STATUS_PRESETS: [he: string, en: string, bar: boolean][] = [
  ['נמכרו עד היום', 'Sold so far', true],
  ['אכלוס צפוי', 'Expected handover', false],
  ['תנאי תשלום', 'Payment terms', false],
  ['שלב הבנייה', 'Construction', true],
];
export const UNIT_PRESETS: [code: string, he: string, en: string][] = [
  ['3', '3 חדרים', '3 rooms'],
  ['4', '4 חדרים', '4 rooms'],
  ['5', '5 חדרים', '5 rooms'],
  ['G', 'דירת גן', 'Garden apartment'],
  ['MP', 'מיני פנטהאוז', 'Mini penthouse'],
  ['PH', 'פנטהאוז', 'Penthouse'],
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
export const newBadge = (he = '', en = ''): ProjectBadge => ({ he: { text: he }, en: { text: en } });
export const newStatus = (he = '', en = '', bar = false): ProjectStatus => ({
  bar: bar ? 0 : null,
  he: { label: he, value: '', note: '' },
  en: { label: en, value: '', note: '' },
});
export const newUnit = (code = '', he = '', en = ''): ProjectUnit => ({
  code,
  size: '',
  floors: '',
  total: null,
  left: null,
  plan: '',
  he: { title: he, outdoor: '' },
  en: { title: en, outdoor: '' },
});

/** A new project starts from the template: the usual facts, figures and blocks, waiting to be filled. */
export function blankProject(): ProjectData {
  const emptyText = projectTextSchema.parse({});
  return {
    slug: '',
    published: false,
    sold: false,
    heroImage: '',
    backdropImage: '',
    text: {
      he: { ...emptyText, cta: 'אני רוצה לשמוע פרטים', leadTitle: 'רוצים לשמוע עוד?', leadText: 'השאירו פרטים ונחזור אליכם עם תוכניות ומחירון.' },
      en: { ...emptyText, cta: 'I’d like to hear more', leadTitle: 'Want to hear more?', leadText: 'Leave your details and we’ll get back to you with plans and prices.' },
    },
    badges: [newBadge(...BADGE_PRESETS[0])],
    facts: [fact('דירות', 'Apartments'), fact('חדרים', 'Rooms'), fact('מ״ר', 'm²'), fact('קומות', 'Floors')],
    status: STATUS_PRESETS.slice(0, 3).map(([he, en, bar]) => newStatus(he, en, bar)),
    statusDate: '',
    blocks: [block('מיקום', 'Location'), block('הדירות', 'The apartments'), block('חוויית מגורים', 'Living here')],
    units: [],
    features: [],
    location: { lat: null, lng: null, zoom: 16, address: '', streets: { major: '', minor: '', parks: '' } },
    nearby: [],
    gallery: [],
    showLeadForm: true,
    showQuickForm: true,
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
  /** The chosen backdrop, or else the hero image; empty only when neither is set. */
  backdropImage: string;
  showLeadForm: boolean;
  showQuickForm: boolean;
  name: string;
  area: string;
  tagline: string;
  cta: string;
  leadTitle: string;
  leadText: string;
  seoTitle: string;
  seoDescription: string;
  areaText: string;
  badges: { text: string; index: number }[];
  facts: { label: string; value: string; index: number }[];
  status: { label: string; value: string; note: string; bar: number | null; index: number }[];
  statusDate: string;
  /** Image blocks alternate sides on their own; a block with no image runs full width. */
  blocks: { title: string; body: string; image: string; side: BlockSide; index: number }[];
  units: {
    code: string;
    title: string;
    size: string;
    floors: string;
    outdoor: string;
    total: number | null;
    left: number | null;
    plan: string;
    index: number;
  }[];
  features: { id: FeatureId; label: string }[];
  /** Set only once its streets are drawn: no streets, no map. */
  location: { zoom: number; streets: { major: string; minor: string; parks: string } } | null;
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
  const { lat, lng, zoom, streets } = project.location;

  return {
    slug: project.slug,
    sold: project.sold,
    heroImage: project.heroImage.trim(),
    backdropImage: (project.backdropImage || project.heroImage).trim(),
    showLeadForm: project.showLeadForm,
    showQuickForm: project.showQuickForm,
    name: t('name'),
    area: t('area'),
    tagline: t('tagline'),
    cta: t('cta'),
    leadTitle: t('leadTitle'),
    leadText: t('leadText'),
    seoTitle: t('seoTitle'),
    seoDescription: t('seoDescription'),
    areaText: t('areaText'),
    badges: project.badges.map((b, index) => ({ text: pick(b.he.text, b.en.text), index })).filter((b) => b.text),
    facts: project.facts
      .map((f, index) => ({ label: pick(f.he.label, f.en.label), value: pick(f.he.value, f.en.value), index }))
      .filter((f) => f.label && f.value),
    status: project.status
      .map((st, index) => ({ label: pick(st.he.label, st.en.label), value: pick(st.he.value, st.en.value), note: pick(st.he.note, st.en.note), bar: st.bar, index }))
      .filter((st) => st.value),
    statusDate: project.statusDate,
    blocks,
    units: project.units
      .map((u, index) => ({
        code: u.code.trim(),
        title: pick(u.he.title, u.en.title),
        size: u.size.trim(),
        floors: u.floors.trim(),
        outdoor: pick(u.he.outdoor, u.en.outdoor),
        total: u.total,
        left: u.left,
        plan: u.plan.trim(),
        index,
      }))
      .filter((u) => u.title),
    features: FEATURE_IDS.filter((id) => project.features.includes(id)).map((id) => ({ id, label: FEATURE_LABELS[id][locale] })),
    location: lat !== null && lng !== null && (streets.major || streets.minor) ? { zoom, streets } : null,
    nearby: project.nearby
      .map((n, index) => ({ place: pick(n.he.place, n.en.place), minutes: n.minutes, mode: n.mode, index }))
      .filter((n) => n.place),
    gallery: project.gallery.filter(filled),
  };
}
