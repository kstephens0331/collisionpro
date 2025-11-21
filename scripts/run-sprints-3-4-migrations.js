const { execSync } = require('child_process');

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║  CollisionPro - Sprint 3 & 4 Database Migrations          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('This will set up:');
console.log('✨ Sprint 3: Workflow & Operations');
console.log('   - Technician Management');
console.log('   - DRP (Direct Repair Programs)');
console.log('   - Job Tracking with Kanban\n');
console.log('✨ Sprint 4: Integrated Accounting');
console.log('   - Chart of Accounts (60+ accounts)');
console.log('   - Double-entry bookkeeping');
console.log('   - Financial statements\n');

console.log('═══════════════════════════════════════════════════════════\n');

try {
  // Run Phase 5 (Sprint 3) migrations
  console.log('📦 Running Sprint 3 migrations...\n');
  execSync('node scripts/run-phase5-migrations.js', { stdio: 'inherit' });

  console.log('\n═══════════════════════════════════════════════════════════\n');

  // Run Phase 6 (Sprint 4) accounting migration
  console.log('📦 Running Sprint 4 accounting migration...\n');
  execSync('node scripts/run-accounting-migration.js', { stdio: 'inherit' });

  console.log('\n═══════════════════════════════════════════════════════════\n');
  console.log('✅ ALL MIGRATIONS COMPLETED SUCCESSFULLY!\n');
  console.log('Your CollisionPro instance now has:');
  console.log('✓ Technician management with certifications');
  console.log('✓ DRP partner tracking and compliance');
  console.log('✓ Job workflow with Kanban board');
  console.log('✓ Full accounting system with financial reports\n');
  console.log('Next: Start the dev server and visit:');
  console.log('  • /dashboard/technicians');
  console.log('  • /dashboard/drp');
  console.log('  • /dashboard/jobs');
  console.log('  • /dashboard/accounting\n');

} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}
