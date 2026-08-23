'use server';

import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { updateTextSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale } from '@/lib/content/schema';

export type MapText = z.infer<typeof TEXT_SECTION_SCHEMAS.map>;

export async function saveMap(locale: ContentLocale, data: MapText) {
  await requireAdmin();
  await updateTextSection(locale, 'map', data);
}
