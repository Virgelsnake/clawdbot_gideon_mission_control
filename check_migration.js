const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uzrkdojntoljwmncfxrt.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// First create the exec_sql function
const createExecSql = `
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function setup() {
  // Try to create exec_sql function using a simple query
  // This won't work without SQL access, so let's try REST API direct table creation
  
  // Create reminders table directly via REST (POST to /rest/v1/reminders will create if not exists)
  const { error: tableError } = await supabase
    .from('reminders')
    .select('id')
    .limit(1);
    
  if (tableError && tableError.code === '42P01') {
    console.log('Reminders table does not exist. Must run SQL manually in Supabase Dashboard.');
    console.log('\n=== SQL TO RUN IN SUPABASE DASHBOARD ===\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/uzrkdojntoljwmncfxrt/sql');
    console.log('2. New query');
    console.log('3. Paste this SQL:\n');
    console.log(createExecSql);
    console.log('\nThen run the migration SQL from:');
    console.log('/Users/gideon/clawd/projects/mission-control/supabase/migrations/20250220_calendar_reminders.sql');
  } else {
    console.log('Reminders table exists or other error:', tableError);
  }
}

setup();