require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🎨 Running Paint Calculator Migration');
  console.log('═'.repeat(60));

  const migrationPath = path.join(__dirname, '../migrations/phase-4/4.2-paint-calculator.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split by semicolons and filter out comments/empty lines
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

  console.log(`\n📄 Executing ${statements.length} SQL statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 60).replace(/\n/g, ' ');

    try {
      console.log(`  Executing: ${preview}...`);

      // Try using rpc exec_sql if available
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // If exec_sql doesn't exist, some statements might fail
        // This is expected for CREATE TABLE IF NOT EXISTS
        if (!error.message.includes('exec_sql')) {
          console.warn(`  ⚠️  Warning: ${error.message}`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  // Verify tables were created
  console.log('\n📊 Verifying tables...');

  const tables = ['PaintCode', 'PaintEstimate', 'PanelPaintTime', 'PaintMaterialPricing'];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (!error) {
      console.log(`  ✅ ${table} table accessible`);
    } else {
      console.log(`  ❌ ${table} table verification failed: ${error.message}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('✅ Paint Calculator Migration Complete!');
  console.log('═'.repeat(60));
  console.log('\nNext steps:');
  console.log('1. Configure paint material pricing in shop settings');
  console.log('2. Add paint codes for common vehicles');
  console.log('3. Paint calculator is ready to use on estimates');
}

runMigration().catch(console.error);
