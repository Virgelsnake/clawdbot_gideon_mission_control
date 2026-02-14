# TTS Voice UI/UX Design Document

**Project:** Mission Control TTS Voice Integration  
**Role:** TRON (UI/UX Design)  
**Date:** 2026-02-08  
**Status:** Design Complete - Ready for Implementation

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [AudioPlayer Component](#audioplayer-component)
3. [Voice Mode Toggle](#voice-mode-toggle)
4. [Settings Panel](#settings-panel)
5. [Privacy Triggers](#privacy-triggers)
6. [Wireframes & Mockups](#wireframes--mockups)
7. [Message Filtering Logic](#message-filtering-logic)
8. [UX Concerns & Recommendations](#ux-concerns--recommendations)
9. [Implementation Checklist](#implementation-checklist)

---

## Design Philosophy

### Core Principles

1. **Conversational, Not Just Playback**: Following ChatGPT Voice Mode's lead, voice isn't an "add-on" — it's a mode of interaction. The UI should feel like talking to an assistant, not playing an audio file.

2. **Desktop-First, Future-Ready**: Design for the primary desktop experience while keeping touch targets and responsive patterns in mind for future mobile expansion.

3. **Unobtrusive Integration**: Voice controls should enhance the chat without cluttering it. Audio elements sit alongside text naturally.

4. **User Control First**: Easy to enable, easier to disable. Privacy and user agency are paramount.

5. **Visual Feedback Loop**: Users must always know:
   - Is voice mode active?
   - Is audio playing/paused/buffering?
   - What's the current speaking progress?

---

## AudioPlayer Component

### Component: `AudioPlayer`

**Location:** Embedded in AI message bubbles (assistant responses only)

**Purpose:** Inline audio playback with visual progress indication

#### Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│  [▶️]  ╭─────────────────────────────────────╮  [🔊]  0:12 │
│        │████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│        /0:45│
│        ╰─────────────────────────────────────╯            │
└─────────────────────────────────────────────────────────────┘
```

#### States

| State | Visual | Behavior |
|-------|--------|----------|
| **Idle** | Play button visible, progress at 0% | Click play to start |
| **Buffering** | Spinner on play button, progress track light | Show "Loading..." tooltip |
| **Playing** | Pause button (⏸️), animated waveform/progress | Real-time progress update |
| **Paused** | Play button, progress frozen at position | Resume from position |
| **Completed** | Play button, progress at 100% | Click to replay |
| **Error** | Alert icon, play disabled | Hover shows error message |

#### Anatomy

```
AudioPlayer
├── Play/Pause Button (left)
│   ├── Icon: Play (▶️) / Pause (⏸️) / Loading (⟳)
│   ├── Size: 32x32px
│   └── Hover: scale(1.05), background highlight
├── Progress Bar (center, flexible width)
│   ├── Track: 4px height, rounded, subtle gray
│   ├── Fill: brand color (primary), animated width
│   ├── Buffer: lighter shade showing loaded portion
│   └── Scrubbable: click/drag to seek (optional v2)
├── Volume Control (right, hover-expand)
│   ├── Icon: Speaker (🔊) / Muted (🔇)
│   └── Mini slider on hover (vertical popover)
└── Time Display (right)
    ├── Current: "0:12" (monospace)
    └── Total: "/0:45" (muted color)
```

#### Props Interface

```typescript
interface AudioPlayerProps {
  audioUrl: string;           // Pre-generated TTS URL
  messageId: string;          // For analytics/sync
  autoPlay?: boolean;         // Play on mount (voice mode on)
  onPlay?: () => void;        // Callback when play starts
  onPause?: () => void;       // Callback when paused
  onComplete?: () => void;    // Callback when finished
  onError?: (error: Error) => void;
  className?: string;
}
```

#### Behavior Rules

1. **Auto-play**: Only if `voiceModeEnabled === true` AND `message.isNew === true`
2. **Sequential**: If multiple messages arrive, queue them (don't overlap)
3. **Scroll-aware**: Pause if user scrolls far from active message
4. **Tab-aware**: Pause when tab hidden (document.hidden)

---

## Voice Mode Toggle

### Component: `VoiceModeToggle`

**Location:** Chat panel header (right side, next to model selector)

**Purpose:** Global on/off switch for TTS voice output

#### Visual Design

```
┌─────────────────────────────────────────────────────────────────┐
│  🗨️ Chat                                        [🔊 Voice On ▼]  │
└─────────────────────────────────────────────────────────────────┘
```

#### States

| State | Visual | Tooltip |
|-------|--------|---------|
| **Off** | Icon: 🔇 (strikethrough or muted) | "Enable voice mode" |
| **On** | Icon: 🔊 (animated pulse when speaking) | "Voice mode active" |
| **Speaking** | Icon: 🔊 + waveform animation | "Speaking..." |

#### Toggle Button Anatomy

```
VoiceModeToggle (Button)
├── Icon (left)
│   ├── Off: VolumeOff (24x24px, muted color)
│   └── On: Volume2 (24x24px, primary color)
├── Label (optional, desktop)
│   ├── Off: "Voice Off"
│   └── On: "Voice On"
├── Status Indicator (dot)
│   └── On: pulsing green dot (bottom-right of icon)
└── Dropdown Arrow (right)
    └── Opens quick settings popover
```

#### Quick Settings Popover (on arrow click)

```
┌──────────────────────────┐
│  Voice Settings      ✕   │
├──────────────────────────┤
│  🔊 Volume: [━━━━●━━━]   │
│                          │
│  ⚡ Speed:  [━━●━━━━]   │
│     1.2x                 │
│                          │
│  🎙️ Voice: [Nova    ▼]   │
│                          │
│  ─────────────────────   │
│  ⚙️ Advanced Settings →  │
└──────────────────────────┘
```

#### Keyboard Shortcuts

- **Ctrl/Cmd + Shift + V**: Toggle voice mode on/off
- **Space** (when message focused): Play/pause current audio

---

## Settings Panel

### Location: Main Settings → Voice (or Chat → Voice)

### Full Settings Interface

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️ Settings > Voice                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Voice Mode                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  [✓] Enable voice for AI responses                         │
│       Auto-play audio when messages arrive                  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Voice Selection                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  🎙️ Selected Voice:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Nova]  [Onyx]  [Echo]  [Fable]  [Shimmer]        │   │
│  │                                                      │   │
│  │  ▶️  "Hello, I'm Nova. I sound warm and natural."   │   │
│  │      [Preview]                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Playback Settings                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  Speed:  0.5x    1.0x    1.5x    2.0x                      │
│          [○─────●─────○─────○]                             │
│                                                             │
│  Volume: [━━━━━━━●━━━━━]  70%                              │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Message Filtering                                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  [✓] Skip code blocks                                       │
│  [✓] Skip error messages                                    │
│  [✓] Skip system messages                                   │
│  [ ] Skip messages with only URLs                           │
│  [✓] Skip tables and data (read summary only)               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Privacy & Triggers                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
│  [✓] Respect "silence" triggers in messages                │
│  [✓] Auto-pause when I start typing                        │
│  [✓] Stop audio when switching conversations               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Voice Selection Component

**Voice Cards Grid:**
- 5 voices in a horizontal scrollable row (or 2x3 grid)
- Each card: 120x80px, rounded corners
- Selected state: border highlight + checkmark
- Preview button on each card

**Voice Attributes:**
| Voice | Gender | Tone | Best For |
|-------|--------|------|----------|
| Nova | Female | Warm, friendly | General conversation |
| Onyx | Male | Professional, clear | Technical explanations |
| Echo | Male | Neutral, balanced | Coding, documentation |
| Fable | Female | Expressive, story-like | Creative writing |
| Shimmer | Female | Bright, energetic | Brainstorming, quick tasks |

### Speed Slider

- **Range:** 0.5x to 2.0x
- **Step:** 0.1x
- **Visual:** Horizontal track with snap points at 0.5, 1.0, 1.5, 2.0
- **Display:** Current value label below
- **Preview:** Option to hear sample at selected speed

---

## Privacy Triggers

### Overview

Privacy triggers are **automatic mute commands** that detect user intent to stop audio playback. They work at multiple levels: message content, user input, and system events.

### Trigger Types

#### 1. Explicit Verbal Triggers (in user messages)

When user sends a message containing these phrases, immediately stop all audio:

| Trigger Phrase | Priority | Action |
|----------------|----------|--------|
| "don't speak" | Critical | Stop + Mute for this session |
| "be quiet" | Critical | Stop + Mute for this session |
| "silence" | Critical | Stop + Mute for this session |
| "shut up" | Critical | Stop + Mute for this session |
| "stop talking" | Critical | Stop + Mute for this session |
| "no voice" | High | Stop current + Disable auto-play |
| "mute" | High | Stop current + Mute |
| "pause" | Medium | Pause current (resumeable) |

**Implementation:**
```typescript
const PRIVACY_TRIGGERS = {
  immediateMute: ['don\'t speak', 'be quiet', 'silence', 'shut up', 'stop talking'],
  disableVoice: ['no voice', 'turn off voice', 'disable voice'],
  pauseOnly: ['pause', 'pause audio', 'pause voice']
};

// Check on every user message before processing
function checkPrivacyTriggers(message: string): PrivacyAction {
  const lowerMsg = message.toLowerCase();
  // Return appropriate action based on matches
}
```

#### 2. Input Detection Triggers

| Event | Action |
|-------|--------|
| User starts typing | Pause current audio |
| User clicks in message input | Pause current audio |
| User sends any message | Stop current + Queue new response |
| User switches conversation | Stop all audio immediately |

#### 3. System/UI Triggers

| Event | Action |
|-------|--------|
| Tab becomes hidden (blur) | Pause after 2s grace period |
| Window minimized | Pause immediately |
| Voice toggle switched OFF | Stop all, disable queue |
| Error in audio playback | Stop + Show error + Auto-retry once |

### Visual Feedback for Triggers

When a privacy trigger fires, show brief confirmation:

```
┌─────────────────────────────┐
│  🔇  Voice paused (typing)  │
└─────────────────────────────┘
        (auto-fade 2s)
```

### Settings for Triggers

Users can customize in Settings → Voice → Privacy:

- [x] Auto-pause when I start typing
- [x] Stop audio when switching conversations
- [x] Pause when tab is hidden
- [ ] Require confirmation before stopping (accessibility option)

---

## Wireframes & Mockups

### Main Chat View (Voice Mode Active)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  🏠 Mission Control                                    👤 Steve    ▼       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  🗨️ Chat                                           [🔊 Voice On ▼]  │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │ 👤 You                                                        │  │  │
│  │  │ How do I create a React component?                           │  │  │
│  │  │                                                        12:34  │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  │                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🤖 Assistant                                                  │  │  │
│  │  │ To create a React component, you'll need to:                 │  │  │
│  │  │                                                                │  │  │
│  │  │ 1. Import React                                              │  │  │
│  │  │ 2. Define your component function                            │  │  │
│  │  │ 3. Return JSX                                                │  │  │
│  │  │                                                                │  │  │
│  │  │ Here's a simple example:                                     │  │  │
│  │  │                                                                │  │  │
│  │  │ ```jsx                                                       │  │  │
│  │  │ [CODE BLOCK - SKIPPED IN VOICE]                              │  │  │
│  │  │ ```                                                          │  │  │
│  │  │                                                                │  │  │
│  │  │ ┌──────────────────────────────────────────────────────────┐ │  │  │
│  │  │ │ [▶️]  ╭──────────────────────────────╮  [🔊]  0:08 /0:32 │ │  │  │
│  │  │ │       │████████████████░░░░░░░░░░░░░░│                   │ │  │  │
│  │  │ │       ╰──────────────────────────────╯                   │ │  │  │
│  │  │ └──────────────────────────────────────────────────────────┘ │  │  │
│  │  │                                                        12:35  │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  │                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │ 👤 You                                                        │  │  │
│  │  │ Thanks! Can you explain useState?                            │  │  │
│  │  │                                                        12:36  │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  │                                                                     │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🤖 Assistant   [⟳ Generating audio...]                        │  │  │
│  │  │ The useState hook allows you to add state to functional...   │  │  │
│  │  │                                                        12:36  │  │  │
│  │  └──────────────────────────────────────────────────────────────┘  │  │
│  │                                                                     │  │
│  ├─────────────────────────────────────────────────────────────────────┤  │
│  │  [💬 Type a message...                          ]  [➤]  [🔊]       │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Voice Settings Panel

```
┌────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Settings                                          [✕ Close]            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌────────────┐  ┌─────────────────────────────────────────────────────┐  │
│  │ General    │  │ Voice Settings                                       │  │
│  │ ─────────  │  │                                                      │  │
│  │ Account    │  │  ┌─────────────────────────────────────────────┐    │  │
│  │ Appearance │  │  │ [✓] Enable voice for AI responses            │    │  │
│  │ 🔊 Voice   │  │  │     Automatically play audio for new messages │    │  │
│  │ ─────────  │  │  └─────────────────────────────────────────────┘    │  │
│  │ API Keys   │  │                                                      │  │
│  │ Shortcuts  │  │  Voice Selection                                     │  │
│  │            │  │  ═════════════════════════════════════════════════  │  │
│  │            │  │                                                      │  │
│  │            │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
│  │            │  │  │  [✓]    │ │   ○     │ │   ○     │ │   ○     │   │  │
│  │            │  │  │  Nova   │ │  Onyx   │ │  Echo   │ │  Fable  │   │  │
│  │            │  │  │ ♀️      │ │ ♂️      │ │ ♂️      │ │ ♀️      │   │  │
│  │            │  │  │ Warm    │ │ Clear   │ │ Neutral │ │ Express │   │  │
│  │            │  │  │         │ │ [▶️]    │ │ [▶️]    │ │ [▶️]    │   │  │
│  │            │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │  │
│  │            │  │                                                      │  │
│  │            │  │  Playback Speed: 1.0x                               │  │
│  │            │  │  [○─────●─────○─────○]  Slow ← → Fast               │  │
│  │            │  │                                                      │  │
│  │            │  │  Volume: [━━━━━━●━━━━━]  65%                         │  │
│  │            │  │                                                      │  │
│  │            │  │  Message Filtering                                   │  │
│  │            │  │  ═════════════════════════════════════════════════  │  │
│  │            │  │                                                      │  │
│  │            │  │  [✓] Skip code blocks and technical content        │  │
│  │            │  │  [✓] Skip error messages                            │  │
│  │            │  │  [✓] Read table summaries only                      │  │
│  │            │  │  [ ] Skip messages with only URLs                   │  │
│  │            │  │                                                      │  │
│  │            │  └─────────────────────────────────────────────────────┘  │
│  │            │                                                          │  │
│  └────────────┘  └─────────────────────────────────────────────────────┘  │
│                                                                            │
│  [Restore Defaults]                                    [Save Changes]      │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Quick Settings Popover

```
                    ┌─────────────────────────┐
                    │  🔊 Voice Settings      │
                    ├─────────────────────────┤
                    │                         │
  [🔊 Voice On ▼]──→│  Volume                 │
                    │  [━●━━━━━━━━━━━━]  25%  │
                    │                         │
                    │  Speed: 1.2x            │
                    │  [━━━●━━━━━━━━━]        │
                    │                         │
                    │  Voice: Nova [▼]        │
                    │  ┌──────────────────┐   │
                    │  │ ⭐ Nova          │   │
                    │  │    Onyx          │   │
                    │  │    Echo          │   │
                    │  │    Fable         │   │
                    │  │    Shimmer       │   │
                    │  └──────────────────┘   │
                    │                         │
                    │  ─────────────────────  │
                    │  [⚙️ Full Settings...]  │
                    │                         │
                    └─────────────────────────┘
```

### Audio Player States (Detail)

```
IDLE (not played yet):
┌─────────────────────────────────────────────────────────┐
│  [▶️]  ╭─────────────────────────────────────────╮      │
│        │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ 0:32 │
│        ╰─────────────────────────────────────────╯      │
└─────────────────────────────────────────────────────────┘

PLAYING:
┌─────────────────────────────────────────────────────────┐
│  [⏸️]  ╭─────────────────────────────────────────╮  [🔊]│
│        │███████████████████░░░░░░░░░░░░░░░░░░░░░│ 0:18 │
│        ╰─────────────────────────────────────────╯ /0:32│
│              ↑ animated pulse                          │
└─────────────────────────────────────────────────────────┘

PAUSED:
┌─────────────────────────────────────────────────────────┐
│  [▶️]  ╭─────────────────────────────────────────╮  [🔊]│
│        │███████████████████░░░░░░░░░░░░░░░░░░░░░│ 0:18 │
│        ╰─────────────────────────────────────────╯ /0:32│
│              ↑ solid fill (no animation)               │
└─────────────────────────────────────────────────────────┘

BUFFERING:
┌─────────────────────────────────────────────────────────┐
│  [⟳]  ╭─────────────────────────────────────────╮      │
│        │▒▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│      │
│        ╰─────────────────────────────────────────╯      │
│         ↑ light shaded = buffered portion               │
└─────────────────────────────────────────────────────────┘
```

---

## Message Filtering Logic

### What Gets Voice

| Content Type | Voice? | Notes |
|--------------|--------|-------|
| Plain text paragraphs | ✅ Yes | Full content |
| Lists (bullet/numbered) | ✅ Yes | Read naturally |
| **Code blocks** | ❌ No | Skip entirely or read "Here's some code" |
| **Error messages** | ❌ No | Skip or read "I encountered an error" |
| Tables | ⚠️ Partial | Read summary row count only |
| URLs | ⚠️ Partial | Skip URLs, read link text if exists |
| Emojis | ⚠️ Convert | "smiling face" or skip |
| Markdown formatting | ⚠️ Strip | Remove `**bold**`, `*italic*` markers |
| Inline code | ✅ Yes | Read as "code: [content]" |

### Filter Implementation

```typescript
interface MessageFilter {
  shouldSpeak(content: string): boolean;
  sanitizeForSpeech(content: string): string;
}

class TTSMessageFilter implements MessageFilter {
  shouldSpeak(content: string): boolean {
    // Skip if only whitespace
    if (!content.trim()) return false;
    
    // Skip if only code block
    if (this.isCodeBlockOnly(content)) return false;
    
    // Skip error messages
    if (this.isErrorMessage(content)) return false;
    
    return true;
  }
  
  sanitizeForSpeech(content: string): string {
    return content
      .replace(/```[\s\S]*?```/g, "Here's some code.")  // Replace code blocks
      .replace(/`([^`]+)`/g, 'code: $1')               // Inline code
      .replace(/\*\*([^*]+)\*\*/g, '$1')              // Bold
      .replace(/\*([^*]+)\*/g, '$1')                  // Italic
      .replace(/https?:\/\/\S+/g, '')                 // URLs
      .replace(/:[a-z_]+:/g, '')                       // Emoji codes
      .trim();
  }
}
```

---

## UX Concerns & Recommendations

### Concern 1: Audio Overlap

**Issue:** If multiple messages arrive quickly, audio could overlap unpleasantly.

**Solution:** 
- Implement a message queue (FIFO)
- Only play one audio at a time
- Visual indicator: "2 messages queued" in header

### Concern 2: Bandwidth & Loading

**Issue:** TTS generation takes time. Users might scroll past before audio ready.

**Solution:**
- Show "Generating audio..." spinner in message header
- Cache aggressively (24hr+ TTL)
- Pre-generate for streaming responses when possible

### Concern 3: Accessibility

**Issue:** Screen reader users may have conflicts with TTS.

**Solution:**
- Respect `prefers-reduced-motion` (disable animations)
- Ensure all audio controls are keyboard accessible
- Add ARIA labels: `aria-label="Play audio for this message"`
- Provide option to disable auto-play entirely

### Concern 4: Privacy Leaks

**Issue:** Audio might play sensitive content out loud unexpectedly.

**Solution:**
- Default voice mode to OFF for new users
- Clear visual indicator when voice is active
- Quick mute (Space key or big MUTE button)
- Respect system Do Not Disturb

### Concern 5: Mobile Future

**Issue:** Current design is desktop-first. Mobile needs different patterns.

**Solution:**
- Design mobile audio player as bottom sheet
- Swipe gestures: swipe message to play
- Keep touch targets > 44px even in desktop design

### Concern 6: Conversation Flow

**Issue:** Voice might feel disjointed from text flow.

**Solution:**
- Highlight currently speaking message (subtle border glow)
- Scroll into view when audio starts
- Allow user to click any message's play button to hear just that one

---

## Implementation Checklist

### Phase 1: Core Audio Player
- [ ] Create `AudioPlayer` React component
- [ ] Implement play/pause/loading states
- [ ] Add progress bar with time display
- [ ] Add volume control
- [ ] Style with CSS/Tailwind
- [ ] Add keyboard accessibility

### Phase 2: Voice Mode Integration
- [ ] Create `VoiceModeToggle` component
- [ ] Add to chat panel header
- [ ] Implement global voice state (Context/Redux)
- [ ] Create quick settings popover
- [ ] Add keyboard shortcut (Cmd/Ctrl+Shift+V)

### Phase 3: Settings Panel
- [ ] Create Voice settings page
- [ ] Build voice selection grid
- [ ] Implement speed slider
- [ ] Add volume slider
- [ ] Create message filtering checkboxes
- [ ] Connect to backend API

### Phase 4: Privacy & Triggers
- [ ] Implement trigger detection in message parser
- [ ] Add typing detection pause
- [ ] Add tab visibility handling
- [ ] Create visual feedback for triggers
- [ ] Add privacy settings options

### Phase 5: Message Filtering
- [ ] Implement `TTSMessageFilter` class
- [ ] Add code block detection
- [ ] Add error message detection
- [ ] Create content sanitizer
- [ ] Test with various markdown formats

### Phase 6: Polish & Testing
- [ ] Test with screen readers
- [ ] Verify keyboard navigation
- [ ] Test rapid message scenarios
- [ ] Test privacy triggers
- [ ] Performance audit (audio loading)

---

## Component Hierarchy

```
ChatPanel
├── ChatHeader
│   ├── Title ("Chat")
│   ├── ModelSelector
│   └── VoiceModeToggle
│       ├── ToggleButton
│       └── QuickSettingsPopover
│           ├── VolumeSlider
│           ├── SpeedSlider
│           └── VoiceDropdown
├── MessageList
│   └── MessageBubble (assistant)
│       ├── MessageContent
│       └── AudioPlayer (embedded)
│           ├── PlayPauseButton
│           ├── ProgressBar
│           ├── VolumeControl
│           └── TimeDisplay
└── ChatInput

SettingsPanel
└── VoiceSettings
    ├── EnableToggle
    ├── VoiceSelectorGrid
    │   └── VoiceCard (x5)
    ├── SpeedSlider
    ├── VolumeSlider
    └── FilterOptions
```

---

## Technical Notes for Implementation

### Audio API
- Use HTML5 `<audio>` element for maximum compatibility
- Or Web Audio API for advanced features (waveform viz)
- Store audio URLs in message metadata

### State Management
```typescript
interface VoiceState {
  enabled: boolean;
  volume: number;        // 0-100
  speed: number;         // 0.5-2.0
  selectedVoice: string; // 'nova' | 'onyx' | etc
  isPlaying: boolean;
  currentMessageId: string | null;
  queue: string[];       // message IDs queued
}
```

### CSS Variables
```css
:root {
  --voice-primary: #10b981;      /* Brand color for voice */
  --voice-paused: #6b7280;       /* Gray when paused */
  --voice-playing: #10b981;      /* Green when playing */
  --voice-error: #ef4444;        /* Red on error */
  --voice-progress-height: 4px;
  --voice-button-size: 32px;
}
```

---

## Ready for Implementation? ✅

**Status:** Design Complete

**Confidence Level:** High

**Blockers:** None

**Next Steps:**
1. Frontend team implements Phase 1 (AudioPlayer)
2. Backend team confirms `/api/tts` endpoint spec
3. Integrate components into existing chat flow
4. User testing with 3-5 internal users

**Estimated Implementation Time:** 2-3 days for MVP

---

*Document Version: 1.0*  
*Author: TRON (UI/UX)*  
*Reviewed: Ready for GEORDI/CODE-1 review*
