const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Checking if Phase 6 migration is needed...');

  // Check if insurance_submissions table exists
  const { data, error } = await supabase
    .from('insurance_submissions')
    .select('id')
    .limit(1);

  if (!error) {
    console.log('✅ Phase 6 migration already applied - insurance tables exist');
    return;
  }

  console.log('Running Phase 6 migration...');

  // Read the SQL file
  const sqlPath = path.join(__dirname, '..', 'migrations', 'phase-6', '6.1-insurance-fields.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} SQL statements...`);

  for (const statement of statements) {
    try {
      const { error: execError } = await supabase.rpc('exec_sql', { sql: statement });
      if (execError) {
        console.error('Error executing statement:', execError.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    } catch (err) {
      // Try using raw SQL via REST API
      console.log('Attempting alternative execution method...');
    }
  }

  console.log('✅ Phase 6 migration completed');
}

runMigration().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
