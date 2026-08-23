import { requireAdmin } from '@/lib/auth/session';
import { AdminNav } from '@/components/admin/AdminNav';
import { LogoutButton } from '@/components/admin/LogoutButton';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-neutral-100">
      <aside className="hidden w-64 shrink-0 flex-col border-l border-white/10 bg-primary-dark p-6 text-neutral-100 md:flex">
        <div className="text-lg font-semibold">Wings — ניהול</div>
        <AdminNav />
        <div className="mt-auto border-t border-white/10 pt-6">
          <p className="mb-3 truncate text-xs text-neutral-200">{session.email}</p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
