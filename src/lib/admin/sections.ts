/**
 * The admin's screens, grouped the way the site owner thinks about them:
 * the site's pages (in the order the site's menu shows them), then settings
 * that apply everywhere. `sitePath` is the page a screen edits, for its
 * "view on site" links.
 */
export type AdminSection = {
  key: string;
  href: string;
  label: string;
  description: string;
  sitePath?: string;
};

export const ADMIN_GROUPS: { title: string; sections: AdminSection[] }[] = [
  {
    title: 'עמודי האתר',
    sections: [
      { key: 'home', href: '/admin/content/home', label: 'עמוד הבית', description: 'מסך הפתיחה, הכיתובים שמתחלפים בזמן הגלילה, ותמונות וסרטוני הטיסה.', sitePath: '/' },
      { key: 'about', href: '/admin/content/about', label: 'אודות', description: 'מאיפה השם, סיפור ההקמה, תמונה משותפת, המשימה ועובדות על החברה.', sitePath: '/about' },
      { key: 'why-us', href: '/admin/content/why-us', label: 'למה Wings', description: 'היתרונות של העבודה איתכם.', sitePath: '/why-us' },
      { key: 'projects', href: '/admin/content/projects', label: 'הזדמנויות', description: 'כרטיסי הנכסים. בלי אף נכס, העמוד מוסתר מהתפריט.', sitePath: '/projects' },
      { key: 'team', href: '/admin/content/team', label: 'הצוות שלנו', description: 'פרופיל לכל איש צוות, ואנשי המקצוע שעובדים איתכם.', sitePath: '/team' },
      { key: 'faq', href: '/admin/content/faq', label: 'שאלות נפוצות', description: 'נושאים, שאלות ותשובות, והכרטיס שבצד.', sitePath: '/faq' },
      { key: 'lead-form', href: '/admin/content/lead-form', label: 'צור קשר', description: 'טופס הפנייה: השדות, השאלות, ההסכמה והודעת התודה.', sitePath: '/contact' },
      { key: 'legal', href: '/admin/content/legal', label: 'פרטיות ונגישות', description: 'מדיניות הפרטיות והצהרת הנגישות.', sitePath: '/privacy' },
    ],
  },
  {
    title: 'הגדרות כלליות',
    sections: [
      { key: 'contact', href: '/admin/content/footer', label: 'פרטי קשר', description: 'טלפון, וואטסאפ (כולל הכפתור הצף), מייל ורשתות חברתיות. מופיעים בכל האתר.' },
      { key: 'nav', href: '/admin/content/nav', label: 'תפריט ושמות עמודים', description: 'השמות שמופיעים בתפריט העליון ובכפתור יצירת הקשר.' },
      { key: 'brand', href: '/admin/content/brand', label: 'מיתוג', description: 'הלוגו שמופיע בראש כל העמודים.' },
    ],
  },
];

export const ADMIN_SECTIONS: AdminSection[] = ADMIN_GROUPS.flatMap((group) => group.sections);

export function adminSection(key: string): AdminSection {
  const section = ADMIN_SECTIONS.find((s) => s.key === key);
  if (!section) throw new Error(`Unknown admin section: ${key}`);
  return section;
}
