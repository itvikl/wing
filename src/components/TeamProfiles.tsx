import Image from 'next/image';
import type { LocaleText } from '@/lib/content/schema';
import { Sized } from '@/lib/textSize';
import { WhatsAppGlyph } from './icons';

type Team = LocaleText['team'];

/** A personal WhatsApp from the admin: a wa.me link as typed, or a number made into one. */
function whatsappLink(value?: string) {
  const v = value?.trim();
  if (!v) return '';
  if (/^https?:\/\//.test(v)) return v;
  const digits = v.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

/**
 * The Team page: each person on their own (photo, role, years, languages,
 * bio, a line in their own words, direct WhatsApp and LinkedIn), then the
 * professionals the team works with. Every detail left empty in the admin is
 * left out; a member with no photo shows their initials.
 */
export function TeamProfiles({ team, images }: { team: Team; images: (string | null)[] }) {
  const members = team.members.filter((m) => m.name.trim());
  const partners = (team.partners ?? []).filter((p) => p.role.trim() || p.name.trim());
  const chip = 'rounded-full border border-white/20 px-3 py-1 text-sm text-neutral-100';

  return (
    <>
      <section className="mx-auto max-w-6xl px-6 pt-16 sm:pt-20 md:pt-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
          <span className="text-base uppercase tracking-[0.2em] text-accent-light md:text-lg"><Sized scale={team.sizes?.eyebrow}>{team.eyebrow}</Sized></span>
          <h1 className="font-display text-3xl font-semibold text-neutral-100 text-balance md:text-5xl"><Sized scale={team.sizes?.title}>{team.title}</Sized></h1>
          {team.intro && <p className="max-w-2xl text-lg leading-relaxed text-neutral-200">{team.intro}</p>}
        </div>

        <div className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {members.map((m, i) => {
            const image = images[team.members.indexOf(m)] ?? null;
            const wa = whatsappLink(m.whatsapp);
            const chips = [m.years, m.languages].filter((c): c is string => !!c?.trim());
            return (
              <article key={i} className="flex flex-col gap-4">
                <div className="relative aspect-[4/5] overflow-hidden rounded border-[3px] border-accent bg-black">
                  {image ? (
                    <Image src={image} alt={m.name} fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw" className="object-cover" unoptimized={image.startsWith('http')} />
                  ) : (
                    <span aria-hidden className="absolute inset-0 flex items-center justify-center bg-primary font-display text-5xl text-accent-light">{m.initials}</span>
                  )}
                </div>
                <div>
                  <h2 className="font-display text-2xl text-neutral-100"><Sized scale={m.sizes?.name}>{m.name}</Sized></h2>
                  <p className="mt-1 text-sm uppercase tracking-[0.16em] text-accent-light"><Sized scale={m.sizes?.role}>{m.role}</Sized></p>
                </div>
                {chips.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {chips.map((c) => <span key={c} className={chip}>{c}</span>)}
                  </div>
                )}
                {m.bio && <p className="text-lg leading-relaxed text-neutral-200"><Sized scale={m.sizes?.bio}>{m.bio}</Sized></p>}
                {m.quote && (
                  <blockquote className="border-s-2 border-accent ps-4 font-display text-lg italic leading-relaxed text-neutral-100">{m.quote}</blockquote>
                )}
                {(wa || m.linkedin) && (
                  <div className="mt-auto flex flex-wrap items-center gap-5 pt-1">
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-base text-accent-light hover:text-neutral-100">
                        <WhatsAppGlyph className="h-4 w-4" />
                        {team.whatsappLabel || 'WhatsApp'}
                      </a>
                    )}
                    {m.linkedin && (
                      <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className="text-base text-accent-light hover:text-neutral-100">
                        {team.linkedinLabel || 'LinkedIn'}
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {partners.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pt-24">
          <div className="rounded-3xl border border-white/10 bg-primary/80 p-8 backdrop-blur-xl md:p-10">
            {team.partnersEyebrow && <span className="text-sm uppercase tracking-[0.18em] text-accent-light">{team.partnersEyebrow}</span>}
            {team.partnersTitle && <h2 className="mt-2 font-display text-2xl font-semibold text-neutral-100 md:text-[28px]">{team.partnersTitle}</h2>}
            <ul className="mt-7 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {partners.map((p, i) => {
                const body = (
                  <>
                    <span className="block text-base text-neutral-100">{p.role}</span>
                    {p.name && <span className="mt-0.5 block text-sm text-neutral-200">{p.name}</span>}
                  </>
                );
                return (
                  <li key={i} className="rounded-2xl bg-white/5 p-4">
                    {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" className="block hover:text-accent-light">{body}</a> : body}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
      <div className="pb-20 md:pb-24" />
    </>
  );
}
