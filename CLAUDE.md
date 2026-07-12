# ScoutViral — Project State & Handoff

> **This file is the source of truth across laptops.** Chat history does NOT carry
> between machines, but this repo does. On a new laptop: `git pull`, then tell
> Claude "read CLAUDE.md and catch up." Claude Code also auto-loads this file.
>
> **Keep it current:** whenever a meaningful change ships, update the relevant
> section and the "Last updated" line below, then commit it with the change.

**Last updated:** 2026-07-12 (latest commit: `bd483c7`)

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

## Features currently live

- **Discover:** country + niche pickers (local-language search for silent comedy),
  result count 10/25/50 **+ Custom (up to 500, paginated)**, sort/time filters,
  free-text search, **🎲 Random** button, per-search quota-cost estimate.
- **Video cards:** taller shorts-style ratio. On Discover they **autoplay muted +
  looped inline** (lazy-loaded); ⤢ button opens focused player with sound.
  **🔗 Copy link** button on every card (Discover, channel Top Shorts, Remake list).
- **My directory:** add creators by @handle/URL (verified live against YouTube),
  or load a 34-creator silent-comedy starter pack.
- **Channel view:** scan a channel's history, rank its top Shorts, export CSV.
- **Remake list:** starred ideas, synced to Firestore when signed in.
- **Settings:** paste API key, backup/restore JSON, clear caches.

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
