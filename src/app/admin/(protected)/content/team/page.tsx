import { getContent } from '@/lib/content/store';
import { TeamForm } from './Form';

export default async function TeamAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">הצוות</h1>
      <p className="mt-2 text-neutral-muted">
        אנשי הצוות המוצגים באתר. אפשר להוסיף תמונת פרופיל לכל אחד — בלי תמונה יוצג עיגול עם ראשי תיבות.
      </p>
      <TeamForm
        initial={{
          he: content.text.he.team,
          en: content.text.en.team,
          images: content.media.team.members,
        }}
      />
    </div>
  );
}
