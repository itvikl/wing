'use server';

import { requireSection } from '@/lib/auth/session';
import { updateLogo } from '@/lib/content/store';

export async function saveBrand(logo: string) {
  await requireSection('brand');
  await updateLogo(logo);
}
