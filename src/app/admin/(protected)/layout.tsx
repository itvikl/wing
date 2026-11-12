import { requireAdmin } from '@/lib/auth/session';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminLocaleProvider } from '@/components/admin/AdminLocale';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <AdminShell email={session.email}>
      {/* One editing language across every section (see AdminLocale). */}
      <AdminLocaleProvider>{children}</AdminLocaleProvider>
    </AdminShell>
  );
}
