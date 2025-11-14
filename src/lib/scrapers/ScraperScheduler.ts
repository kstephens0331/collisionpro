import cron from 'node-cron';
import { AutoZoneScraper } from './AutoZoneScraper';

/**
 * Scraper Scheduler - Runs scrapers daily at noon CST
 *
 * Cron format: minute hour day month dayOfWeek
 * Noon CST = 12:00 PM CST = 18:00 UTC (during standard time)
 * Noon CDT = 12:00 PM CDT = 17:00 UTC (during daylight saving)
 *
 * Using 17:00 UTC to handle daylight saving safely
 */

export class ScraperScheduler {
  private scrapers: any[] = [];
  private isRunning = false;

  constructor() {
    // Initialize scrapers
    this.scrapers = [
      new AutoZoneScraper(),
      // Add more scrapers as they're built:
      // new RockAutoScraper(),
      // new OreillyyScraper(),
      // new NAPAScraper(),
      // new LKQScraper(),
      // new PartsGeekScraper(),
    ];
  }

  /**
   * Start the scheduler - runs daily at noon CST
   */
  start() {
    console.log('🕐 Starting scraper scheduler...');
    console.log('📅 Scrapers will run daily at 12:00 PM CST (17:00 UTC)');

    // Schedule: Every day at 17:00 UTC (noon CST)
    cron.schedule('0 17 * * *', async () => {
      console.log('\n⏰ Scraper schedule triggered!');
      await this.runAllScrapers();
    });

    console.log('✅ Scheduler started successfully');
  }

  /**
   * Run all scrapers sequentially
   */
  async runAllScrapers() {
    if (this.isRunning) {
      console.log('⚠️  Scrapers already running, skipping this run');
      return;
    }

    this.isRunning = true;
    console.log(`\n🚀 Starting batch scrape of ${this.scrapers.length} suppliers...`);

    const startTime = Date.now();
    const results = [];

    for (const scraper of this.scrapers) {
      try {
        console.log(`\n--- Running ${scraper.supplierName} scraper ---`);

        // Run scraper with default search options
        // You can customize these based on what parts you want to scrape
        const result = await scraper.run({
          searchQuery: 'bumper cover',
          category: 'Body Parts',
        });

        results.push(result);

        // Wait 5 seconds between scrapers to avoid rate limiting
        await this.delay(5000);
      } catch (error: any) {
        console.error(`❌ Error running ${scraper.supplierName}:`, error.message);
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log('\n✅ Batch scrape complete!');
    console.log(`   Total duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`   Total parts scraped: ${results.reduce((sum, r) => sum + r.partsScraped, 0)}`);
    console.log(`   Total parts added: ${results.reduce((sum, r) => sum + r.partsAdded, 0)}`);
    console.log(`   Total parts updated: ${results.reduce((sum, r) => sum + r.partsUpdated, 0)}`);

    this.isRunning = false;
  }

  /**
   * Run scrapers immediately (for testing)
   */
  async runNow() {
    console.log('🧪 Running scrapers immediately (test mode)');
    await this.runAllScrapers();
  }

  /**
   * Helper: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let schedulerInstance: ScraperScheduler | null = null;

export function getScheduler(): ScraperScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new ScraperScheduler();
  }
  return schedulerInstance;
}
