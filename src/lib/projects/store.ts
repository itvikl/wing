import 'server-only';
import { cache } from 'react';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { requireAdmin } from '@/lib/auth/session';
import { getContent } from '@/lib/content/store';
import { blankProject, projectSchema, publishProblems, SLUG_RE, type ProjectData, type ProjectRecord } from './schema';

/**
 * Projects live one per doc in `projects`, apart from the site's content doc:
 * each has its own page and its own save, and a growing list of them would
 * otherwise crowd that single doc. `order` is the place in the list, which is
 * the order of the cards on the site.
 */
const projectsCol = () => adminDb.collection('projects');

export type SaveResult = { ok: true } | { ok: false; error: string };

function fromDoc(doc: DocumentSnapshot): ProjectRecord | null {
  const raw = doc.data();
  if (!raw) return null;
  // Defaults fill any field a doc saved before it existed doesn't have.
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(`Project ${doc.id} doesn't match the schema`, parsed.error.flatten());
    return null;
  }
  return {
    ...parsed.data,
    id: doc.id,
    order: typeof raw.order === 'number' ? raw.order : 0,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
  };
}

/** Every project, published or not, in list order. Deduped per request. */
export const listProjects = cache(async (): Promise<ProjectRecord[]> => {
  const snap = await projectsCol().orderBy('order').get();
  return snap.docs.map(fromDoc).filter((p): p is ProjectRecord => p !== null);
});

export async function getPublishedProjects(): Promise<ProjectRecord[]> {
  return (await listProjects()).filter((p) => p.published);
}

/**
 * Whether any project is published. With none, every menu link to the
 * projects page disappears and the page itself shows a short notice.
 */
export async function hasPublishedProjects(): Promise<boolean> {
  return (await getPublishedProjects()).length > 0;
}

export async function getPublishedProjectBySlug(slug: string): Promise<ProjectRecord | null> {
  return (await getPublishedProjects()).find((p) => p.slug === slug) ?? null;
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  return fromDoc(await projectsCol().doc(id).get());
}

/** Writes the list's order as 0, 1, 2… in one batch. */
async function writeOrder(ids: string[]) {
  const batch = adminDb.batch();
  ids.forEach((id, order) => batch.update(projectsCol().doc(id), { order }));
  await batch.commit();
}

async function slugTaken(slug: string, exceptId: string) {
  const snap = await projectsCol().where('slug', '==', slug).get();
  return snap.docs.some((doc) => doc.id !== exceptId);
}

export async function saveProject(id: string, input: unknown): Promise<SaveResult> {
  await requireAdmin();
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'חלק מהשדות לא תקינים. בדקו שאין שדה ארוך מדי.' };
  const data: ProjectData = { ...parsed.data, slug: parsed.data.slug.trim().toLowerCase() };

  const existing = await projectsCol().doc(id).get();
  if (!existing.exists) return { ok: false, error: 'הפרויקט לא נמצא. אולי הוא נמחק בחלון אחר.' };
  if (data.slug && !SLUG_RE.test(data.slug)) {
    return { ok: false, error: 'כתובת הדף יכולה להכיל רק אותיות באנגלית, מספרים ומקפים.' };
  }
  if (data.slug && (await slugTaken(data.slug, id))) {
    return { ok: false, error: `הכתובת /projects/${data.slug} כבר בשימוש בפרויקט אחר. בחרו כתובת אחרת.` };
  }
  if (data.published) {
    const problems = publishProblems(data);
    if (problems.length) return { ok: false, error: `כדי לפרסם חסר: ${problems.join(', ')}. אפשר לשמור בלי לפרסם.` };
  }

  await projectsCol().doc(id).update({ ...data, updatedAt: new Date().toISOString() });
  return { ok: true };
}

export async function setProjectPublished(id: string, published: boolean): Promise<SaveResult> {
  await requireAdmin();
  const project = await getProject(id);
  if (!project) return { ok: false, error: 'הפרויקט לא נמצא.' };
  if (published) {
    const problems = publishProblems(project);
    if (problems.length) return { ok: false, error: `כדי לפרסם חסר: ${problems.join(', ')}.` };
    if (await slugTaken(project.slug, id)) return { ok: false, error: 'כתובת הדף כבר בשימוש בפרויקט אחר.' };
  }
  await projectsCol().doc(id).update({ published, updatedAt: new Date().toISOString() });
  return { ok: true };
}

/** A new draft from the template, first in the list. Returns its id. */
export async function createProject(data: ProjectData = blankProject()): Promise<string> {
  await requireAdmin();
  const list = await listProjects();
  const now = new Date().toISOString();
  const ref = await projectsCol().add({ ...data, published: false, order: -1, createdAt: now, updatedAt: now });
  await writeOrder([ref.id, ...list.map((p) => p.id)]);
  return ref.id;
}

/** A draft copy right under the original, with no address yet (two pages can't share one). */
export async function duplicateProject(id: string): Promise<string | null> {
  await requireAdmin();
  const list = await listProjects();
  const source = list.find((p) => p.id === id);
  if (!source) return null;
  const { id: _id, order: _order, updatedAt: _updatedAt, ...data } = source;
  const copy: ProjectData = {
    ...data,
    slug: '',
    published: false,
    text: {
      he: { ...data.text.he, name: data.text.he.name ? `${data.text.he.name} (עותק)` : '' },
      en: { ...data.text.en, name: data.text.en.name ? `${data.text.en.name} (copy)` : '' },
    },
  };
  const now = new Date().toISOString();
  const ref = await projectsCol().add({ ...copy, order: -1, createdAt: now, updatedAt: now });
  const ids = list.map((p) => p.id);
  ids.splice(ids.indexOf(id) + 1, 0, ref.id);
  await writeOrder(ids);
  return ref.id;
}

export async function moveProject(id: string, direction: -1 | 1) {
  await requireAdmin();
  const ids = (await listProjects()).map((p) => p.id);
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  await writeOrder(ids);
}

export async function deleteProject(id: string) {
  await requireAdmin();
  await projectsCol().doc(id).delete();
}

/**
 * The cards the projects page had before each project got a page of its own
 * (title, location and a line of text per language, an image by position).
 * Shown in the admin only while the new list is still empty.
 */
export async function legacyProjectCount(): Promise<number> {
  const content = await getContent();
  const he = content.text.he.projects.items;
  const en = content.text.en.projects.items;
  return Array.from({ length: Math.max(he.length, en.length) }, (_, i) => he[i]?.title.trim() || en[i]?.title.trim()).filter(Boolean).length;
}

/** Turns those cards into project drafts, so nothing typed before is lost. */
export async function importLegacyProjects(): Promise<number> {
  await requireAdmin();
  const content = await getContent();
  const he = content.text.he.projects.items;
  const en = content.text.en.projects.items;
  const images = content.media.projects.items;
  let imported = 0;
  // Last first: each new draft goes to the top, so this keeps the cards' order.
  for (let i = Math.max(he.length, en.length) - 1; i >= 0; i--) {
    const h = he[i];
    const e = en[i];
    if (!h?.title.trim() && !e?.title.trim()) continue;
    const base = blankProject();
    await createProject({
      ...base,
      heroImage: images[i] ?? '',
      text: {
        he: { ...base.text.he, name: h?.title ?? '', area: h?.location ?? '', tagline: h?.description ?? '' },
        en: { ...base.text.en, name: e?.title ?? '', area: e?.location ?? '', tagline: e?.description ?? '' },
      },
    });
    imported++;
  }
  return imported;
}
