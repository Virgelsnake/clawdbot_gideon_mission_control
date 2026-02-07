# Phase 4 Implementation Tasks — Cloud Deployment & Multi-Device Access

**Source PRD:** `tasks/prd-phase4-cloud-deployment-and-multi-device.md`
**Created:** 7 February 2026
**Status:** Ready for execution

---

## Notes / Changes

_(Record scope changes, discoveries, and deferred items here as work progresses.)_

### Pre-existing baseline issues (7 Feb 2026)
- **Tests:** 4 test files fail (16 tests) — `SettingsProvider` wrapper missing in test renders. 10 tests pass. Not caused by Phase 4.
- **Lint:** 2 errors (`setState` in effect in `agent-context.tsx` and `settings-context.tsx`), 3 warnings (unused vars). Pre-existing.
- **Build:** ✅ Clean (`next build` passes, `tsc --noEmit` clean)
- **Git:** Clean working tree (only untracked `tasks/implementation-tasks-phase4.md`)

---

## 0. Pre-Flight

- [x] **0.1** Baseline health check — run `npm run build`, `npm test`, `npx tsc --noEmit`, `npm run lint` and confirm all pass (or document pre-existing failures)
- [x] **0.2** Create feature branch `phase4/cloud-deployment` from current HEAD
- [x] **0.3** Confirm Supabase project is accessible and env vars are configured in `.env.local`
- [x] **0.4** Confirm Netlify account exists (or create one) — Netlify account confirmed (gideon.rebel@ai-with.agency, 2 sites)
- [x] **0.5** Confirm Cloudflare account exists (gideon.rebel@ai-wit...) — API token NOT needed; `cloudflared tunnel login` uses browser OAuth

---

## 1. Production Build Fixes

> **Maps to:** FR-1.3, FR-6.7
> **Directly affected:** `next.config.mjs`, `package.json`, various components
> **Indirect consumers:** All — build must be green for deployment

- [x] **1.1** Run `npm run build` and catalogue any errors or warnings — build was clean pre-migration
- [x] **1.2** Fix all build-blocking errors (TypeScript, missing imports, SSR issues) — no errors found
- [x] **1.3** Resolve `next-pwa` compatibility with Next.js 16 — replaced `next-pwa` with `@serwist/next` (v9.5.4); `next-pwa` was silently failing to generate SW. Build now uses `--webpack` flag (Serwist requirement), dev uses `--turbopack`
- [x] **1.4** Validate: `npm run build` passes cleanly with production output — SW generated at `/sw.js` (43KB), `tsc --noEmit` clean

**⏸ CHECKPOINT — Section 1 complete. Stop for approval.**

---

## 2. Gateway Client Dual-Mode (Local vs Tunnel)

> **Maps to:** FR-2.3, FR-2.5, FR-2.6
> **Directly affected:** `lib/gateway/client.ts`, `.env.local.example`
> **Indirect consumers:** `app/api/chat/route.ts`, `app/api/chat-bridge/route.ts`, `app/api/model-switch/route.ts`, `app/api/models/route.ts`, `app/api/status/route.ts`

- [x] **2.1** Update `getGatewayEnv()` in `lib/gateway/client.ts` to select tunnel URL in production: if `OPENCLAW_GATEWAY_TUNNEL_URL` is set, use it; otherwise fall back to current logic. Added `isGatewayTunnel()` helper.
- [x] **2.2** Add `OPENCLAW_GATEWAY_TUNNEL_URL` to `.env.local.example` with documentation comment
- [x] **2.3** Review all API routes — made `/api/status` (HTTP probe in tunnel mode vs TCP locally), `/api/model-switch` (Supabase-only in tunnel mode vs config file locally), `/api/models` + `model-cache.ts` (dynamic imports, tunnel-aware fallbacks) production-safe
- [x] **2.4** Extended `/api/status` to report `mode: 'tunnel' | 'local'` and use HTTP probe for tunnel, TCP probe for local
- [x] **2.5** Validate: `npm run build` passes; `npx tsc --noEmit` clean

**⏸ CHECKPOINT — Section 2 complete. Stop for approval.**

---

## 3. Netlify Deployment Setup

> **Maps to:** FR-1.1, FR-1.2, FR-1.4
> **Directly affected:** `netlify.toml` (new), Netlify project config
> **Indirect consumers:** All — production deployment target

