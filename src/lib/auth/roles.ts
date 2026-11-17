/**
 * Who may do what in the admin. Shared by the server (which enforces it) and
 * the admin screens (which only hide what the server would refuse anyway).
 *
 * - owner: everything, including the users screen and the site-wide settings.
 * - editor: every page's content, and publishing projects.
 * - limited: only the sections ticked for them, and never publishing.
 */

export const ROLES = ['owner', 'editor', 'limited'] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'בעלים',
  editor: 'עורך',
  limited: 'עורך מוגבל',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: 'הכול, כולל ניהול משתמשים, מיתוג, פרטי קשר ופרטיות ונגישות.',
  editor: 'עריכת כל עמודי האתר ופרסום פרויקטים.',
  limited: 'רק החלקים שמסמנים לו. יכול לערוך, לא לפרסם או למחוק פרויקטים.',
};

/** Site-wide settings only an owner touches: they change every page at once. */
export const OWNER_ONLY_SECTIONS = ['contact', 'brand', 'legal'] as const;

/** What a screen needs to know about the person using it. */
export type AdminAccess = { role: Role; sections: string[] };

export function canEditSection(access: AdminAccess, sectionKey: string): boolean {
  if (access.role === 'owner') return true;
  if ((OWNER_ONLY_SECTIONS as readonly string[]).includes(sectionKey)) return false;
  if (access.role === 'editor') return true;
  return access.sections.includes(sectionKey);
}

/** Publishing, unpublishing and deleting a project: what changes the live site's project list. */
export function canPublish(access: AdminAccess): boolean {
  return access.role === 'owner' || access.role === 'editor';
}

export function canManageUsers(access: AdminAccess): boolean {
  return access.role === 'owner';
}

export const MIN_PASSWORD_LENGTH = 8;
