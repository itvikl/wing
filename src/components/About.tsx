import Image from 'next/image';
import { getLocale } from 'next-intl/server';
import { getLocaleText } from '@/lib/content/store';
import type { ContentLocale } from '@/lib/content/schema';
import { Sized } from '@/lib/textSize';
import { localePath } from '@/lib/contact';

/**
 * The About page: where the name comes from (the verse), how the three
 * partners started Wings, their shared photo, the mission, facts about the
 * company and a closing call. Its scope is the company's story; each person's
 * profile lives on the Team page, the advantages and process on Why Wings.
 * Every block is skipped when its admin fields are empty, so a missing fact
 * never shows as a gap or a placeholder.
 */
export async function About() {
  const locale = await getLocale();
  const a = (await getLocaleText(locale as ContentLocale)).about;
  const verse = a.body.filter((line) => line.trim());
  const story = a.story.filter((p) => p.trim());
  const facts = [
    { label: a.foundedLabel, value: a.founded },
    { label: a.officeLabel, value: a.office },
    { label: a.licenseLabel, value: a.license },
  ].filter((f) => f.value.trim());

  const rule = <div aria-hidden className="h-px w-14 bg-accent" />;
  const eyebrow = 'text-sm uppercase tracking-[0.22em] text-accent-light rtl:tracking-[0.12em]';
  const underlined = 'border-b border-accent-light/60 pb-1 transition-colors hover:text-accent-light';

  return (
    <>
      {/* 1 · The name */}
      <section className="relative flex min-h-[620px] items-center justify-center overflow-hidden px-6 py-24 text-center md:min-h-[760px]">
        <div className="relative flex max-w-4xl flex-col items-center">
          {a.eyebrow && <span className={eyebrow}><Sized scale={a.sizes?.eyebrow}>{a.eyebrow}</Sized></span>}
          {a.title && (
            <h1 className="mt-5 font-display text-5xl font-semibold leading-none text-neutral-100 md:text-7xl">
              <Sized scale={a.sizes?.title}>{a.title}</Sized>
            </h1>
          )}
          {verse.length > 0 && (
            <>
              <div className="mt-9">{rule}</div>
              <blockquote className="mt-9">
                <p lang="he" dir="rtl" className="font-display text-2xl leading-relaxed text-neutral-100 md:text-[38px] md:leading-[1.55]">
                  <Sized scale={a.sizes?.body}>
                    ״{verse.map((line, i) => (
                      <span key={i}>
                        {i > 0 && <br />}
                        {line.replace(/^[״"]|[״".]+$/g, '')}
                      </span>
                    ))}״
                  </Sized>
                </p>
                {a.verseSource && <footer className="mt-3.5 text-sm tracking-[0.08em] text-accent-light">{a.verseSource}</footer>}
              </blockquote>
            </>
          )}
          {a.verseTranslation && (
            <p dir="auto" className="mt-5 font-display text-lg italic text-neutral-100/70 md:text-xl">{a.verseTranslation}</p>
          )}
          {a.nameLine && <p className="mt-11 max-w-2xl text-lg font-light leading-relaxed text-neutral-100 md:text-[21px]">{a.nameLine}</p>}
        </div>
        <div aria-hidden className="absolute bottom-0 left-1/2 h-20 w-px bg-gradient-to-b from-accent/0 to-accent" />
      </section>

      {/* 2 · How it began */}
      {(a.storyTitle || story.length > 0) && (
        <section className="mx-auto grid max-w-6xl gap-10 px-6 pt-24 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:gap-24 md:pt-28">
          <div>
            {a.storyEyebrow && <span className={eyebrow}>{a.storyEyebrow}</span>}
            {a.storyTitle && <h2 className="mt-4 font-display text-4xl font-semibold leading-tight text-neutral-100 md:text-[46px]">{a.storyTitle}</h2>}
            <div className="mt-7">{rule}</div>
          </div>
          <div className="flex flex-col gap-6 text-lg font-light leading-[1.85] text-neutral-200 md:text-xl">
            {story.map((p, i) => <p key={i}>{p}</p>)}
            {a.storyClosing && <p className="font-display text-2xl font-medium leading-snug text-neutral-100 md:text-[26px]">{a.storyClosing}</p>}
          </div>
        </section>
      )}

      {/* 3 · The partners together */}
      {(a.photo || a.teamLink) && (
        <section className="mx-auto max-w-6xl px-6 pt-24 md:pt-28">
          {a.photo && (
            <figure>
              <div className="relative aspect-[16/9] overflow-hidden rounded border-[3px] border-accent bg-primary">
                <Image src={a.photo} alt={a.photoCaption || ''} fill sizes="(min-width: 1152px) 1104px, 100vw" className="object-cover" unoptimized={a.photo.startsWith('http')} />
              </div>
              {a.photoCaption && <figcaption className="mt-4 text-base text-neutral-200">{a.photoCaption}</figcaption>}
            </figure>
          )}
          {a.teamLink && (
            <a href={localePath(locale, '/team')} className={`mt-5 inline-block text-lg text-accent-light ${underlined}`}>
              {a.teamLink} <span aria-hidden>{locale === 'he' ? '←' : '→'}</span>
            </a>
          )}
        </section>
      )}

      {/* 4 · Mission */}
      {a.mission && (
        <section className="mx-auto max-w-4xl px-6 pt-28 text-center md:pt-32">
          {a.missionEyebrow && <span className={eyebrow}>{a.missionEyebrow}</span>}
          <p className="mt-5 font-display text-3xl font-medium leading-snug text-neutral-100 md:text-[44px] md:leading-[1.3]">{a.mission}</p>
        </section>
      )}

      {/* 5 · Facts */}
      {facts.length > 0 && (
        <section className={`mx-auto grid max-w-6xl gap-10 px-6 pt-24 md:pt-28 ${facts.length === 3 ? 'md:grid-cols-3' : facts.length === 2 ? 'md:grid-cols-2' : ''}`}>
          {facts.map((f) => (
            <div key={f.label} className="border-t border-accent pt-5">
              <div className="text-sm uppercase tracking-[0.18em] text-accent-light rtl:tracking-[0.1em]">{f.label}</div>
              <div className="mt-2 font-display text-2xl text-neutral-100 md:text-3xl">{f.value}</div>
            </div>
          ))}
        </section>
      )}

      {/* 6 · Closing */}
      <section className="mx-auto mt-24 flex max-w-6xl flex-col items-start gap-6 border-t border-white/10 px-6 py-16 md:mt-28 md:flex-row md:items-center md:justify-between">
        {a.closingTitle && <h2 className="font-display text-3xl font-semibold text-neutral-100 md:text-4xl">{a.closingTitle}</h2>}
        <div className="flex flex-wrap items-center gap-8">
          {a.closingWhy && (
            <a href={localePath(locale, '/why-us')} className={`text-lg text-neutral-100 ${underlined}`}>
              {a.closingWhy} <span aria-hidden>{locale === 'he' ? '←' : '→'}</span>
            </a>
          )}
          {a.closingCall && (
            <a href={localePath(locale, '/contact')} className="flex h-[54px] items-center bg-accent px-8 text-lg font-medium text-primary-dark transition-colors hover:bg-accent-light">
              {a.closingCall}
            </a>
          )}
        </div>
      </section>
    </>
  );
}
