/**
 * Extract supplement patterns from historical data
 * Run this script to initialize the pattern database
 *
 * Usage: node scripts/extract-supplement-patterns.js
 */

const https = require('https');

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function extractPatterns() {
  console.log('🔍 Extracting supplement patterns from historical data...');
  console.log(`API URL: ${API_URL}`);

  try {
    const url = `${API_URL}/api/supplements/patterns`;

    console.log(`Making POST request to: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Pattern extraction complete!');
      console.log(`📊 Patterns created: ${result.data.patternsCreated}`);
      console.log(`🔄 Patterns updated: ${result.data.patternsUpdated}`);
      console.log(`\n${result.data.message}`);

      if (result.data.patternsCreated === 0 && result.data.patternsUpdated === 0) {
        console.log('\n💡 No patterns found. This is normal if:');
        console.log('   - You have no approved supplements yet');
        console.log('   - This is a fresh installation');
        console.log('   - Patterns will be created as supplements are approved');
      }
    } else {
      console.error('❌ Pattern extraction failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error extracting patterns:', error.message);
    console.error('\n💡 Make sure:');
    console.error('   1. The application is running (npm run dev)');
    console.error('   2. Database is accessible');
    console.error('   3. Environment variables are set correctly');
    process.exit(1);
  }
}

// Run the extraction
extractPatterns();
