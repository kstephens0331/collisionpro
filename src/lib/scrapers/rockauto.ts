/**
 * RockAuto Parts Scraper - Proof of Concept
 *
 * This scraper demonstrates the ability to fetch parts data from RockAuto
 * for use in CollisionPro's parts catalog feature.
 *
 * Note: For production use, you should:
 * 1. Apply for PartsTech API access (preferred)
 * 2. Respect rate limits and robots.txt
 * 3. Cache results to minimize requests
 */

export interface RockAutoPart {
  partNumber: string;
  manufacturer: string;
  description: string;
  price: number;
  listPrice?: number;
  category: string;
  subCategory?: string;
  fitment: string[];
  imageUrl?: string;
  inStock: boolean;
  warranty?: string;
}

export interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  engine?: string;
}

export interface PartSearchResult {
  parts: RockAutoPart[];
  totalCount: number;
  searchQuery: string;
  vehicle?: VehicleInfo;
}

// RockAuto URL structure
// https://www.rockauto.com/en/catalog/[make],[year],[model],[engine]/[category]/[part]

/**
 * Generate RockAuto catalog URL for a vehicle
 */
export function generateCatalogUrl(vehicle: VehicleInfo, category?: string): string {
  const baseUrl = 'https://www.rockauto.com/en/catalog';
  const makeSlug = vehicle.make.toLowerCase().replace(/\s+/g, ',');
  const modelSlug = vehicle.model.toLowerCase().replace(/\s+/g, ',');

  let url = `${baseUrl}/${makeSlug},${vehicle.year},${modelSlug}`;

  if (vehicle.engine) {
    url += `,${vehicle.engine.toLowerCase().replace(/\s+/g, ',')}`;
  }

  if (category) {
    url += `/${category.toLowerCase().replace(/\s+/g, '+')}`;
  }

  return url;
}

/**
 * Parse HTML response to extract parts data
 * This is a simplified parser - production would need more robust parsing
 */
export function parsePartsFromHtml(html: string): RockAutoPart[] {
  const parts: RockAutoPart[] = [];

  // Simple regex patterns to extract part info
  // In production, use a proper HTML parser like cheerio

  // Pattern for part listings
  const partBlockRegex = /<tr[^>]*class="[^"]*listing-row[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const partMatches = html.matchAll(partBlockRegex);

  for (const match of partMatches) {
    const block = match[1];

    // Extract part number
    const partNumMatch = block.match(/data-part-number="([^"]+)"/);
    const partNumber = partNumMatch ? partNumMatch[1] : '';

    // Extract manufacturer
    const mfgMatch = block.match(/class="[^"]*listing-brand[^"]*"[^>]*>([^<]+)/i);
    const manufacturer = mfgMatch ? mfgMatch[1].trim() : 'Unknown';

    // Extract description
    const descMatch = block.match(/class="[^"]*listing-text[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
    const description = descMatch
      ? descMatch[1].replace(/<[^>]+>/g, '').trim()
      : '';

    // Extract price
    const priceMatch = block.match(/\$([0-9]+\.?[0-9]*)/);
    const price = priceMatch ? parseFloat(priceMatch[1]) : 0;

    // Extract list price if available
    const listPriceMatch = block.match(/class="[^"]*list-price[^"]*"[^>]*>\$([0-9]+\.?[0-9]*)/i);
    const listPrice = listPriceMatch ? parseFloat(listPriceMatch[1]) : undefined;

    // Check stock status
    const inStock = !block.includes('out of stock') && !block.includes('backorder');

    if (partNumber) {
      parts.push({
        partNumber,
        manufacturer,
        description,
        price,
        listPrice,
        category: '',
        fitment: [],
        inStock,
      });
    }
  }

  return parts;
}

/**
 * Scrape parts for a specific vehicle and category
 */
export async function scrapeRockAutoParts(
  vehicle: VehicleInfo,
  category: string
): Promise<PartSearchResult> {
  const url = generateCatalogUrl(vehicle, category);

  try {
    // Note: In production, use a proper scraping solution with:
    // - Proxy rotation
    // - Rate limiting
    // - User-Agent rotation
    // - Request caching

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const parts = parsePartsFromHtml(html);

    return {
      parts,
      totalCount: parts.length,
      searchQuery: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${category}`,
      vehicle,
    };
  } catch (error) {
    console.error('RockAuto scrape error:', error);
    return {
      parts: [],
      totalCount: 0,
      searchQuery: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${category}`,
      vehicle,
    };
  }
}

/**
 * Common body panel categories for collision repair
 */
export const COLLISION_CATEGORIES = {
  BUMPERS: 'bumper',
  FENDERS: 'fender',
  HOODS: 'hood',
  DOORS: 'door',
  MIRRORS: 'mirror',
  HEADLIGHTS: 'headlight',
  TAILLIGHTS: 'tail+light',
  GRILLES: 'grille',
  RADIATOR_SUPPORT: 'radiator+support',
  QUARTER_PANELS: 'quarter+panel',
};

/**
 * Search for parts by keyword
 */
export async function searchPartsByKeyword(
  keyword: string,
  vehicle?: VehicleInfo
): Promise<PartSearchResult> {
  const baseUrl = 'https://www.rockauto.com/en/partsearch/';
  const searchUrl = `${baseUrl}?partnum=${encodeURIComponent(keyword)}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const parts = parsePartsFromHtml(html);

    return {
      parts,
      totalCount: parts.length,
      searchQuery: keyword,
      vehicle,
    };
  } catch (error) {
    console.error('RockAuto search error:', error);
    return {
      parts: [],
      totalCount: 0,
      searchQuery: keyword,
      vehicle,
    };
  }
}

/**
 * Demo function to show scraper capabilities
 */
export async function demoScraper(): Promise<void> {
  console.log('=== RockAuto Scraper Demo ===\n');

  const vehicle: VehicleInfo = {
    year: 2020,
    make: 'Toyota',
    model: 'Camry',
  };

  console.log(`Searching for bumper parts for ${vehicle.year} ${vehicle.make} ${vehicle.model}...\n`);

  const results = await scrapeRockAutoParts(vehicle, COLLISION_CATEGORIES.BUMPERS);

  console.log(`Found ${results.totalCount} parts:\n`);

  results.parts.slice(0, 5).forEach((part, i) => {
    console.log(`${i + 1}. ${part.manufacturer} - ${part.partNumber}`);
    console.log(`   ${part.description}`);
    console.log(`   Price: $${part.price.toFixed(2)}${part.listPrice ? ` (List: $${part.listPrice.toFixed(2)})` : ''}`);
    console.log(`   In Stock: ${part.inStock ? 'Yes' : 'No'}\n`);
  });
}

export default {
  scrapeRockAutoParts,
  searchPartsByKeyword,
  generateCatalogUrl,
  parsePartsFromHtml,
  COLLISION_CATEGORIES,
  demoScraper,
};
