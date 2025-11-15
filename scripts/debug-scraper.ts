/**
 * Debug scraper - saves HTML to see actual page structure
 */
import puppeteer from 'puppeteer';
import fs from 'fs';

async function debugAutoZone() {
  console.log('🔍 Debugging AutoZone page structure...\n');

  const browser = await puppeteer.launch({
    headless: false, // Show browser
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set realistic user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  const url = 'https://www.autozone.com/search?searchText=bumper+cover&year=2020&make=Honda&model=Civic';
  console.log(`📍 Loading: ${url}\n`);

  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait a bit for JavaScript to render
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Save HTML
  const html = await page.content();
  fs.writeFileSync('autozone-page.html', html);
  console.log('✅ Saved HTML to: autozone-page.html');

  // Take screenshot
  await page.screenshot({ path: 'autozone-screenshot.png', fullPage: true });
  console.log('✅ Saved screenshot to: autozone-screenshot.png');

  // Check for common selectors
  const selectors = [
    '[data-testid="product-card"]',
    '.product-card',
    '.search-result-item',
    '.product-item',
    '[class*="product"]',
    '[class*="item"]',
  ];

  console.log('\n🔎 Checking selectors:');
  for (const selector of selectors) {
    const count = await page.$$eval(selector, els => els.length);
    if (count > 0) {
      console.log(`   ✅ ${selector}: ${count} elements found`);
    }
  }

  console.log('\n👀 Browser is open - inspect the page manually');
  console.log('Press Ctrl+C when done');

  // Keep browser open
  await new Promise(() => {});
}

debugAutoZone().catch(console.error);
