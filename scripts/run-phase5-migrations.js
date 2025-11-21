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

async function runPhase5Migrations() {
  console.log('\n🚀 Starting Phase 5 (Sprint 3) Migrations\n');
  console.log('Phase 5: Workflow & Operations');
  console.log('- Technician Management');
  console.log('- DRP Integration');
  console.log('- Job Tracking\n');

  const migrationsDir = path.join(__dirname, '..', 'migrations', 'phase-5');

  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Phase 5 migrations directory not found');
    process.exit(1);
  }

  // Migration files in order
  const migrations = [
    {
      file: '5.1-technician-management.sql',
      description: '5.1 - Technician Management (Skills, Certifications, Assignments)',
      checkTable: 'Technician'
    },
    {
      file: '5.2-drp-integration.sql',
      description: '5.2 - DRP Integration (Insurance Partners, Compliance)',
      checkTable: 'InsuranceCarrier'
    },
    {
      file: '5.3-job-tracking.sql',
      description: '5.3 - Job Tracking (Kanban Workflow, Bottleneck Detection)',
      checkTable: 'WorkflowStage'
    }
  ];

  // Check which migrations are already applied
  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration.file);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Migration file not found: ${migration.file}`);
      continue;
    }

    const tableExists = await checkTableExists(migration.checkTable);

    if (tableExists) {
      console.log(`✅ ${migration.description} - Already applied`);
    } else {
      await runMigrationFile(filePath, migration.description);
    }
  }

  console.log('\n✨ Phase 5 migrations completed!\n');
  console.log('Next steps:');
  console.log('1. Run: node scripts/run-accounting-migration.js');
  console.log('2. Test technician management at /dashboard/technicians');
  console.log('3. Test DRP features at /dashboard/drp');
  console.log('4. Test job tracking at /dashboard/jobs\n');
}

runPhase5Migrations().catch(err => {
  console.error('\n❌ Migration error:', err.message);
  process.exit(1);
});
