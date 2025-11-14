/**
 * Manual scraper runner for testing
 *
 * Usage:
 *   npm run scrape           - Run all scrapers once
 *   npm run scrape:schedule  - Start scheduled scraper (daily at noon CST)
 */

import { getScheduler } from '../src/lib/scrapers/ScraperScheduler';

const args = process.argv.slice(2);
const mode = args[0] || 'once';

async function main() {
  const scheduler = getScheduler();

  if (mode === 'schedule') {
    console.log('🕐 Starting scheduled scraper service...');
    console.log('   Scrapers will run daily at 12:00 PM CST');
    console.log('   Press Ctrl+C to stop\n');
    scheduler.start();

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n👋 Shutting down scraper service...');
      process.exit(0);
    });
  } else {
    console.log('🧪 Running scrapers once (test mode)...\n');
    await scheduler.runNow();
    console.log('\n✅ Done! Scrapers completed.');
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
