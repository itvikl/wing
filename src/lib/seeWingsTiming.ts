// Shared scroll-timing constants for the SeeWings flythrough. Kept in a plain
// module (no 'use client') so the server-rendered page.tsx can compute the
// same trackVh as SeeWingsExperience itself without importing a function
// across the client-component boundary, which Next.js can't resolve at
// server-render time.

// Per-scene scroll length (in viewport-heights) — each dive gets its own
// SECTION_VH of scroll runway, not the full track, so the total track length
// scales with however many scenes are configured (SECTION_VH * sections.length).
// Raised from 4 to 5.5 to 9 over time so each scene takes longer to scroll
// through — it was reading as "flying by" immediately instead of settling
// into an experience. On mobile a single hard flick's scroll distance is
// fixed by the OS's own momentum physics, not by this constant — so the only
// lever that actually slows the *story* down relative to a flick is giving it
// more scroll runway to cover. At lower values a hard flick could blow past
// several chapters (captions flashing by unread, camera cuts feeling like a
// fast-forward) before momentum decayed. This was tried the other way first
// (a scroll-settle "snap back to the nearest caption") but that fought the
// reader's own scroll direction and felt worse than the problem it fixed —
// slowing the underlying pace is the more honest fix.
//
// Re-tuned when the flight collapsed from three 8s scenes plus two connectors
// back to ONE continuous 15s clip. With a single scene this constant IS the
// whole track length, and that length does double duty: it sets how far you
// scroll per second of video, and the cue overlay divides it into one window
// per caption (see SeeWingsCues).
//
// It went to 30 first, chosen to keep the caption windows exactly where the
// three-scene version had them (~5vh each). That was the wrong trade: at 30vh
// a 15s clip needs ~1840px of scroll per second of video, so on a desktop
// wheel the picture barely moved while you scrolled. 22 puts a wheel notch
// back at ~0.076s of video — matching what the old 8s dives actually felt
// like — and cuts scrubbing the full flight from ~460 notches to ~200, while
// still leaving each caption ~3.7vh to be read in. Paired with restoring
// Lenis' wheelMultiplier to 1 (see SmoothScrollProvider); the two were
// multiplying each other.
//
// NOTE this is still a PER-SCENE value — adding a second scene would double
// the track, so re-tune here if scenes ever return.
export const SECTION_VH = 22;

// Scroll length (vh) of a connector clip — the short bridging shot between
// two dives. Was 0.85 — at that length it blew past in a couple of scroll
// ticks; this slows the between-scene motion down to match the dives instead
// of whooshing past.
export const CONN_VH = 1.3;

// Total scroll length of the whole flight: every dive gets SECTION_VH, and
// every *actually present* connector (a null slot just crossfades directly,
// no extra scroll) gets CONN_VH. Shared between SeeWingsExperience and
// page.tsx so PortalReveal/ScrollProgress's own trackVh stays in sync with
// the real track length instead of drifting once connectors are added or removed.
export function computeTrackVh(sectionCount: number, connectors: (string | null)[]) {
  const connCount = connectors.filter(Boolean).length;
  return SECTION_VH * sectionCount + CONN_VH * connCount;
}
