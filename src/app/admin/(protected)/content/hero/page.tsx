import { redirect } from 'next/navigation';

// The opening screen is edited on the Home page screen now.
export default function HeroAdminPage() {
  redirect('/admin/content/home#opening');
}
