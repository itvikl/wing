import enJson from '@/messages/en.json';
import heJson from '@/messages/he.json';
import type { LocaleText, SiteContent, SiteText } from './schema';

const FOOTER_LINK_DEFAULTS = {
  phoneNumber: '',
  whatsappLink: '',
  facebookUrl: '',
  instagramUrl: '',
};

function withFooterDefaults(messages: typeof enJson | typeof heJson): LocaleText {
  return {
    ...messages,
    hero: { ...messages.hero, subheadline: [messages.hero.subheadline] },
    about: { ...messages.about, body: [messages.about.body] },
    footer: { ...messages.footer, ...FOOTER_LINK_DEFAULTS },
  } as unknown as LocaleText;
}

export const defaultText: SiteText = {
  en: withFooterDefaults(enJson),
  he: withFooterDefaults(heJson),
};

export const defaultContent: SiteContent = {
  text: defaultText,
  media: {
    logo: '/brand/logo.png',
    video: { poster: '/scroll-world/img/germancolony.webp' },
    projects: { items: defaultText.en.projects.items.map(() => null) },
    team: { members: defaultText.en.team.members.map(() => null) },
    seeWings: {
      sections: defaultText.en.seeWings.sections.map((s) => ({
        id: s.id,
        still: `/scroll-world/img/${s.id}.png`,
        clip: `/scroll-world/vid/${s.id}.mp4`,
        // Optional lighter phone encode — see seeWingsMediaSectionSchema. Unlike
        // `clip`/`still`, the engine does NOT fall back to the desktop file if
        // this 404s, so only default it where the phone file actually exists.
        clipMobile: `/scroll-world/vid/${s.id}.mobile.mp4`,
      })),
      connectors: [],
    },
  },
};
