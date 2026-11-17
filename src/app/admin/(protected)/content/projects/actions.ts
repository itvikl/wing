'use server';

import type { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireSection } from '@/lib/auth/session';
import { canPublish } from '@/lib/auth/roles';
import { updateProjectsLabels } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS } from '@/lib/content/schema';
import { buildStreetMap, type StreetMap } from '@/lib/projects/streetMap';
import {
  createProject,
  deleteProject,
  duplicateProject,
  getProject,
  importLegacyProjects,
  moveProject,
  saveProject,
  setProjectPublished,
  type SaveResult,
} from '@/lib/projects/store';

export type ProjectsText = z.infer<typeof TEXT_SECTION_SCHEMAS.projects>;
export type ProjectsLabels = Omit<ProjectsText, 'items'>;

// Each action checks the person may edit projects (and, for publishing,
// unpublishing or deleting, that their role allows it); the store checks the
// session again. Results come back as
// { ok, error } rather than thrown: a production build hides a thrown
// message from the browser, and these messages are written for the admin.

const LIST = '/admin/content/projects';
const NO_PUBLISH = 'רק בעלים או עורך יכולים לפרסם, להסתיר או למחוק פרויקט.';

export async function saveProjectsLabels(he: ProjectsLabels, en: ProjectsLabels) {
  await requireSection('projects');
  await updateProjectsLabels(he, en);
}

export async function saveProjectAction(id: string, data: unknown): Promise<SaveResult> {
  const session = await requireSection('projects');
  if (!canPublish(session) && data && typeof data === 'object') {
    // A limited editor's save keeps whatever is live as it is.
    const existing = await getProject(id);
    if (!existing) return { ok: false, error: 'הפרויקט לא נמצא. אולי הוא נמחק בחלון אחר.' };
    data = { ...data, published: existing.published };
  }
  const result = await saveProject(id, data);
  if (result.ok) revalidatePath(LIST);
  return result;
}

export async function setPublishedAction(id: string, published: boolean): Promise<SaveResult> {
  if (!canPublish(await requireSection('projects'))) return { ok: false, error: NO_PUBLISH };
  return setProjectPublished(id, published);
}

export async function createProjectAction(): Promise<string> {
  await requireSection('projects');
  return createProject();
}

export async function duplicateProjectAction(id: string): Promise<string | null> {
  await requireSection('projects');
  return duplicateProject(id);
}

export async function moveProjectAction(id: string, direction: -1 | 1) {
  await requireSection('projects');
  await moveProject(id, direction);
}

export async function deleteProjectAction(id: string) {
  if (!canPublish(await requireSection('projects'))) throw new Error(NO_PUBLISH);
  await deleteProject(id);
}

export async function importLegacyAction(): Promise<number> {
  await requireSection('projects');
  return importLegacyProjects();
}

export type DrawnMap = { ok: true; streets: StreetMap } | { ok: false; error: string };

/** Draws the neighbourhood map's streets around a point (slow: up to a minute). Only the point is sent. */
export async function drawMapAction(lat: number, lng: number): Promise<DrawnMap> {
  await requireSection('projects');
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { ok: false, error: 'המיקום לא תקין.' };
  }
  try {
    const streets = await buildStreetMap(lat, lng);
    if (!streets.major && !streets.minor) return { ok: false, error: 'לא נמצאו רחובות סביב הנקודה. בדקו שהמיקום נכון.' };
    return { ok: true, streets };
  } catch {
    return { ok: false, error: 'שרת המפות עמוס כרגע. נסו שוב בעוד כמה דקות; שאר הדף נשמר כרגיל.' };
  }
}

export type FoundPlace = { ok: true; lat: number; lng: number; label: string } | { ok: false; error: string };

/**
 * An address → a point for the neighbourhood map, through OpenStreetMap's
 * search (Nominatim: one request at a time, an app name in the User-Agent).
 * Only the typed address is sent.
 */
export async function findAddressAction(query: string): Promise<FoundPlace> {
  await requireSection('projects');
  const q = String(query ?? '').trim().slice(0, 200);
  if (q.length < 3) return { ok: false, error: 'הקלידו כתובת: רחוב, מספר ועיר.' };
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=he&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, { headers: { 'User-Agent': 'WingsSiteAdmin/1.0' }, cache: 'no-store' });
    if (!response.ok) return { ok: false, error: 'החיפוש לא זמין כרגע. אפשר להדביק קישור מגוגל מפות במקום.' };
    const results = (await response.json()) as { lat: string; lon: string; display_name: string }[];
    const first = results[0];
    if (!first) return { ok: false, error: 'הכתובת לא נמצאה. נסו לכתוב אותה אחרת, או הדביקו קישור מגוגל מפות.' };
    return { ok: true, lat: Number(first.lat), lng: Number(first.lon), label: first.display_name };
  } catch {
    return { ok: false, error: 'החיפוש לא זמין כרגע. אפשר להדביק קישור מגוגל מפות במקום.' };
  }
}
