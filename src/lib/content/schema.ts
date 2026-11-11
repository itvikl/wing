import { z } from 'zod';

// Per-field text size, as a multiple of the size the site's design gives that
// text (1 = as designed), keyed by field name: { title: 1.2, body: 0.9 }. Kept
// on the object whose text it sizes (a section, or a list item, so it moves
// with the item when the list is reordered) and per language, since Hebrew
// and English set in different typefaces. A reset is stored as 1, not by
// dropping the key: saves merge into Firestore, which would keep a removed key.
const textSizesSchema = z.record(z.string(), z.number().min(0.5).max(2.5)).optional();

export const projectItemSchema = z.object({
  title: z.string(),
  location: z.string(),
  description: z.string(),
  sizes: textSizesSchema,
});

export const seeWingsSectionTextSchema = z.object({
  id: z.string(),
  label: z.string(),
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
  tags: z.array(z.string()),
});

export const cueExtraFieldSchema = z.object({
  label: z.string(),
  value: z.string(),
});

export const cueSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  body: z.string().default(''),
  // Freeform label/value pairs an admin can add per-cue without a code change —
  // rendered on the site as small labeled lines below the body text.
  extra: z.array(cueExtraFieldSchema).default([]),
  sizes: textSizesSchema,
});

export const whyUsItemSchema = z.object({ title: z.string(), body: z.string(), sizes: textSizesSchema });

export const teamMemberSchema = z.object({
  name: z.string(),
  initials: z.string(),
  role: z.string(),
  bio: z.string(),
  sizes: textSizesSchema,
});

export const navTextSchema = z.object({
  about: z.string(),
  advantages: z.string(),
  projects: z.string(),
  team: z.string(),
  contact: z.string(),
  cta: z.string(),
  sizes: textSizesSchema,
});

export const heroTextSchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  subheadline: z.array(z.string()),
  cta: z.string(),
  sizes: textSizesSchema,
});

export const aboutTextSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  body: z.array(z.string()),
  sizes: textSizesSchema,
});

export const videoTextSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  cta: z.string(),
});

export const seeWingsTextSchema = z.object({
  sections: z.array(seeWingsSectionTextSchema),
  ctaPrimary: z.string(),
  ctaSecondary: z.string(),
  cues: z.array(cueSchema),
  // Set once the first cue has been saved as copy of its own. Until then it
  // echoes Hero (see getLocaleText), as it did before it could be edited.
  firstCueOwn: z.boolean().optional(),
  sizes: textSizesSchema,
});

export const mapTextSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
});

export const projectsTextSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  cta: z.string(),
  viewDetails: z.string(),
  close: z.string(),
  // Shown on /projects when no opportunity is published. Optional: content
  // saved before it existed has no such key (the defaults fill it in).
  empty: z.string().optional(),
  items: z.array(projectItemSchema),
  sizes: textSizesSchema,
});

export const whyUsTextSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  items: z.array(whyUsItemSchema),
  sizes: textSizesSchema,
});

export const teamTextSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  members: z.array(teamMemberSchema),
  sizes: textSizesSchema,
});

export const leadFormTextSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  message: z.string(),
  // International buyers: a dial-code picker beside the phone, the hour that
  // suits them for a call (their own time zone is detected and sent along),
  // and three qualifying questions. Each select's choices are edited per
  // language; the chosen label is what the lead records.
  country: z.string(),
  callTime: z.string(),
  callTimeOptions: z.array(z.string()),
  timezoneNote: z.string(),
  budget: z.string(),
  budgetOptions: z.array(z.string()),
  timeline: z.string(),
  timelineOptions: z.array(z.string()),
  purpose: z.string(),
  purposeOptions: z.array(z.string()),
  // Marketing opt-in, unticked by default and separate from sending the form
  // (Israel's Communications Law, s.30A). `privacyNote` + `privacyLink` sit
  // under the button: "By sending you agree to our" + "Privacy Policy".
  consent: z.string(),
  privacyNote: z.string(),
  privacyLink: z.string(),
  submit: z.string(),
  success: z.string(),
  successWhatsapp: z.string(),
  error: z.string(),
  sizes: textSizesSchema,
});

export const footerTextSchema = z.object({
  rights: z.string(),
  phone: z.string(),
  whatsapp: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  whatsappLink: z.string(),
  emailAddress: z.string(),
  // Prefilled first line of a WhatsApp chat opened from the site.
  whatsappMessage: z.string(),
  facebookUrl: z.string(),
  instagramUrl: z.string(),
  sizes: textSizesSchema,
});

/**
 * The privacy policy and accessibility statement pages. A paragraph that
 * starts with "## " renders as a heading, so each page is one editable list.
 */
export const legalTextSchema = z.object({
  privacyTitle: z.string(),
  privacy: z.array(z.string()),
  accessibilityTitle: z.string(),
  accessibility: z.array(z.string()),
});

export const localeTextSchema = z.object({
  nav: navTextSchema,
  hero: heroTextSchema,
  about: aboutTextSchema,
  video: videoTextSchema,
  seeWings: seeWingsTextSchema,
  map: mapTextSchema,
  projects: projectsTextSchema,
  whyUs: whyUsTextSchema,
  team: teamTextSchema,
  leadForm: leadFormTextSchema,
  footer: footerTextSchema,
  legal: legalTextSchema,
});
export type LocaleText = z.infer<typeof localeTextSchema>;

export const siteTextSchema = z.object({
  en: localeTextSchema,
  he: localeTextSchema,
});
export type SiteText = z.infer<typeof siteTextSchema>;

export const seeWingsMediaSectionSchema = z.object({
  id: z.string(),
  still: z.string(),
  clip: z.string(),
  // Lighter phone-only encodes (~720p, tight GOP) so scroll-scrubbing the dive
  // doesn't force a full-res desktop download over cellular. Optional — the
  // engine falls back to `still`/`clip` on phones when these aren't set.
  stillMobile: z.string().optional(),
  clipMobile: z.string().optional(),
});
export type SeeWingsMediaSection = z.infer<typeof seeWingsMediaSectionSchema>;

export const siteMediaSchema = z.object({
  logo: z.string(),
  video: z.object({ poster: z.string() }),
  projects: z.object({ items: z.array(z.string().nullable()) }),
  team: z.object({ members: z.array(z.string().nullable()) }),
  seeWings: z.object({
    sections: z.array(seeWingsMediaSectionSchema),
    connectors: z.array(z.string().nullable()),
  }),
});
export type SiteMedia = z.infer<typeof siteMediaSchema>;

export const siteContentSchema = z.object({
  text: siteTextSchema,
  media: siteMediaSchema,
});
export type SiteContent = z.infer<typeof siteContentSchema>;

export const locales = ['en', 'he'] as const;
export type ContentLocale = (typeof locales)[number];

/** Section keys editable one-at-a-time from the admin (excludes `nav`, edited on its own page too). */
export const TEXT_SECTION_SCHEMAS = {
  nav: navTextSchema,
  hero: heroTextSchema,
  about: aboutTextSchema,
  video: videoTextSchema,
  map: mapTextSchema,
  projects: projectsTextSchema,
  whyUs: whyUsTextSchema,
  team: teamTextSchema,
  leadForm: leadFormTextSchema,
  footer: footerTextSchema,
  seeWings: seeWingsTextSchema,
  legal: legalTextSchema,
} as const;
export type TextSectionKey = keyof typeof TEXT_SECTION_SCHEMAS;

export type TextSizes = z.infer<typeof textSizesSchema>;
