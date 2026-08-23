'use server';

import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { updateTextSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale } from '@/lib/content/schema';

export type FooterText = z.infer<typeof TEXT_SECTION_SCHEMAS.footer>;

export async function saveFooter(locale: ContentLocale, data: FooterText) {
  await requireAdmin();
  await updateTextSection(locale, 'footer', data);
}
