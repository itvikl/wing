import Link from 'next/link';
import { ADMIN_GROUPS } from '@/lib/admin/sections';

export default function AdminDashboardPage() {
  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-semibold text-primary-dark md:text-[28px]">ניהול תוכן האתר</h1>
      <p className="mt-1.5 text-[15px] text-neutral-muted">בחרו מה לערוך. שינויים מתפרסמים באתר החי מיד אחרי השמירה.</p>

      {ADMIN_GROUPS.map((group) => (
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
