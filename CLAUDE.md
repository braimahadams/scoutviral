# ScoutViral — Project State & Handoff

> **This file is the source of truth across laptops.** Chat history does NOT carry
> between machines, but this repo does. On a new laptop: `git pull`, then tell
> Claude "read CLAUDE.md and catch up." Claude Code also auto-loads this file.
>
> **Keep it current:** whenever a meaningful change ships, update the relevant
> section and the "Last updated" line below, then commit it with the change.

**Last updated:** 2026-07-22 (Board redesign: Instagram-Edits-style status tab cards that never wrap on mobile; Collections are now true folders — a filed idea leaves "All" and lives only in its collection, counts add up; creator deletions sync via tombstones; Copy link shares an in-app deep link that auto-plays via the YouTube embed; app resumes your last route instead of the landing, returning/signed-in users skip it — on top of platform hygiene: installable PWA, SEO/canonical/JSON-LD, welcome-back line, feedback door, app-wide accessibility)

## Product ambition — read this first

ScoutViral is built and treated as **the next big thing**, not a hobby tool.
Creativity is the future economy and this app serves that wave. Concretely:

- **Copy is premium, confident, professional.** Never "we check…" — say "is
  verified…". Never surface quotas, API costs, ToS mechanics, or "why we didn't
  build X" disclaimers; that kills momentum. Users get the shortest confident
  version; Braimah handles the deeper explanation in his own promotion.
- **Implement industry standards proactively** (data never lost on sign-out/in,
  key management, confirmations before actions that move things) without waiting
  to be asked — then tell Braimah what was added and why, so he learns from it.
- Simplicity stays (see design principle below) — ambition shows in polish and
  trustworthiness, not in feature bloat.

---

## What this is

ScoutViral is a personal tool for content creators to find **proven** short-form
video ideas to remake in their own style. Pick a country + niche, see which YouTube
Shorts actually went viral for real channels, autoplay-preview them, and save the
ones worth re-filming to a "Remake list."

- **Live site:** https://scoutviral.com (also https://scoutviral-abc1f.web.app)
- **Owner/creator:** Braimah Adams (using it himself first; public launch + ads later)
- **Design principle:** keep it **simple, basic, fast, mobile-friendly**. Add
  features only after actually wishing for them while using it. Do NOT bloat it.

## The whole app is ONE file

`public/index.html` — a single self-contained HTML file (HTML + CSS + vanilla JS,
no build step, no framework, no npm). This is deliberate. Edit it directly.

- `public/config.js` — Firebase web config (safe to be public; these keys are
  client-side by design).
- Everything is client-side. **BYOK**: each user pastes their own free YouTube
  Data API v3 key (localStorage `ss_key`). All API usage bills to the user's own free
  Google quota (10,000 units/day). **The key is also synced to the signed-in user's
  private Firestore doc** (`cloudSave` includes `apiKey`; sign-in restores it only
  when the local device has none) so it follows them across devices and never has to
  be re-entered. `saveKey`/`removeKey` push the change to the cloud.
- **Shared trial key (optional):** `window.TRIAL_YT_KEY` in config.js. When set (a
  domain-restricted key from the `scoutviral` GCP project), first-time visitors get
  `TRIAL_LIMIT` (5) free searches/scouts on it before being nudged to add their own.
  `effectiveKey()` = personal key OR trial key while credits remain; `usingTrial()`,
  `trialRemaining()`, `noteTrialUse()`, `ensureCanScout()` gate every live action
  (discSearch/doScan/addCreator/addFromDisc/renderCreator-resolve). When credits run
  out OR the shared daily quota is hit (yt() throws `__TRIAL_ENDED__`), `trialEndedPrompt()`
  fires a warm, conversion-framed dialog → Settings. Subtle scarcity line on Discover
  (`trialNoteHTML`) only appears on trial, nudging harder at ≤2 left. **Note: YouTube
  Data API is FREE and hard-capped — no billing, no per-request charge, so the shared
  key cannot cost money; worst case it returns quota-exceeded until midnight PT.**

## Architecture / accounts

- **Firebase/GCP project ID:** `scoutviral` (this is the real one — see History).
- **Hosting:** classic Firebase Hosting (NOT App Hosting — that was deleted, it
  kept failing because this is a static site with no package.json).
- **Auth:** Google + Email/Password enabled. Firestore syncs each signed-in user's
  directory + remake list. Works in "local mode" (no login) too.
- **Sync is MERGE, never overwrite** (`mergeCreators`/`mergeLibrary` in index.html):
  on sign-in, cloud and local are unioned — per-video the newest status wins and a
  note from either side is always kept; creators dedupe by channel id OR handle.
  Sign-out never touches local data, so nobody ever loses saves. Don't regress this
  to a plain overwrite.
- **Deletions use tombstones** (`removed` map = `{id: removedAt}`, `ss_removed`,
  synced): a union merge can't represent a removal, so deleting a saved idea records
  a tombstone. `applyTombstones` drops any merged entry whose `u` ≤ its removal time,
  so a removed video **doesn't come back after refresh/sync**; re-adding it (newer
  `u`) wins and clears the tombstone (`pruneRemoved` forgets stale ones). Restoring a
  backup clears tombstones for its ids. `vSet` sets/clears the tombstone.
