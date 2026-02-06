# PRD: Mission Control Phase 5 — Multi-User Auth, Collaboration & Advanced I/O

**Version:** 1.0
**Date:** 6 February 2026
**Author:** Cascade (AI), commissioned by Steve
**Status:** Draft — pending Phase 2, 3 & 4 completion
**Depends on:** Phase 4 (Cloud Deployment — required for multi-user access), Phase 2 (Supabase — RLS must be tightened)

---

## 1. Overview

Phase 5 transforms Mission Control from a single-user private dashboard into a **multi-user collaborative platform** with proper authentication, team workspaces, notifications, and voice interaction. This is the final planned phase that takes the product from a personal tool to a team-capable operations hub.

**Problem solved:** Phases 2-4 deliver a powerful, remotely accessible dashboard — but it's single-user with no authentication beyond basic access control. If Steve wants to onboard collaborators, grant clients read-only access, or enable team-based task management, he needs real auth, roles, and collaboration features. Voice I/O adds a hands-free interaction mode for when Steve is away from a keyboard.

---

## 2. Platforms & Release Targets

| Platform | In Scope | Notes |
|----------|----------|-------|
| **PWA (Web)** | ✅ | Cloud-hosted on Netlify (from Phase 4) |
| **iOS (via PWA)** | ✅ | Installable PWA with push notifications |
| **Android (via PWA)** | ✅ | Installable PWA with push notifications |

**Browser targets:** Safari (macOS, iOS), Chrome (all platforms), Firefox (desktop), Edge (desktop).

---

## 3. Recommended Stack & Rationale

| Layer | Addition | Rationale |
|-------|----------|-----------|
| Authentication | **Supabase Auth** | Already using Supabase; Auth integrates natively with RLS, Realtime, and the existing client |
| Auth providers | **Email/password + Google OAuth** | Email for direct invites; Google for quick onboarding. Expandable later. |
| Authorization | **Supabase RLS + custom roles** | Row-level security policies tied to `auth.uid()`; roles stored in a `profiles` table |
| Notifications | **Supabase Realtime + Web Push API** | Realtime for in-app; Web Push for PWA background notifications |
| Voice I/O | **Web Speech API (STT) + OpenClaw TTS** | Browser-native speech recognition; TTS via gateway or browser `speechSynthesis` |
| Real-time collaboration | **Supabase Realtime Presence** | Show who's viewing what; cursor/selection indicators (stretch) |

**Alternatives considered for auth:**
- *NextAuth.js / Auth.js*: More flexible provider support, but adds complexity; Supabase Auth is simpler given we're already on Supabase
- *Clerk*: Polished drop-in, but adds a third-party dependency and cost
- *Firebase Auth*: Would require mixing Firebase + Supabase — unnecessary complexity

---

## 4. Goals

1. **Secure authentication** — proper login/signup with email and OAuth; no more shared passwords
2. **Role-based access** — owner, admin, member, viewer roles with appropriate permissions
3. **Team workspaces** — multiple users can collaborate on the same task board
4. **Notifications** — in-app and push notifications for task assignments, status changes, mentions
5. **Voice interaction** — hands-free chat with Gideon via voice input and audio output
6. **Data isolation** — RLS ensures users only see data they're authorised to access

---

## 5. User Stories & Personas

### Personas

| Persona | Description |
|---------|-------------|
| **Owner (Steve)** | Full control — manages team, configures agent, all permissions |
| **Admin** | Can manage tasks, ideas, and agent settings; cannot manage team members |
| **Member** | Can create/edit tasks and ideas, chat with agent; cannot change settings |
| **Viewer** | Read-only access to board and activity log; useful for clients |

### User Stories

| ID | Story |
|----|-------|
| US-5.1 | As an owner, I want to invite team members via email so they can access the dashboard. |
| US-5.2 | As an owner, I want to assign roles (admin/member/viewer) so I can control permissions. |
| US-5.3 | As a user, I want to sign in with email/password or Google so I have secure access. |
| US-5.4 | As a member, I want to be notified when a task is assigned to me so I don't miss work. |
| US-5.5 | As a member, I want to see who else is viewing the board in real-time (presence). |
| US-5.6 | As an operator, I want to chat with Gideon using my voice so I can interact hands-free. |
| US-5.7 | As an operator, I want Gideon's responses read aloud so I can listen while doing other things. |
| US-5.8 | As a viewer, I want read-only access to the board and activity log so I can monitor progress. |
| US-5.9 | As an owner, I want to revoke access for a team member so I maintain control. |
| US-5.10 | As a user, I want my session to persist so I don't have to log in every time. |

