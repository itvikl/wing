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
//
// Halved from 22 once the idle-snap landed (see STATION_REST_S below): the
// long track existed to stop captions flashing by unread on a fast flick —
// but once every flick settles on a clean station regardless of speed, that
// job belongs to the snap, not to sheer scroll distance. 22vh of effort to
// get through four stations read as "a lot" on its own. Re-tune by feel.
export const SECTION_VH = 11;

// Where each caption window starts and ends, in seconds of the flight clip.
// The clip scrubs linearly against scroll (no linger — see SeeWingsExperience),
// so a point in the video and a point on the track are the same fraction.
//
// Cut down from six equal-ish slices to four narrative beats (alley+boulevard
// "old meets new Jerusalem" / the building reveal+climb / the roof & view /
// the penthouse+CTA), AND re-picked against a per-frame blur measurement of
// main.mp4 (ffmpeg blurdetect), not just content — the render's motion blur
// tracks camera speed, so a boundary placed mid-move lands on a soft frame.
// Each window's steady "resting" caption now centers on a frame that's
// actually sharp: ~0s (4.7 blur, sharpest in the clip), ~5.2s (6.2, building
// + WINGS sign legible), ~10.1s (5.3, aerial pool/skyline), ~14.9s (6.0,
// living room). The facade climb (~6.5-9.5s, blur up to 11.3) has NO sharp
// frame at any timestamp — it's left as a pure transition between windows 2
// and 3 instead of a rest point, by design, not an oversight.
// Re-cut these whenever the clip is re-rendered. SeeWingsCues falls back to
// equal windows if the admin's cue count ever stops matching.
export const FLIGHT_SECONDS = 15;
export const CUE_BEATS_S = [0, 3.5, 8.8, 12.3, 15];

// Scoped crop for the boulevard reveal (~2.3-6.0s): foreground pedestrians
// walk through the bottom ~10% of frame right where the WINGS sign sits.
// object-position can't fix this — on a typical desktop viewport (shorter
// than 16:9) object-fit:cover already crops the SIDES, not top/bottom, so a
// vertical object-position shift has nothing to move (verified against the
// live engine, not assumed). This instead scales the clip up, top-anchored,
// for just this window — see scrollWorld.js's zoomForTime/zoomBeats — so the
// extra height is pushed off the bottom instead of split across all 4 edges.
// scale 1.12 derived from where the walkers actually sit in main.mp4: they
// start around 90% down the frame, and 0.90 * 1.12 ≈ 1.0 pushes that band
// just past the bottom edge while the sign (~85% down) stays in frame.
// Re-derive both the window and scale if the clip is ever re-rendered.
export const BOULEVARD_ZOOM = { from: 2.3, to: 6.0, scale: 1.12 };

// The flight's stop points, on mouse/trackpad only: each wheel burst / arrow
// key flies to the next one (scrollWorld.js's step-scroll), and a scrollbar
// drag settles on the nearest once it goes idle (its idle-snap) — both read
// the restBeats config. Touch devices scrub freely (see SeeWingsExperience).
// Deliberately NOT evenly spaced and NOT the
// CUE_BEATS_S boundaries: these are the same per-frame-sharp timestamps
// CUE_BEATS_S's windows were built around (see its comment), picked by
// content, not by a fixed interval — the climb has no sharp frame at any
// timestamp, so it's never a landing spot, only ever crossed mid-transition.
// 3.0 was picked by hand (the boulevard opening up with the tower at its end)
// rather than by sharpness, so it doesn't follow the rule above.
export const STATION_REST_S = [0, 3.0, 5.2, 10.1, 14.9];

// Sharp re-renders of the clip's own frame at a stop, faded in over the video
// while the flight rests there (scrollWorld.js's restStills). For stops where
// the camera is mid-move and the footage itself is motion-blurred.
export const STATION_STILLS = [{ t: 3.0, src: '/scroll-world/img/stop-3.0.jpg' }];

// How fast a step plays the flight between two stops, as a multiple of the
// clip's own speed: 1 = real time, so a hop across 4.9s of footage takes 4.9s.
// A flat 1.6s per step (~3x real time on the long hops) read as rushing past.
export const STEP_PLAYBACK_RATE = 1;

// Scroll length (vh) of a connector clip — the short bridging shot between
// two dives. Was 0.85 — at that length it blew past in a couple of scroll
// ticks; this slows the between-scene motion down to match the dives instead
// of whooshing past.
export const CONN_VH = 1.3;

// The viewport height the flight's track was laid out against, in px. Use
// this, not window.innerHeight, wherever a vh value from this file becomes a
// scroll position. On Android Chrome the URL bar slides away after the first
// scroll and innerHeight grows ~80px, but scrollWorld.js deliberately keeps
// its layout (relaying out would yank the scroll position). Measured against
// the live height, the overlays put the end of the flight 22 × 80px past the
// engine's: the last caption stayed up over the lead form after the hand-off.
export function flightVh() {
  if (typeof window === 'undefined') return 1;
  return (window as Window & { __swVh?: number }).__swVh ?? window.innerHeight;
}

// Total scroll length of the whole flight: every dive gets SECTION_VH, and
// every *actually present* connector (a null slot just crossfades directly,
// no extra scroll) gets CONN_VH. Shared between SeeWingsExperience and
// page.tsx so PortalReveal/ScrollProgress's own trackVh stays in sync with
// the real track length instead of drifting once connectors are added or removed.
export function computeTrackVh(sectionCount: number, connectors: (string | null)[]) {
  const connCount = connectors.filter(Boolean).length;
  return SECTION_VH * sectionCount + CONN_VH * connCount;
}
