import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth/session';
import { ChangePasswordForm } from './Form';

export const dynamic = 'force-dynamic';

/**
 * Picking your own password: required right after signing in with one an
 * owner chose (every other admin screen sends you here until it's done), and
 * open any time from the admin menu.
 */
export default async function ChangePasswordPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-dark px-4 py-10">
      <ChangePasswordForm email={session.email} name={session.name} forced={session.mustChangePassword} />
    </div>
  );
}
