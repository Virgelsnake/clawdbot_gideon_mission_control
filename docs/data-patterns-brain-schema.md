# Data Patterns: Brain Schema (BRAIN-DATA-001)

## Schema Overview

### conversations Table
Raw conversation storage - one row per conversation/session.

| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| conversation_date | TIMESTAMP | When conversation occurred |
| summary | TEXT | AI-generated summary |
| raw_text | TEXT | Full conversation transcript |
| tags | TEXT[] | Array of topic tags |
| agent_refs | TEXT[] | Participating agents (e.g., ['DATA', 'PROMPT']) |
| source_type | TEXT | chat, voice, email, document, web, manual |
| status | TEXT | active, archived, processing |

### memory_cards Table
Distilled knowledge cards extracted from conversations.

| Field | Type | Purpose |
|-------|------|---------|
| id | UUID | Primary key |
| conversation_id | UUID | FK to conversations (cascade delete) |
| title | TEXT | Card title |
| content | TEXT | Card content/body |
| tags | TEXT[] | Topic tags |
| card_type | TEXT | note, task, idea, decision, question, insight, code |
| importance | INTEGER | 1-5 scale |
| created_at | TIMESTAMP | When card created |

## Data Patterns

### Pattern 1: Conversation Capture
```sql
-- Insert new conversation
INSERT INTO conversations (summary, raw_text, tags, agent_refs)
VALUES ('Summary here', 'Full text here', ARRAY['tag1', 'tag2'], ARRAY['DATA', 'PROMPT']);
```

### Pattern 2: Memory Card Extraction
```sql
-- Create card from conversation
INSERT INTO memory_cards (conversation_id, title, content, tags, card_type)
VALUES (
    'conversation-uuid',
    'Key Decision',
    'We decided to...',
    ARRAY['decision', 'architecture'],
    'decision'
);
```

### Pattern 3: Tag-Based Retrieval
```sql
-- Find all cards with specific tag
SELECT * FROM memory_cards WHERE 'architecture' = ANY(tags);

-- Find conversations by agent
SELECT * FROM conversations WHERE 'DATA' = ANY(agent_refs);
```

### Pattern 4: Full-Text Search
```sql
-- Use helper function
SELECT * FROM search_conversations('machine learning');

-- Or manual query
SELECT * FROM conversations 
WHERE search_vector @@ plainto_tsquery('english', 'search term');
```

### Pattern 5: Cascade Cleanup
```sql
-- Deleting conversation auto-deletes linked cards
DELETE FROM conversations WHERE id = 'uuid';
-- memory_cards with this conversation_id are also removed
```

## Realtime Events

Tables enabled for Supabase Realtime:
- `conversations` - New conversation captured
- `memory_cards` - New card created/updated/deleted

## RLS Policies

Current (Phase 2): Permissive - all operations allowed
Future: User-isolated policies with service_role bypass for agents

## Token
BRAIN-DATA-001
