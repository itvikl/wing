import Link from 'next/link';
import { visibleGroups } from '@/lib/admin/sections';
import { requireAdmin } from '@/lib/auth/session';

export default async function AdminDashboardPage({ searchParams }: { searchParams: { denied?: string } }) {
  const session = await requireAdmin();
  const groups = visibleGroups(session);

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-primary-dark md:text-[28px]">ניהול תוכן האתר</h1>
      <p className="mt-1.5 text-[15px] text-neutral-muted">בחרו מה לערוך. שינויים מתפרסמים באתר החי מיד אחרי השמירה.</p>
      {searchParams.denied && (
        <p role="alert" className="mt-5 rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          אין לכם הרשאה למסך שניסיתם לפתוח. כאן מופיעים החלקים שמותר לכם לערוך. צריכים גישה נוספת? פנו לבעלים של האתר.
        </p>
      )}
      {groups.length === 0 && <p className="mt-8 text-sm text-neutral-muted">עדיין לא הוגדרו לכם חלקים לעריכה. פנו לבעלים של האתר.</p>}

      {groups.map((group) => (
        <section key={group.title} className="mt-10">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-accent-dark">{group.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.sections.map((section) => (
              <Link
                key={section.key}
                href={section.href}
                className="group flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent"
              >
                <span className="flex items-center justify-between text-lg font-semibold text-primary-dark">
                  {section.label}
                  <span aria-hidden className="text-accent-dark opacity-0 transition-opacity group-hover:opacity-100">←</span>
                </span>
                <span className="text-sm leading-relaxed text-neutral-muted">{section.description}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
