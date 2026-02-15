# Second Brain System

An automatic knowledge capture system for Mission Control that transforms conversations into searchable, tagged knowledge cards.

## Overview

The Second Brain automatically:
- Extracts key insights from conversations
- Generates summaries and tags
- Creates searchable knowledge cards
- Links related conversations
- Tracks action items and questions

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Chat/Voice    │────▶│  Auto-Generator  │────▶│  Conversation   │
│   Conversations │     │  (Tag + Summary) │     │     Cards       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                         │
                                ▼                         ▼
                        ┌───────────────┐        ┌───────────────┐
                        │  Card Tags    │        │   Segments    │
                        │  (Topics)     │        │  (Full convo) │
                        └───────────────┘        └───────────────┘
```

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `conversation_cards` | Main storage for knowledge cards |
| `card_tags` | Topic tags extracted from content |
| `conversation_segments` | Individual messages/pieces of conversations |
| `tag_definitions` | Controlled vocabulary for tags |
| `related_cards` | Connections between related cards |
| `auto_generation_rules` | Configurable rules for auto-generation |
| `card_generation_queue` | Async processing queue |

## Auto-Generation

Cards are automatically generated when:
1. Minimum 3 messages in conversation
2. Minimum 200 characters of content
3. Matches auto-generation rules
4. No exclude patterns matched

### Tag Extraction

Tags are automatically extracted using:
- Keyword patterns (coding, design, planning, etc.)
- Confidence scoring (0-1)
- Controlled vocabulary from `tag_definitions`

Default tags: idea, task, decision, question, insight, planning, coding, design, research, meeting, bug, feature, learning, personal, work

### Summary Generation

Summaries are generated as:
- Bullet points of key topics
- Action items extracted
- Questions identified
- Importance scored (1-5)

## API Endpoints

### Cards
```
GET    /api/second-brain/cards           # List cards (with filters)
POST   /api/second-brain/cards           # Create card manually
PATCH  /api/second-brain/cards           # Update card
DELETE /api/second-brain/cards?id=...    # Delete card
GET    /api/second-brain/cards?id=...    # Get single card
GET    /api/second-brain/cards?search=... # Search cards
GET    /api/second-brain/cards?stats=true # Get statistics
```

### Tags
```
GET    /api/second-brain/cards/tags?cardId=...  # Get tags for card
POST   /api/second-brain/cards/tags             # Add tag to card
DELETE /api/second-brain/cards/tags?cardId=...&tagId=... # Remove tag
GET    /api/second-brain/cards/tags?tag=...     # Get cards by tag
```

### Archive
```
POST   /api/second-brain/cards/archive          # Archive/unarchive card
Body: { id: string, action: 'archive' | 'unarchive' }
```

### Generation
```
POST   /api/second-brain/generate               # Trigger card generation
Body: { 
  messages: Message[],           // Generate from messages
  // OR
  segments: Segment[],           // Generate from segments
  sourceType: 'chat' | 'voice' | ...,
  sourceId?: string,
  sessionId?: string,
  // OR
  action: 'backfill',            // Backfill from history
  since?: string,
  until?: string,
  batchSize?: number
}
```

## React Hooks

### useAutoCardGeneration

Automatically generates cards from chat conversations:

```tsx
import { useAutoCardGeneration } from '@/hooks/use-auto-card-generation';

function ChatComponent() {
  const { generateNow, canGenerate, messageCount } = useAutoCardGeneration({
    enabled: true,
    minMessages: 5,
    onCardGenerated: (card) => {
      console.log('Generated:', card.title);
    },
  });
  
  return (
    <button onClick={generateNow} disabled={!canGenerate}>
      Save to Second Brain
    </button>
  );
}
```

### useSecondBrain

Access the Second Brain context:

```tsx
import { useSecondBrain } from '@/contexts/second-brain-context';

function CardList() {
  const { 
    cards, 
    isLoading, 
    hasMore, 
    loadMore,
    searchQuery,
    setSearchQuery,
    searchResults 
  } = useSecondBrain();
  
  // ... render cards
}
```

## Manual Generation

Generate cards programmatically:

```typescript
import { generateCardFromConversation } from '@/lib/second-brain/generator';

const result = await generateCardFromConversation({
  sourceType: 'chat',
  sessionId: 'my-session',
  segments: [
    { role: 'user', content: 'How do I implement...', timestamp: Date.now() },
    { role: 'assistant', content: 'You can use...', timestamp: Date.now() + 1000 },
  ],
});

console.log(result.card.id);
console.log(result.tags);
console.log(result.actionItems);
console.log(result.questions);
```

## Backfill

Process historical messages:

```bash
# Via API
curl -X POST http://localhost:3000/api/second-brain/generate \
  -H "Content-Type: application/json" \
  -d '{"action":"backfill","batchSize":100}'
```

Or programmatically:

```typescript
import { backfillCardsFromHistory } from '@/lib/second-brain/generator';

const result = await backfillCardsFromHistory('default', {
  batchSize: 100,
  since: new Date('2024-01-01'),
});

console.log(`Processed: ${result.processed}, Created: ${result.created}`);
```

## Search

Full-text search is enabled on cards:

```typescript
// Via API
const response = await fetch('/api/second-brain/cards?search=project planning');
const { cards } = await response.json();

// Via client
import { searchCards } from '@/lib/supabase/conversation-cards';
const cards = await searchCards('project planning', 20);
```

## Integration with Chat

The system integrates with the existing chat system:

1. Messages are stored in `messages` table
2. Periodic checks (every 60s) evaluate if a card should be generated
3. If criteria met, card is auto-generated with tags and summary
4. User sees toast notification of new card

## Configuration

Auto-generation rules can be configured via `auto_generation_rules` table:

- `min_message_count`: Minimum messages required
- `min_content_length`: Minimum characters required
- `exclude_patterns`: Regex patterns to skip
- `require_patterns`: Regex patterns that must match
- `enabled`: Enable/disable rule

## Future Enhancements

- [ ] Semantic search with embeddings
- [ ] AI-powered tag suggestions
- [ ] Card relationships visualization
- [ ] Export to Obsidian/Notion
- [ ] Voice transcription integration
- [ ] Email import
