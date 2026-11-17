import type { MetadataRoute } from 'next';

const SITE = 'https://wings-re.co.il';

// English lives at the root and Hebrew under /he (localePrefix: 'as-needed').
// The home page carries the highest priority so it, not an inner page, is the
// one search engines treat as the site's main entry.
const pages: { path: string; priority: number }[] = [
  { path: '', priority: 1 },
  { path: '/about', priority: 0.8 },
  { path: '/projects', priority: 0.8 },
  { path: '/why-us', priority: 0.7 },
  { path: '/team', priority: 0.7 },
  { path: '/faq', priority: 0.7 },
  { path: '/contact', priority: 0.7 },
  { path: '/accessibility', priority: 0.3 },
  { path: '/privacy', priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap(({ path, priority }) => {
    const en = `${SITE}${path || '/'}`;
    const he = `${SITE}/he${path}`;
    const alternates = { languages: { en, he } };
    return [
      { url: en, changeFrequency: 'weekly', priority, alternates },
      { url: he, changeFrequency: 'weekly', priority, alternates },
    ];
  });
}
