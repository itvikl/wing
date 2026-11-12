import { SectionHeader } from '@/components/admin/SectionHeader';
import { getContent, getLocaleText } from '@/lib/content/store';
import { HeroForm } from '../hero/Form';
import { SeeWingsForm } from '../see-wings/Form';

/**
 * The home page in one screen: the opening screen (what used to be "Hero")
 * and the flight's captions and media (what used to be "See Wings"). Each
 * part keeps its own form and save.
 */
export default async function HomeAdminPage() {
  const content = await getContent();
  // The text as the site shows it, so a first caption that still echoes the
  // opening screen (saved before it had its own fields) opens with what's live.
  const [he, en] = await Promise.all([getLocaleText('he'), getLocaleText('en')]);

  return (
    <div>
      <SectionHeader sectionKey="home" />

      <section id="opening" className="mt-10 scroll-mt-6">
        <h2 className="text-xl font-semibold text-primary-dark">1 · מסך הפתיחה</h2>
        <p className="mt-1 text-sm text-neutral-muted">הלוגו, הכותרת הקטנה והכותרת שמופיעים בכניסה לאתר, לפני שמתחילים לגלול.</p>
        <HeroForm
          initial={{ he: content.text.he.hero, en: content.text.en.hero }}
          // The flight's form saves both languages together, so one flag says it.
          firstCueOwn={!!content.text.he.seeWings.firstCueOwn}
        />
      </section>

      <section id="flight" className="mt-16 scroll-mt-6 border-t border-neutral-200 pt-10">
        <h2 className="text-xl font-semibold text-primary-dark">2 · הטיסה: כיתובים, תמונות וסרטונים</h2>
        <p className="mt-1 text-sm text-neutral-muted">הכיתובים שמתחלפים בזמן הגלילה, והתמונות והסרטונים של הטיסה.</p>
        <SeeWingsForm initial={{ he: he.seeWings, en: en.seeWings, media: content.media.seeWings }} />
      </section>
    </div>
  );
}
