const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://uzrkdojntoljwmncfxrt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sql = fs.readFileSync('/tmp/calendar_migration.sql', 'utf8');

// Split SQL into statements and execute one by one
const statements = sql.split(';').filter(s => s.trim());

async function runMigration() {
  for (const stmt of statements) {
    if (!stmt.trim()) continue;
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      if (error) {
        console.log('Statement error (may be OK if object already exists):', error.message);
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
  console.log('Migration attempt complete');
}

runMigration();