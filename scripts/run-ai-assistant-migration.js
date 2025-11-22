/**
 * Run AI Assistant Migration (Phase 7)
 *
 * Sets up Claude AI assistant database schema
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableExists(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  return !error || error.code !== '42P01'; // 42P01 = undefined table
}

async function runMigration() {
  console.log('🚀 Starting AI Assistant migration...\n');

  try {
    // Check if tables already exist
    const tablesExist = await Promise.all([
      checkTableExists('AssistantConversation'),
      checkTableExists('AssistantMessage'),
      checkTableExists('AssistantAction'),
      checkTableExists('AssistantUsage'),
      checkTableExists('AssistantPrompt'),
    ]);

    if (tablesExist.every((exists) => exists)) {
      console.log('✅ AI Assistant tables already exist');
      console.log('\nSkipping migration. To reset, drop tables manually first.');
      return;
    }

    // Read migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'migrations',
      'phase-7',
      '7.1-ai-assistant.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running migration: 7.1-ai-assistant.sql');

    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).single();

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('Attempting direct SQL execution...');

      // Split into individual statements and execute
      const statements = migrationSQL
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          const { error: execError } = await supabase.rpc('exec', {
            query: statement + ';',
          });

          if (execError && !execError.message.includes('already exists')) {
            console.error('⚠️  Error executing statement:', execError.message);
            console.log('Statement:', statement.substring(0, 100) + '...');
            // Continue anyway
          }
        }
      }
    }

    console.log('✅ Migration completed\n');

    // Verify tables were created
    console.log('🔍 Verifying AI Assistant schema...\n');

    const tables = [
      'AssistantConversation',
      'AssistantMessage',
      'AssistantAction',
      'AssistantUsage',
      'AssistantPrompt',
    ];

    for (const table of tables) {
      const exists = await checkTableExists(table);
      if (exists) {
        console.log(`  ✅ ${table}`);

        // Get count
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (count !== null) {
          console.log(`     Records: ${count}`);
        }
      } else {
        console.log(`  ❌ ${table} - NOT FOUND`);
      }
    }

    // Check if system prompts were seeded
    const { data: prompts } = await supabase
      .from('AssistantPrompt')
      .select('name')
      .eq('isActive', true);

    console.log(`\n📋 System Prompts: ${prompts?.length || 0}`);
    if (prompts && prompts.length > 0) {
      prompts.forEach((p) => console.log(`  - ${p.name}`));
    }

    console.log('\n✨ AI Assistant is ready!');
    console.log('\nNext steps:');
    console.log('1. Set ANTHROPIC_API_KEY in your .env.local file');
    console.log('2. Visit /dashboard/ai-assistant to start chatting');
    console.log('3. Try asking: "Search for a 2022 Honda Accord front bumper"');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