---

## 6. Functional Requirements

### 6.1 Authentication

- **FR-1.1:** Implement Supabase Auth with email/password signup and login
- **FR-1.2:** Add Google OAuth provider
- **FR-1.3:** Login page with email + password form and "Sign in with Google" button
- **FR-1.4:** Signup page with email verification
- **FR-1.5:** Password reset flow (forgot password → email → reset)
- **FR-1.6:** Session persistence via Supabase Auth cookies/tokens
- **FR-1.7:** Auth middleware in Next.js: redirect unauthenticated users to login
- **FR-1.8:** Remove Phase 4's basic access control (Netlify password) — replaced by proper auth

### 6.2 Authorization & Roles

- **FR-2.1:** New `profiles` table:
  ```sql
  CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member'
      CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- **FR-2.2:** Auto-create profile on signup via Supabase trigger
- **FR-2.3:** RLS policies on all tables scoped to `auth.uid()`:
  - `tasks`: owner/admin/member can CRUD; viewer can SELECT only
  - `ideas`: owner/admin/member can CRUD; viewer can SELECT only
  - `agent_state`: owner/admin can UPDATE; all can SELECT
  - `messages`: all authenticated users can INSERT/SELECT; owner can DELETE
  - `activity_log`: all authenticated users can SELECT; system INSERT only
  - `profiles`: users can read all profiles; users can update own profile; owner can update roles
- **FR-2.4:** Permission checks in API routes (server-side) as defense-in-depth alongside RLS
- **FR-2.5:** UI adapts to role: viewers see no edit controls; members see no settings; admins see no team management

### 6.3 Team Management

- **FR-3.1:** Team settings page (owner only): list members, invite, change roles, revoke access
- **FR-3.2:** Invite flow: owner enters email → invite record created → email sent → recipient signs up → auto-assigned role
- **FR-3.3:** New `invites` table:
  ```sql
  CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    invited_by UUID REFERENCES auth.users(id),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- **FR-3.4:** Revoke access: owner removes user → profile deleted → RLS blocks all access
