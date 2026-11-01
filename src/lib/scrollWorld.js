/* ============================================================================
   scroll-world — portable scroll-scrubbed camera-flight engine
   ----------------------------------------------------------------------------
   Framework-agnostic. Vanilla JS, zero dependencies. It builds its own DOM and
   injects its own (namespaced) CSS into a container you give it, so it drops into
   plain HTML, Next.js (call from a ref/useEffect), Vue (onMounted), a server-
   rendered page, anything.

   USAGE
     mountScrollWorld(document.getElementById('world'), {
       brand: { name: 'Pearl & Co.', href: '#top' },
       diveScroll: 1.3,   // viewport-heights of scroll per dive clip
       connScroll: 0.9,   // ...per connector clip
       hint: 'scroll to fly in',
       nav: true,         // show the top section nav
       atmosphere: true,  // subtle gradient + drifting particles behind the clips
       stream: false,     // true = stream clips via Range requests instead of whole-file Blobs
       sections: [
         { id, label, still, stillMobile, clip, clipMobile, accent,
           scroll: 1.6,   // optional per-section override of diveScroll — more scroll
                          // distance = a slower, longer dwell in this scene
           linger: 0.5,   // optional 0..1 — remaps time so the camera settles mid-scene
                          // (exactly where the copy peaks) and moves quicker at the
                          // edges. 0 = linear (default). Keep ≤ 0.6; 1 = full pause.
           eyebrow, title, body, tags:[…],
           cta:{ primary:{label,href}, secondary:{label,href} } }, // last section only
         …
       ],
       connectors: [clipUrl, …],          // length = sections.length - 1 (nulls allowed)
       connectorsMobile: [clipUrl, …],    // optional lighter connectors for phones (same length)

   MOBILE (the clipMobile/connectorsMobile variants are the opt-in mobile version;
   the rest of the phone handling below is always on)
     The engine is phone-aware out of the box: on a coarse-pointer / ≤860px viewport it
       - loads `clipMobile` / `connectorsMobile` when provided, in portrait only (a
         landscape phone gets the desktop clip) — encode these smaller +
         tighter-GOP — seek cost on a phone decoder is dominated by frames-from-keyframe,
         so a 720p, -g 4 file scrubs far smoother than the 1080p desktop master; see
         pipeline.md). Falls back to the desktop `clip` if no mobile variant is given.
       - uses `stillMobile` as the scene poster when provided (pair it with native 9:16
         clipMobile renders so the poster matches the portrait video's first frame instead
         of flashing from a landscape crop). Chosen once at mount; a desktop resize into
         phone width keeps the desktop poster (clips still switch via isMobile()).
       - coalesces seeks (never issues a new currentTime while the decoder is still
         `seeking`) so fast flicks can't pile up and freeze the video.
       - keeps the still as a live poster until the clip actually paints its first frame,
         and primes each video (muted play→pause) on first touch — this is what stops iOS
         from showing a blank scene before the first seek.
       - drops the drifting particles and ignores URL-bar-only resizes (no scroll jump).
     Nothing here is required — a config with only `clip`/`connectors` still works on
     phones; the mobile variants just make it lighter and smoother.

   THEME (CSS custom properties; set on the container or :root to override)
     --sw-bg         page background (match your scene bg for seamless posters)
     --sw-ink        primary text
     --sw-ink-soft   secondary text
     --sw-accent     default accent (each section overrides via its `accent`)
     --sw-font-display / --sw-font-body

   REQUIREMENTS ON YOUR ASSETS
     - clips encoded native-res, crf~20, -g 8, +faststart, no audio (see pipeline.md)
     - connectors' endpoints are the neighbouring dives' ACTUAL frames (see SKILL Step 5)
     - (optional) mobile variants at ~720p, -g 4 for smoother phone scrubbing
   By default the engine loads each clip as a Blob (always seekable) and scrubs currentTime;
   that does NOT depend on HTTP byte-range support, but scroll stays gated until the whole
   first clip has downloaded. With `stream: true` the browser fetches clips in ranges and
   the gate opens once the first frames can play; that needs Range (206) support.
   ========================================================================== */

