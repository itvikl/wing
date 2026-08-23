import { getContent } from '@/lib/content/store';
import { MapForm } from './Form';

export default async function MapAdminPage() {
  const content = await getContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary-dark">מפה</h1>
      <p className="mt-2 text-neutral-muted">כותרות קטע המפה האינטראקטיבית.</p>
      <MapForm initial={{ he: content.text.he.map, en: content.text.en.map }} />
    </div>
  );
}