- **Creators have the SAME tombstone system** (`removedCreators` = `{key: removedAt}`,
  `ss_removed_creators`, synced) — added because removing a creator used to reappear
  after syncing from another device (the plain `mergeCreators` union re-added it).
  Keyed by channel **id AND @handle** (`creatorKeys(c)`, either can match).
  `removeCreator` calls `markCreatorRemoved`; the cloud-load path runs
  `applyCreatorTombstones` (drops any merged creator whose key is tombstoned at/after
  its `addedAt`) then `pruneRemovedCreators`. Re-adding (`addCreator`/`addFromDisc`,
  fresh `addedAt`) and restoring a backup call `clearCreatorRemoved`, so re-add always
  wins. Any new "add creator" path MUST set `addedAt` and clear the tombstone.
- **Firestore:** `(default)` db, region nam5. Rules in `firestore.rules` lock each
  user to `/users/{uid}` only.
- **GitHub repo:** https://github.com/braimahadams/scoutviral (branch `main`).

## Deploy = just push (CI/CD is set up)

```
git add -A && git commit -m "..." && git push
```
GitHub Actions (`.github/workflows/firebase-hosting-merge.yml`) auto-deploys `main`
to the live site. Pull requests get their own preview URL first. **You normally do
NOT run `firebase deploy` by hand** — pushing is the deploy. (Manual
`firebase deploy --only hosting` still works for quick local checks.)

## Platform hygiene: PWA, SEO, onboarding, a11y

- **Installable PWA.** `public/manifest.json` (standalone, S+Play icons), a
  network-first service worker `public/sw.js` (same-origin only; cross-origin —
  YouTube API / Firebase / fonts — is left untouched; cache is offline fallback
  only, so deploys never go stale), registered in `init`. Real PNG icons
  `icon-192/512.png` + `apple-touch-icon.png` (180) were **rasterized from the SVG
  mark via canvas** — regenerate the same way if the logo changes. `firebase.json`
  has `headers`: `sw.js`/`manifest.json` are `no-cache`, images cache a week.
  **Static files (manifest, sw, robots, sitemap, icons) live in `public/` and are
  served directly — Firebase serves real files before the SPA rewrite, so they
  bypass the `** → /index.html` rewrite and the app's 404 handler.**
- **SEO:** `robots.txt` + `sitemap.xml`, a `<link rel="canonical">` to
  `https://scoutviral.com/` (the .web.app mirror must not dilute ranking), and a
  `SoftwareApplication` JSON-LD block in `<head>`.
- **First-run coaching = the Discover starter card** (`discStarterHTML`, built on
  the other laptop): before the first search, `#dres` shows three one-tap starts
  ("US × Silent comedy", "Worldwide × Food", "Surprise me") instead of blank space.
  An instructional 3-step intro card was built in parallel here and **deliberately
  dropped during the merge** — action-first beats explanation, and two coaching
  cards stacked on one screen is clutter. Don't re-add a second intro card.
- **Welcome-back (`dashWelcomeSub`):** if the newest `activity` entry is ≥7 days
  old, the Dashboard greeting subline becomes a warm "Welcome back — it's been N
  days…" pointing at saved ideas or Discover. Purely client-side, no push, only
  ever seen because they opened the app themselves.
- **Feedback door:** Settings has a "Send feedback" mailto button →
  `FEEDBACK_EMAIL` constant (currently Braimah's personal gmail — swap for a
  dedicated address before heavy promotion to avoid spam exposure).
- **Accessibility:** `a11yLabels()` runs after every `render()` and mirrors every
  icon button's `title` into an `aria-label` (so SR announce a real name, not just
  "button") — app-wide, no per-template edits. Dialogs + auth modal have
  `role="dialog"`/`aria-modal`/`aria-labelledby` + `trapFocus()` (Tab cycles inside)
  + autofocus + Escape-to-close (Escape already existed). Header logo is a
  keyboard-activatable `role="button"`. Global `:focus-visible` outline. **When you
  add a new icon-only button, give it a `title` and a11yLabels handles the rest.**

## Look & feel (redesigned 2026-07-13)

