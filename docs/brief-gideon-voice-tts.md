# Brief: Give Gideon a Voice — TTS Integration for Mission Control

## Project Overview
Enable text-to-speech (TTS) capability for Gideon within Mission Control, allowing the AI assistant to "speak" responses in addition to text output. This enhances accessibility and user experience.

## Goals
1. Integrate TTS into Mission Control's chat interface
2. Support free/open-source TTS technologies
3. Enable voice output for agent responses
4. Provide user controls (play/pause, voice selection, auto-play toggle)

## Target Users
- Steve (primary): Wants voice capability for hands-free interaction
- Future: All Mission Control users who prefer audio consumption

## Success Criteria
- [ ] Voice output works for all agent messages in chat
- [ ] Multiple voice options available
- [ ] Toggle for auto-play vs manual play
- [ ] Works offline (local TTS processing)
- [ ] Minimal latency (< 2 seconds for short responses)

## Research Summary: TTS Options

### Option 1: Kokoro-82M (RECOMMENDED)
- **Type:** Open-source, local inference
- **Size:** 82M parameters (very lightweight)
- **Quality:** High quality, natural sounding
- **Installation:** `pip install kokoro soundfile`
- **Pros:** 
  - Fast inference on CPU
  - Multiple languages
  - Small model size (~300MB)
  - No API costs
- **Cons:**
  - Requires espeak-ng dependency
  - English-focused (though supports others)

### Option 2: Web Speech API (Browser Built-in)
- **Type:** Browser native API
- **Cost:** Free
- **Quality:** Varies by OS/browser
- **Pros:**
  - Zero installation
  - No backend needed
  - Instant availability
- **Cons:**
  - Quality inconsistent across platforms
  - Limited voice customization
  - Requires user permission

### Option 3: Piper TTS
- **Type:** Open-source, local
- **Quality:** Good, lightweight
- **Pros:**
  - Very fast
  - Multiple voices
  - ONNX runtime
- **Cons:**
  - Less natural than Kokoro
  - Voice selection more limited

### Option 4: ElevenLabs API (Commercial)
- **Type:** Cloud API
- **Cost:** ~$5-22/month for reasonable usage
- **Quality:** Best-in-class
- **Pros:**
  - Excellent quality
  - Voice cloning possible
- **Cons:**
  - Not free/open-source
  - Requires internet
  - Ongoing costs

## Recommendation
**Primary:** Kokoro-82M for backend processing
**Fallback:** Web Speech API for zero-setup experience

## Technical Approach
1. Backend API endpoint: `/api/tts` that accepts text, returns audio URL
2. Kokoro runs on server, generates MP3/WAV files
3. Audio cached to avoid regeneration
4. Frontend: Audio player component with play/pause controls
5. Settings: Voice selection, speed, auto-play toggle

## Out of Scope (Future Phases)
- Real-time streaming TTS
- Voice cloning/custom voice
- Speech-to-text (STT) for voice input
- Multi-language support beyond initial set

## Timeline Estimate
- Research & Setup: 1 day
- Backend API: 1 day
- Frontend UI: 1-2 days
- Testing & Polish: 1 day
- **Total: 4-5 days**

## Next Steps
1. Create detailed PRD
2. Set up Kokoro on development environment
3. Build prototype
4. Test and iterate
