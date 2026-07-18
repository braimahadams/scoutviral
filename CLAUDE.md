# ScoutViral — Project State & Handoff

> **This file is the source of truth across laptops.** Chat history does NOT carry
> between machines, but this repo does. On a new laptop: `git pull`, then tell
> Claude "read CLAUDE.md and catch up." Claude Code also auto-loads this file.
>
> **Keep it current:** whenever a meaningful change ships, update the relevant
> section and the "Last updated" line below, then commit it with the change.

**Last updated:** 2026-07-16 (Creator Dashboard — activity log, contribution graph, streaks/momentum, account dropdown; fixed floating-card & glow overflow at mid-range viewport widths)

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
- **Bottom tab bar on mobile** (Discover/Directory/Remakes/Settings), inline top
  nav on desktop — driven by CSS media query on the single `<nav>`; `go()`/`data-v`
  unchanged. Big rounded video cards are the hero (`.vgrid`, `.vid`, `.vid.tall`).
  **Main nav intentionally stays 4 items** — Dashboard is NOT a 5th tab (see below).
- **Account control (`#authbox` → `.acctwrap`):** one avatar/icon button in the header
  opens a small dropdown (`renderAuth`/`toggleAcctMenu`/`closeAcctMenu`) with
  **Dashboard**, **Settings**, and Sign in/out (or "Local mode" if Firebase isn't
  configured). Works identically signed-in or not — Dashboard reads local data either
  way. Closes on outside click or Escape. The label hides at ≤860px (inline nav still
  crowds the header there) leaving just the tappable avatar/icon.
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
  cards, a world-pin map, a ranked Top-Shorts list, an idea-board grid). Chosen
  over generated images on purpose: crisp at any DPI, theme-aware, zero network
  weight, and always matches the real UI. If you change a real component's look,
  glance at its `.lp-*` mock twin so they don't drift.
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
- **Sections (top to bottom):** greeting → this-week goal + Momentum score → activity
  contribution graph (`dashContribution`, 13 weeks × 7 days, Sunday-aligned, colored by
  `color-mix(in srgb, var(--accent) N%, var(--bg2))` so it's theme-aware for free) →
  6-week trend bar chart (`dashWeeklyTrend`) → 8 stat tiles (`dashStats`, `.dashtile`,
  responsive `auto-fit` grid) → auto-generated insights (`dashInsights`, up to 5,
  short sentences: most productive day, week-over-week delta, streak, average pace).
  Empty state (no library entries and no activity) shows a single welcoming card
  instead of a wall of zeros.
- **Momentum score** (`momentumScore`, 0–100, reuses `scoutTier`'s good/mid/low
  thresholds and colors): blend of completion rate (40%), pace/avgPerWeek (35%), and
  current streak (25%) — modeled after `scoutScore`'s clamp-and-blend composite-index
  pattern for consistency with the rest of the codebase.
- **Streaks** (`computeStreaks`): current streak counts consecutive calendar days
  with ≥1 completed video, walking back from today; if nothing's completed *yet*
  today it still counts as alive through yesterday (breaks only after a full missed
  day) — no Duolingo-style push notifications, just the number.
- **Weekly goal**: rolling 7-day window, suggested goal = `max(3, round(avgPerWeek))`
  — not user-editable (kept out of Settings on purpose, avoids feature bloat).
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
