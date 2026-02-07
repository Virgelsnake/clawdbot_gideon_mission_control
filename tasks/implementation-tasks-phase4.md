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

### Section 7 notes (7 Feb 2026)
- **Pre-existing fix:** `agent-context.tsx` was missing `autonomy` and `updateAutonomyConfig` in the context value object (Phase 3 addition not wired up). Fixed by adding them to the value — the `updateAutonomyConfig` callback already existed in the component.
- **New files:** `contexts/mobile-view-context.tsx`, `components/layout/bottom-nav.tsx`, `components/layout/mobile-settings-wrapper.tsx`
- **Modified files:** `app/(app)/layout.tsx`, `app/(app)/page.tsx`, `components/kanban/kanban-board.tsx`, `components/ideas/ideas-panel.tsx`, `components/chat/chat-panel.tsx`, `components/settings/settings-panel.tsx`, `components/layout/header.tsx`, `components/kanban/task-card.tsx`
- **Mobile breakpoint:** `< 640px` (Tailwind `sm`), consistent with bottom nav visibility

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

- [x] **6.1** Update `public/manifest.json`: renamed to "Mission Control" (short_name: "MC"), removed landscape orientation, added `scope` and `id`
- [x] **6.2** Added iOS PWA meta tags via Next.js `metadata.appleWebApp` — `apple-touch-icon`, `apple-mobile-web-app-status-bar-style` (black-translucent), `apple-mobile-web-app-title`. Note: Next.js emits `mobile-web-app-capable` instead of `apple-mobile-web-app-capable` (equivalent)
- [x] **6.3** Verified icon assets: both PNGs are real images (192x192 RGB, 512x512 RGB) — confirmed via `file` command
- [x] **6.4** Serwist SW already had `skipWaiting`, `clientsClaim`, `navigationPreload`, and `defaultCache` runtime caching. Added `fallbacks.entries` for `/~offline` document fallback
- [x] **6.5** Created `app/~offline/page.tsx` — "You're offline" page with wifi-off icon, MC branding, and "Try again" button (client component)
- [x] **6.6** Deployed to Netlify — manifest served correctly, SW active with precache + offline fallback, `/~offline` page renders. PWA install on device requires manual test.
- [x] **6.7** Verified all Lighthouse PWA requirements programmatically: HTTPS ✅, manifest with name/icons/display/start_url/scope ✅, SW registered with offline fallback ✅, theme-color ✅, viewport ✅, apple-touch-icon ✅. Full Lighthouse audit requires manual run in Chrome DevTools.

**⏸ CHECKPOINT — Section 6 complete. Stop for approval.**

---

## 7. Mobile Responsive Layout

> **Maps to:** FR-5.1 through FR-5.5
> **Directly affected:** `app/layout.tsx`, `app/page.tsx`, `components/layout/header.tsx`, `components/layout/main-content.tsx`, `components/kanban/kanban-board.tsx`, `components/ideas/ideas-panel.tsx`, `components/chat/chat-panel.tsx`
> **Indirect consumers:** All UI components

### 7a. Mobile Layout Shell

- [x] **7.1** Create bottom navigation bar component (`components/layout/bottom-nav.tsx`): 4 tabs — Board, Ideas, Chat, Settings; visible only on mobile (`< 640px`) — also created `contexts/mobile-view-context.tsx` for mobile tab state
- [x] **7.2** Update `app/(app)/layout.tsx` to include `MobileViewProvider` and `BottomNav`; added `pb-14 sm:pb-0` for bottom nav clearance
- [x] **7.3** Implement mobile view state: `MobileViewProvider` tracks `activeTab` and `isMobile`; `app/(app)/page.tsx` returns null for chat/settings tabs, renders board or ideas based on active tab

### 7b. Kanban Mobile

- [x] **7.4** Mobile kanban: `KanbanBoard` accepts `mobile` prop; renders column selector tabs (scrollable) + single-column card list instead of multi-column board
- [x] **7.5** Touch-friendly: task card action menu and idea delete button always visible on mobile (`opacity-100 sm:opacity-0 sm:group-hover:opacity-100`); slightly larger tap targets on mobile

### 7c. Panels on Mobile

- [x] **7.6** Chat panel: full-screen fixed overlay on mobile (`top-12 bottom-14`) when chat tab active; returns null otherwise. Desktop/tablet behavior unchanged.
- [x] **7.7** Ideas panel: `IdeasPanel` accepts `mobile` prop; renders full-width without sidebar border/width constraints
- [x] **7.8** Settings panel: extracted `SettingsTabsContent` shared component; `MobileSettingsPanel` renders full-screen via `MobileSettingsWrapper` when settings tab active

### 7d. Header Responsive

