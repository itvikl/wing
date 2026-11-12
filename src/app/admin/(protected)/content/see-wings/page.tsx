import { redirect } from 'next/navigation';

// The flight is edited on the Home page screen now.
export default function SeeWingsAdminPage() {
  redirect('/admin/content/home#flight');
}
