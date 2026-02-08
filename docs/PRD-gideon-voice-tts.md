# PRD: Gideon Voice — TTS Integration for Mission Control

## Document Information
- **Version:** 1.0
- **Date:** February 8, 2026
- **Author:** Gideon (AI Assistant)
- **Status:** Draft for Review

## 1. Overview

### 1.1 Purpose
Enable text-to-speech (TTS) functionality in Mission Control, allowing Gideon to "speak" responses aloud, enhancing accessibility and hands-free usage.

### 1.2 Target Users
- **Primary:** Steve Shearman (AI With Agency)
- **Secondary:** Future Mission Control users

### 1.3 Success Metrics
- Voice generation latency < 2 seconds for messages under 500 characters
- Audio quality rated "good" or better by user
- Feature used in 20%+ of sessions within 30 days of launch
- Zero external API costs (fully open-source/local)

### 1.4 Clarifications (User Input)
**Date:** February 8, 2026

| Question | Answer |
|----------|--------|
| **Voice Personality** | Professional, assistant-like |
| **Messages to Speak** | NOT all messages. Exclude: code blocks, long technical outputs, error messages, JSON/XML data, tables, URLs |
| **Auto-Play Scope** | **ChatGPT Voice Mode style** — conversational turn-taking, not just reading responses |
| **Interrupt Behavior** | Queue messages, wait for current audio to finish. **Audio and text must arrive simultaneously** |
| **Privacy Triggers** | "Don't speak", "silence", "be quiet" toggle speech on/off. Plus UI toggle in chat panel |
| **Voice Preference** | Irish female accent, professional tone |
| **Platform Priority** | Desktop first (mobile future phase)

## 2. User Experience

### 2.1 User Stories

**Story 1: Conversational Voice Mode (Primary)**
> As a user, I want to have a voice conversation with Gideon similar to ChatGPT voice mode, where I can speak and Gideon responds by voice, creating a natural back-and-forth dialogue.

**Story 2: Manual Playback**
> As a user, I want to click a play button on any agent message to hear it spoken aloud, so I can consume content hands-free.

**Story 3: Smart Message Filtering**
> As a user, I want Gideon to automatically skip speaking code blocks, errors, and technical data, so I only hear conversational content.

**Story 4: Privacy Control**
> As a user, I want to say "don't speak" or "silence" to temporarily disable voice output, so sensitive information isn't spoken aloud in public spaces.

**Story 5: Voice Selection**
> As a user, I want to choose from multiple voices so I can personalize the experience.

**Story 6: Speed Control**
> As a user, I want to adjust speech speed so I can listen at my preferred pace.

### 2.2 UI/UX Design

#### Chat Message Component Update
Each agent message bubble gains:
- **Play button** (speaker icon) - bottom-right of message
- **Audio waveform visualization** (optional, nice-to-have) when playing
- **Stop button** (appears when audio is playing)

#### Settings Panel Addition
New "Voice" section in Settings:
- **Enable Voice:** Toggle on/off
- **Auto-Play:** Toggle (only appears when voice enabled)
- **Voice Selection:** Dropdown (e.g., "Gideon (Default)", "Nova", "Echo")
- **Speech Speed:** Slider (0.5x - 2.0x, default 1.0x)

#### Chat Panel Voice Controls
Floating voice toggle in chat panel:
- **Voice Mode Toggle:** On/Off switch (persistent)
- **Status Indicator:** Shows when voice is active/listening
- **Quick Mute:** Silence button to stop current audio

#### Privacy/Safety Controls
- **Text Triggers:** "don't speak", "silence", "be quiet" disable voice output
- **Auto-detected silence:** Code blocks, JSON, XML, tables, URLs are never spoken

### 2.3 User Flows

**Flow 1: Play a Message**
1. User sees agent response in chat
2. User clicks play button on message
3. Audio loads and plays
4. Button changes to "stop" icon while playing
5. Audio completes, button returns to "play"

**Flow 2: Enable Auto-Play**
1. User opens Settings
2. Toggles "Enable Voice" ON
3. Toggles "Auto-Play" ON
4. User closes settings
5. Future agent messages auto-play when received

**Flow 3: Change Voice**
1. User opens Settings
2. Selects different voice from dropdown
3. Preview plays: "This is how I'll sound now."
4. User saves/closes settings

## 3. Technical Specification

