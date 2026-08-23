import { getContent } from '@/lib/content/store';
import { SeeWingsForm } from './Form';

export default async function SeeWingsAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">הטיסה הקולנועית (See Wings)</h1>
      <p className="mt-2 text-neutral-muted">חוויית הגלילה עם תמונות/סרטוני הסצנות, המעברים ביניהן, והכותרות המתחלפות.</p>
      <SeeWingsForm
        initial={{
          he: content.text.he.seeWings,
          en: content.text.en.seeWings,
          hero: {
            he: { eyebrow: content.text.he.hero.eyebrow, headline: content.text.he.hero.headline },
            en: { eyebrow: content.text.en.hero.eyebrow, headline: content.text.en.hero.headline },
          },
          media: content.media.seeWings,
        }}
      />
    </div>
  );
}
