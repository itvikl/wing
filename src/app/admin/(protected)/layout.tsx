import { requireAdmin } from '@/lib/auth/session';
import { ROLE_LABELS } from '@/lib/auth/roles';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminLocaleProvider } from '@/components/admin/AdminLocale';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <AdminShell
      user={{ email: session.email, name: session.name, roleLabel: ROLE_LABELS[session.role] }}
      access={{ role: session.role, sections: session.sections }}
    >
      {/* One editing language across every section (see AdminLocale). */}
      <AdminLocaleProvider>{children}</AdminLocaleProvider>
    </AdminShell>
  );
}
