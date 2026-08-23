'use server';

import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { updateTextSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale } from '@/lib/content/schema';

export type NavText = z.infer<typeof TEXT_SECTION_SCHEMAS.nav>;

export async function saveNav(locale: ContentLocale, data: NavText) {
  await requireAdmin();
  await updateTextSection(locale, 'nav', data);
}
