const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Migrations to run in order
const migrations = [
  {
    name: 'Phase 3.1 - Photo Annotations',
    file: 'migrations/phase-3/3.1-photo-annotations.sql',
    checkTable: 'EstimateAnnotation',
  },
  {
    name: 'Phase 3.2 - Video Walkthroughs',
    file: 'migrations/phase-3/3.2-video-walkthroughs.sql',
    checkTable: 'EstimateVideo',
  },
  {
    name: 'Phase 3.3 - Automated Workflows',
    file: 'migrations/phase-3/3.3-automated-workflows.sql',
    checkTable: 'WorkflowTemplate',
  },
  {
    name: 'Phase 4.2 - Inventory Management',
    file: 'migrations/phase-4/4.2-inventory-management.sql',
    checkTable: 'InventoryItem',
  },
  {
    name: 'Phase 6.1 - Insurance DRP Integration',
    file: 'migrations/phase-6/6.1-insurance-fields.sql',
    checkTable: 'InsuranceSubmission',
  },
  {
    name: 'Phase 7.1 - Supplement Patterns',
    file: 'migrations/phase-7/7.1-supplement-patterns.sql',
    checkTable: 'SupplementPattern',
  },
  {
    name: 'Phase 8.1 - 3D Damage Annotations',
    file: 'migrations/phase-8/8.1-damage-annotations.sql',
    checkTable: 'DamageAnnotation',
  },
  {
    name: 'Phase 8.2 - 3D Analytics',
    file: 'migrations/phase-8/8.2-analytics.sql',
    checkTable: 'Analytics3DViewer',
  },
];

async function tableExists(tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        return false;
      }
      // Schema cache errors mean table doesn't exist yet
      if (error.message.includes('Could not find')) {
        return false;
      }
      return true;
    }
    return true;
  } catch (err) {
    return false;
  }
}

async function checkMigrations() {
  console.log('\n🔍 Checking Migration Status...\n');
  console.log('='.repeat(70));

  const results = [];

  for (const migration of migrations) {
    const exists = await tableExists(migration.checkTable);
    const filePath = path.join(__dirname, '..', migration.file);
    const fileExists = fs.existsSync(filePath);

    results.push({
      ...migration,
      tableExists: exists,
      fileExists,
      status: exists ? 'SKIP' : fileExists ? 'RUN' : 'ERROR',
    });

    const statusIcon = exists ? '✅ SKIP' : fileExists ? '⚠️  RUN' : '❌ ERROR';
    console.log(`${statusIcon} | ${migration.name}`);
    console.log(`         Table: "${migration.checkTable}" ${exists ? 'exists' : 'missing'}`);
    console.log(`         File:  ${migration.file} ${fileExists ? '✓' : '✗ NOT FOUND'}`);
    console.log('-'.repeat(70));
  }

  return results;
}

async function printMigrationInstructions(results) {
  const needMigration = results.filter((r) => r.status === 'RUN');

  if (needMigration.length === 0) {
    console.log('\n✅ All migrations already complete! Nothing to do.\n');
    return;
  }

  console.log('\n📋 MIGRATION INSTRUCTIONS');
  console.log('='.repeat(70));
  console.log(`\n${needMigration.length} migration(s) need to be run.\n`);
  console.log('Choose ONE of these methods:\n');

  // Method 1: Supabase SQL Editor (Recommended)
  console.log('─'.repeat(70));
  console.log('METHOD 1: Supabase SQL Editor (Recommended - Safest)');
  console.log('─'.repeat(70));
  console.log('\n1. Open your browser to: https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to: SQL Editor (left sidebar)');
  console.log('4. For each migration below:\n');

  for (let i = 0; i < needMigration.length; i++) {
    const m = needMigration[i];
    console.log(`   ${i + 1}. Click "New Query"`);
    console.log(`      Copy all contents from: ${m.file}`);
    console.log(`      Paste into SQL Editor`);
    console.log(`      Click "Run" button`);
    console.log(`      ✓ Verify success (no errors)\n`);
  }

  // Method 2: psql command line
  console.log('\n' + '─'.repeat(70));
  console.log('METHOD 2: psql Command Line (Advanced)');
  console.log('─'.repeat(70));
  console.log('\n1. Get your DATABASE_URL from Supabase:');
  console.log('   Dashboard > Project Settings > Database > Connection string');
  console.log('\n2. Run these commands:\n');

  for (const m of needMigration) {
    console.log(`   psql $DATABASE_URL -f "${m.file}"`);
  }

  // Method 3: Copy SQL to clipboard
  console.log('\n\n' + '─'.repeat(70));
  console.log('METHOD 3: Combined SQL (Copy & Paste Once)');
  console.log('─'.repeat(70));
  console.log('\nCombined SQL for all migrations:');
  console.log('(Copy everything between the markers and paste into Supabase SQL Editor)\n');
  console.log('▼'.repeat(70));

  for (const m of needMigration) {
    const filePath = path.join(__dirname, '..', m.file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`\n-- ${m.name}`);
    console.log(`-- File: ${m.file}`);
    console.log(`-- Creates: ${m.checkTable} table\n`);
    console.log(sql);
    console.log('\n');
  }

  console.log('▲'.repeat(70));
  console.log('\n✅ After running migrations, verify with:');
  console.log('   node scripts/check-migrations.js\n');
}

async function main() {
  console.log('\n🚀 CollisionPro Migration Manager');
  console.log('='.repeat(70));

  const results = await checkMigrations();
  await printMigrationInstructions(results);

  const needMigration = results.filter((r) => r.status === 'RUN');
  const allComplete = results.filter((r) => r.status === 'SKIP');

  console.log('\n📊 Summary:');
  console.log(`   ✅ Already complete: ${allComplete.length}`);
  console.log(`   ⚠️  Need to run: ${needMigration.length}`);

  if (needMigration.length === 0) {
    console.log('\n🎉 All set! Next steps:');
    console.log('   1. Set up Twilio (add TWILIO_* to .env.local)');
    console.log('   2. Create Supabase "videos" storage bucket');
    console.log('   3. Deploy to production');
    console.log('   4. Start onboarding shops! 🚀\n');
  }

  console.log('='.repeat(70));
  console.log('');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
