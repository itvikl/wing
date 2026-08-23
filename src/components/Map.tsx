import { getTranslations } from 'next-intl/server';
import { MapSection } from './MapSection';

type Pin = { title: string; location: string };

export async function Map() {
  const tMap = await getTranslations('map');
  const tProjects = await getTranslations('projects');
  const pins = tProjects.raw('items') as Pin[];

  return <MapSection eyebrow={tMap('eyebrow')} title={tMap('title')} pins={pins} />;
}
