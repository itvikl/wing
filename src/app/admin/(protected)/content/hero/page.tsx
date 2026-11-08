import { getContent } from '@/lib/content/store';
import { HeroForm } from './Form';

export default async function HeroAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">ראשי (Hero)</h1>
      <p className="mt-2 text-neutral-muted">מסך הפתיחה: הלוגו, התגית והכותרת שמופיעים בכניסה לאתר, לפני שמתחילים לגלול.</p>
      <HeroForm
        initial={{ he: content.text.he.hero, en: content.text.en.hero }}
        // The See Wings page saves both locales together, so one flag says it.
        firstCueOwn={!!content.text.he.seeWings.firstCueOwn}
      />
    </div>
  );
}
