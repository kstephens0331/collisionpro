import { AutoZoneScraper } from '../src/lib/scrapers/AutoZoneScraper';

async function testScraper() {
  console.log('🔍 Testing AutoZone Scraper...\n');

  const scraper = new AutoZoneScraper();

  try {
    // Test with Honda Civic bumper
    console.log('Searching for: 2020 Honda Civic front bumper\n');

    const parts = await scraper.scrape({
      searchQuery: 'front bumper',
      make: 'Honda',
      model: 'Civic',
      year: 2020,
    });

    console.log(`\n✅ Found ${parts.length} parts!\n`);

    // Display first 5 parts
    parts.slice(0, 5).forEach((part, index) => {
      console.log(`--- Part ${index + 1} ---`);
      console.log(`Name: ${part.name}`);
      console.log(`Part Number: ${part.partNumber}`);
      console.log(`Price: $${part.price.toFixed(2)}`);
      console.log(`In Stock: ${part.inStock ? 'Yes' : 'No'}`);
      console.log(`Condition: ${part.condition}`);
      console.log(`Images: ${part.images.length} image(s)`);
      console.log(`URL: ${part.productUrl}`);
      console.log('');
    });

    if (parts.length > 5) {
      console.log(`... and ${parts.length - 5} more parts\n`);
    }

    // Summary
    const newParts = parts.filter(p => p.condition === 'new');
    const inStock = parts.filter(p => p.inStock);
    const avgPrice = parts.reduce((sum, p) => sum + p.price, 0) / parts.length;

    console.log('📊 Summary:');
    console.log(`Total parts found: ${parts.length}`);
    console.log(`New condition: ${newParts.length}`);
    console.log(`In stock: ${inStock.length}`);
    console.log(`Average price: $${avgPrice.toFixed(2)}`);
    console.log(`Price range: $${Math.min(...parts.map(p => p.price)).toFixed(2)} - $${Math.max(...parts.map(p => p.price)).toFixed(2)}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

testScraper();
