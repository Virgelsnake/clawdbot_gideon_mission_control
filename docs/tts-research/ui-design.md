# TTS UI/UX Design

**Designer:** TRON  
**Date:** February 8, 2026  
**Status:** ✅ Design Complete

---

## Design Philosophy

**ChatGPT Voice Mode inspired** — conversational, seamless, not just "read aloud."

Key principles:
- Voice is a mode, not a feature
- Audio and text arrive together
- Simple controls, smart defaults
- Privacy-first (easy to silence)

---

## Component Overview

### 1. Chat Message Audio Player

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 Gideon                                      12:34 PM    │
│                                                             │
│  Your morning brief is ready. Today we have 3 high         │
│  priority tasks and 2 new ideas to review.                  │
│                                                             │
│                                    ┌─────┐     ┌─────┐     │
│                                    │  ▶  │     │ 🔊  │     │
│                                    └─────┘     └─────┘     │
│                                   Play      Voice Toggle   │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Play Button:** Speaker icon, appears on hover or always visible
- **Voice Toggle:** Quick mute/unmute for this message
- **Playing State:** Waveform animation, pause button

**States:**
- Idle: Speaker icon
- Loading: Spinner
- Playing: Pause icon + waveform
- Error: Red X (fallback available)

---

### 2. Chat Panel Voice Mode Toggle

```
┌──────────────────────────────────────────┐
│  Chat                          ┌────────┐│
│  (245)                         │ 🎤 ON  ││
│                                └────────┘│
├──────────────────────────────────────────┤
│                                          │
│  [Message list...]                       │
│                                          │
└──────────────────────────────────────────┘
```

**Voice Mode Toggle:**
- Position: Top-right of chat panel header
- States: 🎤 ON / 🎤 OFF / 🔇 SILENCED
- Click to toggle global voice mode

**Visual States:**
- ON: Green/mic icon, "Voice Active"
- OFF: Gray/muted icon, "Voice Off"
- SILENCED: Red with strikethrough, "Silenced" (temporary)

---

### 3. Message Filtering (Auto-Skip)

**Messages that DON'T get spoken:**

| Type | Example | Behavior |
|------|---------|----------|
| Code blocks | ```code``` | Skip entirely |
| JSON/XML | `{ "key": "value" }` | Skip entirely |
| URLs only | `https://...` | Skip or say "link" |
| Error messages | `Error: timeout` | Skip entirely |
| Tables | `| Col1 | Col2 |` | Skip or summarize |
| Very long | >1000 chars | Truncate with "continues..." |

**UI Indicator:**
Small "muted" icon on skipped messages:
```
┌─────────────────────────────────┐
│ ```                             │
│ const x = 1;                    │
│ ```                        🔇   │
└─────────────────────────────────┘
```

---

### 4. Privacy Triggers

**Text commands that control voice:**

| Trigger | Action | Response |
|---------|--------|----------|
| "don't speak" | Disable voice | 🔇 "Voice disabled" |
| "silence" | Mute until toggled | 🔇 "Silenced" |
| "be quiet" | Same as silence | 🔇 "Quiet mode" |
| "speak up" | Re-enable voice | 🎤 "Voice enabled" |
| "voice on" | Force enable | 🎤 "Voice on" |

**UI Feedback:**
Toast notification when triggered:
```
┌──────────────────────┐
│  🔇 Voice silenced   │
│  Say "speak up" to   │
│  re-enable           │
└──────────────────────┘
```

---

### 5. Settings Panel — Voice Section

```
┌────────────────────────────────────────┐
│  ⚙️ Settings                           │
├────────────────────────────────────────┤
│                                        │
│  VOICE                                 │
│  ────────────────────────────────────  │
│                                        │
│  Enable Voice               [Toggle]   │
│                                        │
│  Auto-Play Messages         [Toggle]   │
│  (Play all agent responses)            │
│                                        │
│  Voice Selection            [▼ British │
│                              Female]   │
│                                        │
│  Speech Speed               [●──────]  │
│              Slow      Normal    Fast  │
│              0.5x       1.0x     2.0x  │
│                                        │
│  [🔊 Preview Voice]                    │
│                                        │
│  ────────────────────────────────────  │
│  Advanced                              │
│  ────────────────────────────────────  │
│                                        │
│  Cache Audio Files          [Toggle]   │
│  (Faster replay, uses ~500MB)          │
│                                        │
└────────────────────────────────────────┘
```

**Voice Options Dropdown:**
- British Female (Default — closest to Irish)
- American Female
- American Male
- British Male
- [Phase 2] Irish Female (Custom)

---

### 6. Audio Player States (Detailed)

**Loading State:**
```
┌──────────────────────────────────────┐
│ Generating audio...                  │
│ ████████░░░░░░░░░░  45%              │
└──────────────────────────────────────┘
```

**Playing State:**
```
┌──────────────────────────────────────┐
│ ▶️  ▌▌  ▃▅▇▇▃▂ ▂▃▅▇▇▅▃▂  ──────○  │
│    0:03                    0:12     │
└──────────────────────────────────────┘
```

**Waveform:** Simple CSS animation or Lottie

---

### 7. Desktop-First Responsive

**Breakpoints:**
- Desktop (primary): Full feature set
- Tablet: Simplified controls, no waveform
- Mobile (Phase 2): Minimal player, large touch targets

**Desktop Layout:**
- Chat panel: 320px fixed width
- Audio controls: Inline with messages
- Settings: Full modal panel

---

## Accessibility

**ARIA Labels:**
```html
<button aria-label="Play message audio">
  <SpeakerIcon />
</button>

<button aria-label="Toggle voice mode" aria-pressed="true">
  <MicIcon />
</button>
```

**Keyboard Navigation:**
- Tab: Navigate to play button
- Space/Enter: Toggle play/pause
- Shift + V: Toggle voice mode (global shortcut)

**Screen Reader:**
- Announce "Audio available" on messages
- Announce "Voice enabled/disabled" on toggle

---

## Component Props

### AudioPlayer
```typescript
interface AudioPlayerProps {
  messageId: string;
  text: string;
  audioUrl?: string;      // Generated URL
  isGenerating: boolean;  // Loading state
  autoPlay?: boolean;     // Should auto-play
  onPlay?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}
```

### VoiceToggle
```typescript
interface VoiceToggleProps {
  enabled: boolean;
  silenced: boolean;      // Temporary silence
  onToggle: () => void;
  showLabel?: boolean;    // Show "Voice On/Off" text
}
```

### VoiceSettings
```typescript
interface VoiceSettingsProps {
  enabled: boolean;
  autoPlay: boolean;
  voice: string;          // 'bf', 'af', etc.
  speed: number;          // 0.5 - 2.0
  onChange: (settings: VoiceSettings) => void;
}
```

---

## Implementation Notes

**Libraries to Consider:**
- `wavesurfer.js` — Waveform visualization (optional)
- `howler.js` — Audio playback (if HTML5 audio insufficient)
- `lucide-react` — Icons (already in project)

**CSS Animation:**
```css
@keyframes waveform {
  0%, 100% { height: 20%; }
  50% { height: 100%; }
}

.waveform-bar {
  animation: waveform 1s ease-in-out infinite;
}
```

---

## Next Steps

1. ✅ UI design approved
2. Build AudioPlayer component
3. Build VoiceToggle component
4. Add Voice section to Settings
5. Implement message filtering
6. Add privacy trigger detection

**Status:** ✅ READY FOR IMPLEMENTATION