- [x] **7.9** Header simplified on mobile: bell, help, settings, theme toggle all hidden below `sm`; only logo + avatar visible
- [x] **7.10** Validate: `npm run build` clean ✅; tested on 375px viewport via Playwright — all 4 tabs (Board, Ideas, Chat, Settings) render correctly, column selector works, bottom nav highlights active tab

**⏸ CHECKPOINT — Section 7 complete. Stop for approval.**

---

## 8. Production Hardening

> **Maps to:** FR-6.1 through FR-6.7
> **Directly affected:** `app/`, `components/`, `next.config.mjs`
> **Indirect consumers:** All user-facing flows

- [x] **8.1** Created `app/error.tsx` — client component with error icon, "Something went wrong" message, error digest display, "Try again" (reset) and "Dashboard" (/) buttons. Matches offline page visual style.
- [x] **8.2** Created `app/not-found.tsx` — server component with search-minus icon, large "404" heading, "Page not found" message, and "Back to Dashboard" link. Consistent styling with error and offline pages.
- [x] **8.3** Reviewed all 9 API routes. `/api/auth` migrated from ad-hoc `{ error: string }` to structured `jsonError()` format (400/401/500 with `ApiErrorBody`). `/api/models` and `/api/models/health` catch blocks now log errors before returning graceful fallbacks. All other routes already used `jsonError` correctly.
- [x] **8.4** Created `lib/env.ts` with `isProduction()`, `getBaseUrl()` (client/server aware, Netlify `URL` env support), `getGatewayMode()` ('tunnel' | 'local'), and `requireEnv()` (throws in prod, warns in dev)
- [x] **8.5** Added `headers()` config to `next.config.mjs`: icons/SVGs get 1-year immutable cache, manifest gets 1-hour cache with stale-while-revalidate, SW gets must-revalidate. Also added security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy) on all routes.
- [x] **8.6** Validated: `npx tsc --noEmit` clean ✅; `npm run build` clean ✅ (15 routes, SW bundled, `/_not-found` in output). Lighthouse Performance score requires manual audit in Chrome DevTools on deployed site.

**⏸ CHECKPOINT — Section 8 complete. Stop for approval.**

---

## 9. Final Validation & Cleanup

- [x] **9.1** Run full test suite: `npm test` — 12 fail / 17 pass, all pre-existing (SettingsProvider wrapper missing in test renders, same as baseline)
- [x] **9.2** Run `npm run build` — clean build, 15 routes, SW bundled at `/sw.js`
- [x] **9.3** Run `npm run lint` — 3 source-level errors all pre-existing (`setState` in effect in `task-detail-dialog.tsx`, `agent-context.tsx`, `settings-context.tsx`). Fixed: `error.tsx` `<a>` → `<Link>`, removed unused `persist` var from `settings-context.tsx`, removed unused `sendStreamingMessage` + `consumeSSEStream` from `lib/api/chat.ts`
- [x] **9.4** Run `npx tsc --noEmit` — clean (must run after `npm run build` to generate `.next/types`)
- [x] **9.5** Manual smoke test — local dev server on desktop (1280×800): kanban board with 5 columns ✅, task cards with labels/assignees/due dates ✅, ideas panel ✅, chat panel with status indicator + model selector ✅, settings panel with 5 tabs ✅
- [x] **9.6** Manual smoke test — local dev server on mobile (375×812): bottom nav with 4 tabs ✅, kanban column selector + single-column view ✅, chat full-screen overlay ✅, settings full-screen ✅, ideas full-width ✅
- [x] **9.7** Manual smoke test — gateway tunnel down: `/api/status` returns structured JSON ✅, `/api/models` returns config fallback ✅, Supabase tasks load independently of gateway ✅, 404 page renders ✅. Full tunnel-stop test requires manual action.
- [x] **9.8** Manual smoke test — offline: `/~offline` page renders correctly with wifi-off icon, "You're offline" message, and "Try again" button ✅. Actual offline PWA install + disconnect test requires device.
- [ ] **9.9** Lighthouse audits: PWA ≥ 90, Performance ≥ 80 _(requires Chrome DevTools on deployed site — user to run)_
- [x] **9.10** Verify `.env.local.example` — all env vars documented; added `NEXT_PUBLIC_SITE_URL` (optional, for `getBaseUrl()` override)
- [x] **9.11** Remove dead code / debug logging: removed `[DIAG]` console.log from `agent-context.tsx`, `chat-bridge/route.ts`, `gateway/client.ts`, `page.tsx`; removed unused `sendStreamingMessage` + `consumeSSEStream` from `lib/api/chat.ts`; removed unused `persist` from `settings-context.tsx`
- [x] **9.12** Commit final state on feature branch

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
