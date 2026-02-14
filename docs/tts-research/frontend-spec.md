# TTS Frontend Specification

Date: 2026-02-08
Assigned to: TRON (UI/UX)

## Task:
Design audio player component and chat integration.

## Key Requirements:
- Audio player in chat bubbles
- Voice mode toggle in chat panel
- Privacy triggers (don't speak, silence, be quiet)
- Settings: voice selection, speed control
- Desktop-first (mobile future phase)

## Deliverables:
1. Component design
2. UI mock/wireframe
3. Integration plan with existing chat
4. Accessibility considerations

## Completed Design

See full UI/UX specification: [`ui-design.md`](./ui-design.md)

### Key Design Decisions:

1. **AudioPlayer Component**: Embedded in AI message bubbles with play/pause, progress bar, volume, and time display
2. **VoiceModeToggle**: Located in chat panel header with quick settings popover
3. **Settings Panel**: Full voice configuration with voice selection grid, speed slider, volume control, and message filtering
4. **Privacy Triggers**: Automatic mute on "don't speak", "silence", "be quiet" plus typing detection
5. **Message Filtering**: Skip code blocks, errors, tables; sanitize markdown for speech

### Component Hierarchy:
```
ChatPanel
├── ChatHeader
│   └── VoiceModeToggle
├── MessageList
│   └── MessageBubble
│       └── AudioPlayer
└── ChatInput
```

### Implementation Phases:
- Phase 1: Core AudioPlayer component
- Phase 2: Voice Mode toggle integration
- Phase 3: Settings panel
- Phase 4: Privacy triggers
- Phase 5: Message filtering
- Phase 6: Polish & testing

## Notes:
- Design is desktop-first, mobile-ready
- All components include keyboard accessibility
- Visual states: idle, buffering, playing, paused, error
- Estimated MVP implementation: 2-3 days
