import { requireSection } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

// The opening screen is edited on the Home page screen now.
export default async function HeroAdminPage() {
  await requireSection('home');
  redirect('/admin/content/home#opening');
}
