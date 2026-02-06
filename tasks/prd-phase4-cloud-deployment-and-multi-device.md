# PRD: Mission Control Phase 4 — Cloud Deployment & Multi-Device Access

**Version:** 1.0
**Date:** 6 February 2026
**Author:** Cascade (AI), commissioned by Steve
**Status:** Draft — pending Phase 2 & 3 completion
**Depends on:** Phase 2 (Supabase backend), Phase 3 (activity log — informs deployment monitoring)
**Blocks:** Phase 5 (multi-user auth requires cloud deployment)

---

## 1. Overview

Phase 4 moves Mission Control from a local-only `next dev` instance into a **cloud-deployed, multi-device accessible** application. Steve will be able to monitor and manage Gideon from any device — laptop, phone, or tablet — not just the iMac.

**Problem solved:** Phase 2-3 deliver a powerful shared dashboard, but it's only accessible on the iMac running `next dev`. Steve can't check task status from his phone, or manage Gideon while away from his desk. Phase 4 solves this with production deployment and secure remote access.

---

## 2. Platforms & Release Targets

| Platform | In Scope | Notes |
|----------|----------|-------|
| **PWA (Web)** | ✅ | Cloud-hosted, accessible from any browser |
| **iOS (via PWA)** | ✅ | Installable PWA on iOS Safari — no native app |
| **Android (via PWA)** | ✅ | Installable PWA on Android Chrome — no native app |

**Browser targets:** Safari (macOS, iOS), Chrome (all platforms), Firefox (desktop).

**Device targets:** iMac (primary), MacBook, iPhone, iPad, Android phone/tablet.

---

## 3. Recommended Stack & Rationale

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Hosting | **Netlify** | Excellent Next.js support, edge functions, simple deploys, free tier sufficient for single-user |
| Tunnel (gateway access) | **Cloudflare Tunnel (cloudflared)** | Secure tunnel from cloud → iMac for OpenClaw gateway access; no port forwarding; free tier |
| PWA | **Mature PWA config** | Proper service worker, offline fallback, app icons, splash screens |
| CDN | **Netlify Edge** | Automatic with Netlify deployment |
| SSL | **Automatic (Netlify)** | HTTPS by default on all Netlify deploys |

**Alternatives considered:**
- *Vercel*: Also excellent for Next.js, but Netlify preferred for edge function flexibility and pricing
- *ngrok*: Simpler tunnel setup, but Cloudflare Tunnel is more reliable for always-on use and free
- *Self-hosted VPS*: More control but more maintenance; not justified for single-user
- *Tailscale*: Good for device-to-device, but doesn't provide a public URL for PWA install

### Architecture: Cloud ↔ Local Bridge

```
┌──────────────┐     HTTPS      ┌──────────────┐    Cloudflare    ┌──────────────┐
│  Any Device  │ ─────────────► │   Netlify    │    Tunnel        │    iMac      │
│  (Browser)   │ ◄───────────── │  (Next.js)   │ ──────────────► │  OpenClaw    │
│              │                 │              │                  │  :18789      │
└──────────────┘                └──────────────┘                  └──────────────┘
                                       │
                                       │ Direct
                                       ▼
                                ┌──────────────┐
                                │   Supabase   │
                                │   (Cloud)    │
                                └──────────────┘
```

**Key insight:** Supabase is already cloud-hosted (Phase 2), so most data flows don't need the tunnel. The tunnel is only needed for:
- OpenClaw gateway API calls (chat, model switching, status checks)
- `openclaw models set` CLI execution (runs on iMac)

---

## 4. Goals

1. **Remote access** — Steve can access Mission Control from any device with a browser
2. **PWA installability** — Full PWA experience on mobile (home screen icon, splash screen, offline shell)
3. **Secure access** — Dashboard is not publicly accessible without authentication (basic for now, full auth in Phase 5)
4. **Gateway bridge** — Cloud-deployed Next.js can reach the local OpenClaw gateway via secure tunnel
5. **Production-grade** — Proper builds, caching, error handling, and monitoring

---

## 5. User Stories & Personas

| ID | Story |
|----|-------|
| US-4.1 | As an operator, I want to access Mission Control from my phone so I can check on Gideon while away from my desk. |
| US-4.2 | As an operator, I want to install Mission Control as a PWA on my phone for quick access. |
| US-4.3 | As an operator, I want the dashboard to be secure so only I can access it. |
| US-4.4 | As an operator, I want the cloud dashboard to have the same real-time features as the local version. |
| US-4.5 | As an operator, I want chat and model switching to work remotely via the gateway tunnel. |
| US-4.6 | As an operator, I want an offline fallback shell so the PWA doesn't show a blank page when offline. |
| US-4.7 | As an operator, I want the mobile layout to be optimised for smaller screens. |

---

## 6. Functional Requirements

### 6.1 Cloud Deployment

