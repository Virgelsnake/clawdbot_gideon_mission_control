# TTS Backend Architecture

**Tech Lead:** GEORDI + CODE-1  
**Date:** February 8, 2026  
**Status:** ✅ Design Complete

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mission Control                           │
│                                                                  │
│  ┌──────────────┐         ┌──────────────────────────────────┐  │
│  │   Chat API   │────────►│  TTS Pre-Generator (Middleware) │  │
│  └──────────────┘         └──────────────┬───────────────────┘  │
│                                          │                       │
│                                          ▼                       │
│                           ┌──────────────────────────┐          │
│                           │  /api/tts (Next.js Route)│          │
│                           └──────────────┬───────────┘          │
│                                          │                       │
│           ┌──────────────────────────────┼──────────────────┐   │
│           │                              │                  │   │
│           ▼                              ▼                  ▼   │
│    ┌─────────────┐              ┌──────────────┐    ┌─────────┐│
│    │ File Cache  │              │ Kokoro TTS   │    │ Fallback││
│    │ (TTL: 7d)   │              │ (Python)     │    │ Web API ││
│    └─────────────┘              └──────────────┘    └─────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Specification

### POST /api/tts
Generate TTS audio for a message.

**Request:**
```json
{
  "text": "Hello Steve, your morning brief is ready.",
  "voice": "bf",
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

### GET /api/tts/audio/:messageId
Stream the audio file.

---

## Pre-Generation Strategy (CRITICAL)

**Requirement:** Audio must be ready BEFORE message displays.

**Implementation:**
1. Chat API receives agent response
2. BEFORE sending to client, call TTS pre-generator
3. TTS generator creates audio in background
4. Chat response includes `audioUrl` in metadata
5. Frontend receives text + audio URL simultaneously

**Code Flow:**
```typescript
// In chat API route
const response = await generateAgentResponse(message);

// Pre-generate TTS (don't await, but start immediately)
const ttsPromise = fetch('/api/tts', {
  method: 'POST',
  body: JSON.stringify({
    text: response.text,
    voice: settings.voice,
    messageId: response.id
  })
});

// Send response to client (text first, audio follows)
res.json({
  ...response,
  audioReady: false // Client polls or waits for WebSocket
});

// Wait for TTS, then notify via WebSocket
const ttsResult = await ttsPromise;
webSocket.emit('audio-ready', {
  messageId: response.id,
  audioUrl: ttsResult.audioUrl
});
```

---

## Audio Queue System

**Problem:** Multiple messages arriving while audio playing.

**Solution:** Client-side queue with WebSocket coordination.

```typescript
// Frontend Audio Queue
class AudioQueue {
  private queue: string[] = [];
  private isPlaying = false;

  add(audioUrl: string) {
    this.queue.push(audioUrl);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const url = this.queue.shift()!;
    
    await this.playAudio(url);
    this.playNext(); // Continue with next
  }

  skip() {
    // Stop current, play next
  }
}
```

---

## Caching Strategy

**Cache Key:** SHA256(`text + voice + speed`)

**Storage:**
```
/cache/tts/
  ├── {hash1}.mp3
  ├── {hash2}.mp3
  └── ...
```

**TTL:** 7 days (LRU eviction if >500MB)

**Implementation:**
```typescript
const crypto = require('crypto');

function getCacheKey(text: string, voice: string, speed: number): string {
  return crypto
    .createHash('sha256')
    .update(`${text}|${voice}|${speed}`)
    .digest('hex');
}

function getAudioPath(cacheKey: string): string {
  return `/cache/tts/${cacheKey}.mp3`;
}
```

---

## Error Handling

| Error | Fallback |
|-------|----------|
| Kokoro fails | Web Speech API (client-side) |
| Cache write fails | Generate on-the-fly, don't cache |
| Timeout (>3s) | Return text only, audio later |
| Invalid text | Skip TTS (return empty) |

---

## File Structure

```
app/
├── api/
│   ├── chat/
│   │   └── route.ts          (modified: pre-generate TTS)
│   └── tts/
│       ├── route.ts          (POST: generate TTS)
│       └── audio/
│           └── [id]/
│               └── route.ts  (GET: stream audio)
├── lib/
│   ├── tts/
│   │   ├── generator.ts      (Kokoro integration)
│   │   ├── cache.ts          (File cache management)
│   │   └── queue.ts          (Server-side queue)
│   └── websocket/
│       └── tts-events.ts     (WebSocket for audio-ready)
```

---

## Dependencies

**System:**
- Python 3.8+
- espeak-ng (`brew install espeak`)

**NPM:**
- `crypto` (built-in)
- `ws` (WebSocket library)

**Python:**
- kokoro>=0.9.4
- soundfile
- torch
- transformers
- phonemizer

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| TTS Generation | <2s | Kokoro is fast (~0.5-1.5s) |
| Cache Hit | <10ms | File system read |
| First Message | <3s | Generation + network |
| Concurrent | 5+ users | No blocking |

---

## Next Steps

1. ✅ Architecture approved
2. Install Kokoro dependencies
3. Implement /api/tts endpoint
4. Modify chat API for pre-generation
5. Implement WebSocket audio-ready events
6. Test with concurrent users

**Status:** ✅ READY FOR IMPLEMENTATION
