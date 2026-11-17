'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type ReactNode } from 'react';
import { MIN_PASSWORD_LENGTH, ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES, type Role } from '@/lib/auth/roles';
import { createUserAction, deleteUserAction, resetPasswordAction, setBlockedAction, updateUserAction } from './actions';

export type UserRow = {
  uid: string;
  email: string;
  name: string;
  role: Role;
  sections: string[];
  disabled: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string;
  /** From ADMIN_EMAILS: always an owner, not editable here. */
  envOwner: boolean;
  isMe: boolean;
};
type SectionOption = { key: string; label: string };
type Handoff = { name: string; email: string; password: string; isNew: boolean };

const button = 'rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-primary-dark transition-colors hover:border-accent disabled:opacity-50';
const primary = 'rounded-full bg-accent px-5 py-2 text-sm font-medium text-primary-dark transition-colors hover:bg-accent-light disabled:opacity-60';
const input = 'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-primary-dark focus:border-accent focus:outline-none';

/** Easy to read aloud or type from a phone: no 0/O, 1/l/I. */
function generatePassword() {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = crypto.getRandomValues(new Uint32Array(10));
  return Array.from(values, (v) => chars[v % chars.length]).join('');
}

function formatDate(iso: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('he-IL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function UsersManager({ rows, sectionOptions }: { rows: UserRow[]; sectionOptions: SectionOption[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [openRow, setOpenRow] = useState<{ uid: string; panel: 'edit' | 'password' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [handoff, setHandoff] = useState<Handoff | null>(null);

  function run(key: string, task: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) {
    setErrors((e) => ({ ...e, [key]: '' }));
    startTransition(async () => {
      try {
        const result = await task();
        if (!result.ok) return setErrors((e) => ({ ...e, [key]: result.error }));
        after?.();
        router.refresh();
      } catch {
        setErrors((e) => ({ ...e, [key]: 'הפעולה נכשלה. רעננו את הדף ונסו שוב.' }));
      }
    });
  }

  const label = (key: string) => sectionOptions.find((s) => s.key === key)?.label ?? key;

  return (
    <div className="mt-8">
      {handoff && <HandoffCard handoff={handoff} onClose={() => setHandoff(null)} />}

      {creating ? (
        <Card>
          <h2 className="text-lg font-semibold text-primary-dark">משתמש חדש</h2>
          <UserForm
            sectionOptions={sectionOptions}
            withEmail
            withPassword
            submitLabel="פתיחת המשתמש"
            pending={pending}
            error={errors.create}
            onCancel={() => setCreating(false)}
            onSubmit={(value) =>
              run('create', () => createUserAction(value), () => {
                setCreating(false);
                setHandoff({ name: value.name, email: value.email.trim().toLowerCase(), password: value.password, isNew: true });
              })
            }
          />
        </Card>
      ) : (
        <button type="button" className={primary} onClick={() => (setCreating(true), setHandoff(null))}>
          + משתמש חדש
        </button>
      )}

      <ul className="mt-8 grid gap-3">
        {rows.map((row) => {
          const locked = row.envOwner || row.isMe;
          const panel = openRow?.uid === row.uid ? openRow.panel : null;
          return (
            <li key={row.uid} className={`rounded-2xl border bg-white p-5 shadow-sm ${row.disabled ? 'border-red-200 opacity-75' : 'border-neutral-200'}`}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-primary-dark">{row.name || row.email}</span>
                    {row.isMe && <span className="text-sm text-neutral-muted">(אתם)</span>}
                    <Pill tone="neutral">{ROLE_LABELS[row.role]}</Pill>
                    {row.disabled ? (
                      <Pill tone="red">חסום</Pill>
                    ) : row.mustChangePassword ? (
                      <Pill tone="amber">טרם בחר סיסמה</Pill>
                    ) : row.lastLoginAt ? (
                      <Pill tone="green">פעיל</Pill>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm text-neutral-muted" dir="ltr" style={{ textAlign: 'right' }}>{row.email}</p>
                  {row.role === 'limited' && (
                    <p className="mt-1 text-sm text-neutral-muted">חלקים: {row.sections.map(label).join(', ')}</p>
                  )}
                  <p className="mt-1 text-xs text-neutral-muted">
                    {row.envOwner
                      ? 'בעלים קבוע מהגדרות השרת. לא ניתן לשנות מכאן.'
                      : row.lastLoginAt
                        ? `התחברות אחרונה: ${formatDate(row.lastLoginAt)}`
                        : 'עדיין לא התחבר.'}
                  </p>
                </div>

                {!locked && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" className={button} disabled={pending} onClick={() => setOpenRow(panel === 'edit' ? null : { uid: row.uid, panel: 'edit' })}>
                      תפקיד והרשאות
                    </button>
                    <button type="button" className={button} disabled={pending} onClick={() => setOpenRow(panel === 'password' ? null : { uid: row.uid, panel: 'password' })}>
                      סיסמה זמנית חדשה
                    </button>
                    <button
                      type="button"
                      className={button}
                      disabled={pending}
                      onClick={() => {
                        if (row.disabled || window.confirm(`לחסום את ${row.name || row.email}? הוא ינותק מיד ולא יוכל להיכנס עד שתבטלו את החסימה.`)) {
                          run(row.uid, () => setBlockedAction(row.uid, !row.disabled));
                        }
                      }}
                    >
                      {row.disabled ? 'ביטול חסימה' : 'חסימה'}
                    </button>
                    <button
                      type="button"
                      className={`${button} text-red-600`}
                      disabled={pending}
                      onClick={() => {
                        if (window.confirm(`למחוק את ${row.name || row.email}? המשתמש יימחק לגמרי, כולל ההתחברות שלו.`)) {
                          run(row.uid, () => deleteUserAction(row.uid));
                        }
                      }}
                    >
                      מחיקה
                    </button>
                  </div>
                )}
              </div>

              {panel === 'edit' && (
                <div className="mt-5 border-t border-neutral-200 pt-5">
                  <UserForm
                    sectionOptions={sectionOptions}
                    initial={{ name: row.name, email: row.email, password: '', role: row.role, sections: row.sections }}
                    submitLabel="שמירה"
                    pending={pending}
                    onCancel={() => setOpenRow(null)}
                    onSubmit={(value) => run(row.uid, () => updateUserAction(row.uid, value), () => setOpenRow(null))}
                  />
                </div>
              )}
              {panel === 'password' && (
                <div className="mt-5 border-t border-neutral-200 pt-5">
                  <PasswordReset
                    pending={pending}
                    onCancel={() => setOpenRow(null)}
                    onSubmit={(password) =>
                      run(row.uid, () => resetPasswordAction(row.uid, password), () => {
                        setOpenRow(null);
                        setHandoff({ name: row.name, email: row.email, password, isNew: false });
                      })
                    }
                  />
                </div>
              )}
              {errors[row.uid] && <p className="mt-3 text-sm text-red-600">{errors[row.uid]}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:p-6">{children}</div>;
}

function Pill({ tone, children }: { tone: 'neutral' | 'green' | 'amber' | 'red'; children: ReactNode }) {
  const tones = {
    neutral: 'border-neutral-200 bg-neutral-100 text-primary-dark',
    green: 'border-green-600/30 bg-green-50 text-green-800',
    amber: 'border-amber-500/30 bg-amber-50 text-amber-800',
    red: 'border-red-300 bg-red-50 text-red-700',
  };
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs ${tones[tone]}`}>{children}</span>;
}

function PasswordInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex gap-2">
      <input type="text" dir="ltr" autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} className={`${input} font-mono`} />
      <button type="button" className={`${button} shrink-0`} onClick={() => onChange(generatePassword())}>
        יצירת סיסמה
      </button>
    </div>
  );
}

type FormValue = { name: string; email: string; password: string; role: Role; sections: string[] };

function UserForm({
  sectionOptions,
  initial,
  withEmail,
  withPassword,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
}: {
  sectionOptions: SectionOption[];
  initial?: FormValue;
  withEmail?: boolean;
  withPassword?: boolean;
  submitLabel: string;
  pending: boolean;
  error?: string;
  onSubmit: (value: FormValue) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState<FormValue>(initial ?? { name: '', email: '', password: generatePassword(), role: 'editor', sections: [] });
  const [problem, setProblem] = useState<string | null>(null);
  const set = (patch: Partial<FormValue>) => setValue((v) => ({ ...v, ...patch }));

  function submit() {
    if (!value.name.trim()) return setProblem('חסר שם.');
    if (withEmail && !value.email.trim()) return setProblem('חסר מייל.');
    if (withPassword && value.password.length < MIN_PASSWORD_LENGTH) return setProblem(`הסיסמה צריכה להיות באורך ${MIN_PASSWORD_LENGTH} תווים לפחות.`);
    if (value.role === 'limited' && !value.sections.length) return setProblem('סמנו לפחות חלק אחד שמותר לו לערוך.');
    setProblem(null);
    onSubmit(value);
  }

  return (
    <div className="mt-4 grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-primary-dark">
          שם
          <input value={value.name} onChange={(e) => set({ name: e.target.value })} className={input} />
        </label>
        {withEmail && (
          <label className="grid gap-1.5 text-sm font-medium text-primary-dark">
            מייל (משמש לכניסה)
            <input type="email" dir="ltr" value={value.email} onChange={(e) => set({ email: e.target.value })} className={input} />
          </label>
        )}
        {withPassword && (
          <div className="grid gap-1.5 text-sm font-medium text-primary-dark md:col-span-2">
            סיסמה זמנית
            <PasswordInput value={value.password} onChange={(password) => set({ password })} />
            <span className="text-xs font-normal text-neutral-muted">בכניסה הראשונה המשתמש יחויב לבחור סיסמה משלו. {MIN_PASSWORD_LENGTH} תווים לפחות.</span>
          </div>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-primary-dark">תפקיד</legend>
        <div className="grid gap-2 md:grid-cols-3">
          {ROLES.map((role) => (
            <label
              key={role}
              className={`cursor-pointer rounded-xl border p-3 text-sm transition-colors ${value.role === role ? 'border-accent bg-accent/10' : 'border-neutral-200 hover:border-accent/60'}`}
            >
              <span className="flex items-center gap-2 font-medium text-primary-dark">
                <input type="radio" name={`role-${initial?.email ?? 'new'}`} checked={value.role === role} onChange={() => set({ role })} className="accent-accent" />
                {ROLE_LABELS[role]}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-neutral-muted">{ROLE_DESCRIPTIONS[role]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {value.role === 'limited' && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-primary-dark">החלקים שמותר לו לערוך</legend>
          <div className="flex flex-wrap gap-2">
            {sectionOptions.map((s) => {
              const on = value.sections.includes(s.key);
              return (
                <label key={s.key} className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${on ? 'border-accent bg-accent/10 text-primary-dark' : 'border-neutral-200 text-neutral-muted'}`}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => set({ sections: on ? value.sections.filter((k) => k !== s.key) : [...value.sections, s.key] })}
                    className="accent-accent"
                  />
                  {s.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {(problem || error) && <p className="text-sm text-red-600">{problem || error}</p>}
      <div className="flex gap-2">
        <button type="button" className={primary} disabled={pending} onClick={submit}>
          {pending ? 'שומר…' : submitLabel}
        </button>
        <button type="button" className={button} disabled={pending} onClick={onCancel}>
          ביטול
        </button>
      </div>
    </div>
  );
}

function PasswordReset({ pending, onSubmit, onCancel }: { pending: boolean; onSubmit: (password: string) => void; onCancel: () => void }) {
  const [password, setPassword] = useState(generatePassword);
  return (
    <div className="grid gap-3">
      <p className="text-sm text-neutral-muted">
        למשתמש ששכח את הסיסמה. הוא ינותק מכל מקום, ייכנס עם הסיסמה הזמנית ויחויב לבחור סיסמה חדשה.
      </p>
      <PasswordInput value={password} onChange={setPassword} />
      <div className="flex gap-2">
        <button type="button" className={primary} disabled={pending || password.length < MIN_PASSWORD_LENGTH} onClick={() => onSubmit(password)}>
          {pending ? 'שומר…' : 'קביעת הסיסמה הזמנית'}
        </button>
        <button type="button" className={button} disabled={pending} onClick={onCancel}>
          ביטול
        </button>
      </div>
    </div>
  );
}

/** What to send the person, shown once: the temporary password isn't stored anywhere readable. */
function HandoffCard({ handoff, onClose }: { handoff: Handoff; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  // The site's own address, even when the owner works from the App Hosting one.
  const origin = window.location.hostname.endsWith('.hosted.app') ? 'https://wings-re.co.il' : window.location.origin;
  const loginUrl = `${origin}/admin/login`;
  const message = [
    `שלום${handoff.name ? ` ${handoff.name}` : ''},`,
    handoff.isNew ? 'נפתח לך משתמש בממשק הניהול של אתר Wings.' : 'נקבעה לך סיסמה זמנית חדשה לממשק הניהול של אתר Wings.',
    `כניסה: ${loginUrl}`,
    `מייל: ${handoff.email}`,
    `סיסמה זמנית: ${handoff.password}`,
    'בכניסה הראשונה תתבקשו לבחור סיסמה משלכם.',
  ].join('\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-green-600/30 bg-green-50 p-5 md:p-6">
      <h2 className="text-lg font-semibold text-green-900">{handoff.isNew ? 'המשתמש נפתח' : 'הסיסמה הזמנית נקבעה'}</h2>
      <p className="mt-1 text-sm text-green-900/80">שלחו את הפרטים למשתמש. הסיסמה הזמנית מוצגת רק עכשיו.</p>
      <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-green-600/20 bg-white p-4 font-sans text-sm leading-relaxed text-primary-dark">{message}</pre>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={primary} onClick={copy}>
          {copied ? 'הועתק ✓' : 'העתקה'}
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={button}>
          שליחה בוואטסאפ
        </a>
        <a href={`mailto:${handoff.email}?subject=${encodeURIComponent('כניסה לממשק הניהול של Wings')}&body=${encodeURIComponent(message)}`} className={button}>
          שליחה במייל
        </a>
        <button type="button" className={button} onClick={onClose}>
          סגירה
        </button>
      </div>
    </div>
  );
}