- **FR-1.1:** Deploy Mission Control to Netlify with automatic builds from Git
- **FR-1.2:** Configure production environment variables on Netlify (Supabase keys, tunnel URL)
- **FR-1.3:** `next build` must produce a production-optimised bundle with no errors
- **FR-1.4:** Configure custom domain (optional) or use Netlify subdomain
- **FR-1.5:** Set up Netlify deploy previews for branches (optional but recommended)

### 6.2 Gateway Tunnel

- **FR-2.1:** Install and configure `cloudflared` on the iMac as a LaunchAgent (always-on)
- **FR-2.2:** Tunnel exposes OpenClaw gateway (`127.0.0.1:18789`) at a stable Cloudflare URL
- **FR-2.3:** Next.js API routes use the tunnel URL for gateway calls when `NODE_ENV=production`
- **FR-2.4:** Fallback: if tunnel is down, UI shows "gateway unreachable" — Supabase features (tasks, ideas, status) still work
- **FR-2.5:** Tunnel URL stored in environment variable: `OPENCLAW_GATEWAY_TUNNEL_URL`
- **FR-2.6:** Gateway client (`lib/gateway/client.ts`) selects local URL in development, tunnel URL in production

### 6.3 PWA Maturity

- **FR-3.1:** Complete PWA manifest with proper app name, icons (192px, 512px), theme colour, background colour
- **FR-3.2:** Production-ready service worker with offline fallback shell
- **FR-3.3:** App installable on iOS Safari and Android Chrome
- **FR-3.4:** Splash screen configured for iOS and Android
- **FR-3.5:** Proper viewport meta tags for mobile
- **FR-3.6:** `apple-touch-icon` and related iOS PWA meta tags

### 6.4 Basic Access Control

- **FR-4.1:** Implement basic access restriction — Netlify site-level password protection or a simple shared secret
- **FR-4.2:** This is a stopgap until Phase 5's full auth system
- **FR-4.3:** Must not interfere with Supabase Realtime WebSocket connections
- **FR-4.4:** Gideon's REST API access to Supabase is unaffected (direct to Supabase, not through Netlify)

### 6.5 Mobile Responsive Refinements

- **FR-5.1:** Mobile-first layout for Kanban: single-column view with horizontal swipe between columns
- **FR-5.2:** Collapsible panels: chat, ideas default to collapsed on mobile
- **FR-5.3:** Touch-optimised: larger tap targets, swipe gestures for common actions
- **FR-5.4:** Bottom navigation bar on mobile (Kanban / Ideas / Chat / Settings)
- **FR-5.5:** Responsive breakpoints: mobile (<640px), tablet (640-1024px), desktop (>1024px)

### 6.6 Production Hardening

- **FR-6.1:** Error boundary components with user-friendly error pages
- **FR-6.2:** Proper 404 page
- **FR-6.3:** API route error handling returns appropriate HTTP status codes
- **FR-6.4:** Client-side error reporting (console + optional Sentry in future)
- **FR-6.5:** Performance: Lighthouse PWA score ≥ 90, Performance score ≥ 80
- **FR-6.6:** Proper cache headers for static assets
- **FR-6.7:** Environment-aware configuration: dev vs production behaviour

---

## 7. Acceptance Criteria & Test Strategy

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-1 | Dashboard accessible at Netlify URL from any device | Manual: open URL on phone, tablet, laptop |
| AC-2 | PWA installable on iOS and Android | Manual: install from Safari/Chrome → verify home screen icon, splash |
| AC-3 | Real-time updates work remotely (Supabase Realtime) | Integration: create task via curl → verify appears on phone |
| AC-4 | Chat works remotely via gateway tunnel | Manual: send chat message from phone → receive streamed response |
| AC-5 | Model switching works remotely via tunnel | Manual: switch model from phone → verify success |
| AC-6 | Basic access control prevents public access | Manual: access URL without credentials → verify blocked |
| AC-7 | Offline fallback shows shell (not blank page) | Manual: enable airplane mode → verify app shell visible |
| AC-8 | Mobile layout is usable on phone-sized screens | Manual: visual review on iPhone/Android |
| AC-9 | Lighthouse PWA score ≥ 90 | Automated: run Lighthouse audit |
| AC-10 | Gateway-down graceful degradation | Manual: stop tunnel → verify Supabase features still work, gateway features show error |

**Test approach:**
- **Unit tests:** Gateway client URL selection logic, environment detection
- **E2E tests (Playwright):** Mobile viewport tests, offline behaviour, error boundaries
- **Manual:** Multi-device testing, PWA installation, tunnel reliability

---

## 8. Definition of Done

- [ ] Mission Control deployed to Netlify with production build
- [ ] Cloudflare Tunnel configured and running as LaunchAgent on iMac
- [ ] All features work remotely (tasks, ideas, chat, model switch, status)
- [ ] PWA installable on iOS and Android with proper icons and splash
- [ ] Basic access control in place
- [ ] Mobile responsive layout tested on phone and tablet
- [ ] Offline fallback shell working
- [ ] Lighthouse PWA ≥ 90, Performance ≥ 80
- [ ] All acceptance criteria pass
- [ ] `next build` passes cleanly

---

## 9. Non-Goals (Out of Scope)

