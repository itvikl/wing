import { requireOwner } from '@/lib/auth/session';
import { OWNER_ONLY_SECTIONS } from '@/lib/auth/roles';
import { envOwnerEmails, isEnvOwner, listUserRecords } from '@/lib/auth/users';
import { ADMIN_SECTIONS } from '@/lib/admin/sections';
import { UsersManager, type UserRow } from './UsersManager';

export default async function UsersPage() {
  const me = await requireOwner();
  const records = await listUserRecords();

  const rows: UserRow[] = records.map((r) => ({
    uid: r.uid,
    email: r.email,
    name: r.name,
    role: isEnvOwner(r.email) ? 'owner' : r.role,
    sections: r.sections,
    disabled: r.disabled && !isEnvOwner(r.email),
    mustChangePassword: r.mustChangePassword,
    lastLoginAt: r.lastLoginAt,
    envOwner: isEnvOwner(r.email),
    isMe: r.uid === me.uid,
  }));
  // Owners from the server settings who never signed in have no record yet.
  for (const email of envOwnerEmails()) {
    if (!rows.some((row) => row.email === email)) {
      rows.push({ uid: `env:${email}`, email, name: '', role: 'owner', sections: [], disabled: false, mustChangePassword: false, lastLoginAt: '', envOwner: true, isMe: false });
    }
  }

  const sectionOptions = ADMIN_SECTIONS.filter((s) => !(OWNER_ONLY_SECTIONS as readonly string[]).includes(s.key)).map((s) => ({
    key: s.key,
    label: s.label,
  }));

  return (
    <div className="max-w-5xl">
      <div className="border-b border-neutral-200 pb-6">
        <h1 className="text-2xl font-semibold text-primary-dark md:text-[28px]">משתמשים</h1>
        <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-neutral-muted">
          מי נכנס לממשק הניהול ומה מותר לו. פותחים משתמש עם סיסמה זמנית, ובכניסה הראשונה הוא בוחר סיסמה משלו.
        </p>
      </div>
      <UsersManager rows={rows} sectionOptions={sectionOptions} />
    </div>
  );
}