- [x] **3.1** Create `netlify.toml` at project root with build settings: `command = "npm run build"`, `publish = ".next"`, `[build.environment]` NODE_VERSION=20, NEXT_TELEMETRY_DISABLED=1. Added `.netlify` to `.gitignore`
- [x] **3.2** `@netlify/plugin-nextjs` NOT needed — Netlify auto-uses OpenNext adapter (v5.15.8) for Next.js 13.5+. No pinning required.
- [x] **3.3** Deploy to Netlify — site live at https://gideon-mission-control.netlify.app (site ID: `826213fc-1763-48fa-b97f-8a5cda9c77f0`). Used `netlify link` + `netlify deploy --build --prod`
- [x] **3.4** Configure production environment variables on Netlify: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secret), `OPENCLAW_GATEWAY_TOKEN` (secret), `OPENCLAW_CANONICAL_SESSION_KEY`. `OPENCLAW_GATEWAY_TUNNEL_URL` deferred to Section 4 (tunnel not yet configured)
- [x] **3.5** Validate: deployed site loads ✅, Supabase data appears (3 tasks across Backlog/To Do/In Progress) ✅, kanban board fully functional ✅
- [x] **3.6** Validate: chat shows "Disconnected" status ✅, model selector shows "Not Configured" with graceful fallback ✅, `/api/status` returns 502 (expected — no tunnel yet) ✅

**⏸ CHECKPOINT — Section 3 complete. Stop for approval.**

---

## 4. Cloudflare Tunnel Setup

> **Maps to:** FR-2.1, FR-2.2, FR-2.4
> **Directly affected:** iMac system config (`cloudflared`, LaunchAgent), Netlify env vars
> **Indirect consumers:** All gateway-dependent features (chat, model switch, status)

- [x] **4.1** Install `cloudflared` on the iMac (`brew install cloudflared`) — v2026.2.0 installed
- [x] **4.2** Authenticate with Cloudflare — `cloudflared tunnel login` browser auth blocked (Cloudflare account email unverified / zone nameservers not yet updated at Porkbun). Pivoted to quick tunnel approach (no auth required). Nameserver update tracked as separate Supabase task (due 2026-02-17).
- [x] **4.3** ~~Create a named tunnel~~ — SKIPPED: using `cloudflared tunnel --url` quick tunnel (trycloudflare.com) instead of named tunnel. Quick tunnels don't require account auth. Trade-off: URL changes on restart (mitigated by startup script).
- [x] **4.4** Configure tunnel to route to `http://127.0.0.1:18789` — startup script at `~/.cloudflared/start-tunnel.sh` starts quick tunnel, captures URL, and (optionally) updates Netlify env var via API
- [x] **4.5** Test tunnel manually — verified gateway reachable at `*.trycloudflare.com` URL (HTTP 200), `/api/status` returns `{"connected":true,"mode":"tunnel"}`
- [x] **4.6** Install as LaunchAgent (`com.missioncontrol.gateway-tunnel.plist`) for always-on operation with `KeepAlive` and `RunAtLoad`. Fixed PATH issue (LaunchAgent needs full path `/usr/local/bin/cloudflared`).
- [x] **4.7** Set `OPENCLAW_GATEWAY_TUNNEL_URL` on Netlify — set via Netlify MCP, redeployed with `npx netlify deploy --build --prod`. Note: quick tunnel URL changes on restart; manual update + redeploy needed until Netlify token is configured in `~/.cloudflared/netlify-token.txt` for auto-update.
- [x] **4.8** Validate: deployed site reaches gateway through tunnel ✅ — `/api/status` returns `{"ok":true,"connected":true,"mode":"tunnel"}`, `/api/models` returns model list, `/api/chat-bridge/history` returns chat history

**⏸ CHECKPOINT — Section 4 complete. Stop for approval.**

---

## 5. Basic Access Control

> **Maps to:** FR-4.1, FR-4.2, FR-4.3, FR-4.4
> **Directly affected:** `middleware.ts` (new), `app/(auth)/login/page.tsx` (new), `app/api/auth/route.ts` (new), `app/layout.tsx`, route group restructure
> **Indirect consumers:** All user-facing routes

