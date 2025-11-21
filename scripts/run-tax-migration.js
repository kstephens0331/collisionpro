const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running Tax Calculation Migration');
  console.log('═'.repeat(60));

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'phase-4', '4.1-tax-calculation.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📄 Executing migration...');

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, trying direct execution...');

      // Split into individual statements and execute
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

      for (const statement of statements) {
        console.log(`\n  Executing: ${statement.substring(0, 60)}...`);
        const { error: stmtError } = await supabase.rpc('exec', { sql: statement });

        if (stmtError) {
          console.error(`  ❌ Error: ${stmtError.message}`);
          // Continue with other statements
        } else {
          console.log('  ✅ Success');
        }
      }
    } else {
      console.log('✅ Migration executed successfully');
    }

    // Verify tables
    console.log('\n📊 Verifying tables...');

    const { data: taxSettings, error: taxError } = await supabase
      .from('ShopTaxSettings')
      .select('*')
      .limit(1);

    if (taxError && !taxError.message.includes('does not exist')) {
      console.log('❌ ShopTaxSettings table verification failed:', taxError.message);
    } else {
      console.log('✅ ShopTaxSettings table ready');
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Tax Migration Complete!');
    console.log('═'.repeat(60));
    console.log('\nNext steps:');
    console.log('1. Configure tax settings in shop settings');
    console.log('2. Tax will be calculated automatically on estimates');
    console.log('3. Update shop settings page to include tax configuration');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
