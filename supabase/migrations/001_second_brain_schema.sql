-- Second Brain Schema Migration
-- Creates tables for conversation cards, tags, and segments
-- Enables automatic knowledge capture from conversations

-- ============================================
-- 1. CONVERSATION CARDS (Main storage)
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core content
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL, -- Full conversation content or key excerpts
    
    -- Source tracking
    source_type TEXT NOT NULL CHECK (source_type IN ('chat', 'voice', 'email', 'document', 'web', 'manual')),
    source_id TEXT, -- Reference to original conversation/messages
    source_url TEXT, -- Optional URL reference
    
    -- Context
    session_id TEXT DEFAULT 'default',
    user_id TEXT DEFAULT 'steve', -- For future multi-user support
    
    -- Metadata
    importance INTEGER DEFAULT 3 CHECK (importance >= 1 AND importance <= 5),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'processing')),
    
    -- Timestamps
    conversation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE,
    
    -- Full-text search vector (updated via trigger)
    search_vector TSVECTOR
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON conversation_cards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_conversation_date ON conversation_cards(conversation_date DESC);
CREATE INDEX IF NOT EXISTS idx_cards_source_type ON conversation_cards(source_type);
CREATE INDEX IF NOT EXISTS idx_cards_status ON conversation_cards(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_cards_importance ON conversation_cards(importance DESC);
CREATE INDEX IF NOT EXISTS idx_cards_session ON conversation_cards(session_id);
CREATE INDEX IF NOT EXISTS idx_cards_search ON conversation_cards USING GIN(search_vector);

-- ============================================
-- 2. CARD TAGS (Topic extraction)
-- ============================================
CREATE TABLE IF NOT EXISTS card_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES conversation_cards(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.00 CHECK (confidence >= 0 AND confidence <= 1),
    extracted_by TEXT DEFAULT 'auto' CHECK (extracted_by IN ('auto', 'manual', 'ai')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(card_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_tags_card ON card_tags(card_id);
CREATE INDEX IF NOT EXISTS idx_tags_tag ON card_tags(tag);
CREATE INDEX IF NOT EXISTS idx_tags_confidence ON card_tags(confidence DESC);

-- ============================================
-- 3. CONVERSATION SEGMENTS (Detailed pieces)
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID NOT NULL REFERENCES conversation_cards(id) ON DELETE CASCADE,
    
    -- Segment content
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ordering within the conversation
    sequence_order INTEGER NOT NULL DEFAULT 0,
    
    -- Optional metadata
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_segments_card ON conversation_segments(card_id);
CREATE INDEX IF NOT EXISTS idx_segments_order ON conversation_segments(card_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_segments_role ON conversation_segments(role);

-- ============================================
-- 4. TAG DEFINITIONS (Controlled vocabulary)
-- ============================================
CREATE TABLE IF NOT EXISTS tag_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6', -- Default blue
    category TEXT DEFAULT 'general',
    auto_extract_pattern TEXT, -- Optional regex pattern for auto-extraction
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tag_defs_tag ON tag_definitions(tag);
CREATE INDEX IF NOT EXISTS idx_tag_defs_category ON tag_definitions(category);

-- ============================================
-- 5. RELATED CARDS (Connections between cards)
-- ============================================
CREATE TABLE IF NOT EXISTS related_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_card_id UUID NOT NULL REFERENCES conversation_cards(id) ON DELETE CASCADE,
    target_card_id UUID NOT NULL REFERENCES conversation_cards(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'related' CHECK (relationship_type IN ('related', 'child', 'parent', 'reference', 'duplicate')),
    confidence DECIMAL(3,2) DEFAULT 1.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(source_card_id, target_card_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_related_source ON related_cards(source_card_id);
CREATE INDEX IF NOT EXISTS idx_related_target ON related_cards(target_card_id);

-- ============================================
-- 6. AUTO-GENERATION RULES (Configurable rules)
-- ============================================
CREATE TABLE IF NOT EXISTS auto_generation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Trigger conditions
    source_type TEXT NOT NULL CHECK (source_type IN ('chat', 'voice', 'email', 'document', 'web', 'any')),
    min_message_count INTEGER DEFAULT 3,
    min_content_length INTEGER DEFAULT 100,
    
    -- Processing config
    auto_summarize BOOLEAN DEFAULT true,
    auto_extract_tags BOOLEAN DEFAULT true,
    importance_boost INTEGER DEFAULT 0, -- Add to calculated importance
    
    -- Filters
    exclude_patterns TEXT[], -- Regex patterns to exclude
    require_patterns TEXT[], -- Regex patterns that must match
    
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. CARD GENERATION QUEUE (For async processing)
-- ============================================
CREATE TABLE IF NOT EXISTS card_generation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    session_id TEXT DEFAULT 'default',
    
    -- Raw data for processing
    raw_data JSONB NOT NULL,
    
    -- Processing state
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority INTEGER DEFAULT 5, -- 1 = highest, 10 = lowest
    
    -- Results
    card_id UUID REFERENCES conversation_cards(id),
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3
);

CREATE INDEX IF NOT EXISTS idx_queue_status ON card_generation_queue(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_queue_source ON card_generation_queue(source_type, source_id);

-- ============================================
-- TRIGGERS AND FUNCTIONS
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
DROP TRIGGER IF EXISTS update_conversation_cards_updated_at ON conversation_cards;
CREATE TRIGGER update_conversation_cards_updated_at
    BEFORE UPDATE ON conversation_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tag_definitions_updated_at ON tag_definitions;
CREATE TRIGGER update_tag_definitions_updated_at
    BEFORE UPDATE ON tag_definitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_auto_generation_rules_updated_at ON auto_generation_rules;
CREATE TRIGGER update_auto_generation_rules_updated_at
    BEFORE UPDATE ON auto_generation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update search vector for full-text search
CREATE OR REPLACE FUNCTION update_card_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.summary, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_search_vector ON conversation_cards;
CREATE TRIGGER update_search_vector
    BEFORE INSERT OR UPDATE ON conversation_cards
    FOR EACH ROW EXECUTE FUNCTION update_card_search_vector();

-- Update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tag_definitions 
        SET usage_count = usage_count + 1 
        WHERE tag = NEW.tag;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tag_definitions 
        SET usage_count = GREATEST(0, usage_count - 1) 
        WHERE tag = OLD.tag;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tag_count ON card_tags;
CREATE TRIGGER update_tag_count
    AFTER INSERT OR DELETE ON card_tags
    FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- ============================================
-- REALTIME ENABLEMENT
-- ============================================
ALTER TABLE conversation_cards REPLICA IDENTITY FULL;
ALTER TABLE card_tags REPLICA IDENTITY FULL;
ALTER TABLE conversation_segments REPLICA IDENTITY FULL;

-- ============================================
-- RLS POLICIES (Permissive for Phase 2)
-- ============================================
ALTER TABLE conversation_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE related_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_generation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_generation_queue ENABLE ROW LEVEL SECURITY;

-- Allow all operations (Phase 2: single-user local setup)
CREATE POLICY conversation_cards_all ON conversation_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY card_tags_all ON card_tags FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY conversation_segments_all ON conversation_segments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY tag_definitions_all ON tag_definitions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY related_cards_all ON related_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY auto_generation_rules_all ON auto_generation_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY card_generation_queue_all ON card_generation_queue FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SEED DATA: Default tags
-- ============================================
INSERT INTO tag_definitions (tag, description, color, category) VALUES
    ('idea', 'New ideas and concepts', '#10b981', 'content'), -- emerald
    ('task', 'Action items and todos', '#f59e0b', 'content'), -- amber
    ('decision', 'Important decisions made', '#ef4444', 'content'), -- red
    ('question', 'Questions that need answers', '#8b5cf6', 'content'), -- violet
    ('insight', 'Key insights and realizations', '#3b82f6', 'content'), -- blue
    ('planning', 'Planning and strategy discussions', '#06b6d4', 'content'), -- cyan
    ('coding', 'Programming and development', '#ec4899', 'content'), -- pink
    ('design', 'Design and UI/UX discussions', '#f97316', 'content'), -- orange
    ('research', 'Research and exploration', '#6366f1', 'content'), -- indigo
    ('meeting', 'Meeting notes and summaries', '#84cc16', 'content'), -- lime
    ('bug', 'Bugs and issues', '#dc2626', 'content'), -- red-600
    ('feature', 'Feature requests and ideas', '#22c55e', 'content'), -- green
    ('learning', 'Learning and skill development', '#14b8a6', 'content'), -- teal
    ('personal', 'Personal matters', '#a855f7', 'content'), -- purple
    ('work', 'Work-related discussions', '#0ea5e9', 'content') -- sky
ON CONFLICT (tag) DO NOTHING;

-- Seed default auto-generation rules
INSERT INTO auto_generation_rules (name, description, source_type, min_message_count, min_content_length, auto_summarize, auto_extract_tags)
VALUES 
    ('Chat Conversations', 'Automatically generate cards from chat conversations', 'chat', 3, 200, true, true),
    ('Voice Notes', 'Process voice transcripts into cards', 'voice', 1, 100, true, true)
ON CONFLICT DO NOTHING;
