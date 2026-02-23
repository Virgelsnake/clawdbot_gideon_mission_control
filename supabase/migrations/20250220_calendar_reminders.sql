-- Migration: Calendar Reminders Feature
-- Date: 2026-02-20
-- Author: DATA (AI With Agency)
-- Purpose: Add reminders table and calendar functionality to Mission Control

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. REMINDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign key relationships (polymorphic via type + id)
    -- A reminder can be linked to a task, an idea, or be standalone
    linked_type VARCHAR(20) NOT NULL CHECK (linked_type IN ('task', 'idea', 'custom')),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
    
    -- Reminder details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Timing (due_date for calendar view, reminder_time for notification)
    due_date DATE,                                    -- Calendar date
    due_time TIME WITHOUT TIME ZONE,                  -- Optional specific time
    reminder_at TIMESTAMP WITH TIME ZONE,             -- When to send notification
    timezone VARCHAR(50) DEFAULT 'Europe/London',     -- User's timezone
    
    -- Recurrence support (future-proofing)
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(50),                   -- 'daily', 'weekly', 'monthly', 'custom'
    recurrence_end_date DATE,                         -- When recurrence stops
    parent_reminder_id UUID REFERENCES reminders(id) ON DELETE CASCADE,  -- For recurring instances
    
    -- Status tracking
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE,
    is_snoozed BOOLEAN DEFAULT FALSE,
    snoozed_until TIMESTAMP WITH TIME ZONE,
    
    -- Priority and categorization
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Assignment
    assignee VARCHAR(100),                            -- Who this reminder is for
    
    -- Metadata
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_linked_record CHECK (
        (linked_type = 'task' AND task_id IS NOT NULL AND idea_id IS NULL) OR
        (linked_type = 'idea' AND idea_id IS NOT NULL AND task_id IS NULL) OR
        (linked_type = 'custom' AND task_id IS NULL AND idea_id IS NULL)
    ),
    CONSTRAINT valid_reminder_time CHECK (
        reminder_at IS NULL OR due_date IS NULL OR 
        reminder_at::date <= due_date + INTERVAL '1 day'
    )
);

-- ============================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================

