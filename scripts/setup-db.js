#!/usr/bin/env node

/**
 * Database Setup Script for CollisionPro
 * Run this after deployment to initialize the database
 */

const { execSync } = require('child_process');

console.log('🚀 CollisionPro Database Setup');
console.log('================================\n');

try {
  console.log('📦 Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('\n📊 Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });

  console.log('\n✅ Database setup complete!');
  console.log('\nNext steps:');
  console.log('1. Visit your application');
  console.log('2. Register a new shop account');
  console.log('3. Start using CollisionPro!');

} catch (error) {
  console.error('\n❌ Database setup failed:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Check your DATABASE_URL is correct');
  console.log('2. Verify Supabase database is running');
  console.log('3. Ensure network connectivity to Supabase');
  process.exit(1);
}
