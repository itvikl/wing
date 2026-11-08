import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Every page renders per request (content lives in Firestore), but the
    // browser's router kept each visited page for 30s and served that copy on
    // a link back to it. In the admin that meant: save, open another section,
    // come back, and the form showed the old values; saving again wrote them
    // back over the edit. On the site, an open tab showed old copy the same way.
    staleTimes: { dynamic: 0 },
  },
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