- **Dark theme by default** (deep charcoal `#101012`), light theme under
  `prefers-color-scheme: light`. **One accent: red** (`--accent` #f2555a dark /
  #e5333a light) used sparingly. **Inter** font (Google Fonts `<link>` in `<head>`
  — the app's only external dependency; falls back to `system-ui`).
- **Logo = "S + Play" mark** (chosen from 3 concepts): a monoline **S** next to a red
  **play triangle** (the play button doubles as the V). Header uses it inline (S =
  `currentColor` so it's theme-aware, triangle = `var(--accent)`). Favicon is an SVG
  data-URI: the same mark in white on a red gradient app-icon tile (in `<head>`). Both
  are hand-built vectors — no raster assets. Keep them in sync if the mark changes.
- **Main nav = 5 tabs** (Discover/Directory/Remakes/Settings/**Dashboard**) — the
  same single `<header>`/`<nav>` markup is reused for all three layouts purely via
  CSS media queries (`go()`/`data-v`/`render()` untouched, no duplicated DOM).
  Dashboard is now a real nav tab at **every** breakpoint (last, under Settings —
  `<button data-v="dash">` with a chart icon), so it's no longer in the account
  flyout. Three states:
  - `≤720px` — **floating pill tab bar**: `nav{position:fixed;bottom:10px;left/right:12px;
    border-radius:24px;background:var(--glass);backdrop-filter:blur(...)}` — a
    detached, rounded, glassy capsule that hovers above the bottom edge (thumb-
    reachable but light/modern; ties into the floating creator bubbles). Sticky top
    header still holds just the logo + account avatar. `--glass` is a theme-aware
    translucent card colour (added to `:root` + the light block); it's ~80% opaque
    so it still reads fine if `backdrop-filter` is unsupported.
  - `721–1099px` — **icon-only left sidebar**, `header{position:fixed;left:0;
    width:76px;height:100vh}`, nav vertical, labels hidden (`nav button .lbl{
    display:none}`), logo shows just the play-mark (the wordmark text is wrapped
    in `<span class="word">` so it can be hidden without touching the SVG). Each
    nav button gets a **hover tooltip** via `nav button::after{content:attr(
    aria-label)}` (that's why every nav button carries an `aria-label`) — so the
    collapsed icons are still discoverable, Instagram-web style.
  - `≥1100px` — **expanded sidebar**, `width:248px`, full nav labels and wordmark
    back (tooltips suppressed: `nav button::after{display:none}`), matching
    Instagram's own icon→labeled-sidebar breakpoint behavior.
  `body{padding-left:76px / 248px}` reserves the matching gutter so `main` (already
  `width:100%;margin:0 auto`) recenters itself for free. `.statusbar{left:76px /
  248px}` keeps the scan-progress toast from sliding under the sidebar. **Don't add
  `overflow-x`/`overflow-y` to `header`** — it's a one-line trap: CSS forces the
  *other* overflow axis to clip too once either is non-`visible`, which would clip
  the hover tooltips. Sidebar content is short and fixed and doesn't need scrolling.
  Big rounded video cards are the hero (`.vgrid`, `.vid`, `.vid.tall`).
- **Account control (`#authbox` → `.acctwrap`):** always **top-right** — on mobile
  it sits at the right of the sticky top header; on desktop it's pulled OUT of the
  sidebar to the viewport's top-right corner (`position:fixed;top:12px;right:18px`,
  floating over the content) so nav lives on the left and account on the right, like
  a conventional app chrome. Shows the signed-in user's avatar + name (or a generic
  avatar + "Account" when logged out / in local mode) and opens a small flyout
  (`renderAuth`/`toggleAcctMenu`/`closeAcctMenu`, same functions/DOM everywhere)
  with just Sign in/out (or "Local mode" if Firebase isn't configured) now that
  Dashboard is a nav tab. The flyout drops down-right (`top:100%;right:0`). **Settings
  is deliberately NOT in this flyout** — it only lives in the main nav (sidebar or
  bottom tab bar). Reasoning: Settings is where every in-app nudge sends people
  (trial ended, no API key yet, etc.), so it needs to stay a fast, always-visible,
  one-tap destination, and it works with zero account at all (local mode) — putting
  it only behind an avatar click would bury the single most-needed screen for a
  brand new user. The flyout is scoped purely to sign-in state now. Don't re-add
  Settings there; if it ever feels missing, that's a sign the main nav access
  broke, not that the flyout needs it back. Closes on outside click or Escape.
- **Branded dialogs** replace native `alert/confirm/prompt` — `uiAlert`/`uiConfirm`/
  `uiPrompt` (Promise-based) render into `#dialog`; destructive confirms use a red
  button. Escape = cancel, Enter = confirm. `uiPrompt` supports `{multiline:true}`
  (textarea, used for video notes).
- **No emojis in the UI** — all icons are inline SVGs (Lucide-style strokes) from
  the `ICONS` map + `ico(name)` helper in index.html; the static header/nav SVGs
  are inlined directly. Zero network cost. Don't reintroduce emoji icons.
- **Friendly copy rule:** never surface "cost", "quota units", or technical caps
  to users — say things like "free, barely touches your daily limit" instead.
  Plain simple English everywhere (worldwide, non-technical audience).
- **No cookies/tracking** (stated in footer). Mistyped URLs: hosting rewrites all
  paths to index.html; init shows a "Page not found — brought you home" dialog
  and cleans the URL.

## Landing page (home / `renderHome`)

- A premium **storytelling landing** — Linear/Vercel-tier — is the `home` route.
  Flow: hero → Discover Worldwide → Scout a Creator → Build Your Board → 5-step
  workflow (Discover→Scout→Save→Remake→Publish) → final CTA. Global `<footer>` closes it.
- **The app nav is hidden on the landing** (`body.landing`, toggled in `render()`
  for the `home` route). The landing is a marketing *front door*, not the app:
  showing all five nav tabs there made the door and the house look like one room
  and killed curiosity. At every width the nav is `display:none` on home; on
  desktop the left sidebar reverts to a simple sticky **top bar** (logo left,
  account/sign-in right, `padding-left` gutter removed so the page is full-width),
  and on mobile the bottom pill is just hidden (the top header already reads as a
  marketing bar). Stepping inside — the hero's **"Start discovering"** CTA
  (`go('disc')`) or any other route — drops the class and the sidebar/pill nav
  returns. **This is deliberately NOT sign-in-gated**: the free trial key + local
  mode still let a first-timer try instantly with no account (that no-signup
  onboarding is a core advantage — don't regress it into a forced-login wall).
  Sign-in stays for what it's for: cross-device sync + the personal Dashboard.
- **The app resumes where you left off; only genuinely new visitors see the landing.**
  `go()` writes the current route to `ss_route` (creator detail → `"dir"`, since its
  index goes stale), and init restores it (`RESUMABLE` set). So a refresh — or the
  app reloading itself — no longer dumps a returning user on the marketing page (that
  was a real friction point). A brand-new visitor has no `ss_route` → lands on home.
  Fresh-device signed-in case: `bootRedirect` (true only when there's no saved route)
  makes the `onUser` handler send a restored session into the app (`go("disc")`)
  instead of the landing; any deliberate nav or a deep link cancels it. Don't persist
  transient/overlay state here — only the six main routes resume.
- **All product visuals are pure CSS/DOM mockups** built from the real design
  tokens (a mock "app window" with a Discover grid + floating Scout Score / Saved
  cards, a **worldwide creator mesh**, a ranked Top-Shorts list, an idea-board
  grid). Chosen over generated images on purpose: crisp at any DPI, theme-aware,
  zero network weight, and always matches the real UI. If you change a real
  component's look, glance at its `.lp-*` mock twin so they don't drift.
- **The "Discover worldwide" visual is a creator mesh** (`.lp-mesh`, built in
  `renderHome` from `meshNodes`/`meshLinks`), not the old pulsing-pins map. It
  reads as a live global network **over a real dotted world map**: gradient-
  avatar nodes (`.lp-node`, an `ico("user")` silhouette on an `LP_G` gradient) sit
  on their home continent — N/S America, Europe, Africa, a central **hub** node,
  E-Asia, Oceania — joined by animated dashed "connection" lines (`.lp-mline`,
  red accent, `lpflow` flowing dash). **The map is real, not hand-drawn**: an
  earlier version approximated continents as CSS ellipses and it looked visibly
  wrong ("the sketch of the continent doesn't match"). `WORLD_DOTS` is now a
  precomputed `"x,y x,y …"` string generated *once* (see
  `/tmp/.../scratchpad/gen_map.js` if you ever need to regenerate it) by
  ray-casting real coastlines from Natural Earth's public-domain 110m land
  dataset (`world-atlas@2/land-110m.json`) against a grid in this same
  coordinate space — so the continents are geographically accurate, not a guess.
  Still baked in statically (no fetch, no runtime cost, same "generated not
  asset" spirit as everything else here). **Coordinate trick:** the SVG is
  `viewBox="0 0 210 100" preserveAspectRatio="none"`, and `.lp-mesh` uses
  `aspect-ratio:2.1/1` (not a fixed pixel height — a fixed height stretched the
  map/dots at column widths other than the one it was tuned for) so the 2.1:1
  space is exact at every viewport, which is what keeps dots perfectly round and
  the coastlines undistorted. A node's HTML `left/top` is a %, and its SVG point
  is `(xPct*2.1, yPct)` — lines, dots, and avatars all share that space, so line
  endpoints land exactly on avatar centers (verified ~0px). If you regenerate
  `WORLD_DOTS` or move a node, re-run the same near-dots/endpoint checks — a node
  off the coastline or a stretched dot is an easy regression to miss visually.
  Deliberately **gradient avatars, not photos** (same reason as every other mock:
  crisp, theme-aware, zero network weight, no external asset). All animation is
  reduced-motion-gated.
  **Depth pass (2026-07-21):** dots sit in 3 size/opacity tiers via a
  shader-style scatter hash (`sin(x*12.9898+y*78.233)` — a *linear* hash
  collapses on this regular grid, don't swap one back in); each connection is a
  blurred neon underlay (`.lp-mglow`, `#lpBlur` filter) + the crisp dash + a
  light pulse travelling the arc (SMIL `animateMotion`, zero JS, `.lp-pulse` —
  hidden under reduced-motion); the hub gets an ambient red glow baked into
  `.lp-mesh`'s background stack. Braimah asked for a *generated image* here —
  the image workspace was out of credits at the time, so this in-code depth pass
  shipped instead; if he asks again and credits exist, generate a dark 2:1
  dotted-world-map hero (charcoal #101012, red #f2555a accents) and layer the
  existing nodes/lines on top.
- **Mock-window bar on phones (≤640px):** the fake Discover/Directory/Remakes
  tab strip (`.lp-winnav`) is hidden — it's decoration and it was shoving the
  "Worldwide × Silent comedy" pill (`.lp-winpill`) out of the window — and the
  pill becomes an ellipsizing block capped at 70% width so it can never clip.
- **Overflow gotcha (fixed once, don't reintroduce):** the mock app window
  (`.lp-stage{max-width:940px}`) fills its column with **zero side margin** for
  almost the entire 641–976px range (main's content width ≤ 940px there), so the
  floating Scout Score / Saved cards' spill-outside-the-window effect
  (`.lp-score{left:-26px}`/`.lp-saved{right:-22px}`) only has room to be negative
  above **1181px**. Below that, a `@media (max-width:1180px)` rule pulls them to a
  small **positive** inset (`left:6px`/`right:6px`) instead — never negative in that
  range. `.lp-glow` is `position:absolute` sized `min(1200px,100%)` (not `100vw`,
  which is wider than `clientWidth` whenever a vertical scrollbar is present —
  classic scrollbar-gutter overflow bug). If you touch either, re-check overflow
  across the full width range, not just the 3 preset breakpoints.
- **Motion** (`lpInit`/`lpCount`/`lpParallax`, all `lp-`-prefixed): IntersectionObserver
  scroll-reveal, animated counters (computed live from `COUNTRIES.length`/`NICHES.length`
  — they can't drift), CSS float on the hero cards, and a gentle desktop-only pointer
  parallax. All gated behind `prefers-reduced-motion`; the mousemove listener is
  torn down in `go()` when leaving home. No emojis (SVG `ico()` only), no new deps.

## Creator Dashboard (`dash` route / `renderDashboard`)

- **Not YouTube Studio.** Deliberately tracks creative *consistency*, not channel
  performance — no views/subs/revenue anywhere. Answers "am I making progress?", not
  "how did I do?". Reached via the header account dropdown (see above), not the main
  nav. Reuses the app's existing design tokens and the landing page's motion system
  (`lpInit`/`lpCount`/`.lp-reveal`/`.lp-num`) — no new CSS framework, no new JS libs.
- **Data source: 100% local, zero extra API calls.** Everything is computed from
  `creators`, `library`, and a new **`activity` log** (`ss_activity`, array of
  `{t:"saved"|"remaking"|"completed", id, at}`, appended by `logActivity()` inside
  `vSet` on every real status change, capped at 2000 entries). Synced like the rest
  (`mergeActivity` = union + dedupe by `t|id|at`, included in `cloudSave`/`persist`).
  Creators also gained `addedAt` (set in `addCreator`/`addFromDisc`) for the
  Countries Explored stat's provenance. **When adding any new trackable action,
  call `logActivity(status, id)` — the Dashboard has no other way to see history.**
- **Sections (top to bottom):** greeting → this-week goal + Momentum score →
  **monthly calendar** (`dashCalendarData`/`calendarHTML`, id `#dashCal`) → 6-week
  trend bar chart (`dashWeeklyTrend`) → 8 stat tiles (`dashStats`, `.dashtile`,
  responsive `auto-fit` grid) → auto-generated insights (`dashInsights`, up to 5,
  short sentences: most productive day, week-over-week delta, streak, average pace).
  Empty state (no library entries and no activity) shows a single welcoming card
  instead of a wall of zeros.
- **Signed-out Dashboard is an invite, not a report** (`renderDashboardSignedOut`,
  taken when `fb && !user`). The Dashboard is framed as a personal progress
  *profile*, so a signed-out visitor shouldn't see a "good morning, here's your
  momentum" report over empty data — that read as broken. Instead they get an
  aspirational sign-in CTA (what signing in unlocks: streaks, momentum, a calendar
  of completed videos, synced across devices) plus a row of **dimmed "locked"
  teaser tiles** (`.dash-teaser`, values shown as "—") to create pull. If they've
  already saved/completed videos locally (used a key without signing in), the copy
  names those real counts ("You've already saved 2 ideas and completed 1…") so
  signing in feels like *claiming* work, not starting over, and the Saved/Completed
  teaser tiles show those real numbers while the sign-in-locked ones (Streak,
  Momentum) stay "—". Signed-IN users (or pure local mode with no `fb`) still get
  the real dashboard, including the plain "wall of zeros"→welcome empty card when
  they simply haven't saved anything yet — that empty card is only right once you're
  in, not as a first impression for a logged-out newcomer.
- **Monthly calendar, not a GitHub-style dot grid.** The first version used a
  91-day heat-map of tiny squares; real creators complete a handful of videos a
  week (not hundreds of commits a day), so almost every square was empty/near-
  invisible and it read as confusing rather than motivating. The calendar shows the
  same "when was I productive" story with day numbers and checkmarks **always
  visible** (no hover, no legend to decode): a checkmark = at least one completed
  video that day, a small numbered badge if more than one, today gets an accent
  ring, future days (this month, not yet happened) are dimmed and never show a
  checkmark. `dashCalNav(±1)` browses past months in place (`#dashCal` innerHTML
  swap, no full re-render) and can't navigate into the future; `dashCalMonth` resets
  to the current month every time the Dashboard is opened. A one-line caption below
  states the real numbers ("You completed videos on N of the last M days.") instead
  of a Less→More legend.
- **Momentum score** (`momentumScore`, 0–100, reuses `scoutTier`'s good/mid/low
  thresholds and colors): blend of completion rate (40%), pace/avgPerWeek (35%), and
  current streak (25%) — modeled after `scoutScore`'s clamp-and-blend composite-index
  pattern for consistency with the rest of the codebase.
- **Streaks** (`computeStreaks`): current streak counts consecutive calendar days
  with ≥1 completed video, walking back from today; if nothing's completed *yet*
  today it still counts as alive through yesterday (breaks only after a full missed
  day) — no Duolingo-style push notifications, just the number.
- **Weekly goal is user-editable** (`weeklyGoal` state, `editWeeklyGoal`, pencil icon
  on the goal card — NOT in Settings, edited inline where it's used). `null` = the
  auto-suggested default (`max(3, round(avgPerWeek))`, a reasonable starting point);
  once a creator sets their own number it's used verbatim — a lowball auto-suggestion
  shouldn't be the ceiling on someone who wants real pressure to stay consistent.
  Clearing the prompt back to blank returns to the auto-suggestion. Synced across
  devices the same way `apiKey` is (`weeklyGoal` in the `cloudSave` payload; on
  sign-in, cloud value is adopted only if this device hasn't set one — an explicit
  local choice always wins over a synced default).
- **Future scalability (built for, not built yet):** the section-by-section render
  and the append-only `activity` log are intentionally generic enough to support
  Year-in-Review, Weekly Review emails/summaries, or per-niche insights later without
  a data-model change — don't add those now, just don't break the log shape.

## Features currently live

- **Discover:** country + niche pickers (local-language search for silent comedy),
  **result count = a number stepper (default 10, 1–500, arrows or type)** like the
  channel Top-N control; counts >50 paginate. Sort ("Biggest hits / Best match /
  Newest first") + time ("All time / Hot this week / Past month / 3 months / year"),
  free-text search, **Random** button. No quota-cost estimates surfaced (ambition rule).
  **COUNTRIES (48) are ordered by creator monetization strength** — Worldwide, then
  US → Australia → Norway → … down to emerging markets, so picking near the top
  always lands on highly competitive creative scenes. **NICHES (28)** cover ~99% of
  short-form content (comedy cluster, lifestyle, looks, food/fitness/travel,
  dance/music/art, DIY/hacks/ASMR, science/facts/motivation/money, tech/gaming/cars,
  pets/sports). Landing counters read these arrays' lengths automatically.
- **Discover: adding a channel to your directory happens inline on the video card,
  not in a separate list.** Used to show a "Channels in these results — tap to add"
  chip row above the videos, aggregated by channel; this was confusing (which
  chip belongs to which video?) and needed the user to cross-reference back to the
  grid. Now each card's channel-name row (`.chrow`) carries its own small
  `.chadd` **+** button next to the name, calling `addFromDisc(chId, chName, ...)`
  directly — no aggregation step, no separate section. The button disappears once
  that channel is already in the directory (`creators.some(c=>c.id===v.chId)`), and
  `addFromDisc` removes any other matching `.chadd[data-ch]` buttons in place after
  a successful add (a channel can appear on multiple video cards in one result set).
  The old "they play muted as you scroll; tap the corner arrows for sound" hint
  above the grid was also dropped — people already know tapping a video opens it.
- **Video cards:** taller shorts-style ratio. On Discover they **autoplay muted +
  looped while on-screen and stop when scrolled out of view** — driven by an
  `IntersectionObserver` (`observePreviews`/`startPreview`/`stopPreview`/
  `stopAllPreviews`, threshold 0.5). ⤢ opens focused player with sound.
  **🔗 Copy link** button on every card (Discover, channel Top Shorts, Remake list).
- **My directory (workspace):** add creators **one at a time** by @handle/URL
  (`addCreator`, confirmed live against YouTube; Enter submits). Bulk paste-import was
  built then **deliberately reverted** — Braimah wants to discourage over-importing;
  Discover already covers browsing many. **No starter pack** — we don't push any
  creator (they don't pay for placement). Cards are **floating "bubbles"** (`.creator`,
  built in `renderDir`): a strongly-rounded, centered card (avatar `.cr-av` on top,
  name, @handle, then a `.cr-tags` row with the Scout chip + style tags), that
  **gently bobs** — each card carries inline `--fdur`/`--fdel` custom props so they
  drift on independent cycles (`@keyframes crfloat`), and `:nth-child(even)` gets a
  static `margin-top` stagger so the grid reads organic, not like a rigid table.
  Deliberately creative per Braimah's ask, but still a scannable responsive grid
  (`.grid` auto-fill, 2-up at ≤560px) **ranked by Scout Score** with a name search.
  Hover pauses the float. All motion is **reduced-motion-gated** (`.creator{
  animation:none}`); the stagger stays (it's static layout, not motion). `dirF = {q}`.
  Note: the `.grid` and the add-creator `.card` above it share `main`'s full width,
  so their left/right edges line up exactly — keep new directory rows inside `main`
  (no extra insets) so nothing "extends past" the add-creator box.
- **Seamless "no API key yet" round-trip.** A first-time user typing a handle into
  "Add creator" with no key set gets routed to Settings to add one — but they used
  to have to manually navigate back and re-type the handle, which felt broken for
  a beginner-friendly app. Now `ensureCanScout(resume)` accepts an optional
  `{route, run}` descriptor, stored in module-level `pendingResume` right before
  the "add a key" prompt fires; `addCreator()` registers one that restores the
  typed handle into `#addIn` and calls itself again. Declining the prompt clears
  `pendingResume` (so it can never fire later for an unrelated key save).
  `saveKey()` checks `pendingResume` first: if set, it skips the normal "Key saved
  ✓" alert (an extra click to dismiss right before navigating away would undercut
  the seamlessness) and instead `go()`es straight back and calls `resume.run()` —
  so saving the key finishes the exact add-creator attempt automatically, live API
  call and all. `renderSet()` shows a one-line contextual banner ("we'll take you
  straight back…") whenever `pendingResume` is active, so the redirect doesn't
  feel like a random detour. Currently wired up for the Directory add-creator flow
  only (the case this was built for) — Discover's own gated actions still redirect
  to Settings but don't auto-resume; extend the same `resume` pattern there later
  if the same friction shows up.
- **Mobile Discover = selector-card deck + bottom sheets, not dropdowns.** At
  ≤720px the raw `<select>` row (`.filterbar`) is hidden and replaced by
  `.disc-deck`: a 2×2 grid of tappable selector cards (Country/Niche/Sort/Time —
  icon, label, current value, chevron) plus a full-width results stepper
  (`discCount(±5)`). Tapping a card opens a **branded bottom sheet**
  (`discSheet(kind)` → `#modal`, `.sheet-ov`/`.sheet`, slide-up animation,
  drag-grip, searchable list for the 48 countries / 28 niches, checkmark on the
  selected row; backdrop tap or Escape closes; ≥721px it centers as a modal but
  desktop keeps the plain select row — don't remove that). Picking re-renders
  Discover with the new value. **Both UIs read/write the same `disc` state**, so
  adding a filter means updating the selects AND the deck/sheet. Reduced-motion
  disables the slide. Search placeholders stay short; Enter submits.
- **Discover starter card (blank-page killer):** before the first search,
  `#dres` isn't empty — `discStarterHTML()` renders three one-tap starts
  ("US × Silent comedy", "Worldwide × Food", "Surprise me" → `discQuick`/
  `randomDiscover`) so a first-timer's first ten seconds produce a result, not a
  form. It naturally disappears once a search fills `#dres`.
- **Mobile: 2-up cards, not full-width.** At `≤560px`, `.vgrid` (video cards —
  Discover, a creator's scouted Shorts, and the Saved/Remaking/Completed board all
  share it) and `.grid` (the directory's creator list) switch from 1 column to 2,
  with tightened font/padding/icon sizes so nothing feels cramped. One full-width
  card per screen forced heavy scrolling just to compare a handful of ideas; 2-up
  lets people scan and pick faster. Desktop is untouched — it already showed plenty
  via the normal `auto-fill` grid.
- **Creator workflow (progress model):** every video has one permanent status keyed
  by its YouTube id — **New / ⭐ Saved / 🎬 Remaking / ✅ Completed / 🚫 Skipped** —
  stored in the `library` map (`ss_library`, synced to Firestore). The pipeline is
  **Save an idea → Remaking (planning/filming) → Completed**. `normalizeLib` migrates
  the old `"remade"` status to `"completed"` on load/import/merge. On a creator's
  page the scouted Shorts show status-filter chips (**Active** = New+Saved default,
  plus Saved / Remaking / Completed / Skipped / All); the per-card action row is
  Save / Remaking / Completed / Skip (+ a notes pencil once actioned), updated in
  place by `vSetCreator`. Autoplay-in-view is on except **Completed + Skipped**.
- **Board tab (`renderRemake`) = the workflow hub:** three status tabs **Saved /
  Remaking / Completed** (NOT a Notes tab — notes belong to a video, not a category),
  rendered as **Instagram-Edits-style cards** (`.boardtabs`/`.btab`: icon on top,
  name, big count) in a fixed `repeat(3,1fr)` grid **capped at 460px** so they always
  sit on one line and never wrap on mobile (a real bug before — a flex-wrap row broke
  onto two lines on phones). Cards carry contextual actions: Saved → [Start remaking,
  Collection, Notes, Remove]; Remaking → [Mark completed, Collection, Notes, Back to
  Saved]; Completed → [Reopen, Notes]. Saved+Remaking autoplay; Completed is static.
  `libFilter` = saved|remaking|completed; switching tabs resets `libGroup` to null.
- **Collections = ad-hoc folders within Saved/Remaking** (`library[id].g`, a free-text
  label like "Gym"/"Park"/"Kitchen"). Purpose: a creator can only film some ideas in
  some contexts, so they file ideas by what a shoot *needs* and focus on what's doable
  now. **A filed idea lives in exactly ONE place** — it leaves the loose "All" pile
  and shows only inside its collection (Braimah's explicit ask: no point hunting "All"
  for something you already filed). So the bucket counts add up to the tab total with
  no double-listing: `All (loose) + Σcollections = Saved`. **Derived, never declared:**
  the `Collections` chip row (`.grplabel`+`.grpbar`, Saved+Remaking only) is computed
  from the `g` tags present, so an emptied collection just disappears — nothing to
  delete by hand. `libGroup` = `null` (All = loose/unfiled) or a collection name; a
  stale filter auto-resets to All. Empty-All-but-collections-exist shows a "tap a
  collection above" hint, not a scary "nothing saved". `groupPicker(id)` is a branded
  dialog: existing collections as one-tap chips + a "new collection" field; `setGroup`
  assigns/clears and touches `u` so the tag rides the newest-wins sync merge. `g` is
  preserved through status changes (`vSet`) and merged like notes (`mergeLibrary`).
  `_grpNames` holds the current tab's names for index-based onclicks (avoids escaping
  labels into inline handlers).
- **Shareable deep links play in-app** (`copyLink` → `location.origin+"/?v=ID"`, not a
  youtube.com URL). On load, `?v=ID` (validated by `validVid` = 11-ish safe chars,
  which also hardens the id that flows into the player iframe src) opens the branded
  player over the resumed base view and cleans the URL. **Legal:** it's the official
  YouTube IFrame embed (same one used everywhere here), not a re-host — and it pulls
  whoever clicks a shared link onto ScoutViral instead of straight to YouTube.
- **Per-video notes = "Production Notes":** pencil on any actioned video opens the
  `editNote` modal (title "Production Notes", "Write down anything you'll need to
  recreate this video.", Save button). Note stored as `library[id].n`, survives
  status changes, shown in a dashed `.vnote` box. On **Discover** cards the pencil
  appears next to the star the moment an idea is saved (`discPencilHTML`/
  `discSyncPencil`); Discover cards carry `data-card` so the note renders in place.
- **Marking Completed asks first** (`confirmCompleted` → branded uiConfirm) — the
  finish-line moment; copy reassures that production notes stay with it.
- **Settings:** API key has Save + **Remove key** (confirm dialog); privacy line is
  the confident "Your privacy is protected…" copy. No quota talk anywhere.
- **Top Shorts ranking:** a "Ranked by views / Ranked by engagement" select on the
  creator page (`ss_rankby`, `rankVids`/`engRatio` = likes÷views; hidden-likes videos
  sink to the bottom of an engagement ranking). Engagement mode shows "X% liked" on
  each card and the CSV export gains an `engagement_pct` column. This is what makes the
  landing's "ranked by views or engagement" true.
- **No global footer; legal lives quietly in Settings.** The old always-visible
  `<footer>` (Powered by YouTube + ToS/Privacy links + "your API key stays in your
  browser") read as unpolished chrome on every screen, so it was removed. A
  **first-visit consent gate** was tried and **rejected** (it broke the seamless
  first-run feel — don't re-add a startup modal for this). **The required YouTube
  API attribution is NOT deleted** (the YouTube API ToS requires client apps to
  link the YouTube Terms of Service + Google Privacy Policy): it's a small muted
  line at the **bottom of Settings** ("No cookies, no tracking, no ads… Powered by
  YouTube… YouTube Terms of Service / Google Privacy Policy") — present for
  compliance, out of the way, seen only when someone opens Settings (which every
  key-related nudge sends them to anyway). `main{min-height:60vh}` now (was
  `calc(100vh - 162px)` to reserve footer space) since there's no footer.
- **Channel view:** "Scout range" control (Last 50/100/200/500/1,000 uploads,
  Full history, or Custom #) sets how deep to look; "Show top N" sets how many
  ranked Shorts to display; "Scout"/"Rescout" runs it; export CSV. (User-facing
  copy says "scout", not "scan"; the internal functions are still `scanChannel`
  etc.)
- **Scout Score (`scoutScore` in index.html):** a 0–100 signal computed *client-
  side from a channel's scanned Shorts* — shown big on the channel view (with a
  plain-English verdict via `scoutVerdict`) and as a small `⚡ Scout NN` chip on
  directory cards once a creator has been scouted. Weighted blend: hit rate 35%
  (share of Shorts ≥2× the channel's own median = breakout ideas), reach 20%
  (median views, log-scaled), engagement 15% (like/view, neutral if likes hidden),
  consistency 15% (Shorts/month), freshness 15% (still posting + recent Shorts
  still landing). Deliberately replaces subscriber count as the headline metric.
  Tiers: ≥75 green, ≥50 amber, else grey. Needs ≥3 Shorts or returns null.
- **Settings:** paste API key, backup/restore JSON (now `{creators, library}`,
  still imports old `remakes` backups), clear caches.

## Known constraints / gotchas

- YouTube API caps `search` and `videos` endpoints at 50 items/call — that's why
  custom counts >50 paginate (`pagedSearchIds` / `batchVideoDetails` in index.html).
- Auth **authorized domains** (`scoutviral.com`, `.web.app`) are already added —
  Google sign-in works. This setting is console-only if it ever needs changing.
- Firebase App Hosting is intentionally NOT used — don't re-enable it.
- There's a separate `youtube-shorts-scout.js` Node CLI in the parent Downloads
  folder (not in this repo) — an early standalone scraper script, superseded by the
  web app. Ignore unless asked.

## Ideas parked for later (do NOT build unless asked)

- Shared low-quota key so first-time users can try before making their own API key
  (the current biggest onboarding friction for non-technical users).
- Ads / "featured creator" placement (label sponsored) — post-launch monetization.
- Privacy page before public launch (needed for Google sign-in verification).

## Commit style

Short imperative subject, a blank line, then a brief why. Nothing fancy.