- **Full user authentication (login/password/OAuth)** — Phase 5
- **Multi-user support** — Phase 5
- **Native iOS/Android apps** — PWA is sufficient; native apps are not planned
- **Custom domain with DNS** — optional stretch goal, not required
- **CI/CD pipeline** — manual Netlify deploys or Git-based auto-deploy sufficient
- **Server-side rendering for SEO** — not relevant for a private dashboard
- **Analytics / usage tracking** — future consideration

---

## 10. Design Considerations

### Mobile Layout

- **Kanban on mobile:** Switch to a single-column card list with a column selector (tabs or horizontal swipe). Full board view is unusable on <640px.
- **Bottom nav bar:** 4 tabs — Board, Ideas, Chat, Settings. Replaces desktop sidebar/header nav.
- **Chat on mobile:** Full-screen overlay when open, not a side panel.
- **Touch interactions:** Swipe right on task card for quick-assign, swipe left for quick-archive. Long-press for context menu.

### PWA Identity

- **App name:** "Mission Control"
- **Short name:** "MC"
- **Theme colour:** Match dark mode background
- **Icons:** Current `icon.jpeg` needs replacement with proper PNG/SVG at 192px and 512px

---

## 11. Technical Considerations

### Cloudflare Tunnel Setup

```bash
# Install
brew install cloudflared

# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create mission-control-gateway

# Configure (~/.cloudflared/config.yml)
tunnel: <tunnel-id>
credentials-file: /Users/gideon/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: mc-gateway.<domain>.com
    service: http://127.0.0.1:18789
  - service: http_status:404

# Run as LaunchAgent for always-on
cloudflared service install
```

### Gateway Client Dual-Mode

```typescript
// lib/gateway/client.ts
const getGatewayUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.OPENCLAW_GATEWAY_TUNNEL_URL || '';
  }
  return process.env.OPENCLAW_GATEWAY_URL || process.env.CLAWDBOT_GATEWAY_URL || 'http://127.0.0.1:18789';
};
```

### Security: Tunnel Access

The Cloudflare Tunnel exposes the gateway — this must be secured:
- **Option A:** Cloudflare Access (zero-trust) on the tunnel endpoint — requires Cloudflare account
- **Option B:** Gateway token in the tunnel URL headers (set via Cloudflare config)
- **Recommendation:** Cloudflare Access with email-based OTP — free tier, zero-trust, no password to remember

---

## 12. Implementation Notes (Non-binding)

### Suggested Sequence

1. Production build fixes (`next build` must pass cleanly)
2. Netlify deployment setup (manual deploy first, then Git-based)
3. Cloudflare Tunnel installation and configuration on iMac
4. Gateway client dual-mode (local vs tunnel URL)
5. Basic access control (Netlify password or Cloudflare Access)
6. PWA manifest and service worker maturity
7. Mobile responsive layout refinements
8. Production hardening (error boundaries, 404, cache headers)
9. Multi-device testing

### Key Risks

| Risk | Mitigation |
|------|------------|
| Tunnel instability / dropped connections | Cloudflare Tunnel is production-grade; add health check endpoint; LaunchAgent auto-restarts |
| Latency through tunnel for chat streaming | SSE should work through tunnel; test early; Supabase Realtime is direct (no tunnel) |
| PWA cache causes stale UI after deploy | Version service worker; use `skipWaiting()` + prompt user to refresh |
| Netlify cold starts for API routes | Use edge functions where possible; most data flows are Supabase-direct anyway |

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Remote access reliability | 99%+ uptime (tunnel + Netlify) |
| Mobile usability | Usable for core tasks (view board, chat, check status) on phone |
| PWA Lighthouse score | ≥ 90 |
| Performance Lighthouse score | ≥ 80 |
| Chat streaming latency via tunnel | First token < 1s (vs < 500ms local) |
| Deploy time | < 3 minutes from push to live |

---

## 14. Open Questions

1. **Custom domain?** — Do you want a custom domain (e.g., `mc.yourdomain.com`) or is a Netlify subdomain sufficient?
2. **Cloudflare account** — Do you have an existing Cloudflare account, or should we create one?
3. **Tunnel security model** — Cloudflare Access (zero-trust, email OTP) vs simple gateway token? Recommend Cloudflare Access.
4. **Offline capability depth** — Should the PWA cache task data for offline viewing, or just show an app shell?
5. **Netlify plan** — Free tier is likely sufficient. Confirm no need for team features or higher build limits.

---

## 15. Appendix: Source Notes

| Source | Key Facts Extracted |
|--------|--------------------|
| `docs/PHASE2_BRIEFING_2026-02-06.md` Section 3.2 | Phase 4 scope: cloud deployment, multi-device, mobile refinements |
| `docs/PHASE2_BRIEFING_2026-02-06.md` Section 7 | Security considerations for local-only deployment; informs what changes for cloud |
| Phase 2 PRD | Supabase is already cloud-hosted; gateway is local-only — defines the tunnel requirement |
| `public/manifest.json` | Existing PWA manifest needs maturity work |
