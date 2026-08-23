'use server';

import type { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { updateTextSection } from '@/lib/content/store';
import { TEXT_SECTION_SCHEMAS, type ContentLocale } from '@/lib/content/schema';

export type LeadFormText = z.infer<typeof TEXT_SECTION_SCHEMAS.leadForm>;

export async function saveLeadForm(locale: ContentLocale, data: LeadFormText) {
  await requireAdmin();
  await updateTextSection(locale, 'leadForm', data);
}
