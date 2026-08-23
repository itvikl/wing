'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_SECTIONS } from '@/lib/admin/sections';

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mt-8 flex flex-col gap-1">
      {ADMIN_SECTIONS.map((section) => {
        const active = pathname === section.href;
        return (
          <Link
            key={section.key}
            href={section.href}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              active ? 'bg-accent text-primary-dark' : 'text-neutral-200 hover:bg-white/10'
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
