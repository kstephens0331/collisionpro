import { BaseScraper, ScrapedPart } from './BaseScraper';
import puppeteer from 'puppeteer';

export class AutoZoneScraper extends BaseScraper {
  constructor() {
    super('sup_autozone', 'AutoZone', 'AUTOZONE');
  }

  /**
   * Scrape parts from AutoZone
   *
   * Example: Scrape front bumpers for 2020 Honda Civic
   */
  async scrape(options: {
    searchQuery?: string;
    make?: string;
    model?: string;
    year?: number;
    category?: string;
  } = {}): Promise<ScrapedPart[]> {
    const parts: ScrapedPart[] = [];

    // Default search if no options provided
    const searchQuery = options.searchQuery || 'bumper cover';
    const year = options.year || 2020;
    const make = options.make || 'Honda';
    const model = options.model || 'Civic';

    console.log(`🔍 AutoZone: Searching for ${searchQuery} - ${year} ${make} ${model}`);

    try {
      const browser = await puppeteer.launch({
        headless: true, // Headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled', // Hide automation
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-web-security',
          '--window-size=1920,1080',
        ],
      });

      const page = await browser.newPage();

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Set realistic user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Remove webdriver flag
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });

      // Add realistic navigator properties
      await page.evaluateOnNewDocument(() => {
        // @ts-ignore
        window.navigator.chrome = {
          runtime: {},
        };
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
      });

      // Set extra headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Referer': 'https://www.google.com/',
      });

      // Build search URL for AutoZone
      // Format: https://www.autozone.com/search?searchText=bumper+cover&year=2020&make=Honda&model=Civic
      const baseUrl = 'https://www.autozone.com/search';
      const params = new URLSearchParams({
        searchText: searchQuery,
        year: year.toString(),
        make: make,
        model: model,
      });

      const url = `${baseUrl}?${params}`;
      console.log(`📍 Navigating to: ${url}`);

      // Random delay before loading (human-like)
      await this.randomDelay(1000, 3000);

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // Random scroll (human-like behavior)
      await page.evaluate(() => {
        window.scrollTo(0, Math.floor(Math.random() * 500));
      });
      await this.randomDelay(500, 1500);

      // Wait for page to fully load
      await this.randomDelay(5000, 5000);

      // Try multiple selectors
      const selectors = [
        '[data-testid="product-card"]',
        '.product-card',
        '.search-result-item',
        '[class*="ProductCard"]',
        '[class*="product"]',
      ];

      let foundSelector = null;
      for (const selector of selectors) {
        const count = await page.$$eval(selector, els => els.length);
        if (count > 0) {
          foundSelector = selector;
          console.log(`✅ Found ${count} products using selector: ${selector}`);
          break;
        }
      }

      if (!foundSelector) {
        console.log('⚠️  No products found with any selector');

        // Save HTML for debugging
        const html = await page.content();
        console.log('First 500 chars of HTML:', html.substring(0, 500));
      }

      // Extract product data
      const productData = await page.evaluate(() => {
        const products: any[] = [];

        // Try multiple selectors for AutoZone's product cards
        const productCards = document.querySelectorAll(
          '[data-testid="product-card"], .product-card, .search-result-item, .product-item'
        );

        productCards.forEach((card) => {
          try {
            // Extract product name
            const nameEl = card.querySelector('[data-testid="product-name"], .product-name, .product-title, h3, h4');
            const name = nameEl?.textContent?.trim() || '';

            // Extract part number
            const partNumEl = card.querySelector('[data-testid="part-number"], .part-number, .sku');
            const partNumber = partNumEl?.textContent?.trim().replace(/[^0-9A-Z-]/gi, '') || '';

            // Extract price
            const priceEl = card.querySelector('[data-testid="product-price"], .price, .product-price');
            const priceText = priceEl?.textContent?.trim() || '0';

            // Extract list price (crossed out)
            const listPriceEl = card.querySelector('.price-strike, .original-price, .was-price');
            const listPriceText = listPriceEl?.textContent?.trim() || '';

            // Extract image
            const imgEl = card.querySelector('img');
            const image = imgEl?.src || imgEl?.getAttribute('data-src') || '';

            // Extract product URL
            const linkEl = card.querySelector('a[href*="/p/"]');
            const productUrl = linkEl?.getAttribute('href') || '';

            // Extract stock status
            const stockEl = card.querySelector('[data-testid="stock-status"], .stock-status, .availability');
            const stockText = stockEl?.textContent?.trim().toLowerCase() || '';
            const inStock = !stockText.includes('out of stock') && !stockText.includes('unavailable');

            if (name && partNumber && priceText !== '0') {
              products.push({
                name,
                partNumber,
                priceText,
                listPriceText,
                image,
                productUrl,
                inStock,
              });
            }
          } catch (err) {
            console.error('Error extracting product:', err);
          }
        });

        return products;
      });

      console.log(`✅ Found ${productData.length} products on page`);

      // Transform to ScrapedPart format
      for (const product of productData) {
        const part: ScrapedPart = {
          partNumber: product.partNumber,
          supplierPartNumber: product.partNumber,
          name: this.cleanText(product.name),
          description: `${product.name} for ${year} ${make} ${model}`,
          category: options.category || 'Body Parts',
          images: product.image ? [product.image] : [],
          price: this.extractPrice(product.priceText),
          listPrice: product.listPriceText ? this.extractPrice(product.listPriceText) : undefined,
          inStock: product.inStock,
          leadTimeDays: product.inStock ? 1 : 5,
          warranty: '1 Year',
          condition: 'new',
          productUrl: product.productUrl.startsWith('http')
            ? product.productUrl
            : `https://www.autozone.com${product.productUrl}`,
          make,
          model,
          yearStart: year,
          yearEnd: year,
        };

        parts.push(part);
      }

      await browser.close();
    } catch (error: any) {
      this.errors.push(`AutoZone scrape failed: ${error.message}`);
      console.error('❌ AutoZone scraper error:', error);
    }

    return parts;
  }

  /**
   * Random delay to mimic human behavior
   */
  private randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}
