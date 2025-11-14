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
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      // Set realistic user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

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

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for product listings to load
      await page.waitForSelector('[data-testid="product-card"], .product-card, .search-result-item', {
        timeout: 10000,
      }).catch(() => {
        console.log('⚠️  No products found or different page structure');
      });

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
}
