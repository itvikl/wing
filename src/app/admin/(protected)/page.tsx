import Link from 'next/link';
import { ADMIN_SECTIONS } from '@/lib/admin/sections';

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">ניהול תוכן האתר</h1>
      <p className="mt-2 text-neutral-muted">בחרו קטע לעריכה. שינויים נשמרים ומתפרסמים באתר החי מיד לאחר השמירה.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ADMIN_SECTIONS.map((section) => (
          <Link
            key={section.key}
            href={section.href}
            className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <span className="font-semibold text-primary-dark">{section.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
