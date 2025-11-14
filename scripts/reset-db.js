#!/usr/bin/env node

/**
 * CollisionPro - Database Reset Script
 * Drops all tables and recreates from scratch
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 CollisionPro Database Reset');
console.log('================================\n');

// Read the SQL file
const sqlPath = path.join(__dirname, '..', 'prisma', 'reset-and-setup.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

console.log('📄 SQL Script loaded');
console.log('📊 This will:');
console.log('   1. Drop all existing tables');
console.log('   2. Create fresh schema');
console.log('   3. Set up indexes');
console.log('   4. Configure RLS policies\n');

console.log('⚠️  MANUAL STEP REQUIRED:');
console.log('   1. Go to: https://supabase.com/dashboard/project/pkyqrvrxwhlwkxalsbaz/sql/new');
console.log('   2. Copy the SQL from: prisma/reset-and-setup.sql');
console.log('   3. Paste into Supabase SQL Editor');
console.log('   4. Click "Run" or press Ctrl+Enter\n');

console.log('📋 Or copy this SQL directly:\n');
console.log('─'.repeat(80));
console.log(sql);
console.log('─'.repeat(80));
console.log('\n✅ After running the SQL, your database will be ready!\n');
