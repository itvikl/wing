'use server';

import { requireAdmin } from '@/lib/auth/session';
import { updateLogo } from '@/lib/content/store';

export async function saveBrand(logo: string) {
  await requireAdmin();
  await updateLogo(logo);
}
