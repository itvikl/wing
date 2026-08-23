import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'ניהול תוכן — Wings',
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
