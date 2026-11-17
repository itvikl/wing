import type { Metadata } from 'next';
import { didot, hebrewDisplay, hebrewSans, heeboLatin } from '@/lib/fonts';
import '../globals.css';

export const metadata: Metadata = {
  title: 'ניהול תוכן — Wings',
  robots: { index: false, follow: false },
};

// The site's own fonts, so the previews read like the site (globals.css
// builds --font-display / --font-sans from these), with Heebo as the admin's
// interface font. Without them the whole admin fell back to the browser's
// default serif.
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${didot.variable} ${hebrewDisplay.variable} ${hebrewSans.variable} ${heeboLatin.variable}`}>
      <body className="antialiased [font-family:var(--font-heebo-latin),var(--font-hebrew-sans),system-ui,sans-serif]">{children}</body>
    </html>
  );
}
