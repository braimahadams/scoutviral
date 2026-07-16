# ScoutViral — Project State & Handoff

> **This file is the source of truth across laptops.** Chat history does NOT carry
> between machines, but this repo does. On a new laptop: `git pull`, then tell
> Claude "read CLAUDE.md and catch up." Claude Code also auto-loads this file.
>
> **Keep it current:** whenever a meaningful change ships, update the relevant
> section and the "Last updated" line below, then commit it with the change.

**Last updated:** 2026-07-16 (landing copy pass, monetization-ordered countries, 28 niches, cloud merge-not-overwrite, remade confirmation, key removal)

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
  Data API v3 key (stored in their browser's localStorage only, never sent to us).
  All API usage bills to the user's own free Google quota (10,000 units/day).

## Architecture / accounts

- **Firebase/GCP project ID:** `scoutviral` (this is the real one — see History).
- **Hosting:** classic Firebase Hosting (NOT App Hosting — that was deleted, it
  kept failing because this is a static site with no package.json).
- **Auth:** Google + Email/Password enabled. Firestore syncs each signed-in user's
  directory + remake list. Works in "local mode" (no login) too.
- **Sync is MERGE, never overwrite** (`mergeCreators`/`mergeLibrary` in index.html):
  on sign-in, cloud and local are unioned — per-video the newest status wins and a
  note from either side is always kept; creators dedupe by channel id OR handle
  (starter-pack entries have no id until scouted). Sign-out never touches local
  data, so nobody ever loses saves. Don't regress this to a plain overwrite.
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
- **Bottom tab bar on mobile** (Discover/Directory/Remakes/Settings), inline top
  nav on desktop — driven by CSS media query on the single `<nav>`; `go()`/`data-v`
  unchanged. Big rounded video cards are the hero (`.vgrid`, `.vid`, `.vid.tall`).
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
- **Motion** (`lpInit`/`lpCount`/`lpParallax`, all `lp-`-prefixed): IntersectionObserver
  scroll-reveal, animated counters (computed live from `COUNTRIES.length`/`NICHES.length`
  — they can't drift), CSS float on the hero cards, and a gentle desktop-only pointer
  parallax. All gated behind `prefers-reduced-motion`; the mousemove listener is
  torn down in `go()` when leaving home. No emojis (SVG `ico()` only), no new deps.

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
- **My directory (workspace):** add creators by @handle/URL (verified live against
  YouTube) or load a 34-creator starter pack. Deliberately lean — no country input,
  no country/style filter dropdowns, no country grouping; a single grid **ranked by
  Scout Score** (scouted creators first) with a name search. `dirF = {q}` only.
- **Video workflow (statuses):** every video has one permanent status keyed by its
  YouTube id — **New / ⭐ Saved / 🎬 Remade / 🚫 Skipped** — stored in the `library`
  map (`ss_library`, synced to Firestore; migrated from the old `ss_remakes`). On a
  creator's page the scouted Shorts show status-filter chips (**Active** = New+Saved
  is the default, plus New / Saved / Remade / Skipped / All); status survives
  rescans. Save/Remade/Skip buttons update the card in place (`vSetCreator`,
  `vStat`/`vSet`); skipped/remade leave the working view. Autoplay-in-view is on for
  New/Saved/Active/All, **off for Remade + Skipped** (static references).
- **Remakes tab = global board:** Saved (inspiration board, autoplay) + Remade
  (static) + **Notes** view (every video with a note — the "shopping list" for
  props/gear). Built from `library`; `renderRemake`/`vSetById`.
- **Per-video notes:** pencil button on any non-New video opens a multiline
  dialog (`editNote`); note stored as `library[id].n`, survives status changes,
  shown in a dashed `.vnote` box on the card. Aggregated in the board's Notes view.
  On **Discover** cards the pencil appears next to the star the moment an idea is
  saved (`discPencilHTML`/`discSyncPencil`) and Discover cards carry `data-card` so
  the note box renders in place.
- **Marking Remade asks first** (`confirmRemade` → branded uiConfirm) because the
  card moves off the working list; the copy reassures that any note stays with it.
- **Settings:** API key has Save + **Remove key** (confirm dialog); privacy line is
  the confident "Your privacy is protected…" copy. No quota talk anywhere.
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
