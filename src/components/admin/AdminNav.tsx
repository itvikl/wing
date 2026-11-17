'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { visibleGroups } from '@/lib/admin/sections';
import { canManageUsers, type AdminAccess } from '@/lib/auth/roles';

/**
 * The admin's screens in their groups, only those this person may edit (plus
 * the users screen for owners); `onNavigate` closes the phone menu on a pick.
 */
export function AdminNav({ access, onNavigate }: { access: AdminAccess; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="מסכי הניהול" className="flex flex-col gap-6">
      <Link
        href="/admin"
        onClick={onNavigate}
        aria-current={pathname === '/admin' ? 'page' : undefined}
        className={`rounded-lg px-3 py-2 text-sm transition-colors ${
          pathname === '/admin' ? 'bg-white/10 text-neutral-100' : 'text-neutral-200 hover:bg-white/5'
        }`}
      >
        סקירה כללית
      </Link>
      {visibleGroups(access).map((group) => (
        <div key={group.title}>
          <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-accent-light/80">{group.title}</div>
          <div className="flex flex-col gap-0.5">
            {group.sections.map((section) => {
              const active = pathname === section.href || pathname.startsWith(`${section.href}/`);
              return (
                <Link
                  key={section.key}
                  href={section.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-lg px-3 py-2 text-[15px] transition-colors ${
                    active ? 'bg-accent font-medium text-primary-dark' : 'text-neutral-100 hover:bg-white/5'
                  }`}
                >
                  {section.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
      {canManageUsers(access) && (
        <div>
          <div className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-accent-light/80">ניהול</div>
          <Link
            href="/admin/users"
            onClick={onNavigate}
            aria-current={pathname.startsWith('/admin/users') ? 'page' : undefined}
            className={`block rounded-lg px-3 py-2 text-[15px] transition-colors ${
              pathname.startsWith('/admin/users') ? 'bg-accent font-medium text-primary-dark' : 'text-neutral-100 hover:bg-white/5'
            }`}
          >
            משתמשים
          </Link>
        </div>
      )}
    </nav>
  );
}
