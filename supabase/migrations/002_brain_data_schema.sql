-- Brain Data Schema Migration (BRAIN-DATA-001)
-- Creates conversations and memory_cards tables for knowledge capture
-- Token: BRAIN-DATA-001

-- ============================================
-- 1. CONVERSATIONS (Raw conversation storage)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core fields (as specified)
    conversation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    summary TEXT NOT NULL,
    raw_text TEXT NOT NULL,
    
    -- Tags as array for simple querying
    tags TEXT[] DEFAULT '{}',
    
    -- Agent references (which agents participated)
    agent_refs TEXT[] DEFAULT '{}',
    
    -- Optional metadata
    source_type TEXT DEFAULT 'chat' CHECK (source_type IN ('chat', 'voice', 'email', 'document', 'web', 'manual')),
    session_id TEXT DEFAULT 'default',
    user_id TEXT DEFAULT 'steve',
    
    -- Status tracking
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'processing')),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Full-text search
    search_vector TSVECTOR
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_date ON conversations(conversation_date DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_conversations_tags ON conversations USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_conversations_agents ON conversations USING GIN(agent_refs);
CREATE INDEX IF NOT EXISTS idx_conversations_search ON conversations USING GIN(search_vector);

-- ============================================
-- 2. MEMORY_CARDS (Distilled knowledge cards)
-- ============================================
CREATE TABLE IF NOT EXISTS memory_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to parent conversation
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Core fields (as specified)
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    
    -- Metadata
    card_type TEXT DEFAULT 'note' CHECK (card_type IN ('note', 'task', 'idea', 'decision', 'question', 'insight', 'code')),
    importance INTEGER DEFAULT 3 CHECK (importance >= 1 AND importance <= 5),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for memory_cards
CREATE INDEX IF NOT EXISTS idx_memory_cards_conversation ON memory_cards(conversation_id);
CREATE INDEX IF NOT EXISTS idx_memory_cards_created ON memory_cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memory_cards_type ON memory_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_memory_cards_importance ON memory_cards(importance DESC);
CREATE INDEX IF NOT EXISTS idx_memory_cards_tags ON memory_cards USING GIN(tags);

-- ============================================
-- 3. TRIGGERS AND FUNCTIONS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_memory_cards_updated_at ON memory_cards;
CREATE TRIGGER update_memory_cards_updated_at
    BEFORE UPDATE ON memory_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update search vector for conversations
CREATE OR REPLACE FUNCTION update_conversation_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.raw_text, '')), 'B') ||
        setweight(to_tsvector('english', array_to_string(COALESCE(NEW.tags, '{}'), ' ')), 'C');
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_conversations_search ON conversations;
CREATE TRIGGER update_conversations_search
    BEFORE INSERT OR UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_conversation_search_vector();

-- Auto-extract memory cards from conversations (optional automation)
CREATE OR REPLACE FUNCTION auto_extract_memory_cards()
RETURNS TRIGGER AS $$
BEGIN
    -- This trigger can be extended to auto-generate memory cards
    -- based on conversation content patterns
    -- For now, it's a placeholder for future automation
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS auto_extract_on_conversation ON conversations;
CREATE TRIGGER auto_extract_on_conversation
    AFTER INSERT ON conversations
    FOR EACH ROW EXECUTE FUNCTION auto_extract_memory_cards();

-- ============================================
-- 4. REALTIME ENABLEMENT (Supabase Realtime)
-- ============================================
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE memory_cards REPLICA IDENTITY FULL;

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations for authenticated users (Phase 2 setup)
-- In production, replace with user-specific policies
CREATE POLICY conversations_all ON conversations 
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY memory_cards_all ON memory_cards 
    FOR ALL USING (true) WITH CHECK (true);

-- Future-proof RLS policies (commented out for reference)
/*
-- Example user-specific policy for production:
CREATE POLICY conversations_user_isolation ON conversations
    FOR ALL USING (user_id = auth.uid()::text);

CREATE POLICY memory_cards_user_isolation ON memory_cards
    FOR ALL USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()::text
        )
    );

-- Service role bypass (for agent operations):
CREATE POLICY conversations_service ON conversations
    FOR ALL USING (auth.role() = 'service_role');
*/

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Search conversations by content
CREATE OR REPLACE FUNCTION search_conversations(search_query TEXT)
RETURNS SETOF conversations AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM conversations
    WHERE search_vector @@ plainto_tsquery('english', search_query)
       OR raw_text ILIKE '%' || search_query || '%'
       OR summary ILIKE '%' || search_query || '%'
    ORDER BY created_at DESC;
END;
$$ language 'plpgsql';

-- Get memory cards by tag
CREATE OR REPLACE FUNCTION get_cards_by_tag(tag_query TEXT)
RETURNS SETOF memory_cards AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM memory_cards
    WHERE tag_query = ANY(tags)
    ORDER BY created_at DESC;
END;
$$ language 'plpgsql';

-- Get conversations by agent reference
CREATE OR REPLACE FUNCTION get_conversations_by_agent(agent_ref TEXT)
RETURNS SETOF conversations AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM conversations
    WHERE agent_ref = ANY(agent_refs)
    ORDER BY conversation_date DESC;
END;
$$ language 'plpgsql';

-- ============================================
-- 7. DATA PATTERNS DOCUMENTATION
-- ============================================
COMMENT ON TABLE conversations IS 
'Raw conversation storage. One row per conversation/session.
Token: BRAIN-DATA-001
Patterns:
- Insert: New conversation captured
- Update: Summary refined, tags added
- Query by date range, tags, or agent_refs
- Full-text search on summary + raw_text';

COMMENT ON TABLE memory_cards IS 
'Distilled knowledge cards extracted from conversations.
Token: BRAIN-DATA-001
Patterns:
- Insert: Manual or AI extraction from conversation
- Link: Always has conversation_id parent
- Query by type, importance, or tags
- Cascade delete with parent conversation';

-- Migration complete marker
SELECT 'BRAIN-DATA-001: Schema created successfully' as migration_status;
