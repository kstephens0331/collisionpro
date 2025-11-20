const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  console.log('🚀 Creating DamageAnnotation table...\n');

  try {
    // Simple approach: Just execute the CREATE TABLE statement
    const sql = `
      CREATE TABLE IF NOT EXISTS "DamageAnnotation" (
        "id" TEXT PRIMARY KEY,
        "estimateId" TEXT NOT NULL,
        "vehicleType" TEXT NOT NULL DEFAULT 'sedan',
        "markers" JSONB NOT NULL DEFAULT '[]'::jsonb,
        "cameraPosition" JSONB,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS "DamageAnnotation_estimateId_idx"
        ON "DamageAnnotation"("estimateId");

      CREATE INDEX IF NOT EXISTS "DamageAnnotation_createdAt_idx"
        ON "DamageAnnotation"("createdAt");
    `;

    console.log('✅ Table creation SQL ready!');
    console.log('\n📋 Please run this in your Supabase SQL Editor:\n');
    console.log('1. Go to: https://app.supabase.com/project/YOUR_PROJECT/sql');
    console.log('2. Copy and paste the following SQL:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('\n3. Click "Run"\n');

    // Try to verify table exists via a simple query
    console.log('Checking if table already exists...');
    const { data, error } = await supabase
      .from('DamageAnnotation')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️  Table does not exist yet - please run the SQL above');
      } else {
        console.log('⚠️  Error checking table:', error.message);
      }
    } else {
      console.log('✅ Table already exists! You can start using the 3D damage viewer.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTable();
