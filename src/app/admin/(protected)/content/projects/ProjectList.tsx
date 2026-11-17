'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  createProjectAction,
  deleteProjectAction,
  duplicateProjectAction,
  importLegacyAction,
  moveProjectAction,
  setPublishedAction,
} from './actions';

export type ProjectRow = {
  id: string;
  name: string;
  area: string;
  slug: string;
  published: boolean;
  sold: boolean;
  heroImage: string;
  /** What still blocks publishing; empty when it can go live. */
  problems: string[];
  updatedAt: string;
};

const button = 'rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-primary-dark transition-colors hover:border-accent disabled:opacity-50';

function formatDate(iso: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Every project, in the order the site shows them: publish or unpublish one
 * right here, move it, copy it, delete it, or open it to edit its page.
 */
export function ProjectList({ rows, legacyCount, canPublish: mayPublish }: { rows: ProjectRow[]; legacyCount: number; canPublish: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  function run(id: string | null, task: () => Promise<void>) {
    setBusyId(id);
    startTransition(async () => {
      try {
        await task();
        router.refresh();
      } catch (error) {
        setNotice(error instanceof Error ? error.message : 'הפעולה נכשלה. נסו שוב.');
      } finally {
        setBusyId(null);
      }
    });
  }

  function togglePublished(row: ProjectRow) {
    setErrors((prev) => ({ ...prev, [row.id]: '' }));
    run(row.id, async () => {
      const result = await setPublishedAction(row.id, !row.published);
      if (!result.ok) setErrors((prev) => ({ ...prev, [row.id]: result.error }));
    });
  }

  const publishedCount = rows.filter((r) => r.published).length;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-primary-dark">הפרויקטים</h2>
          <p className="mt-1 text-sm text-neutral-muted">
            {rows.length ? `${rows.length} פרויקטים, ${publishedCount} מפורסמים באתר. ` : ''}
            הסדר כאן הוא הסדר באתר. פרויקט שלא מסומן לפרסום לא מופיע באתר בכלל.
            {publishedCount === 0 && rows.length > 0 && ' כרגע אף פרויקט לא מפורסם, ולכן הקישור לעמוד הפרויקטים מוסתר מהתפריט.'}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(null, async () => {
              const id = await createProjectAction();
              router.push(`/admin/content/projects/${id}`);
            })
          }
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-primary-dark transition-colors hover:bg-accent-light disabled:opacity-60"
        >
          + פרויקט חדש
        </button>
      </div>

      {notice && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{notice}</p>}

      {legacyCount > 0 && rows.length === 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/40 bg-accent/10 p-5">
          <p className="max-w-xl text-sm leading-relaxed text-primary-dark">
            נמצאו {legacyCount} כרטיסי הזדמנות מהמבנה הקודם של העמוד. אפשר להפוך אותם לטיוטות של דפי פרויקט, עם השם, המיקום, התיאור והתמונה שכבר הוזנו.
          </p>
          <button type="button" disabled={pending} onClick={() => run(null, async () => { await importLegacyAction(); })} className={button}>
            העברה לדפי פרויקט
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-white p-10 text-center text-neutral-muted">
          עדיין אין פרויקטים. ״פרויקט חדש״ פותח דף מהתבנית, עם החלקים הקבועים מוכנים למילוי.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {rows.map((row, index) => {
            const busy = pending && busyId === row.id;
            const canPublish = mayPublish && (row.published || row.problems.length === 0);
            return (
              <li key={row.id} className={`grid gap-4 p-4 md:grid-cols-[28px_96px_minmax(0,1fr)_auto] md:items-center ${busy ? 'opacity-60' : ''}`}>
                <div className="flex gap-1 md:flex-col">
                  <button type="button" aria-label="הזזה למעלה" disabled={index === 0 || pending} onClick={() => run(row.id, () => moveProjectAction(row.id, -1))} className="h-7 w-7 rounded-md text-neutral-muted hover:bg-neutral-100 disabled:opacity-30">↑</button>
                  <button type="button" aria-label="הזזה למטה" disabled={index === rows.length - 1 || pending} onClick={() => run(row.id, () => moveProjectAction(row.id, 1))} className="h-7 w-7 rounded-md text-neutral-muted hover:bg-neutral-100 disabled:opacity-30">↓</button>
                </div>

                <Link href={`/admin/content/projects/${row.id}`} className="relative hidden aspect-[3/2] w-24 overflow-hidden rounded-lg bg-neutral-100 md:block">
                  {row.heroImage && <Image src={row.heroImage} alt="" fill sizes="96px" className="object-cover" />}
                </Link>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/content/projects/${row.id}`} className="text-base font-semibold text-primary-dark hover:underline">
                      {row.name || 'פרויקט ללא שם'}
                    </Link>
                    {row.sold && <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent-dark">נמכר</span>}
                  </div>
                  <p className="text-sm text-neutral-muted">
                    {row.area || '—'}
                    {row.slug && <span dir="ltr" className="ms-2 text-xs text-neutral-muted/80">/projects/{row.slug}</span>}
                  </p>
                  {!row.published && row.problems.length > 0 && (
                    <p className="mt-1 text-xs text-amber-700">חסר לפרסום: {row.problems.join(', ')}</p>
                  )}
                  {errors[row.id] && <p role="alert" className="mt-1 text-xs text-red-600">{errors[row.id]}</p>}
                  <p className="mt-1 text-xs text-neutral-muted/80" suppressHydrationWarning>
                    {row.updatedAt && `עודכן ${formatDate(row.updatedAt)}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <label className={`flex items-center gap-2.5 rounded-full border px-3 py-1.5 text-sm ${row.published ? 'border-green-600/30 bg-green-50 text-green-800' : 'border-neutral-200 text-neutral-muted'} ${canPublish ? 'cursor-pointer' : 'cursor-not-allowed'}`} title={canPublish ? undefined : mayPublish ? `חסר: ${row.problems.join(', ')}` : 'פרסום והסתרה נעשים על ידי בעלים או עורך'}>
                    <input
                      type="checkbox"
                      role="switch"
                      checked={row.published}
                      disabled={!canPublish || pending}
                      onChange={() => togglePublished(row)}
                      className="peer sr-only"
                    />
                    <span aria-hidden className={`relative h-5 w-9 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${row.published ? 'bg-green-600' : 'bg-neutral-200'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${row.published ? 'start-[18px]' : 'start-0.5'}`} />
                    </span>
                    {row.published ? 'מפורסם באתר' : 'לא מפורסם'}
                  </label>
                  <Link href={`/admin/content/projects/${row.id}`} className={button}>עריכה</Link>
                  {row.published && (
                    <a href={`/he/projects/${row.slug}`} target="_blank" rel="noopener noreferrer" className={button}>
                      צפייה <span aria-hidden>↗</span>
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(row.id, async () => {
                        const id = await duplicateProjectAction(row.id);
                        if (id) setNotice('נוצר עותק כטיוטה, בלי כתובת. הוא לא יופיע באתר עד שתפרסמו אותו.');
                      })
                    }
                    className={button}
                  >
                    שכפול
                  </button>
                  {mayPublish && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm(`למחוק את "${row.name || 'פרויקט ללא שם'}"? הדף יורד מהאתר ואי אפשר לשחזר אותו. אם הפרויקט נמכר, עדיף לסמן אותו "נמכר".`)) return;
                      run(row.id, () => deleteProjectAction(row.id));
                    }}
                    className="rounded-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    מחיקה
                  </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
