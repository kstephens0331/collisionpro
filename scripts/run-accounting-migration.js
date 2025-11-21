const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('id')
    .limit(1);

  return !error;
}

async function runMigrationFile(filePath, description) {
  console.log(`\n📄 Running: ${description}`);

  const sql = fs.readFileSync(filePath, 'utf8');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`   Executing ${statements.length} SQL statements...`);

  let successCount = 0;
  let errorCount = 0;

  for (const statement of statements) {
    try {
      // Use Supabase's query method for direct SQL execution
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Some errors are expected (like "already exists"), so we'll continue
        if (!error.message.includes('already exists') &&
            !error.message.includes('does not exist')) {
          console.error(`   ⚠️  Warning: ${error.message}`);
          errorCount++;
        }
      } else {
        successCount++;
      }
    } catch (err) {
      // Silently handle errors - tables may already exist
      if (!err.message?.includes('already exists')) {
        console.error(`   ⚠️  Error: ${err.message}`);
        errorCount++;
      }
    }
  }

  console.log(`   ✅ Completed (${successCount} successful, ${errorCount} warnings)`);
}

async function verifyAccountingTables() {
  console.log('\n🔍 Verifying accounting tables...\n');

  const tables = [
    'Account',
    'JournalEntry',
    'JournalEntryLine',
    'AccountingPeriod',
    'Budget'
  ];

  let allExist = true;

  for (const table of tables) {
    const exists = await checkTableExists(table);
    if (exists) {
      console.log(`   ✅ ${table} table exists`);
    } else {
      console.log(`   ❌ ${table} table missing`);
      allExist = false;
    }
  }

  return allExist;
}

async function countAccounts() {
  const { data, error, count } = await supabase
    .from('Account')
    .select('*', { count: 'exact', head: true });

  if (!error) {
    console.log(`\n📊 Found ${count} accounts in chart of accounts`);

    if (count > 0) {
      // Get breakdown by type
      const types = ['asset', 'liability', 'equity', 'revenue', 'expense'];

      for (const type of types) {
        const { count: typeCount } = await supabase
          .from('Account')
          .select('*', { count: 'exact', head: true })
          .eq('accountType', type);

        console.log(`   - ${type.charAt(0).toUpperCase() + type.slice(1)}s: ${typeCount}`);
      }
    }
  }
}

async function runAccountingMigration() {
  console.log('\n🚀 Starting Phase 6 (Sprint 4) Accounting Migration\n');
  console.log('Phase 6: Integrated Accounting System');
  console.log('- Chart of Accounts (60+ default accounts)');
  console.log('- Journal Entries (Double-entry bookkeeping)');
  console.log('- Financial Statements (P&L, Balance Sheet)');
  console.log('- Budget Tracking\n');

  const migrationsDir = path.join(__dirname, '..', 'migrations', 'phase-6');

  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Phase 6 migrations directory not found');
    process.exit(1);
  }

  const filePath = path.join(migrationsDir, '6.1-integrated-accounting.sql');

  if (!fs.existsSync(filePath)) {
    console.error('❌ Accounting migration file not found');
    process.exit(1);
  }

  // Check if already applied
  const accountTableExists = await checkTableExists('Account');

  if (accountTableExists) {
    console.log('✅ Accounting migration already applied - Account table exists\n');

    // Verify all tables and show stats
    const allExist = await verifyAccountingTables();

    if (allExist) {
      await countAccounts();
      console.log('\n✨ Accounting system is fully set up!\n');
      console.log('Access at: /dashboard/accounting');
      console.log('Features:');
      console.log('- Chart of Accounts management');
      console.log('- Create journal entries');
      console.log('- View Balance Sheet & P&L');
      console.log('- Track budgets\n');
      return;
    }
  }

  // Run the migration
  await runMigrationFile(
    filePath,
    '6.1 - Integrated Accounting (Chart of Accounts, Journal Entries, Financial Reports)'
  );

  // Verify installation
  const verified = await verifyAccountingTables();

  if (verified) {
    await countAccounts();
    console.log('\n✨ Accounting migration completed successfully!\n');
    console.log('Next steps:');
    console.log('1. Visit /dashboard/accounting');
    console.log('2. Review the chart of accounts');
    console.log('3. Create your first journal entry');
    console.log('4. Generate financial reports\n');
  } else {
    console.error('\n❌ Some tables are missing. Please check the migration errors above.\n');
  }
}

runAccountingMigration().catch(err => {
  console.error('\n❌ Migration error:', err.message);
  process.exit(1);
});
