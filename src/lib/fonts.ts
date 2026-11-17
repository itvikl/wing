import localFont from 'next/font/local';

// Every font is a file in src/app/fonts, never fetched from Google during the
// build: on 2026-11-17 Google Fonts answered the build server with something
// next/font/google couldn't parse and every deploy failed. These are the same
// files Google serves (OFL), so the site looks exactly as before.

// Google's latin cut of GFS Didot: next/font/google only knows the font's
// greek subset, so it would never preload the one this site reads in.
export const didot = localFont({
  src: '../app/fonts/GFSDidot-latin.woff2',
  weight: '400',
  variable: '--font-didot',
  display: 'swap',
  // The generated metric-matched fallback is local Times New Roman for every
  // character, Hebrew included, so it would win over the Hebrew fonts below.
  adjustFontFallback: false,
});

// GFS Didot has no Hebrew glyphs, so Hebrew falls through to these, character
// by character: see --font-display and --font-sans in globals.css.
// Both are variable fonts: one file covers the weight range.
export const hebrewDisplay = localFont({
  src: '../app/fonts/FrankRuhlLibre-hebrew.woff2',
  weight: '500 700',
  variable: '--font-hebrew-display',
  display: 'swap',
});

export const hebrewSans = localFont({
  src: '../app/fonts/Heebo-hebrew.woff2',
  weight: '300 700',
  variable: '--font-hebrew-sans',
  display: 'swap',
});

// Heebo's latin cut, for the admin's interface (English, numbers, emails).
export const heeboLatin = localFont({
  src: '../app/fonts/Heebo-latin.woff2',
  weight: '300 700',
  variable: '--font-heebo-latin',
  display: 'swap',
  // Its generated fallback is local Arial for every character, so Hebrew
  // would stop there instead of reaching Heebo's Hebrew cut.
  adjustFontFallback: false,
});
