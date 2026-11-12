import type { Metadata } from 'next';
import { Frank_Ruhl_Libre, Heebo } from 'next/font/google';
import localFont from 'next/font/local';
import '../globals.css';

export const metadata: Metadata = {
  title: 'ניהול תוכן — Wings',
  robots: { index: false, follow: false },
};

// The site's own fonts, so the previews read like the site (globals.css
// builds --font-display / --font-sans from these), with Heebo as the admin's
// interface font. Without them the whole admin fell back to the browser's
// default serif.
const didot = localFont({
  src: '../fonts/GFSDidot-latin.woff2',
  weight: '400',
  variable: '--font-didot',
  display: 'swap',
  adjustFontFallback: false,
});
const hebrewDisplay = Frank_Ruhl_Libre({ subsets: ['hebrew'], weight: ['500', '600', '700'], variable: '--font-hebrew-display', display: 'swap' });
const hebrewSans = Heebo({ subsets: ['hebrew', 'latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-hebrew-sans', display: 'swap' });

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${didot.variable} ${hebrewDisplay.variable} ${hebrewSans.variable}`}>
      <body className="antialiased [font-family:var(--font-hebrew-sans),system-ui,sans-serif]">{children}</body>
    </html>
  );
}
