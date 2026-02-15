#!/bin/bash
# apply-second-brain-migration.sh
# Applies the Second Brain schema migration to Supabase

set -e

SUPABASE_URL="${SUPABASE_URL:-https://uzrkdojntoljwmncfxrt.supabase.co}"
MIGRATION_FILE="supabase/migrations/001_second_brain_schema.sql"

echo "Applying Second Brain migration to: $SUPABASE_URL"

# Check if we have the service role key
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Error: SUPABASE_SERVICE_ROLE_KEY not set"
    echo "Please set it: export SUPABASE_SERVICE_ROLE_KEY=your_key_here"
    exit 1
fi

# Read the migration SQL
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

SQL=$(cat "$MIGRATION_FILE")

echo "Migration SQL loaded ($(echo "$SQL" | wc -c) bytes)"
echo ""
echo "To apply this migration, you have two options:"
echo ""
echo "Option 1: Supabase Dashboard (Recommended)"
echo "1. Go to https://supabase.com/dashboard"
echo "2. Select your project"
echo "3. Go to SQL Editor → New Query"
echo "4. Copy and paste the contents of:"
echo "   $MIGRATION_FILE"
echo "5. Click Run"
echo ""
echo "Option 2: psql (if you have direct DB access)"
echo "psql -h <host> -U postgres -d postgres -f $MIGRATION_FILE"
echo ""
echo "Migration file location:"
pwd
ls -la "$MIGRATION_FILE"
