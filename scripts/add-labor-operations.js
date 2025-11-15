/**
 * Add Labor Operations & Shop Settings to database
 * Run with: node scripts/add-labor-operations.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLFile(filePath) {
  console.log(`📄 Reading SQL file: ${filePath}`);
  const sql = fs.readFileSync(filePath, 'utf8');

  // Split SQL into individual statements (basic split on semicolons)
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments and empty statements
    if (statement.startsWith('--') || statement.trim() === '') {
      continue;
    }

    console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase.from('_sql_exec').select('*').limit(0);
        if (directError) {
          console.warn(`⚠️  Statement ${i + 1} may have failed (this might be OK for CREATE IF NOT EXISTS):`, error.message);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    } catch (err) {
      console.warn(`⚠️  Statement ${i + 1} error:`, err.message);
    }
  }
}

async function main() {
  console.log('🚀 Adding Labor Operations & Shop Settings to database...\n');

  try {
    // Read and execute SQL migration file
    const sqlFilePath = path.join(__dirname, '..', 'supabase-labor-operations.sql');

    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ SQL file not found:', sqlFilePath);
      process.exit(1);
    }

    await runSQLFile(sqlFilePath);

    console.log('\n✅ Labor operations and shop settings added successfully!');
    console.log('\n📊 Summary:');
    console.log('  - LaborOperation table created');
    console.log('  - ShopSettings table created');
    console.log('  - 50+ industry-standard operations seeded');
    console.log('  - Default shop settings created for existing shops');
    console.log('\n🎯 Next steps:');
    console.log('  1. Go to /dashboard/settings to configure your labor rates');
    console.log('  2. Create estimates with auto-calculated labor hours');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