- **FR-3.5:** First user to sign up becomes owner (or Steve's account is pre-seeded as owner)

### 6.4 Notification System

- **FR-4.1:** In-app notification bell in header with unread count badge
- **FR-4.2:** Notification types:
  - Task assigned to you
  - Task you're watching moved to a new column
  - Gideon completed a task you assigned
  - New comment on a task you're involved in
  - Agent status changed (configurable)
- **FR-4.3:** New `notifications` table:
  ```sql
  CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    entity_type TEXT,
    entity_id UUID,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  ```
- **FR-4.4:** Notifications created server-side when triggering events occur
- **FR-4.5:** Supabase Realtime subscription on `notifications` filtered by `user_id`
- **FR-4.6:** Web Push notifications for PWA (background):
  - Prompt user to enable push on first login
  - Store push subscription in `push_subscriptions` table
  - Send via Netlify serverless function or Supabase Edge Function
- **FR-4.7:** Notification preferences: user can mute specific notification types

### 6.5 Voice I/O

- **FR-5.1:** Voice input button in chat panel (microphone icon)
- **FR-5.2:** Speech-to-text via Web Speech API (`SpeechRecognition`)
- **FR-5.3:** Transcribed text populates the chat input field; user confirms before sending
- **FR-5.4:** Text-to-speech for Gideon's responses:
  - **Option A:** Browser `speechSynthesis` API (zero-cost, works offline)
  - **Option B:** OpenClaw gateway TTS if available (higher quality)
- **FR-5.5:** Toggle: "Read responses aloud" (off by default)
- **FR-5.6:** Visual feedback during voice input (pulsing microphone, waveform animation)
- **FR-5.7:** Keyboard shortcut to activate voice input (e.g., `Ctrl+Shift+V`)
- **FR-5.8:** Graceful degradation: if browser doesn't support Web Speech API, hide voice button

### 6.6 Real-Time Presence (Stretch)

- **FR-6.1:** Show online users in header (avatar dots)
- **FR-6.2:** Supabase Realtime Presence to track who's connected
- **FR-6.3:** Optional: show which board column a user is viewing (subtle indicator)

---

## 7. Acceptance Criteria & Test Strategy

| ID | Criterion | Test Method |
|----|-----------|-------------|
| AC-1 | User can sign up with email and log in | E2E: signup flow → verify dashboard access |
| AC-2 | User can sign in with Google | Manual: Google OAuth flow → verify dashboard access |
| AC-3 | Viewer role has read-only access | E2E: login as viewer → verify no edit controls, CRUD blocked by RLS |
| AC-4 | Owner can invite a new member via email | Manual: send invite → signup with invited email → verify role assigned |
| AC-5 | Task assignment triggers in-app notification | Integration: assign task → verify notification appears for assignee |
| AC-6 | Push notification received on mobile PWA | Manual: assign task while app backgrounded → verify push notification |
| AC-7 | Voice input transcribes speech to chat input | Manual: click mic → speak → verify text appears in input field |
| AC-8 | TTS reads Gideon's response aloud | Manual: enable "Read aloud" → send message → verify audio output |
| AC-9 | Unauthenticated user redirected to login | E2E: access dashboard URL without auth → verify redirect to login |
| AC-10 | RLS prevents cross-user data access | Integration: user A creates task → user B with viewer role cannot delete |
| AC-11 | Online presence shows connected users | Manual: two users logged in → verify both avatars visible |

**Test approach:**
- **Unit tests:** Auth middleware, role permission checks, notification creation logic
- **Integration tests:** RLS policy validation, invite flow, notification delivery
- **E2E tests (Playwright):** Login/signup flows, role-based UI adaptation, voice I/O
- **Manual:** OAuth flows, push notifications, voice quality, multi-user scenarios

---

## 8. Definition of Done

- [ ] Email/password and Google OAuth authentication working
- [ ] Role-based access control with RLS on all tables
- [ ] Team management UI (invite, roles, revoke)
- [ ] In-app notification system with real-time delivery
- [ ] Web Push notifications for mobile PWA
- [ ] Voice input (speech-to-text) in chat panel
- [ ] Text-to-speech for Gideon's responses
- [ ] Phase 4 basic access control removed (replaced by proper auth)
- [ ] All acceptance criteria pass
- [ ] `next build` passes cleanly
- [ ] Security review: no auth bypasses, RLS policies tested

---

## 9. Non-Goals (Out of Scope)

- **Native mobile apps** — PWA is sufficient
- **SSO / SAML / enterprise auth** — future if needed for enterprise clients
- **Multi-workspace / multi-agent** — future; Phase 5 is single workspace, single agent
- **Granular per-task permissions** — role-based is sufficient; no per-object ACLs
- **Video/screen sharing** — out of scope
- **Custom voice models / wake words** — use browser defaults
- **Offline task editing with sync** — online-only for writes; offline shell for reads (from Phase 4 cache)

---

## 10. Design Considerations

### Auth Pages

- **Login page:** Clean, centred card with email/password fields + Google button. Mission Control branding. Obsidian/Linear aesthetic.
- **Signup page:** Same aesthetic. Email verification notice after submission.
- **Forgot password:** Simple email input → confirmation message.

### Notifications

- **Bell icon** in top-right header, with red badge for unread count
- **Dropdown panel:** List of notifications, grouped by today / earlier
- **Each notification:** Icon (task/status/comment), title, body preview, relative time, unread dot
- **Mark as read:** Click to mark individual; "Mark all read" button

### Voice I/O

- **Microphone button:** Right side of chat input, next to send button
- **Active state:** Button pulses with colour; waveform animation below input
- **Transcription preview:** Text appears in input field in real-time as user speaks
- **TTS toggle:** Small speaker icon in chat header; toggle on/off

### Presence

- **Online avatars:** Small avatar circles in header, max 5 visible + "+N" overflow
- **Status dots:** Green = active, grey = idle (no activity for 5 min)

---

## 11. Technical Considerations

### Supabase Auth Integration

```typescript
// lib/supabase/client.ts — updated for auth
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

Next.js middleware for auth:
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session && !request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}
```

### RLS Policy Example

```sql
-- Tasks: authenticated users can read; members+ can write
CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'admin', 'member')
    )
  );
```

### Web Push Architecture

```
Trigger event (task assigned)
  → Server creates notification record
  → Supabase Realtime delivers to connected clients (in-app)
  → Netlify Function / Supabase Edge Function sends Web Push to offline clients
```

### Voice I/O Browser Support

| Browser | Speech Recognition | Speech Synthesis |
|---------|-------------------|-----------------|
| Chrome (desktop/Android) | ✅ | ✅ |
| Safari (macOS/iOS) | ✅ (with prefix) | ✅ |
| Firefox | ❌ (no support) | ✅ |
| Edge | ✅ | ✅ |

Firefox users will not have voice input. Graceful degradation: hide mic button.

### Gideon's Access Post-Auth

Gideon continues to use the **service role key** for Supabase access, bypassing RLS. This is correct — Gideon is a system actor, not a user. His actions are attributed via `created_by = 'gideon'` / `actor = 'gideon'` fields, not via `auth.uid()`.

---

## 12. Implementation Notes (Non-binding)

### Suggested Sequence

1. Supabase Auth setup (email + Google OAuth)
2. Login/signup pages + Next.js auth middleware
3. Profiles table + auto-creation trigger
4. RLS policies on all existing tables
5. Role-based UI adaptation (hide/show controls)
6. Team management UI (invite, roles, revoke)
7. Notification system (table + Realtime + UI)
8. Web Push notifications
9. Voice input (speech-to-text)
10. Text-to-speech
11. Presence (stretch)

### Key Risks

| Risk | Mitigation |
|------|------------|
| RLS policy errors expose data | Write comprehensive RLS tests; test with multiple roles before deploy |
| OAuth redirect URI misconfiguration | Document exact Netlify URL in Supabase Auth settings |
| Web Push subscription management complexity | Use a library (e.g., `web-push`) and Supabase Edge Function |
| Voice recognition accuracy | Provide edit-before-send; don't auto-send transcribed text |
| Session token refresh failures | Supabase handles refresh automatically; add error boundary for edge cases |

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Auth flow completion rate | 95%+ (signup → first dashboard view) |
| RLS policy coverage | 100% of tables have role-appropriate policies |
| Notification delivery (in-app) | < 2 seconds |
| Push notification delivery | < 10 seconds |
| Voice transcription accuracy | Acceptable for English commands (browser-dependent) |
| Concurrent users supported | At least 10 simultaneous without degradation |

---

## 14. Open Questions

1. **OAuth providers** — Google only, or also GitHub/Microsoft? Recommend starting with Google + email.
2. **Team size limit** — Any cap on team members? Free Supabase tier has connection limits.
3. **Gideon per-user or shared?** — Is Gideon a shared team resource (everyone chats with the same agent) or per-user? Recommend shared with message attribution.
4. **Voice language** — English only, or multi-language? Web Speech API supports many languages.
5. **Notification email** — Should notifications also send email digests, or in-app + push only?
6. **Data ownership on user removal** — When a user is removed, are their tasks/comments preserved or deleted?

---

## 15. Appendix: Source Notes

| Source | Key Facts Extracted |
|--------|--------------------|
| `docs/PHASE2_BRIEFING_2026-02-06.md` Section 3.2 | Phase 5 scope: multi-user auth, team collaboration, notifications, voice I/O |
| `docs/PHASE2_BRIEFING_2026-02-06.md` Section 7.2 | Current security model (anon key + service role); RLS is permissive — must tighten |
| Phase 2 PRD | Supabase schema baseline; `created_by` field on tasks already exists |
| Phase 3 PRD | Activity log provides audit trail; roles must respect log visibility |
| Phase 4 PRD | Cloud deployment is prerequisite; basic access control to be replaced |