### 3.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mission Control                          │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │   Chat UI    │◄──►│  Audio Player│◄──►│  TTS API     │   │
│  └──────────────┘    └──────────────┘    └──────┬───────┘   │
│         ▲                                          │         │
│         │          ┌──────────────┐               │         │
│         └──────────┤  Pre-generate│◄──────────────┘         │
│                    │  Audio       │                         │
│                    └──────────────┘                         │
│  ┌──────────────┐    ┌──────────────┐                       │
│  │   Settings   │◄──►│  Voice Store │                       │
│  └──────────────┘    └──────────────┘                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Kokoro TTS     │
                    │   (Local Model)  │
                    └──────────────────┘
```

**Critical Requirement:** Audio must be pre-generated before message display to ensure **synchronized text/audio arrival**. This requires the backend to generate TTS in parallel with text generation, not after.

### 3.2 Technology Stack

**TTS Engine:** Kokoro-82M
- Repository: https://github.com/hexgrad/kokoro
- Model: 82M parameters
- Size: ~300MB
- License: Apache 2.0
- Languages: English (primary), supports others via config

**Backend:**
- Next.js API Routes (`/api/tts`)
- Python subprocess or Node.js wrapper for Kokoro
- File system cache for generated audio

**Frontend:**
- HTML5 `<audio>` element
- React state management for playback
- Tailwind for UI styling

**Storage:**
- Local filesystem: `/tmp/tts-cache/` or `./cache/tts/`
- TTL: 7 days for cached audio files

### 3.3 API Specification

#### Endpoint: `POST /api/tts`

**Request:**
```json
{
  "text": "Hello Steve, your morning brief is ready.",
  "voice": "default",
  "speed": 1.0,
  "messageId": "msg_abc123"
}
```

**Response:**
```json
{
  "success": true,
  "audioUrl": "/api/tts/audio/msg_abc123.mp3",
  "duration": 3.2,
  "cached": false
}
```

#### Endpoint: `GET /api/tts/audio/:id`

Streams the audio file.

### 3.4 Data Models

```typescript
// types/tts.ts

interface TTSOptions {
  voice: string;
  speed: number;
  language?: string;
}

interface TTSCacheEntry {
  messageId: string;
  textHash: string;
  audioPath: string;
  createdAt: Date;
  expiresAt: Date;
  duration: number;
}

interface VoiceSettings {
  enabled: boolean;
  autoPlay: boolean;
  voice: string;
  speed: number;
}
```

### 3.5 Component Specification

#### `AudioPlayer` Component
```typescript
interface AudioPlayerProps {
  messageId: string;
  text: string;
  autoPlay?: boolean;
  onPlay?: () => void;
  onComplete?: () => void;
}
```

**Features:**
- Pre-generate audio before message display (**critical for text/audio sync**)
- Queue system: New messages wait for current audio to finish
- Cache generated audio URLs
- Visual feedback (loading state, playing state)
- Error handling (fallback to Web Speech API if TTS fails)

#### `VoiceSettings` Component
Settings panel section for voice configuration.

#### `MessageFilter` Utility
```typescript
// Determines if a message should be spoken
function shouldSpeakMessage(text: string): boolean {
  // Never speak these patterns:
  const skipPatterns = [
    /^```[\s\S]*```$/,           // Code blocks
    /^{[\s\S]*}$/,                // JSON objects
    /^<[\s\S]*>$/,                // XML/HTML
    /^\|.*\|.*\|/,               // Tables (markdown)
    /^https?:\/\/\S+$/,           // URLs only
    /^Error:|^Exception:|^Traceback/, // Error messages
    /^\s*$/                       // Empty/whitespace only
  ];
  
  return !skipPatterns.some(pattern => pattern.test(text));
}

// Strip non-speech content for TTS
function prepareTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '[code block]')
    .replace(/`[^`]+`/g, '[code]')
    .replace(/https?:\/\/\S+/g, '[link]')
    .replace(/\|[^|]+\|/g, '') // Remove table markdown
    .trim();
}
```

### 3.6 Caching Strategy

**Cache Key:** SHA256 hash of `text + voice + speed`

**Storage:**
- Development: `./cache/tts/`
- Production: `/tmp/tts-cache/` or S3 (if scaled)

**Cleanup:**
- Cron job or on-startup cleanup of files older than 7 days
- Max cache size: 500MB (LRU eviction)

