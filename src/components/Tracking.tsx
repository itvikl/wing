'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { captureAttribution, trackEvent } from '@/lib/tracking';

/**
 * Meta Pixel (when `pixelId` is set), first-touch campaign attribution, and a
 * Contact event for every phone, WhatsApp or email link clicked anywhere on
 * the site — the floating button, the footer, the header and the flight's
 * topbar alike, without each having to report itself.
 */
export function Tracking({ pixelId }: { pixelId?: string }) {
  const pathname = usePathname();
  const countedPath = useRef(pathname);

  useEffect(() => {
    captureAttribution();
  }, []);

  // The snippet below counts the first page view; client-side navigations
  // between pages count their own. Keyed on the path itself, so an effect
  // that runs twice (React's dev Strict Mode) still counts a page once.
  useEffect(() => {
    if (countedPath.current === pathname) return;
    countedPath.current = pathname;
    window.fbq?.('track', 'PageView');
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a');
      const href = link?.getAttribute('href') ?? '';
      const method = href.startsWith('tel:')
        ? 'phone'
        : /(^https?:\/\/)?(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)/.test(href)
          ? 'whatsapp'
          : href.startsWith('mailto:')
            ? 'email'
            : null;
      if (method) trackEvent('Contact', { method });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  if (!pixelId || !/^\d+$/.test(pixelId)) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- Meta's no-JS beacon, not content */}
        <img height="1" width="1" style={{ display: 'none' }} alt="" src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  );
}
