import { getTranslations } from 'next-intl/server';
import { Reveal } from './motion/Reveal';

export async function About() {
  const t = await getTranslations('about');
  const paragraphs = t.raw('body') as string[];

  return (
    <section id="about" className="bg-neutral-bg py-16 sm:py-20 md:py-24">
      <Reveal className="mx-auto max-w-3xl px-6 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-accent-dark">{t('eyebrow')}</span>
        <h2 className="mt-4 font-display text-3xl font-semibold text-primary-dark text-balance md:text-4xl">
          {t('title')}
        </h2>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mx-auto mt-6 max-w-2xl text-neutral-muted md:text-lg">
            {paragraph}
          </p>
        ))}
      </Reveal>
    </section>
  );
}
