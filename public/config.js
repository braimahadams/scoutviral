/* ============================================================
   Creator Scout — site configuration
   The app works WITHOUT this (local mode, no sign-in).
   To enable Google sign-in + cloud sync:
   1. console.firebase.google.com → your project → Project settings
   2. Under "Your apps" add a Web app → copy the firebaseConfig values here
   ============================================================ */
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBKiCsNvm1NdCWZ-ovoAbM2D76nDUdxdZs",
  authDomain: "scoutviral-abc1f.firebaseapp.com",
  projectId: "scoutviral",
  storageBucket: "scoutviral.firebasestorage.app",
  messagingSenderId: "341581212283",
  appId: "1:341581212283:web:605904210b5f04c1e090de"
};

/* ============================================================
   Optional shared TRIAL key — lets first-time visitors run a few
   searches/scouts before creating their own free key. When their
   free preview runs out (or the shared daily quota is used up),
   the app nudges them to add their own key to keep going.

   To turn it on:
   1. console.cloud.google.com → project "scoutviral"
   2. APIs & Services → Library → enable "YouTube Data API v3"
   3. APIs & Services → Credentials → Create credentials → API key
   4. Edit the key → Application restrictions → Websites, and add:
        scoutviral.com/*   ,   *.web.app/*
      (this locks the key so it only works from your own site)
   5. API restrictions → restrict to "YouTube Data API v3"
   6. Paste the key below.

   It's a hard-capped FREE quota (10,000 units/day) — there is no
   billing and no way to be charged. Leave "" to require every user
   to bring their own key from the very first search.
   ============================================================ */
window.TRIAL_YT_KEY = "";
