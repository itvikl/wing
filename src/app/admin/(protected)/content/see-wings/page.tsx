import { getContent, getLocaleText } from '@/lib/content/store';
import { SeeWingsForm } from './Form';

export default async function SeeWingsAdminPage() {
  const content = await getContent();
  // The text as the site shows it, so a first cue that still echoes Hero
  // (saved before it had its own fields) opens with what's actually live.
  const [he, en] = await Promise.all([getLocaleText('he'), getLocaleText('en')]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">הטיסה הקולנועית (See Wings)</h1>
      <p className="mt-2 text-neutral-muted">חוויית הגלילה עם תמונות/סרטוני הסצנות, המעברים ביניהן, והכותרות המתחלפות.</p>
      <SeeWingsForm
        initial={{
          he: he.seeWings,
          en: en.seeWings,
          media: content.media.seeWings,
        }}
      />
    </div>
  );
}
