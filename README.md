# Wings Real Estate — Website

Next.js 14 (App Router) + TypeScript + Tailwind + next-intl (EN/HE, RTL) + Firebase.

## Status: M1 — project shell

Built so far: i18n/RTL routing, brand design tokens, fonts, Header/Footer,
Hero/About/Why-Us/Lead-form sections with real copy, Firebase client + admin
SDK wiring (no credentials yet).

Not yet wired: lead submission to Firestore/CRM (M3), admin dashboard (M4–M5),
marketing video / interactive map / featured projects sections (M2).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Firebase config once the project exists
npm run dev
```

Visit `http://localhost:3000` (English) or `http://localhost:3000/he` (Hebrew).

## Environment variables

See `.env.example`. The `NEXT_PUBLIC_FIREBASE_*` values come from Firebase
Console → Project settings → General → Your apps. The `FIREBASE_ADMIN_*`
values come from Project settings → Service accounts → Generate new private
key — keep these secret, never commit `.env.local`.

`CRM_API_URL` / `CRM_API_KEY` are left blank until the client's IT contact
provides integration details; until then leads are stored in Firestore only.
