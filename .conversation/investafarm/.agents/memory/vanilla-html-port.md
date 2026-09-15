---
name: Vanilla HTML port strategy
description: How to port a plain HTML/CSS/JS multi-page site into the Replit pnpm_workspace without converting to React
---

# Vanilla HTML/CSS/JS Port into pnpm_workspace

## The rule
When the imported app is plain HTML/CSS/JS (not Next.js/React), do NOT convert to React. Instead:
- Replace `artifacts/<slug>/index.html` with the site's real homepage HTML
- Drop all other HTML pages into `artifacts/<slug>/public/` — Vite serves them as-is at their paths
- Drop all CSS, JS, and images into `artifacts/<slug>/public/` as well
- The `src/main.tsx` scaffold file can remain untouched (it's never loaded since index.html has no module script tag)

**Why:** Vite's public directory serves files verbatim at the root URL. A file at `public/investors.html` is immediately available at `/investors.html` with no Vite processing.

## Visit tracking quirk
When Express served the HTML in the original app, visit tracking was middleware-level. After Vite takes over serving HTML, Express never sees those requests. Fix: add a client-side beacon (POST /api/visit) at the top of the shared script.js.

## How to apply
Any time the migrated app has no `app/`, `pages/`, or React entry point — just HTML files and static assets.