- [x] **5.1** Evaluated options: (A) Netlify password — requires Pro plan ($19/mo), (B) Cloudflare Access — blocked by unverified DNS zone, (C) Next.js middleware password gate — free, no external deps. **Chose Option C.**
- [x] **5.2** Implemented Next.js middleware password gate: `middleware.ts` checks `mc_auth` cookie against `SITE_PASSWORD` env var, redirects to `/login` if missing. `app/api/auth/route.ts` verifies password and sets httpOnly cookie (30-day expiry). Restructured app into route groups: `(app)/` for dashboard (with app shell), `(auth)/login/` for login page (clean, no app shell). `SITE_PASSWORD` env var set on Netlify.
- [x] **5.3** Verified: Supabase Realtime WebSocket connections unaffected — they connect directly to `supabase.co`, not through Netlify. Dashboard loads all task data after login.
- [x] **5.4** Verified: Gideon's direct REST API access to Supabase unaffected — `curl` to `supabase.co/rest/v1/tasks` returns 200. Gideon bypasses Netlify entirely.
- [x] **5.5** Tested: unauthenticated request to `/` → 307 redirect to `/login`; wrong password → "Incorrect password" error; correct password → cookie set, redirect to dashboard with full data

**⏸ CHECKPOINT — Section 5 complete. Stop for approval.**

---

## 6. PWA Manifest & Service Worker Maturity

> **Maps to:** FR-3.1 through FR-3.6
> **Directly affected:** `public/manifest.json`, `next.config.mjs`, `app/layout.tsx`, `public/icons/`
> **Indirect consumers:** Mobile install experience

- [ ] **6.1** Update `public/manifest.json`: rename app to "Mission Control" (short_name: "MC"), remove `"orientation": "landscape"` (allow portrait for mobile), add `"scope": "/"`, add `"id": "/"`
- [ ] **6.2** Add `apple-touch-icon` link and iOS PWA meta tags to `app/layout.tsx` (`<meta name="apple-mobile-web-app-capable">`, `<meta name="apple-mobile-web-app-status-bar-style">`, `<link rel="apple-touch-icon">`)
- [ ] **6.3** Verify icon assets: `public/icons/icon-192x192.png` and `public/icons/icon-512x512.png` exist and are proper PNG icons (not placeholder)
- [ ] **6.4** Resolve service worker strategy: if `next-pwa` was replaced in Section 1, configure the new SW solution with offline fallback shell, `skipWaiting`, and cache strategy for static assets
- [ ] **6.5** Create offline fallback page (`app/offline/page.tsx` or `public/offline.html`) — simple "You're offline" message with MC branding
- [ ] **6.6** Validate: deploy to Netlify → install as PWA on iOS Safari and/or Android Chrome → home screen icon, splash screen, standalone mode all work
- [ ] **6.7** Validate: Lighthouse PWA audit score ≥ 90

**⏸ CHECKPOINT — Section 6 complete. Stop for approval.**

---

## 7. Mobile Responsive Layout

> **Maps to:** FR-5.1 through FR-5.5
> **Directly affected:** `app/layout.tsx`, `app/page.tsx`, `components/layout/header.tsx`, `components/layout/main-content.tsx`, `components/kanban/kanban-board.tsx`, `components/ideas/ideas-panel.tsx`, `components/chat/chat-panel.tsx`
> **Indirect consumers:** All UI components

### 7a. Mobile Layout Shell

- [ ] **7.1** Create bottom navigation bar component (`components/layout/bottom-nav.tsx`): 4 tabs — Board, Ideas, Chat, Settings; visible only on mobile (`< 640px`)
- [ ] **7.2** Update `app/layout.tsx` to conditionally show bottom nav on mobile and hide desktop header nav elements
- [ ] **7.3** Implement mobile view state: track active tab (board/ideas/chat/settings), show only the active panel full-screen on mobile

### 7b. Kanban Mobile

- [ ] **7.4** Create mobile kanban view: single-column card list with a column selector (tabs or horizontal swipe) instead of the multi-column desktop board
- [ ] **7.5** Ensure task cards are touch-friendly: larger tap targets, no hover-only actions

### 7c. Panels on Mobile

- [ ] **7.6** Chat panel: full-screen overlay on mobile (not side panel); triggered via bottom nav "Chat" tab
- [ ] **7.7** Ideas panel: full-screen overlay on mobile; triggered via bottom nav "Ideas" tab
- [ ] **7.8** Settings panel: full-screen overlay on mobile; triggered via bottom nav "Settings" tab

### 7d. Header Responsive

- [ ] **7.9** Simplify header on mobile: collapse search bar, hide workspace dropdown, show only logo + status indicator + avatar
- [ ] **7.10** Validate: `npm run build` clean; test on mobile viewport (375px, 390px, 414px widths) via browser DevTools or Playwright

