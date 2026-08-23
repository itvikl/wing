import { z } from 'zod';

export const projectItemSchema = z.object({
  title: z.string(),
  location: z.string(),
  description: z.string(),
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
});

export const whyUsItemSchema = z.object({ title: z.string(), body: z.string() });

export const teamMemberSchema = z.object({
  name: z.string(),
  initials: z.string(),
  role: z.string(),
  bio: z.string(),
});

export const navTextSchema = z.object({
  about: z.string(),
  advantages: z.string(),
  projects: z.string(),
  team: z.string(),
  contact: z.string(),
  cta: z.string(),
});

export const heroTextSchema = z.object({
  eyebrow: z.string(),
  headline: z.string(),
  subheadline: z.array(z.string()),
  cta: z.string(),
});

export const aboutTextSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  body: z.array(z.string()),
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
  items: z.array(projectItemSchema),
});

export const whyUsTextSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  items: z.array(whyUsItemSchema),
});

export const teamTextSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  members: z.array(teamMemberSchema),
});

export const leadFormTextSchema = z.object({
  eyebrow: z.string(),
  title: z.string(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  message: z.string(),
  submit: z.string(),
  success: z.string(),
  error: z.string(),
});

export const footerTextSchema = z.object({
  rights: z.string(),
  phone: z.string(),
  whatsapp: z.string(),
  phoneNumber: z.string(),
  whatsappLink: z.string(),
  facebookUrl: z.string(),
  instagramUrl: z.string(),
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
} as const;
export type TextSectionKey = keyof typeof TEXT_SECTION_SCHEMAS;
