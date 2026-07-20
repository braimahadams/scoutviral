# ScoutViral — Project State & Handoff

> **This file is the source of truth across laptops.** Chat history does NOT carry
> between machines, but this repo does. On a new laptop: `git pull`, then tell
> Claude "read CLAUDE.md and catch up." Claude Code also auto-loads this file.
>
> **Keep it current:** whenever a meaningful change ships, update the relevant
> section and the "Last updated" line below, then commit it with the change.

**Last updated:** 2026-07-20 (Desktop nav is now a left sidebar, Instagram-web style — icon-only 721–1099px, full labels ≥1100px, account flyout pinned to the sidebar bottom; mobile bottom tab bar unchanged)

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
- **Bottom tab bar on mobile** (Discover/Directory/Remakes/Settings, `≤720px`);
  **left sidebar on desktop** (`>720px`), Instagram-web style — the same single
  `<header>`/`<nav>` markup is reused for all three layouts purely via CSS media
  queries (`go()`/`data-v`/`render()` untouched, no duplicated DOM). Three states:
  - `≤720px` — unchanged mobile: sticky top header (logo + account avatar only),
    `nav` pulled out via `position:fixed;bottom:0` as the tab bar.
  - `721–1099px` — **icon-only left sidebar**, `header{position:fixed;left:0;
    width:76px;height:100vh}`, nav vertical, labels hidden (`nav button .lbl{
    display:none}`), logo shows just the play-mark (the wordmark text is wrapped
    in `<span class="word">` so it can be hidden without touching the SVG).
  - `≥1100px` — **expanded sidebar**, `width:248px`, full nav labels and wordmark
    back, matching Instagram's own icon→labeled-sidebar breakpoint behavior.
  `body{padding-left:76px / 248px}` reserves the matching gutter so `main`/`footer`
  (already `width:100%;margin:0 auto`) recenter themselves for free — no other
  layout math needed. `.statusbar{left:76px / 248px}` keeps the scan-progress toast
  from sliding under the sidebar. **Don't add `overflow-x`/`overflow-y` to `header`**
  — it's a one-line trap: CSS forces the *other* overflow axis to clip too once either
  is non-`visible`, which silently clips the account flyout menu (see below) whenever
  it needs to render outside the 76px/248px column. Sidebar content is short and
  fixed (logo + 4 nav + account) and doesn't need scrolling anyway.
  Big rounded video cards are the hero (`.vgrid`, `.vid`, `.vid.tall`).
  **Main nav intentionally stays 4 items** — Dashboard is NOT a 5th tab (see below).
- **Account control (`#authbox` → `.acctwrap`):** on mobile, one avatar/icon button
  top-right of the header; **on desktop it's pinned to the bottom of the left
  sidebar** (`margin-top:auto` inside the column-flex header) — the Instagram
  profile-in-the-sidebar pattern. Opens a small flyout (`renderAuth`/
  `toggleAcctMenu`/`closeAcctMenu`, same functions/DOM at every breakpoint) with
  **Dashboard** and Sign in/out (or "Local mode" if Firebase isn't configured).
  The flyout's anchor flips with the sidebar state so it's never clipped by the
  viewport edge: mobile → below-right (`top:100%;right:0`), icon-only sidebar →
  beside it (`left:calc(100% + 10px);bottom:0`), expanded sidebar → above it
  (`bottom:calc(100% + 8px);left:0`). **Settings is deliberately NOT in this
  flyout** — it only lives in the main nav (sidebar or bottom tab bar). Reasoning:
  Settings is where every in-app nudge sends people (trial ended, no API key yet,
  etc.), so it needs to stay a fast, always-visible, one-tap destination, and it
  works with zero account at all (local mode) — putting it only behind an avatar
  click would bury the single most-needed screen for a brand new user. The flyout
  is scoped purely to account-y things: your personal stats and your sign-in
  state. Don't re-add Settings there; if it ever feels missing, that's a sign the
  main nav access broke, not that the flyout needs it back. Works identically
  signed-in or not — Dashboard reads local data either way. Closes on outside
  click or Escape.
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
- **All product visuals are pure CSS/DOM mockups** built from the real design
  tokens (a mock "app window" with a Discover grid + floating Scout Score / Saved
  cards, a **worldwide creator mesh**, a ranked Top-Shorts list, an idea-board
  grid). Chosen over generated images on purpose: crisp at any DPI, theme-aware,
  zero network weight, and always matches the real UI. If you change a real
  component's look, glance at its `.lp-*` mock twin so they don't drift.
- **The "Discover worldwide" visual is a creator mesh** (`.lp-mesh`, built in
  `renderHome` from `meshNodes`/`meshLinks`), not the old pulsing-pins map. It
  reads as a live global network **over a dotted world map**: gradient-avatar
  nodes (`.lp-node`, an `ico("user")` silhouette on an `LP_G` gradient) sit on
  their home continent — N/S America, Europe, Africa, a central **hub** node,
  E-Asia, Oceania — joined by animated dashed "connection" lines (`.lp-mline`,
  red accent, `lpflow` flowing dash). The world map is **generated, not an asset**:
  `CONT` is a list of continent ellipses `[cx,cy,rx,ry]` and a grid scan keeps a
  faint dot (`.lp-mdots circle`) wherever it falls inside one — so a creator from
  any continent sees themselves placed on it. **Coordinate trick:** the SVG is
  `viewBox="0 0 210 100" preserveAspectRatio="none"` over the ~2.1:1 box (so units
  are ≈square → dots render round); a node's HTML `left/top` is a %, and its SVG
  point is `(xPct*2.1, yPct)` — lines, dots, and avatars all share that space, so
  endpoints land exactly on avatar centers (verified 0px). Move a node → its
  continent ellipse must move too, or it floats off the land. Deliberately
  **gradient avatars, not photos** (same reason as every other mock: crisp,
  theme-aware, zero network weight, no external asset). All animation is
  reduced-motion-gated.
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
  creator (they don't pay for placement). Cards show the creator's **profile photo**
  (`c.meta.thumb` → `.cr-av`, initial-letter placeholder when absent) beside the name
  for at-a-glance recognition. Deliberately lean — no country input, no filter
  dropdowns; a single grid **ranked by Scout Score** with a name search. `dirF = {q}`.
- **Mobile Discover filters wrap** (`.filterbar` at ≤600px is `flex-wrap:wrap`, NOT a
  hidden horizontal scroll) so all controls — country, niche, result count, sort,
  time — are visible. Search placeholders are short ("Type your own search…",
  "@handle or channel link") so they fit small inputs; Enter submits both.
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
- **Board tab (`renderRemake`) = the workflow hub:** three tabs **Saved / Remaking /
  Completed** (NOT a Notes tab — notes belong to a video, not a category). Cards carry
  contextual actions: Saved → [Start remaking, Notes, Remove]; Remaking → [Mark
  completed, Notes, Back to Saved]; Completed → [Reopen, Notes]. Saved+Remaking
  autoplay; Completed is static. `libFilter` = saved|remaking|completed.
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
- **Sticky footer:** the global `<footer>` sits at the page bottom on every view via
  `main{min-height:calc(100vh - 162px)}` (NOT body flex — the trailing empty
  #modal/#dialog/#sbar divs broke flex free-space distribution). If header/footer
  height changes materially, retune the 162px reserve.
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