## 4. Implementation Plan

### Phase 1: Backend Setup (Day 1)
- [ ] Install Kokoro dependencies (Python, espeak-ng)
- [ ] Create `/api/tts` endpoint with **pre-generation** capability
- [ ] Implement text-to-speech generation with <2s latency target
- [ ] Implement audio file serving
- [ ] Add caching layer
- [ ] Create message filtering utility (skip code blocks, errors, etc.)
- [ ] Test with sample messages

### Phase 2: Frontend Core (Day 2)
- [ ] Create `AudioPlayer` component with **audio queue system**
- [ ] Implement **pre-generation** of audio before message display (sync with text)
- [ ] Add play button to message bubbles
- [ ] Implement audio loading states
- [ ] Add error handling and fallbacks
- [ ] Test audio/text synchronization

### Phase 3: Settings & Voice Controls (Day 3)
- [ ] Add Voice section to Settings panel
- [ ] Implement voice selection
- [ ] Implement speed control
- [ ] Add **Voice Mode toggle** to chat panel
- [ ] Implement **privacy triggers** ("don't speak", "silence", "be quiet")
- [ ] Add preview functionality
- [ ] Persist settings to localStorage/Supabase

### Phase 4: Testing & Optimization (Day 4)
- [ ] Test **audio/text synchronization** (critical)
- [ ] Test message filtering (code blocks, errors skipped)
- [ ] Test privacy triggers ("don't speak", etc.)
- [ ] Test voice switching
- [ ] Performance testing (latency)
- [ ] Test audio queue behavior
- [ ] Bug fixes

### Phase 5: Deployment (Day 5)
- [ ] Deploy to staging
- [ ] User acceptance testing
- [ ] Deploy to production
- [ ] Monitor usage and errors

## 5. Dependencies

### System Requirements
- Python 3.8+
- espeak-ng (system package)
- ~1GB disk space for model + cache

### NPM Packages
```json
{
  "dependencies": {
    "crypto": "^1.0.1"
  }
}
```

### Python Packages
```
kokoro>=0.9.4
soundfile
torch
transformers
phonemizer
```

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Kokoro install fails | High | Fallback to Web Speech API |
| Audio generation slow | Medium | Pre-generate for streaming responses |
| Cache grows too large | Low | Implement TTL + size limits |
| Browser audio blocked | Medium | Clear error message, manual play only |
| espeak-ng not available | High | Document install steps; Docker option |

## 7. Future Enhancements

- **Streaming TTS:** Generate audio chunks as text streams in
- **Voice Cloning:** Train custom voice from samples
- **SSML Support:** Rich markup for emphasis, pauses
- **Multi-language:** Spanish, French, German voices
- **Offline Mode:** PWA support with service worker caching
- **STT Integration:** Voice input (speech-to-text)

## 8. Open Questions

1. Should we support SSML for advanced voice control?
2. Do we need voice activity detection (pause when user speaks)?
3. Should audio persist across page reloads?
4. Mobile: Should audio play in background when app minimized?

## 9. Appendix

### A. Kokoro Voice Options
Available voices from Kokoro (can be extended):
- `af` (American Female)
- `am` (American Male)
- `bf` (British Female) — *Closest to Irish accent among built-in options*
- `bm` (British Male)

**Note on Irish Accent:**
Kokoro-82M does not include a native Irish accent. Options to achieve Irish female voice:
1. **Phase 1:** Use `bf` (British Female) as closest approximation
2. **Phase 2:** Train/fine-tune custom voice with Irish accent samples
3. **Alternative:** Use Piper TTS with Irish voice model (if available)
4. **Fallback:** Web Speech API may have platform-specific Irish voices

**Recommendation:** Start with `bf` (British Female), investigate custom voice training for Phase 2.

### B. Web Speech API Fallback
If Kokoro unavailable, use browser's built-in:
```javascript
const utterance = new SpeechSynthesisUtterance(text);
utterance.voice = speechSynthesis.getVoices()[0];
speechSynthesis.speak(utterance);
```

### C. Testing Checklist
- [ ] Short messages (< 100 chars)
- [ ] Long messages (> 1000 chars)
- [ ] Special characters and emojis
- [ ] Code blocks (should be skipped or simplified)
- [ ] Multiple rapid plays
- [ ] Network interruption during load
- [ ] Browser refresh during playback
