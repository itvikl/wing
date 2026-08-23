import { getContent } from '@/lib/content/store';
import { VideoForm } from './Form';

export default async function VideoAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">קטע הווידאו</h1>
      <p className="mt-2 text-neutral-muted">התצוגה המקדימה שמובילה לחוויית &quot;הטיסה הקולנועית&quot;.</p>
      <VideoForm
        initial={{ text: { he: content.text.he.video, en: content.text.en.video }, poster: content.media.video.poster }}
      />
    </div>
  );
}
