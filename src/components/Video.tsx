import { getTranslations, getLocale } from 'next-intl/server';
import { getSiteMedia } from '@/lib/content/store';
import { VideoContent } from './VideoContent';

export async function Video() {
  const t = await getTranslations('video');
  const locale = await getLocale();
  const media = await getSiteMedia();
  const href = locale === 'en' ? '/see-wings' : `/${locale}/see-wings`;

  return <VideoContent eyebrow={t('eyebrow')} title={t('title')} cta={t('cta')} href={href} poster={media.video.poster} />;
}
