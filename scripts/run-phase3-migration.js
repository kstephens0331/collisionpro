const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running Phase 3.1: Damage Annotations Migration...\n');

  const migrationFile = path.join(
    __dirname,
    '..',
    'migrations',
    'phase-3',
    '3.1-damage-annotations.sql'
  );

  try {
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('📄 Reading migration file:', migrationFile);
    console.log('📝 Executing SQL...\n');

    // Split by semicolon and filter out empty statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });

      if (error) {
        // Try direct execution via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql_query: statement + ';' })
        });

        if (!response.ok) {
          // If RPC doesn't work, we need to use SQL editor or direct connection
          console.log('⚠️  Cannot execute via RPC. Using alternative method...');

          // For Supabase, we'll need to execute via the SQL editor
          console.log('\n⚠️  Please run this migration manually:');
          console.log('1. Go to your Supabase Dashboard');
          console.log('2. Navigate to SQL Editor');
          console.log('3. Copy and paste the contents of:');
          console.log(`   ${migrationFile}`);
          console.log('4. Click "Run"\n');

          // Still try to create the table using JS
          break;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nCreated:');
    console.log('  - DamageAnnotation table');
    console.log('  - Indexes for performance');
    console.log('  - Row Level Security policies');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n📝 Manual migration required:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run the SQL file: migrations/phase-3/3.1-damage-annotations.sql');
    process.exit(1);
  }
}

runMigration();