function mountScrollWorld(container, config) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Phone detection. `coarse` is captured once (input type doesn't change mid-session);
  // the ≤860px query is read live via isMobile() so a desktop resize/DevTools toggle
  // switches sources and seek behaviour without a reload.
  const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  const smallMQ = window.matchMedia('(max-width: 860px)');
  const isMobile = () => coarse || smallMQ.matches;
  // The mobile clip is a portrait (3:4) crop, so it only fits a portrait
  // screen: a landscape phone or tablet loads the desktop clip instead.
  const portraitMQ = window.matchMedia('(orientation: portrait)');
  const wantsMobileClip = () => isMobile() && portraitMQ.matches;
  const SECTIONS = config.sections || [];
  const CONNECTORS = config.connectors || [];
  const CONNECTORS_M = config.connectorsMobile || [];
  const DIVE_W = config.diveScroll || 1.3;
  const CONN_W = config.connScroll || 0.9;
  const CROSSFADE = (config.crossfade != null) ? config.crossfade : 0.12;  // seam dissolve width (vh)
  // stream: hand the video element the clip URL and let the browser fetch it
  // in ranges, instead of downloading the whole file as a Blob first. The
  // first-frame gate then opens as soon as the opening frames can play rather
  // than after the full download. Needs a server that answers Range requests
  // (206) and +faststart clips (moov before mdat).
  const STREAM = !!config.stream;
  const N = SECTIONS.length;
  if (!N) return { dispose() {} };

  // Torn down on dispose(): stops the rAF loop, removes every window-level
  // listener registered below, clears the pending portal-transition timer, and
  // revokes each clip's Blob URL. Without this, a caller that mounts a new
  // instance on top of an old one (e.g. a client-side route change that keeps
  // the page alive) leaks listeners/rAF/video blobs without bound.
  let disposed = false;
  const objectUrls = [];
  let portalTimeout = null;

  injectCSS();
  container.classList.add('sw-root');
  // The host has no header of its own after the flight, so the topbar stays
  // on as the page's nav instead of fading out at the hand-off.
  if (config.keepTopbar) container.classList.add('sw-keep-topbar');

  // ---- build the interleaved segment chain: dive0, conn0, dive1, … diveN-1 ----
  const SEGMENTS = [];
  SECTIONS.forEach((s, i) => {
    const dive = { kind: 'dive', si: i, clip: s.clip, clipM: s.clipMobile, still: s.still, stillM: s.stillMobile,
                   accent: s.accent, w: s.scroll || DIVE_W, linger: s.linger || 0, zoomBeats: s.zoomBeats || [],
                   restStills: s.restStills || [] };
    SEGMENTS.push(dive);
    s._seg = dive;
    // A connector is optional: if connectors[i] is falsy, the two dives simply
    // crossfade directly (no fly-over). Lets a page complete even when a
    // connector can't be generated (e.g. a content-filter false-positive).
    if (i < N - 1 && CONNECTORS[i]) {
      SEGMENTS.push({ kind: 'conn', si: i, clip: CONNECTORS[i], clipM: CONNECTORS_M[i],
                      still: SECTIONS[i + 1].still, stillM: SECTIONS[i + 1].stillMobile,
                      accent: SECTIONS[i + 1].accent, w: CONN_W });
    }
  });
  const NSEG = SEGMENTS.length;
  // The clip the first-frame gate waits on (see closeGate). Null under reduced
  // motion, where clips never load and there's nothing to wait for.
  const gateSeg = reduce ? null : (SEGMENTS.find(s => s.clip) || null);

  // ---- DOM ----
  const sky = el('div', 'sw-sky');
  if (config.atmosphere !== false) {
    sky.appendChild(el('div', 'sw-sky__grad'));
    sky.appendChild(el('div', 'sw-sky__glow'));
  }
  const particles = el('div', 'sw-particles'); sky.appendChild(particles);

  const scrollbar = el('div', 'sw-scrollbar');
  const scrollbarFill = el('span'); scrollbar.appendChild(scrollbarFill);

  const topbar = el('div', 'sw-topbar');
  if (config.brand) {
    const brand = el('a', 'sw-brand'); brand.href = (config.brand.href || '#');
    brand.appendChild(el('span', 'sw-brand__mark'));
    const nm = el('span', 'sw-brand__name'); nm.textContent = config.brand.name || ''; brand.appendChild(nm);
    topbar.appendChild(brand);
  }
  // `navLinks` (real {label,href} anchors, e.g. to sections on the page below
  // this experience) takes over the topbar nav entirely; without it, nav falls
  // back to jump-to-section buttons for each dive (see the SECTIONS loop below).
  const navLinks = config.navLinks || null;
  const nav = el('nav', 'sw-nav');
  if (navLinks ? navLinks.length > 0 : config.nav !== false) topbar.appendChild(nav);
  if (navLinks) {
    navLinks.forEach(n => {
      const a = el('a', 'sw-nav__item'); a.href = n.href || '#'; a.textContent = n.label || '';
      nav.appendChild(a);
    });
  }
  // Grouped so a single margin-inline-start:auto on the wrapper pins both to
  // the topbar's end edge, regardless of which of the two is present.
  const topEnd = el('div', 'sw-topbar__end');
  if (config.lang && config.lang.label) {
    const l = el('a', 'sw-toplang'); l.href = config.lang.href || '#'; l.textContent = config.lang.label;
    topEnd.appendChild(l);
  }
  if (config.cta && config.cta.label) {
    const c = el('a', 'sw-topcta'); c.href = config.cta.href || '#'; c.textContent = config.cta.label;
    topEnd.appendChild(c);
  }
  // Phones have no room for the centered pill nav beside the CTA, so it hides
  // there (see the ≤860px block) and this button drops the same links down as
  // a panel instead. Closes on a pick, a tap outside, Escape or a scroll.
  let menuBtn = null;
  let menuOpen = false;
  let menuOpenedAt = 0;
  function setMenu(open) {
    if (!menuBtn || open === menuOpen) return;
    menuOpen = open;
    menuOpenedAt = window.scrollY;
    topbar.classList.toggle('is-menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  if (nav.parentNode) {
    menuBtn = el('button', 'sw-menu'); menuBtn.type = 'button';
    menuBtn.setAttribute('aria-label', config.menuLabel || 'Menu');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.appendChild(el('i'));
    menuBtn.addEventListener('click', () => setMenu(!menuOpen));
    nav.addEventListener('click', (e) => { if (e.target.closest('.sw-nav__item')) setMenu(false); });
    topEnd.appendChild(menuBtn);
  }
  const onMenuOutside = (e) => { if (menuOpen && !topbar.contains(e.target)) setMenu(false); };
  const onMenuKey = (e) => { if (menuOpen && e.key === 'Escape') { setMenu(false); menuBtn.focus(); } };
  // A real scroll, not the tail of a swipe's momentum still settling as the
  // button is tapped.
  const onMenuScroll = () => { if (menuOpen && Math.abs(window.scrollY - menuOpenedAt) > 40) setMenu(false); };
  document.addEventListener('pointerdown', onMenuOutside);
  document.addEventListener('keydown', onMenuKey);
  window.addEventListener('scroll', onMenuScroll, { passive: true });
  if (topEnd.children.length) topbar.appendChild(topEnd);

  const stage = el('div', 'sw-stage');
  const copylayer = el('div', 'sw-copylayer');
  const route = el('div', 'sw-route');
  const hint = el('div', 'sw-hint');
  const hintText = el('span'); hintText.textContent = config.hint || 'scroll'; hint.appendChild(hintText);
  hint.appendChild(el('i'));
  // Download progress for the first clip, shown in place of the wheel icon
  // while the first-frame gate holds scroll (see closeGate).
  const hintBar = el('b', 'sw-hint__bar');
  const hintFill = el('span'); hintBar.appendChild(hintFill);
  hint.appendChild(hintBar);
  const track = el('div', 'sw-track');

  // A single-section experience has nowhere to jump to, so the chapter-dot
  // rail is skipped entirely rather than showing one inert dot.
  const layers = [sky, scrollbar, topbar, stage, copylayer, hint, track];
  if (N > 1) layers.splice(4, 0, route);
  layers.forEach(n => container.appendChild(n));

  // segment scenes
  SEGMENTS.forEach((s, i) => {
    const scene = el('div', 'sw-scene'); scene.style.setProperty('--sw-accent', s.accent || '');
    const img = el('img', 'sw-scene__still'); img.alt = '';
    // The first poster is the page's opening frame: fetch it now, at high
    // priority. Later scenes stay lazy until the flight gets near them.
    if (i === 0) { img.loading = 'eager'; img.fetchPriority = 'high'; }
    else { img.decoding = 'async'; img.loading = 'lazy'; }
    const poster = (isMobile() && s.stillM) ? s.stillM : s.still;
    if (poster) img.src = poster;
    scene.appendChild(img); stage.appendChild(scene);
    // Sharp stills of single clip frames, faded in over the video while the
    // flight rests on that frame (see raf) — a fast camera move bakes motion
    // blur into the footage itself, which no encode can take back out.
    s.rests = (s.restStills || []).map(r => {
      const ri = el('img', 'sw-scene__rest'); ri.alt = ''; ri.decoding = 'async';
      ri.src = (isMobile() && r.srcMobile) ? r.srcMobile : r.src;
      scene.appendChild(ri);
      return { t: r.t, img: ri, on: false };
    });
    s.el = scene; s.img = img; s.video = null; s.hasClip = false;
    s.loading = false; s.ready = false; s.cur = 0; s.target = 0; s.visible = false;
  });

  // per-section copy / route / nav
  const copies = [], dots = [];
  SECTIONS.forEach((s, i) => {
    const c = el('article', 'sw-copy'); c.style.setProperty('--sw-accent', s.accent || '');
    // The "01 / 03" counter labels a section's own copy. A host that renders
    // the copy itself (SeeWingsCues) passes none, and a bare counter then sat
    // over that host's captions for the first half of the flight.
    const hasCopy = !!(s.eyebrow || s.title || s.body || (s.tags && s.tags.length) || s.cta);
    c.innerHTML =
      // A single-scene flight has nothing to count ("01 / 01") either.
      (hasCopy && N > 1 ? `<span class="sw-copy__num">${pad(i + 1)} / ${pad(N)}</span>` : '') +
      (s.eyebrow ? `<span class="sw-copy__eyebrow">${esc(s.eyebrow)}</span>` : '') +
      (s.title ? `<h2 class="sw-copy__title">${esc(s.title)}</h2>` : '') +
      (s.body ? `<p class="sw-copy__body">${esc(s.body)}</p>` : '') +
      (s.tags && s.tags.length ? `<ul class="sw-copy__tags">${s.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '') +
      (s.cta ? `<div class="sw-copy__cta">${ctaBtns(s.cta)}</div>` : '');
    copylayer.appendChild(c); copies.push(c);

    if (N > 1) {
      const dot = el('button', 'sw-route__dot'); dot.style.setProperty('--sw-accent', s.accent || '');
      dot.innerHTML = `<span class="sw-route__label">${esc(s.label || '')}</span><i></i>`;
      dot.addEventListener('click', () => jumpTo(i)); route.appendChild(dot); dots.push(dot);
    }

    if (!navLinks && config.nav !== false) {
      const b = el('button', 'sw-nav__item'); b.textContent = s.label || '';
      b.addEventListener('click', () => jumpTo(i)); nav.appendChild(b);
    }
  });

  // ---- math ----
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  // Per-section dwell: monotone remap of scroll→time so the camera settles mid-scene
  // (where the copy peaks) and moves quicker near the seams. L=0 linear, L=1 full
  // mid-scene pause. f(0)=0, f(1)=1 always, so seam frames are untouched.
  const lingerEase = (x, L) => { L = clamp(L); const c = x - 0.5; return (1 - L) * x + L * (4 * c * c * c + 0.5); };
  const smoothstep = (a, b, x) => { const c = clamp((x - a) / (b - a)); return c * c * (3 - 2 * c); };
  // Crops out a band along a clip's own timeline (e.g. foreground pedestrians
  // walking through a shot) without touching any other moment — a config-driven
  // alternative to a single global object-position, which can only nudge the
  // same crop for every frame of every scene. `beats` is [{from,to,scale}]: the
  // video is scaled up (top-anchored, so the crop is pushed off the BOTTOM, not
  // split evenly) between from..to, ramping over ZOOM_RAMP_S on each side so it
  // reads as the camera settling rather than a cut. Scales from overlapping
  // beats take the max, so authors don't have to worry about ordering.
  const ZOOM_RAMP_S = 0.5;
  const zoomForTime = (beats, t) => {
    let z = 1;
    for (const b of beats || []) {
      const ramp = Math.min(smoothstep(b.from - ZOOM_RAMP_S, b.from, t), 1 - smoothstep(b.to, b.to + ZOOM_RAMP_S, t));
      z = Math.max(z, 1 + (b.scale - 1) * clamp(ramp));
    }
    return z;
  };
  // ---- idle-snap: once scrolling genuinely stops, ease to the nearest "rest"
  // beat instead of leaving the reader wherever momentum happened to drop them.
  // `config.restBeats` is [0..1] fractions of the TOTAL track (not seconds —
  // the engine doesn't know the caller's seconds-per-track mapping once
  // sections/connectors are involved; the caller does that conversion, see
  // SeeWingsExperience). Debounced on scrollY going idle (no new scroll event
  // for IDLE_MS), never on raw wheel/touch deltas — this project already tried
  // intercepting the gesture itself once (see seeWingsTiming.ts's SECTION_VH
  // comment) and it fought the reader's own scroll direction. Watching the
  // RESULT (scroll position has stopped changing) instead of the INPUT means
  // it only ever nudges where you already landed, after you've finished
  // scrolling — it can't fight a flick mid-flight because it never runs
  // during one. ----
  const REST_FR = (config.restBeats || []).slice().sort((a, b) => a - b);
  const IDLE_MS = 220;
  const SNAP_DURATION_S = 0.7;
  let idleTimer = null, snapping = false;
  function armIdleSnap() {
    if (!REST_FR.length || reduce) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(trySnap, IDLE_MS);
  }
  function trySnap() {
    // gated: first-frame load lock. portalLocking/portalPlayed: the end-of-
    // flight hand-off already owns scroll — never fight either lock, and
    // never snap once the reader has scrolled on into the real page below.
    if (snapping || stepping || gated || portalLocking || portalPlayed) return;
    const y = window.scrollY || window.pageYOffset;
    if (y <= 0 || y >= totalW * vh - 1) return;
    let targetF = REST_FR[0], bestDist = Infinity;
    for (const f of REST_FR) {
      const d = Math.abs(f * totalW * vh - y);
      if (d < bestDist) { bestDist = d; targetF = f; }
    }
    const targetY = targetF * totalW * vh;
    if (Math.abs(targetY - y) < 2) return;
    snapping = true;
    const lenis = window.__lenis;
    if (lenis && lenis.scrollTo) {
      lenis.scrollTo(targetY, { duration: SNAP_DURATION_S, onComplete: () => { snapping = false; } });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
      setTimeout(() => { snapping = false; }, SNAP_DURATION_S * 1000 + 80);
    }
  }
  // ---- step-scroll: every gesture flies to the NEXT rest beat in the
  // direction the reader scrolled — one wheel burst / swipe / key press = one
  // station, never a partial scrub. Unlike the old snap-back (see
  // seeWingsTiming.ts's SECTION_VH comment) it always moves WITH the gesture,
  // so it can't fight the reader's direction. A trackpad flick arrives as a
  // long burst of wheel events (inertia keeps firing for ~1s); only the first
  // event of a burst counts, and a new burst needs WHEEL_QUIET_MS of silence,
  // so one flick can't skip two stations. Past the last rest beat the next
  // step goes to the end of the track, where the portal hand-off takes over.
  // Idle-snap above stays as the fallback for input this can't see (dragging
  // the scrollbar). Enabled by `config.stepScroll` + `config.restBeats`.
  // `config.stepInterrupt` sets what a NEW gesture does mid-flight: 'lock'
  // (default) ignores it; 'boost' re-aims at the stop after the current target
  // and speeds up (each extra gesture adds 1x, up to STEP_BOOST_MAX), or turns
  // back to the stop behind when the gesture reverses direction. ----
  const STEP_ON = !!config.stepScroll && REST_FR.length > 0 && !reduce;
  // A step's duration is proportional to the distance it covers:
  // `stepTrackSeconds` is how long crossing the whole track would take.
  const STEP_TRACK_S = config.stepTrackSeconds || 6.4;
  const STEP_MIN_S = 0.5;
  const WHEEL_QUIET_MS = 180;
  const SWIPE_MIN_PX = 40;
  // Sine rather than cubic: peaks at ~1.6x the average speed instead of 3x,
  // so a long step reads as a steady flight, not a lurch through the middle.
  const easeInOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const STEP_BOOST = config.stepInterrupt === 'boost';
  const STEP_BOOST_MAX = 4;
  let stepping = false, stepTimer = null, lastWheelT = 0, burstUsed = false, touchY0 = null;
  let stepTargetY = 0, stepDir = 0, stepSpeed = 1;
  // Only inside the flight itself: below its end the real page scrolls natively.
  const stepActive = () => STEP_ON && !gated && !portalLocking && (window.scrollY || window.pageYOffset) < totalW * vh - 1;
  function step(dir) {
    const boosting = stepping && STEP_BOOST;
    if (stepping && !boosting) return;
    const y = window.scrollY || window.pageYOffset;
    const end = totalW * vh;
    const stops = REST_FR.map(f => f * end).concat(end);
    // Mid-flight in the same direction, count from where the camera is
    // already headed; past the last stop there's nothing further, so just
    // hurry on to the current target.
    const from = boosting && dir === stepDir ? stepTargetY : y;
    const next = dir > 0 ? stops.find(s => s > from + 2) : stops.slice().reverse().find(s => s < from - 2);
    const targetY = next != null ? next : (boosting && dir === stepDir ? stepTargetY : null);
    if (targetY == null) return;
    stepSpeed = boosting ? Math.min(stepSpeed + 1, STEP_BOOST_MAX) : 1;
    stepTargetY = targetY; stepDir = dir;
    const dur = Math.max(STEP_MIN_S, STEP_TRACK_S * Math.abs(targetY - y) / end / stepSpeed);
    // A re-aim starts with the camera already moving: ease out only, or
    // easing in again would stall it mid-flight.
    const easing = boosting ? easeOutCubic : easeInOutSine;
    stepping = true;
    clearTimeout(idleTimer);
    // Released on a timer rather than Lenis' onComplete, which never fires if
    // something stops the animation midway — that would leave every later
    // gesture ignored for the rest of the visit.
    clearTimeout(stepTimer);
    stepTimer = setTimeout(() => { stepping = false; stepTimer = null; }, dur * 1000 + 80);
    const lenis = window.__lenis;
    if (lenis && lenis.scrollTo) lenis.scrollTo(targetY, { duration: dur, easing, force: true });
    else window.scrollTo({ top: targetY, behavior: 'smooth' });
  }
  function onStepWheel(e) {
    if (!stepActive() || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    // Capture + stopImmediatePropagation keeps the raw wheel from Lenis too.
    e.preventDefault(); e.stopImmediatePropagation();
    const now = performance.now();
    if (now - lastWheelT >= WHEEL_QUIET_MS) burstUsed = false;
    lastWheelT = now;
    if (burstUsed || Math.abs(e.deltaY) < 1 || (stepping && !STEP_BOOST)) return;
    burstUsed = true;
    step(e.deltaY > 0 ? 1 : -1);
  }
  function onStepTouchStart(e) { touchY0 = e.touches.length === 1 ? e.touches[0].clientY : null; }
  // Lenis treats any touch event as native scroll taking over and stops its
  // running animation. So moves are kept from it while a step is flying, and
  // the swipe's own step starts only after its touchend has reached Lenis.
  function onStepTouchMove(e) {
    if (!stepActive()) return;
    if (e.cancelable) e.preventDefault();
    if (stepping) e.stopImmediatePropagation();
  }
  function onStepTouchEnd(e) {
    if (touchY0 == null || !stepActive()) { touchY0 = null; return; }
    const dy = touchY0 - e.changedTouches[0].clientY;
    touchY0 = null;
    if (Math.abs(dy) >= SWIPE_MIN_PX) setTimeout(() => step(dy > 0 ? 1 : -1), 0);
  }
  function onStepKey(e) {
    if (!stepActive() || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    let dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || ((e.key === ' ' || e.key === 'Spacebar') && !e.shiftKey)) dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'PageUp' || ((e.key === ' ' || e.key === 'Spacebar') && e.shiftKey)) dir = -1;
    if (!dir) return;
    e.preventDefault(); e.stopImmediatePropagation();
    step(dir);
  }
  let vh = window.innerHeight, stageX = 0, totalW = 0, activeIndex = -1, ticking = false;
  // One-shot "portal" hand-off: instead of the real page underneath continuing to
  // reveal itself as the user keeps scrolling (which always reads as "scrolling",
  // no matter how the video itself fades), we briefly take over input the first
  // time the dive completes, play the zoom+dissolve to the end, then jump the
  // scroll position straight to the top of whatever follows — so it arrives
  // already in place rather than scrolling up into view. Fires once; scrolling
  // back up and returning later just reveals/hides the video normally.
  let doneWasActive = false, portalPlayed = false, portalLocking = false;
  let laidOutW = window.innerWidth;   // width the current layout was computed at (see onResize)
  let lastIsMobile = isMobile();      // tracked so layout() can catch a mobile/desktop crossing (see below)

  function layout() {
    vh = window.innerHeight;
    // Published for host overlays that convert the track's vh into pixels:
    // onResize below keeps this height while a phone's URL bar slides away,
    // so a live innerHeight would put their end point trackVh × the bar's
    // height past this one.
    window.__swVh = vh;
    laidOutW = window.innerWidth;
    stageX = window.innerWidth > 860 ? 4 : 0;
    // The still poster is picked once at mount time, but the video clip
    // re-picks its mobile/desktop variant live when it actually loads (see
    // loadClip) — a resize/rotation across the 860px boundary in between
    // (e.g. a tablet flipped from portrait to landscape) would otherwise
    // leave a scene showing a still and a video from mismatched variants.
    // Re-sync the poster here too, but only for scenes whose video hasn't
    // already taken over.
    const nowMobile = isMobile();
    if (nowMobile !== lastIsMobile) {
      lastIsMobile = nowMobile;
      SEGMENTS.forEach(s => {
        if (s.hasClip) return;
        const poster = (nowMobile && s.stillM) ? s.stillM : s.still;
        if (poster) s.img.src = poster;
      });
    }
    let off = 0;
    SEGMENTS.forEach(s => { s.start = off * vh; off += s.w; s.end = off * vh; });
    totalW = off;
    // Buffer after the last dive: enough for its crossfade + the sw-done
    // chrome/stage transition to actually finish before the real page
    // content's edge arrives, not a full extra viewport of dead, blank
    // scroll. (Was 0.25 — a normal scroll gesture crossed that faster than
    // the chrome's .4s fade could complete, so headers overlapped. Now 0.7
    // to cover the stage's slower .6s zoom+dissolve hand-off too.)
    track.style.height = (totalW * vh + Math.max(CROSSFADE, 0.7) * vh) + 'px';
    read();
  }

  function jumpTo(i) {
    const seg = SECTIONS[i]._seg;
    window.scrollTo({ top: seg.start + (seg.end - seg.start) * 0.5, behavior: reduce ? 'auto' : 'smooth' });
  }

  // Flies the rest of the track in one go and lets the portal hand-off take
  // over at the end: for a "contact" CTA whose form sits beneath the flight,
  // which a hash link can't reach while the host keeps it pinned behind the
  // stage. A shortcut rather than the tour, so it's quick: FLY_END_MAX_S for
  // the whole track, proportionally less for what's left of it. Returns false
  // when there's nothing to fly (already past the end, mid hand-off, reduced
  // motion), so the caller can fall back to the plain link.
  const FLY_END_MAX_S = 2.4;
  function flyToEnd() {
    const y = window.scrollY || window.pageYOffset;
    const end = totalW * vh;
    if (reduce || portalLocking || y >= end - 1) return false;
    const dur = Math.max(0.8, FLY_END_MAX_S * (end - y) / end);
    // Borrows the step lock: wheel steps, idle-snap and rest stills all stand
    // aside while it flies.
    stepping = true;
    clearTimeout(idleTimer);
    clearTimeout(stepTimer);
    stepTimer = setTimeout(() => { stepping = false; stepTimer = null; }, dur * 1000 + 80);
    // A couple of px past the end, so rounding can't leave it a hair short of
    // the threshold that fires the hand-off (the track is padded past it).
    const targetY = end + 2;
    const lenis = window.__lenis;
    if (lenis && lenis.scrollTo) lenis.scrollTo(targetY, { duration: dur, easing: easeInOutSine, force: true });
    else window.scrollTo({ top: targetY, behavior: 'smooth' });
    return true;
  }

  function loadClip(s) {
    // Under prefers-reduced-motion we never load the clips at all — the stills stay up
    // and simply cross-dissolve as you scroll. No scrubbed video motion, no decode cost.
    if (reduce || s.loading || !s.clip) return;
    s.loading = true;
    // Serve the lighter mobile encode on phones when one was provided.
    const url = (wantsMobileClip() && s.clipM) ? s.clipM : s.clip;
    if (STREAM) { attachVideo(s, url, 'canplay'); return; }
    fetch(url).then(r => r.ok ? readBlob(r, s === gateSeg ? onGateProgress : null) : Promise.reject(new Error('404')))
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        objectUrls.push(objectUrl);
        attachVideo(s, objectUrl, 'loadedmetadata');
      }).catch(() => { s.loading = false; if (s === gateSeg) openGate(); });
  }

  // `gateOn` is the media event that lets scroll in. A Blob is already fully
  // local, so metadata is enough; a streamed clip waits for `canplay`, when
  // the frames at the start can actually render.
  function attachVideo(s, src, gateOn) {
    const v = document.createElement('video');
    v.className = 'sw-scene__video';
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
    v.src = src;
    v.addEventListener('loadedmetadata', () => { s.ready = true; read(); });
    v.addEventListener(gateOn, () => { if (s === gateSeg) openGate(); }, { once: true });
    if (STREAM) v.addEventListener('error', () => { if (s === gateSeg) openGate(); }, { once: true });
    // Reveal the video (hide the still poster) only once a real frame has
    // painted — on iOS a seeked-but-never-played muted video stays blank, so
    // hiding the still on metadata alone would flash an empty scene.
    v.addEventListener('seeked', () => { s.el.classList.add('has-clip'); }, { once: true });
    v.addEventListener('loadeddata', () => { try { v.pause(); } catch (e) {} if (userReady) primeVideo(v); });
    s.el.appendChild(v); s.video = v; s.hasClip = true;
  }

  // Reads a fetch Response into a Blob, reporting 0..1 progress along the way
  // when the server sent a Content-Length (otherwise it just waits for it all).
  function readBlob(r, onProgress) {
    const total = Number(r.headers.get('content-length')) || 0;
    if (!onProgress || !total || !r.body) return r.blob();
    const type = r.headers.get('content-type') || 'video/mp4';
    const reader = r.body.getReader();
    const chunks = [];
    let got = 0;
    const pump = () => reader.read().then(({ done, value }) => {
      if (done) return new Blob(chunks, { type });
      chunks.push(value); got += value.length; onProgress(got / total);
      return pump();
    });
    return pump();
  }

  function read() {
    const y = window.scrollY || window.pageYOffset;
    const fade = CROSSFADE * vh;
    let ci = 0;
    for (let i = 0; i < NSEG; i++) if (y >= SEGMENTS[i].start) ci = i;

    for (let i = 0; i < NSEG; i++) {
      const s = SEGMENTS[i];
      if (y > s.start - 1.6 * vh && y < s.end + 1.6 * vh) loadClip(s);
      const local = clamp((y - s.start) / Math.max(s.end - s.start, 1e-6), 0, 1);
      s.target = s.linger ? lingerEase(local, s.linger) : local;
      let outside = 0;
      if (y < s.start) outside = s.start - y; else if (y > s.end) outside = y - s.end;
      const op = smooth(1 - outside / fade);
      s.el.style.opacity = op; s.visible = op > 0.001;
      s.el.style.zIndex = (i === ci) ? '120' : String(100 + Math.round(op * 10));
      if (!s.hasClip || !s.ready) {
        // A still standing in for a clip IS that clip's first frame — left
        // untransformed so the video takes over without a jump. Only clip-less
        // stills (reduced motion) keep the shift and slow push-in.
        if (s.clip && !reduce) s.img.style.transform = 'none';
        else {
          const sc = reduce ? 1 : 1.03 + local * 0.14;
          s.img.style.transform = `translateX(${stageX - 2}vw) scale(${sc.toFixed(3)})`;
        }
      }
    }

    for (let i = 0; i < N; i++) {
      const seg = SECTIONS[i]._seg;
      // Math.max(...,1e-6) guards a misconfigured zero-length section (scroll: 0)
      // from dividing by zero and producing NaN, which would silently zero out
      // that section's copy opacity for the rest of the page's life.
      const pr = clamp((y - seg.start) / Math.max(seg.end - seg.start, 1e-6), 0, 1);
      const before = y < seg.start, after = y > seg.end;
      let cop;
      if (i === 0) cop = after ? 0 : smooth(1 - pr / 0.62);            // greets on landing
      else if (i === N - 1) cop = before ? 0 : smooth(pr / 0.4);       // holds CTA at the end
      else cop = (before || after) ? 0 : smooth(1 - Math.abs(pr - 0.5) / 0.5);
      const c = copies[i];
      c.style.opacity = cop;
      c.style.transform = reduce ? 'none' : `translateY(${(0.5 - pr) * 4}vh)`;
      c.style.pointerEvents = cop > 0.5 ? 'auto' : 'none';
    }

    const cur = SEGMENTS[ci];
    const near = clamp(cur.kind === 'dive' ? cur.si
      : (((y - cur.start) / (cur.end - cur.start)) > 0.5 ? cur.si + 1 : cur.si), 0, N - 1);
    if (near !== activeIndex) {
      activeIndex = near;
      dots.forEach((d, k) => d.classList.toggle('is-active', k === near));
      // Real navLinks aren't tied to a dive section, so "active" highlighting
      // (meant for jump-to-section buttons) doesn't apply to them.
      if (!navLinks) nav.querySelectorAll('.sw-nav__item').forEach((n, k) => n.classList.toggle('is-active', k === near));
      container.style.setProperty('--sw-accent', SECTIONS[near].accent || '');
    }
    // Once the last dive has fully played out, this instance is done being the
    // page's chrome (topbar/route/scrollbar/sky) — hide those fixed overlays so
    // whatever real page content follows in the flow (e.g. the site's own header)
    // isn't fought over or covered. Scrolling back up un-hides them symmetrically.
    const isDoneNow = y >= totalW * vh;
    if (!portalLocking) {
      if (isDoneNow && !doneWasActive && !reduce) playPortalTransition();
      else container.classList.toggle('sw-done', isDoneNow);
    }
    doneWasActive = isDoneNow;
    scrollbarFill.style.transform = `scaleX(${clamp(y / (totalW * vh))})`;
    hint.style.opacity = clamp(1 - y / (0.5 * vh));
    if (particles) particles.style.transform = `translate3d(0, ${-y * 0.05}px, 0)`;
    ticking = false;
  }

  function raf() {
    if (disposed) return;
    // Lenis is created by a sibling effect that runs after this mount, so the
    // gate can't stop it up front — catch it here the first frame it exists.
    if (gated && window.__lenis && !gateStoppedLenis) { window.__lenis.stop(); gateStoppedLenis = true; }
    const eps = isMobile() ? 0.02 : 0.008;   // coarser seek step on phones = fewer decodes
    for (let i = 0; i < NSEG; i++) {
      const s = SEGMENTS[i];
      if (!s.hasClip || !s.ready || !s.video) continue;
      // Never queue a seek while the decoder is still resolving the last one.
      // On phones a fast flick would otherwise pile up seeks and freeze the clip;
      // cur keeps lerping, so we snap to the latest target the moment it's free.
      if (s.video.seeking) continue;
      if (!s.visible && Math.abs(s.cur - s.target) < 0.002) continue;
      s.cur += (s.target - s.cur) * (reduce ? 1 : 0.18);
      const dur = s.video.duration || 1;
      const t = clamp(s.cur, 0, 0.999) * dur;
      if (Math.abs(s.video.currentTime - t) > eps) { try { s.video.currentTime = t; } catch (e) {} }
      if (s.zoomBeats.length) {
        const z = zoomForTime(s.zoomBeats, t);
        s.video.style.transformOrigin = '50% 0%';
        s.video.style.transform = z > 1.001 ? `scale(${z})` : '';
      }
      if (s.rests.length) {
        // Only once the flight has fully settled: never mid-step, and never
        // while the clip is still easing onto the frame.
        const settled = !stepping && Math.abs(s.cur - s.target) < 0.0015;
        for (const r of s.rests) {
          const on = settled && Math.abs(t - r.t) < 0.1 && r.img.complete && r.img.naturalWidth > 0;
          if (on !== r.on) {
            r.on = on;
            // Enter from just short of the frame (.is-pre, no transition) so it
            // settles forward like the camera's last metre; leave the other way.
            if (on) { r.img.classList.add('is-pre'); void r.img.offsetWidth; r.img.classList.remove('is-pre'); }
            r.img.classList.toggle('is-on', on);
          }
          // Same crop as the video under it, or the swap would visibly jump.
          r.img.style.transform = s.video.style.transform;
        }
      }
    }
    requestAnimationFrame(raf);
  }

  // iOS needs a user gesture before a muted video will decode/paint reliably. On the
  // first touch we prime every loaded clip (muted play→pause) so the first seek is
  // instant instead of showing a blank frame. `userReady` also makes freshly-loaded
  // clips prime themselves (see loadClip).
  let userReady = false;
  function primeVideo(v) {
    if (!isMobile() || !v) return;
    try { const p = v.play(); if (p && p.then) p.then(() => { try { v.pause(); } catch (e) {} }).catch(() => {}); }
    catch (e) {}
  }
  function onFirstGesture() {
    if (userReady) return;
    userReady = true;
    SEGMENTS.forEach(s => primeVideo(s.video));
  }
  window.addEventListener('pointerdown', onFirstGesture, { once: true, passive: true });
  window.addEventListener('touchstart', onFirstGesture, { once: true, passive: true });

  // ---- portal hand-off: block input, let the .sw-done zoom+dissolve play out on
  // its own timeline, then snap scroll straight to the top of what follows ----
  function blockInput(e) { e.preventDefault(); e.stopPropagation(); }
  // Only the keys that would actually scroll — a plain keydown blocker would
  // also swallow Tab, Escape, and typing into any focused field elsewhere on
  // the page for the whole lock duration.
  const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar']);
  function blockScrollKeys(e) { if (SCROLL_KEYS.has(e.key)) { e.preventDefault(); e.stopPropagation(); } }
  function lockInput() {
    window.addEventListener('wheel', blockInput, { passive: false, capture: true });
    window.addEventListener('touchmove', blockInput, { passive: false, capture: true });
    window.addEventListener('keydown', blockScrollKeys, { capture: true });
    const lenis = window.__lenis;
    if (lenis) lenis.stop();
  }
  function unlockInput() {
    window.removeEventListener('wheel', blockInput, { capture: true });
    window.removeEventListener('touchmove', blockInput, { capture: true });
    window.removeEventListener('keydown', blockScrollKeys, { capture: true });
    const lenis = window.__lenis;
    if (lenis) lenis.start();
  }
  function playPortalTransition() {
    if (portalLocking || portalPlayed) return;
    portalLocking = true;
    portalPlayed = true;
    container.classList.add('sw-done');
    // SeeWingsCues (the eyebrow/title/CTA text overlay) is a separate React
    // component driven purely by its own scroll-position math — it has no
    // idea this lock exists. Tell it to drop out in step with the stage's
    // own zoom+dissolve instead of sitting frozen at whatever cue happened
    // to be visible the instant scroll got locked.
    window.dispatchEvent(new CustomEvent('sw:portal'));
    lockInput();
    // Matches the .sw-stage zoom+dissolve duration (.6s) plus a small margin so
    // the jump never lands before the animation has actually finished painting.
    portalTimeout = setTimeout(() => {
      portalTimeout = null;
      // Hosts that park content behind the stage (PortalReveal) unpin it on
      // this event, synchronously, before the jump below. Content and scroll
      // then move in the same task, so no frame paints one without the other —
      // with a second timer of their own, the page could paint unpinned while
      // the scroll still sat at the threshold, ~a viewport short of the target.
      window.dispatchEvent(new CustomEvent('sw:portal-done'));
      const targetY = (totalW + Math.max(CROSSFADE, 0.7)) * vh;
      const lenis = window.__lenis;
      if (lenis) {
        lenis.scrollTo(targetY, { immediate: true, force: true });
      } else {
        const prev = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        window.scrollTo(0, targetY);
        document.documentElement.style.scrollBehavior = prev;
      }
      unlockInput();
      portalLocking = false;
    }, 700);
  }

  // ---- first-frame gate: the page opens on the first clip's opening frame
  // (its still) and scroll stays shut until that clip has downloaded and can
  // seek. Scrolling earlier only pushed the still around while the 1080p blob
  // was still arriving, then snapped to the video wherever the scroll had got
  // to. Opens on loadedmetadata, on a failed fetch (the still then carries the
  // page as before), or after GATE_MAX_MS as a last resort on a dead network. ----
  const GATE_MAX_MS = 25000;
  let gated = false, gateTimer = null, gateStoppedLenis = false;
  function gateBlock(e) { e.preventDefault(); e.stopImmediatePropagation(); }
  function gateKeys(e) { if (SCROLL_KEYS.has(e.key)) gateBlock(e); }
  function onGateProgress(p) {
    if (!gated) return;
    hintFill.style.transform = `scaleX(${clamp(p).toFixed(3)})`;
    hintText.textContent = `${config.loadingHint || 'loading'} ${Math.round(clamp(p) * 100)}%`;
  }
  function closeGate() {
    if (!gateSeg) return;
    gated = true;
    container.classList.add('sw-loading');
    hintText.textContent = config.loadingHint || 'loading';
    // overflow:hidden also stops scrollbar drags, which no input listener can.
    // Capture + stopImmediatePropagation keeps the wheel from Lenis too, whose
    // own window listener would otherwise still scroll programmatically.
    document.documentElement.style.overflow = 'hidden';
    window.addEventListener('wheel', gateBlock, { passive: false, capture: true });
    window.addEventListener('touchmove', gateBlock, { passive: false, capture: true });
    window.addEventListener('keydown', gateKeys, { capture: true });
    gateTimer = setTimeout(openGate, GATE_MAX_MS);
  }
  function openGate() {
    if (!gated) return;
    gated = false;
    clearTimeout(gateTimer); gateTimer = null;
    window.removeEventListener('wheel', gateBlock, { capture: true });
    window.removeEventListener('touchmove', gateBlock, { capture: true });
    window.removeEventListener('keydown', gateKeys, { capture: true });
    document.documentElement.style.overflow = '';
    if (gateStoppedLenis && window.__lenis && !portalLocking) window.__lenis.start();
    gateStoppedLenis = false;
    container.classList.remove('sw-loading');
    hintText.textContent = config.hint || 'scroll';
  }

  // Particles are a per-frame cost we can't afford alongside video scrubbing on a phone.
  seedParticles(particles, reduce || coarse);
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(read); } armIdleSnap(); }
  window.addEventListener('scroll', onScroll, { passive: true });
  if (STEP_ON) {
    window.addEventListener('wheel', onStepWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', onStepTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', onStepTouchMove, { passive: false, capture: true });
    window.addEventListener('touchend', onStepTouchEnd, { passive: true, capture: true });
    window.addEventListener('keydown', onStepKey, { capture: true });
  }
  // Mobile browsers fire `resize` every time the URL bar slides in/out. Re-running
  // layout() there rebuilds the track height and yanks the scroll position, so on
  // touch we ignore height-only changes and only relayout when the width actually
  // changes (rotation still comes through orientationchange). layout() records the
  // width it laid out at.
  function onResize() {
    if (coarse && window.innerWidth === laidOutW) return;
    layout();
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', layout);
  window.addEventListener('load', layout);
  closeGate();
  layout();
  requestAnimationFrame(raf);

  function dispose() {
    if (disposed) return;
    openGate();
    disposed = true;
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('scroll', onMenuScroll);
    document.removeEventListener('pointerdown', onMenuOutside);
    document.removeEventListener('keydown', onMenuKey);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', layout);
    window.removeEventListener('load', layout);
    window.removeEventListener('pointerdown', onFirstGesture);
    window.removeEventListener('touchstart', onFirstGesture);
    window.removeEventListener('wheel', blockInput, { capture: true });
    window.removeEventListener('touchmove', blockInput, { capture: true });
    window.removeEventListener('keydown', blockScrollKeys, { capture: true });
    if (portalTimeout) { clearTimeout(portalTimeout); portalTimeout = null; }
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    if (stepTimer) { clearTimeout(stepTimer); stepTimer = null; }
    window.removeEventListener('wheel', onStepWheel, { capture: true });
    window.removeEventListener('touchstart', onStepTouchStart, { capture: true });
    window.removeEventListener('touchmove', onStepTouchMove, { capture: true });
    window.removeEventListener('touchend', onStepTouchEnd, { capture: true });
    window.removeEventListener('keydown', onStepKey, { capture: true });
    // A streamed clip keeps fetching ranges until its src is dropped.
    if (STREAM) SEGMENTS.forEach(s => { if (s.video) { s.video.removeAttribute('src'); s.video.load(); } });
    objectUrls.forEach((u) => URL.revokeObjectURL(u));
    objectUrls.length = 0;
    delete window.__swVh;
  }

  // ---- helpers ----
  function el(tag, cls) { const n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function ctaBtns(cta) {
    let h = '';
    if (cta.primary) h += `<a class="sw-btn sw-btn--primary" href="${esc(cta.primary.href || '#')}">${esc(cta.primary.label)}</a>`;
    if (cta.secondary) h += `<a class="sw-btn sw-btn--ghost" href="${esc(cta.secondary.href || '#')}">${esc(cta.secondary.label)}</a>`;
    return h;
  }

  // Resolves once the opening poster has decoded and can paint, so a host
  // that server-rendered its own copy of that frame knows when to drop it.
  const firstStill = SEGMENTS[0].img;
  const firstPainted = (firstStill.src ? firstStill.decode() : Promise.resolve()).catch(() => {});

  return { dispose, firstPainted, flyToEnd };
}

function seedParticles(host, reduce) {
  if (!host || reduce) return;
  const kinds = ['dot', 'dot', 'ring'];
  const seeds = [7, 23, 41, 58, 71, 88, 12, 34, 52, 66, 83, 95, 18, 29, 47, 63, 77, 91, 5, 38, 55, 69, 82, 97];
  for (let k = 0; k < 20; k++) {
    const s = document.createElement('span');
    s.className = 'sw-pt sw-pt--' + kinds[k % kinds.length];
    s.style.left = seeds[k % seeds.length] + 'vw';
    s.style.top = ((seeds[(k * 3) % seeds.length] * 1.3) % 100) + 'vh';
    s.style.setProperty('--sw-sc', (0.5 + ((seeds[(k * 5) % seeds.length] % 60) / 60) * 1.1).toFixed(2));
    const dur = 14 + (seeds[(k * 7) % seeds.length] % 22);
    s.style.animationDuration = dur + 's';
    s.style.animationDelay = (-(seeds[(k * 2) % seeds.length] % dur)) + 's';
    host.appendChild(s);
  }
}

function injectCSS() {
  if (document.getElementById('sw-css')) return;
  const css = `
  .sw-root{--sw-bg:#F5EDE0;--sw-ink:#241d2b;--sw-ink-soft:#6a6072;--sw-accent:#8a7bb5;
    --sw-font-display:ui-rounded,"SF Pro Rounded","Segoe UI",system-ui,sans-serif;
    --sw-font-body:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,system-ui,sans-serif;
    color:var(--sw-ink);font-family:var(--sw-font-body);}
  html,body{margin:0;background:var(--sw-bg,#F5EDE0);overflow-x:clip;}
  .sw-sky{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:var(--sw-bg);}
  .sw-sky__grad{position:absolute;inset:-10%;background:linear-gradient(178deg,color-mix(in srgb,var(--sw-accent) 12%,var(--sw-bg)) 0%,var(--sw-bg) 55%,color-mix(in srgb,var(--sw-accent) 6%,var(--sw-bg)) 100%);}
  .sw-sky__glow{position:absolute;inset:0;background:radial-gradient(60% 42% at 74% 16%,color-mix(in srgb,var(--sw-accent) 22%,transparent),transparent 70%),radial-gradient(46% 34% at 50% 50%,color-mix(in srgb,#fff 45%,transparent),transparent 70%);}
  .sw-particles{position:absolute;inset:-6% -2%;will-change:transform;}
  .sw-pt{position:absolute;width:13px;height:13px;transform:scale(var(--sw-sc,1));opacity:0;animation:sw-drift linear infinite;}
  .sw-pt::before{content:"";position:absolute;inset:0;border-radius:50%;}
  .sw-pt--dot::before{background:radial-gradient(circle at 34% 30%,color-mix(in srgb,var(--sw-accent) 60%,#000),#000 82%);}
  .sw-pt--ring::before{background:transparent;border:2px solid color-mix(in srgb,var(--sw-accent) 55%,transparent);}
  @keyframes sw-drift{0%{opacity:0;transform:scale(var(--sw-sc)) translate(0,12vh) rotate(0)}12%{opacity:.5}88%{opacity:.45}100%{opacity:0;transform:scale(var(--sw-sc)) translate(4vw,-22vh) rotate(210deg)}}
  .sw-scrollbar{position:fixed;top:0;left:0;right:0;height:3px;z-index:60;background:color-mix(in srgb,var(--sw-accent) 14%,transparent);}
  .sw-scrollbar span{display:block;height:100%;width:100%;transform-origin:0 50%;transform:scaleX(0);background:var(--sw-accent);}
  .sw-topbar{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:clamp(14px,2.4vw,26px) clamp(18px,5vw,64px);}
  .sw-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--sw-ink);}
  .sw-brand__mark{width:24px;height:28px;border-radius:7px 7px 10px 10px;background:linear-gradient(160deg,var(--sw-accent),color-mix(in srgb,var(--sw-accent) 60%,#000));box-shadow:0 6px 14px color-mix(in srgb,var(--sw-accent) 40%,transparent);}
  .sw-brand__name{font-family:var(--sw-font-display);font-weight:700;font-size:1.1rem;}
  /* Absolutely centered on .sw-topbar itself (which spans the full viewport
     width) rather than relying on flex space-between's middle gap — that
     only centers the nav when a same-width sibling sits on the opposite
     side, and now that the brand mark is omitted (the flying logo replaces
     it) there's nothing to balance the CTA against, so the nav drifted to
     the start edge instead of staying centered. */
  .sw-nav{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;gap:4px;padding:5px;background:color-mix(in srgb,#fff 55%,transparent);backdrop-filter:blur(10px);border:1px solid color-mix(in srgb,var(--sw-accent) 16%,transparent);border-radius:999px;}
  .sw-nav__item{font:inherit;font-size:.82rem;text-decoration:none;color:var(--sw-bg) !important;border:0;background:transparent;cursor:pointer;padding:7px 14px;border-radius:999px;transition:color .25s,background .25s;}
  .sw-nav__item:hover{color:var(--sw-accent) !important;} .sw-nav__item.is-active{color:#fff !important;background:var(--sw-accent) !important;}
  /* margin-inline-start:auto pins it to the end of .sw-topbar (right in LTR,
     left in RTL) regardless of whether a brand mark sits at the other end —
     relying on justify-content:space-between broke once the brand mark was
     omitted, since a single flex child sits at the start by default. This
     also now matches where the real page's own Header puts its CTA, so
     there's no visual jump when the portal hand-off swaps one for the other. */
  .sw-topbar__end{margin-inline-start:auto;display:flex;align-items:center;gap:12px;}
  /* Pilled like .sw-nav__item (not plain text) — the topbar sits directly on
     the raw photo with no darkening overlay, so anything without its own
     background risks vanishing against light stone. */
  .sw-toplang{display:inline-flex;align-items:center;text-decoration:none;font-weight:700;font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--sw-bg) !important;background:color-mix(in srgb,#fff 55%,transparent);backdrop-filter:blur(10px);border:1px solid color-mix(in srgb,var(--sw-accent) 16%,transparent);padding:8px 14px;border-radius:999px;white-space:nowrap;transition:background .2s,color .2s;}
  .sw-toplang:hover{background:var(--sw-accent) !important;color:#fff !important;}
  .sw-topcta{text-decoration:none;font-weight:600;font-size:.9rem;color:var(--sw-bg) !important;background:var(--sw-accent) !important;padding:10px 20px;border-radius:999px;white-space:nowrap;}
  /* Phone menu button, glass-pilled like .sw-toplang; three bars that fold
     into an X while the panel is open. Hidden until the ≤860px block. */
  .sw-menu{display:none;position:relative;flex:none;width:36px;height:36px;padding:0;cursor:pointer;color:var(--sw-bg) !important;background:color-mix(in srgb,#fff 55%,transparent) !important;backdrop-filter:blur(10px);border:1px solid color-mix(in srgb,var(--sw-accent) 16%,transparent);border-radius:999px;}
  .sw-menu i,.sw-menu i::before,.sw-menu i::after{position:absolute;width:16px;height:1.5px;border-radius:2px;background:currentColor;transition:transform .25s ease,background .2s;}
  .sw-menu i{left:50%;top:50%;margin:-.75px 0 0 -8px;}
  .sw-menu i::before,.sw-menu i::after{content:"";left:0;}
  .sw-menu i::before{top:-5px;} .sw-menu i::after{top:5px;}
  .sw-topbar.is-menu-open .sw-menu i{background:transparent;}
  .sw-topbar.is-menu-open .sw-menu i::before{transform:translateY(5px) rotate(45deg);}
  .sw-topbar.is-menu-open .sw-menu i::after{transform:translateY(-5px) rotate(-45deg);}
  @keyframes sw-menu-in{from{opacity:0;transform:translateY(-6px)}}
  /* Opaque: whatever the host pins behind the stage (PortalReveal parks the
     real page there) must never show through a scene whose poster hasn't
     painted yet. The hand-off fades the whole stage, background included. */
  .sw-stage{position:fixed;inset:0;z-index:10;pointer-events:none;background:var(--sw-bg);}
  .sw-scene{position:absolute;inset:0;opacity:0;overflow:hidden;will-change:opacity;}
  .sw-scene__video,.sw-scene__still,.sw-scene__rest{position:absolute !important;inset:0 !important;width:100% !important;height:100% !important;max-width:none !important;object-fit:cover !important;object-position:center 42%;}
  .sw-scene__still{will-change:transform;transition:opacity .5s ease;} .sw-scene.has-clip .sw-scene__still{opacity:0;} .sw-scene__video{z-index:1;}
  /* Rest still: a focus pull rather than a plain swap. It eases in from a soft,
     slightly short frame to sharp and full size, and on leaving defocuses while
     pushing on, matching the camera's forward motion both ways. The scale
     property (not transform) because raf owns the inline transform for the
     zoom crop. */
  .sw-scene__rest{transform-origin:50% 0%;z-index:2;opacity:0;pointer-events:none;filter:blur(6px);scale:1.012;transition:opacity .45s ease-in,filter .45s ease-in,scale .45s ease-in;}
  .sw-scene__rest.is-pre{scale:.988;transition:none;}
  .sw-scene__rest.is-on{opacity:1;filter:blur(0);scale:1;transition:opacity .8s cubic-bezier(.22,.61,.36,1),filter 1.3s cubic-bezier(.22,.61,.36,1),scale 1.3s cubic-bezier(.22,.61,.36,1);}
  /* Chrome eases in over the opening frame instead of popping on at mount:
     the topbar, hint, scrollbar and especially the copylayer's side gradient
     appeared in a single frame and read as the screen suddenly going green
     at the edges. backwards (not both) so once it's done, the .sw-done fade
     and the hint's inline opacity take over again untouched. */
  @keyframes sw-in{from{opacity:0}to{opacity:1}}
  .sw-topbar,.sw-scrollbar,.sw-hint,.sw-route{animation:sw-in .9s ease-out .25s backwards;}
  .sw-copylayer::before{animation:sw-in 1.8s ease-out .4s backwards;}
  .sw-copylayer{position:fixed;inset:0;z-index:20;pointer-events:none;}
  .sw-copylayer::before{content:"";position:absolute;inset-block:0;inset-inline-start:0;width:min(58vw,780px);background:linear-gradient(90deg,var(--sw-bg) 0%,color-mix(in srgb,var(--sw-bg) 82%,transparent) 34%,color-mix(in srgb,var(--sw-bg) 40%,transparent) 62%,transparent 100%);}
  .sw-copylayer:dir(rtl)::before{background:linear-gradient(270deg,var(--sw-bg) 0%,color-mix(in srgb,var(--sw-bg) 82%,transparent) 34%,color-mix(in srgb,var(--sw-bg) 40%,transparent) 62%,transparent 100%);}
  .sw-copy{position:absolute;inset-inline-start:clamp(18px,5vw,64px);top:50%;transform:translateY(-50%);width:min(42vw,460px);opacity:0;will-change:opacity,transform;}
  /* direction:ltr keeps "01 / 03" in numeric order — without it, an RTL page
     (Hebrew) reorders the digit/slash runs and it reads back to front. */
  .sw-copy__num{font-family:ui-monospace,Menlo,monospace;font-size:.74rem;letter-spacing:.12em;color:var(--sw-ink-soft);direction:ltr;unicode-bidi:isolate;display:inline-block;}
  .sw-copy__eyebrow{display:block;margin-top:18px;font-family:var(--sw-font-display);font-weight:700;font-size:.8rem;letter-spacing:.16em;text-transform:uppercase;color:var(--sw-accent);}
  .sw-copy__title{font-family:var(--sw-font-display);font-weight:700;color:var(--sw-ink);font-size:clamp(2rem,4.4vw,3.5rem);line-height:1.03;margin:12px 0 0;letter-spacing:-.01em;text-shadow:0 2px 20px color-mix(in srgb,var(--sw-bg) 70%,transparent);}
  .sw-copy__body{margin-top:18px;font-size:clamp(1rem,1.25vw,1.14rem);line-height:1.55;color:color-mix(in srgb,var(--sw-ink) 78%,var(--sw-ink-soft));max-width:40ch;text-shadow:0 1px 12px color-mix(in srgb,var(--sw-bg) 90%,transparent);}
  .sw-copy__tags{list-style:none;display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 0;padding:0;}
  .sw-copy__tags li{font-size:.82rem;font-weight:600;color:color-mix(in srgb,var(--sw-accent) 70%,#000);padding:7px 14px;border-radius:999px;background:color-mix(in srgb,var(--sw-accent) 14%,#fff);border:1px solid color-mix(in srgb,var(--sw-accent) 30%,transparent);}
  .sw-copy__cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px;pointer-events:auto;}
  .sw-btn{text-decoration:none;font-weight:600;font-size:.95rem;padding:13px 24px;border-radius:999px;transition:transform .2s;}
  .sw-btn--primary{color:var(--sw-bg) !important;background:var(--sw-accent) !important;} .sw-btn--primary:hover{transform:translateY(-2px);}
  .sw-btn--ghost{color:var(--sw-ink);border:1.5px solid color-mix(in srgb,var(--sw-ink) 25%,transparent);} .sw-btn--ghost:hover{transform:translateY(-2px);}
  /* inset-inline-end (not right) so the rail moves to the physical left in
     RTL instead of sitting on top of .sw-copy, which itself already mirrors
     there (see .sw-copy above). */
  .sw-route{position:fixed;inset-inline-end:clamp(14px,2.4vw,30px);top:50%;z-index:40;transform:translateY(-50%);display:flex;flex-direction:column;gap:22px;padding:18px 10px;}
  .sw-route::before{content:"";position:absolute;left:50%;top:22px;bottom:22px;width:2px;transform:translateX(-50%);background:var(--sw-accent);opacity:.28;}
  .sw-route__dot{position:relative;border:0;background:transparent;cursor:pointer;width:14px;height:14px;display:grid;place-items:center;}
  .sw-route__dot i{width:9px;height:9px;border-radius:50%;background:color-mix(in srgb,var(--sw-accent) 40%,transparent);transition:transform .3s,background .3s,box-shadow .3s;}
  .sw-route__dot:hover i{transform:scale(1.25);background:var(--sw-accent);}
  .sw-route__dot.is-active i{background:var(--sw-accent);transform:scale(1.4);box-shadow:0 0 0 5px color-mix(in srgb,var(--sw-accent) 22%,transparent);}
  .sw-route__label{position:absolute;inset-inline-end:24px;top:50%;transform:translateY(-50%) translateX(6px);white-space:nowrap;font-size:.78rem;font-weight:600;color:var(--sw-bg) !important;background:color-mix(in srgb,#fff 85%,transparent);backdrop-filter:blur(6px);padding:5px 11px;border-radius:999px;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;border:1px solid color-mix(in srgb,var(--sw-accent) 14%,transparent);}
  .sw-route__label:dir(rtl){transform:translateY(-50%) translateX(-6px);}
  .sw-route__dot:hover .sw-route__label:dir(rtl),.sw-route__dot:focus-visible .sw-route__label:dir(rtl),.sw-route__dot.is-active .sw-route__label:dir(rtl){transform:translateY(-50%) translateX(0);}
  .sw-route__dot:hover .sw-route__label,.sw-route__dot:focus-visible .sw-route__label,.sw-route__dot.is-active .sw-route__label{opacity:1;transform:translateY(-50%) translateX(0);}
  .sw-hint{position:fixed;left:50%;bottom:26px;z-index:30;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;font-size:.76rem;letter-spacing:.14em;text-transform:uppercase;color:var(--sw-ink-soft);transition:opacity .3s;}
  .sw-hint i{width:22px;height:34px;border-radius:12px;border:2px solid color-mix(in srgb,var(--sw-ink) 28%,transparent);position:relative;}
  .sw-hint i::after{content:"";position:absolute;left:50%;top:7px;width:4px;height:7px;border-radius:2px;background:var(--sw-accent);transform:translateX(-50%);animation:sw-wheel 1.7s ease-in-out infinite;}
  @keyframes sw-wheel{0%{opacity:0;top:6px}40%{opacity:1}100%{opacity:0;top:17px}}
  .sw-hint__bar{display:none;width:140px;height:2px;border-radius:2px;overflow:hidden;background:color-mix(in srgb,var(--sw-ink) 22%,transparent);}
  .sw-hint__bar span{display:block;width:100%;height:100%;transform-origin:0 50%;transform:scaleX(0);background:var(--sw-accent);transition:transform .2s linear;}
  .sw-hint__bar span:dir(rtl){transform-origin:100% 50%;}
  .sw-root.sw-loading .sw-hint__bar{display:block;} .sw-root.sw-loading .sw-hint i{display:none;}
  /* The track is the only thing occupying the flight's scroll column in normal
     flow, so it also has to PAINT that column. The host page's own <body> may
     legitimately carry a light background for its other pages (this site sets
     bg-neutral-bg), and once .sw-done fades .sw-sky out at the hand-off, that
     light body showed through the strip of track still on screen — a pale band
     above the real content for the length of the tail buffer. Painting the
     track itself with the scene background closes that gap for good. */
  .sw-track{position:relative;z-index:1;width:100%;pointer-events:none;background:var(--sw-bg);}
  @media (max-width:860px){
    .sw-nav{display:none;}
    .sw-menu{display:block;}
    /* The menu's panel: a compact dark-glass card in the site's green and
       gold, hanging under the button at the topbar's end edge. */
    .sw-topbar.is-menu-open .sw-nav{display:flex;flex-direction:column;gap:0;top:calc(100% - 6px);left:auto;right:auto;inset-inline-end:clamp(18px,5vw,64px);transform:none;min-width:176px;padding:6px;border-radius:16px;background:color-mix(in srgb,var(--sw-bg) 84%,transparent);backdrop-filter:blur(14px);border:1px solid color-mix(in srgb,var(--sw-accent) 28%,transparent);box-shadow:0 14px 32px rgba(0,0,0,.28);animation:sw-menu-in .22s ease-out;}
    .sw-topbar.is-menu-open .sw-nav__item{color:#F7F6F3 !important;font-size:.9rem;padding:10px 14px;border-radius:10px;text-align:start;}
    .sw-topbar.is-menu-open .sw-nav__item:hover,.sw-topbar.is-menu-open .sw-nav__item:focus-visible{color:var(--sw-accent) !important;background:color-mix(in srgb,#fff 6%,transparent);}
    .sw-copylayer::before,.sw-copylayer:dir(rtl)::before{width:100%;height:42%;top:auto;bottom:0;background:linear-gradient(0deg,color-mix(in srgb,var(--sw-bg) 88%,transparent) 0%,color-mix(in srgb,var(--sw-bg) 55%,transparent) 30%,color-mix(in srgb,var(--sw-bg) 18%,transparent) 62%,transparent 100%);}
    /* Anchor copy to the bottom, clear of the home indicator / collapsing URL bar.
       dvh + env() are progressive: browsers that lack them keep the vh fallback line. */
    .sw-copy{left:clamp(18px,5vw,64px);right:clamp(18px,5vw,64px);top:auto;bottom:clamp(64px,14vh,120px);transform:none;width:auto;max-width:560px;}
    .sw-copy{bottom:calc(clamp(56px,12dvh,110px) + env(safe-area-inset-bottom));}
    .sw-copy__title{font-size:clamp(1.9rem,7.5vw,2.7rem);}
    .sw-copy__body{max-width:none;font-size:clamp(.98rem,3.6vw,1.1rem);} .sw-scene__video,.sw-scene__still,.sw-scene__rest{object-position:center 46%;}
    .sw-hint{bottom:calc(20px + env(safe-area-inset-bottom));}
    .sw-route{gap:16px;inset-inline-end:6px;} .sw-route__label{display:none;}
  }
  /* Portrait phones crop a 16:9 clip hard; keep the framing centred so the focal
     subject (which the camera dives toward) stays in view. */
  @media (max-width:860px) and (orientation:portrait){
    .sw-scene__video,.sw-scene__still,.sw-scene__rest{object-position:center 44%;}
  }
  /* Touch: give the route dots a finger-sized hit area without growing the visible dot. */
  @media (hover:none) and (pointer:coarse){
    .sw-route{padding:14px 6px;}
    .sw-route__dot{width:28px;height:28px;}
    .sw-btn{padding:15px 26px;}
  }
  @media (prefers-reduced-motion:reduce){ .sw-hint i::after{animation:none;} .sw-pt{display:none;}
    .sw-topbar,.sw-scrollbar,.sw-hint,.sw-route,.sw-copylayer::before{animation:none;} }
  .sw-topbar,.sw-route,.sw-scrollbar,.sw-sky,.sw-copylayer{transition:opacity .4s;}
  .sw-root.sw-done .sw-topbar,.sw-root.sw-done .sw-route,.sw-root.sw-done .sw-scrollbar,.sw-root.sw-done .sw-sky,.sw-root.sw-done .sw-copylayer{opacity:0;pointer-events:none;}
  .sw-root.sw-keep-topbar.sw-done .sw-topbar{opacity:1;pointer-events:auto;}
  /* Stage gets its own, slightly longer hand-off: a forward zoom + dissolve
     instead of a plain fade — reads as "flying into" the page underneath,
     matching the flythrough itself rather than just cutting the video off.
     A host that parks the clip's own last frame underneath sets
     --sw-handoff-scale:1, so the dissolve lands on the same picture. */
  .sw-stage{transition:opacity .6s ease-in,transform .6s ease-in;transform-origin:center center;}
  .sw-root.sw-done .sw-stage{opacity:0;transform:scale(var(--sw-handoff-scale,1.4));pointer-events:none;}
  `;
  // Wrap in a cascade layer so the page's own theme tokens (unlayered
  // :root / .sw-root { --sw-bg / --sw-ink / --sw-accent … }) always win over
  // these defaults, regardless of injection order. Enables clean dark themes.
  const style = document.createElement('style'); style.id = 'sw-css';
  style.textContent = '@layer sw {\n' + css + '\n}';
  document.head.appendChild(style);
}

export { mountScrollWorld };
