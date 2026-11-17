import { requireSection } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

// The flight is edited on the Home page screen now.
export default async function SeeWingsAdminPage() {
  await requireSection('home');
  redirect('/admin/content/home#flight');
}