-- Primary lookup indexes
CREATE INDEX idx_reminders_task_id ON reminders(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_reminders_idea_id ON reminders(idea_id) WHERE idea_id IS NOT NULL;
CREATE INDEX idx_reminders_linked_type ON reminders(linked_type);

-- Calendar view indexes
CREATE INDEX idx_reminders_due_date ON reminders(due_date);
CREATE INDEX idx_reminders_reminder_at ON reminders(reminder_at);

-- Status filtering indexes
CREATE INDEX idx_reminders_is_sent ON reminders(is_sent) WHERE is_sent = FALSE;
CREATE INDEX idx_reminders_assignee ON reminders(assignee);
CREATE INDEX idx_reminders_priority ON reminders(priority);

-- Composite index for upcoming reminders query
CREATE INDEX idx_reminders_upcoming ON reminders(reminder_at, is_sent, is_snoozed) 
    WHERE is_sent = FALSE AND (is_snoozed = FALSE OR snoozed_until <= NOW());

-- Recurrence indexes
CREATE INDEX idx_reminders_recurring ON reminders(is_recurring) WHERE is_recurring = TRUE;
CREATE INDEX idx_reminders_parent ON reminders(parent_reminder_id) WHERE parent_reminder_id IS NOT NULL;

-- ============================================
-- 3. TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reminders_updated_at
    BEFORE UPDATE ON reminders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. CALENDAR EVENTS VIEW
-- ============================================
-- Combines tasks, ideas, and reminders into a unified calendar view

CREATE OR REPLACE VIEW calendar_events AS

-- Task events (from tasks with due dates)
SELECT 
    t.id::text AS event_id,
    'task' AS event_type,
    t.title,
    t.description,
    t.due_date,
    NULL::time WITHOUT TIME ZONE AS due_time,
    t.priority,
    t.column_status AS status,
    t.labels,
    t.assignee,
    t.created_at,
    t.updated_at,
    NULL::timestamp WITH TIME ZONE AS reminder_at,
    FALSE AS has_reminder,
    'task:' || t.id::text AS source_ref
FROM tasks t
WHERE t.due_date IS NOT NULL

UNION ALL

-- Idea events (from ideas with target dates - using created_at + priority-based target)
SELECT 
    i.id::text AS event_id,
    'idea' AS event_type,
    'IDEA: ' || SUBSTRING(i.content, 1, 100) AS title,
    i.content AS description,
    i.created_at::date + 
        CASE 
            WHEN i.priority = 'urgent' THEN INTERVAL '7 days'
            WHEN i.priority = 'high' THEN INTERVAL '14 days'
            WHEN i.priority = 'medium' THEN INTERVAL '30 days'
            ELSE INTERVAL '60 days'
        END AS due_date,
    NULL::time WITHOUT TIME ZONE AS due_time,
    i.priority,
    CASE WHEN i.archived THEN 'archived' ELSE 'active' END AS status,
    i.labels,
    NULL AS assignee,
    i.created_at,
    i.updated_at,
    NULL::timestamp WITH TIME ZONE AS reminder_at,
    FALSE AS has_reminder,
    'idea:' || i.id::text AS source_ref
FROM ideas i
WHERE i.archived = FALSE

UNION ALL

-- Reminder events (standalone and linked)
SELECT 
    r.id::text AS event_id,
    'reminder' AS event_type,
    r.title,
    r.description,
    r.due_date,
    r.due_time,
    r.priority,
    CASE 
        WHEN r.is_sent THEN 'completed'
        WHEN r.is_snoozed THEN 'snoozed'
        ELSE 'pending'
    END AS status,
    NULL AS labels,
    r.assignee,
    r.created_at,
    r.updated_at,
    r.reminder_at,
    TRUE AS has_reminder,
    'reminder:' || r.id::text AS source_ref
FROM reminders r;

-- ============================================
-- 5. FUNCTIONS
-- ============================================

-- Function: Get upcoming reminders
-- Returns reminders that need to be sent (not sent, not snoozed, or snooze expired)
CREATE OR REPLACE FUNCTION get_upcoming_reminders(
    p_limit INTEGER DEFAULT 50,
    p_assignee VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    reminder_at TIMESTAMP WITH TIME ZONE,
    due_date DATE,
    priority VARCHAR(10),
    linked_type VARCHAR(20),
    task_id UUID,
    idea_id UUID,
    assignee VARCHAR(100),
    minutes_until INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.title,
        r.description,
        r.reminder_at,
        r.due_date,
        r.priority,
        r.linked_type,
        r.task_id,
        r.idea_id,
        r.assignee,
        EXTRACT(EPOCH FROM (r.reminder_at - NOW()))::INTEGER / 60 AS minutes_until
    FROM reminders r
    WHERE r.is_sent = FALSE
      AND (
          r.is_snoozed = FALSE 
          OR r.snoozed_until <= NOW()
      )
      AND r.reminder_at <= NOW() + INTERVAL '24 hours'
      AND (p_assignee IS NULL OR r.assignee = p_assignee)
    ORDER BY r.reminder_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Mark reminder as sent
-- Updates reminder status and records sent timestamp
CREATE OR REPLACE FUNCTION mark_reminder_sent(
    p_reminder_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE reminders
    SET 
        is_sent = TRUE,
        sent_at = NOW(),
        is_snoozed = FALSE,
        snoozed_until = NULL
    WHERE id = p_reminder_id
      AND is_sent = FALSE;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    
    -- Handle recurring reminders: create next instance if applicable
    IF v_updated > 0 THEN
        PERFORM create_next_recurring_instance(p_reminder_id);
    END IF;
    
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Snooze a reminder
-- Marks reminder as snoozed until specified time
CREATE OR REPLACE FUNCTION snooze_reminder(
    p_reminder_id UUID,
    p_snooze_until TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE reminders
    SET 
        is_snoozed = TRUE,
        snoozed_until = p_snooze_until
    WHERE id = p_reminder_id
      AND is_sent = FALSE;
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql;

-- Function: Create next recurring instance
-- Internal function to generate next occurrence of a recurring reminder
CREATE OR REPLACE FUNCTION create_next_recurring_instance(
    p_parent_reminder_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_parent reminders%ROWTYPE;
    v_next_date DATE;
    v_next_reminder TIMESTAMP WITH TIME ZONE;
    v_new_id UUID;
BEGIN
    -- Get parent reminder details
    SELECT * INTO v_parent
    FROM reminders
    WHERE id = p_parent_reminder_id;
    
    -- Exit if not recurring or past end date
    IF NOT v_parent.is_recurring THEN
        RETURN NULL;
    END IF;
    
    IF v_parent.recurrence_end_date IS NOT NULL 
       AND v_parent.due_date >= v_parent.recurrence_end_date THEN
        RETURN NULL;
    END IF;
    
    -- Calculate next occurrence
    v_next_date := CASE v_parent.recurrence_pattern
        WHEN 'daily' THEN v_parent.due_date + INTERVAL '1 day'
        WHEN 'weekly' THEN v_parent.due_date + INTERVAL '1 week'
        WHEN 'monthly' THEN v_parent.due_date + INTERVAL '1 month'
        ELSE v_parent.due_date + INTERVAL '1 week'  -- default
    END;
    
    -- Calculate next reminder time (preserve time difference)
    IF v_parent.reminder_at IS NOT NULL THEN
        v_next_reminder := v_parent.reminder_at + (v_next_date - v_parent.due_date);
    END IF;
    
    -- Create new instance
    INSERT INTO reminders (
        linked_type,
        task_id,
        idea_id,
        title,
        description,
        due_date,
        due_time,
        reminder_at,
        timezone,
        is_recurring,
        recurrence_pattern,
        recurrence_end_date,
        parent_reminder_id,
        priority,
        assignee,
        created_by
    ) VALUES (
        v_parent.linked_type,
        v_parent.task_id,
        v_parent.idea_id,
        v_parent.title,
        v_parent.description,
        v_next_date,
        v_parent.due_time,
        v_next_reminder,
        v_parent.timezone,
        TRUE,
        v_parent.recurrence_pattern,
        v_parent.recurrence_end_date,
        COALESCE(v_parent.parent_reminder_id, p_parent_reminder_id),
        v_parent.priority,
        v_parent.assignee,
        v_parent.created_by
    )
    RETURNING id INTO v_new_id;
    
    RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get calendar events for date range
-- Optimized function for calendar view queries
CREATE OR REPLACE FUNCTION get_calendar_events(
    p_start_date DATE,
    p_end_date DATE,
    p_assignee VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    event_id TEXT,
    event_type VARCHAR(20),
    title VARCHAR(255),
    description TEXT,
    event_date DATE,
    event_time TIME WITHOUT TIME ZONE,
    priority VARCHAR(10),
    status VARCHAR(50),
    labels JSONB,
    assignee VARCHAR(100),
    has_reminder BOOLEAN,
    source_ref TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.event_id,
        ce.event_type,
        ce.title,
        ce.description,
        ce.due_date AS event_date,
        ce.due_time AS event_time,
        ce.priority,
        ce.status,
        ce.labels,
        ce.assignee,
        ce.has_reminder,
        ce.source_ref
    FROM calendar_events ce
    WHERE ce.due_date BETWEEN p_start_date AND p_end_date
      AND (p_assignee IS NULL OR ce.assignee = p_assignee)
    ORDER BY ce.due_date ASC, ce.due_time ASC NULLS LAST, ce.priority DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- 6. REAL-TIME SUBSCRIPTION SETUP
-- ============================================

-- Enable real-time for reminders table
ALTER TABLE reminders REPLICA IDENTITY FULL;

-- Note: In Supabase, run this in the SQL editor or Dashboard:
-- BEGIN;
--   -- Enable realtime for reminders
--   INSERT INTO supabase_realtime.publication_tables (publication_id, table_id)
--   SELECT pub.id, tbl.id
--   FROM pg_publication pub
--   CROSS JOIN pg_class tbl
--   WHERE pub.pubname = 'supabase_realtime'
--   AND tbl.relname = 'reminders';
-- COMMIT;

-- Alternative: Use supabase CLI or Dashboard to enable realtime on reminders table

-- ============================================
-- 7. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE reminders IS 'Calendar reminders linked to tasks, ideas, or standalone events';
COMMENT ON COLUMN reminders.linked_type IS 'Type of linked record: task, idea, or custom (standalone)';
COMMENT ON COLUMN reminders.reminder_at IS 'Timestamp when notification should be sent';
COMMENT ON COLUMN reminders.is_recurring IS 'Whether this reminder repeats';
COMMENT ON COLUMN reminders.parent_reminder_id IS 'Reference to original reminder for recurring instances';

COMMENT ON VIEW calendar_events IS 'Unified calendar view combining tasks, ideas, and reminders';

COMMENT ON FUNCTION get_upcoming_reminders IS 'Returns reminders needing notification within next 24 hours';
COMMENT ON FUNCTION mark_reminder_sent IS 'Marks a reminder as sent and creates next recurring instance if applicable';
COMMENT ON FUNCTION get_calendar_events IS 'Returns calendar events for a date range with optional assignee filter';

-- ============================================
-- 8. SAMPLE DATA (Optional - comment out for production)
-- ============================================

-- Uncomment to add sample reminders for testing:
/*
INSERT INTO reminders (title, description, linked_type, due_date, reminder_at, priority, created_by)
VALUES 
    ('Review Q1 decommissioning report', 'Check documentation before submission', 'custom', '2026-03-01', '2026-03-01 09:00:00+00', 'high', 'gideon'),
    ('Team standup', 'Weekly sync with operations team', 'custom', '2026-02-24', '2026-02-24 08:30:00+00', 'medium', 'gideon');
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