**⏸ CHECKPOINT — Section 7 complete. Stop for approval.**

---

## 8. Production Hardening

> **Maps to:** FR-6.1 through FR-6.7
> **Directly affected:** `app/`, `components/`, `next.config.mjs`
> **Indirect consumers:** All user-facing flows

- [ ] **8.1** Create global error boundary component (`app/error.tsx`) with user-friendly error page and retry button
- [ ] **8.2** Create custom 404 page (`app/not-found.tsx`) with MC branding and navigation back to dashboard
- [ ] **8.3** Review all API routes — ensure they return appropriate HTTP status codes (400, 401, 404, 500) with structured JSON error responses
- [ ] **8.4** Add environment-aware configuration helper: `lib/env.ts` with `isProduction()`, `getBaseUrl()`, `getGatewayMode()` (local vs tunnel)
- [ ] **8.5** Add proper `Cache-Control` headers for static assets via `next.config.mjs` `headers()` config
- [ ] **8.6** Validate: `npm run build` clean; `npx tsc --noEmit` clean; Lighthouse Performance score ≥ 80

**⏸ CHECKPOINT — Section 8 complete. Stop for approval.**

---

## 9. Final Validation & Cleanup

- [ ] **9.1** Run full test suite: `npm test` — all tests pass (or document pre-existing failures)
- [ ] **9.2** Run `npm run build` — clean build, no TypeScript errors
- [ ] **9.3** Run `npm run lint` — no lint errors
- [ ] **9.4** Run `npx tsc --noEmit` — no type errors
- [ ] **9.5** Manual smoke test — deployed site on desktop browser: tasks, ideas, chat, model switch, status, settings all work
- [ ] **9.6** Manual smoke test — deployed site on mobile device (phone): bottom nav, kanban mobile view, chat full-screen, PWA install
- [ ] **9.7** Manual smoke test — gateway tunnel down: Supabase features work, gateway features show graceful error
- [ ] **9.8** Manual smoke test — offline: PWA shows offline fallback shell
- [ ] **9.9** Lighthouse audits: PWA ≥ 90, Performance ≥ 80
- [ ] **9.10** Verify `.env.local.example` updated with all new env vars
- [ ] **9.11** Remove any dead code or debug logging added during Phase 4
- [ ] **9.12** Commit final state on feature branch

**⏸ CHECKPOINT — Phase 4 complete. Stop for final approval before merge.**

---

## Acceptance Criteria Mapping

| AC | Description | Covered by Task(s) |
|----|-------------|---------------------|
| AC-1 | Dashboard accessible at Netlify URL from any device | 3.5 |
| AC-2 | PWA installable on iOS and Android | 6.6 |
| AC-3 | Real-time updates work remotely (Supabase Realtime) | 3.5 |
| AC-4 | Chat works remotely via gateway tunnel | 4.8 |
| AC-5 | Model switching works remotely via tunnel | 4.8 |
| AC-6 | Basic access control prevents public access | 5.5 |
| AC-7 | Offline fallback shows shell (not blank page) | 6.5, 9.8 |
| AC-8 | Mobile layout is usable on phone-sized screens | 7.10, 9.6 |
| AC-9 | Lighthouse PWA score ≥ 90 | 6.7, 9.9 |
| AC-10 | Gateway-down graceful degradation | 2.3, 3.6, 9.7 |

---

## App Impact Mapping

| Section | Directly Affected | Indirect Consumers |
|---------|-------------------|--------------------|
| 1 (Build Fixes) | `next.config.mjs`, `package.json` | All — build must pass |
| 2 (Gateway Dual-Mode) | `lib/gateway/client.ts`, `.env.local.example` | All API routes using gateway |
| 3 (Netlify Deploy) | `netlify.toml` (new), Netlify config | All — production hosting |
| 4 (Cloudflare Tunnel) | iMac system config | Chat, model switch, status |
| 5 (Access Control) | Netlify/Cloudflare config | All user-facing routes |
| 6 (PWA Maturity) | `manifest.json`, `layout.tsx`, `next.config.mjs` | Mobile install experience |
| 7 (Mobile Layout) | `layout.tsx`, `page.tsx`, `header.tsx`, panel components | All UI components |
| 8 (Production Hardening) | `app/error.tsx`, `app/not-found.tsx`, API routes | All user flows |
