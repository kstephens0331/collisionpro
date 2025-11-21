require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createShopTaxSettingsTable() {
  console.log('🏗️  Creating ShopTaxSettings Table\n');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS "ShopTaxSettings" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "shopId" TEXT NOT NULL,
      "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0,
      "taxableParts" BOOLEAN DEFAULT true,
      "taxableLabor" BOOLEAN DEFAULT false,
      "shopSuppliesRate" DECIMAL(5,4) DEFAULT 0.05,
      "environmentalFeeAmount" DECIMAL(10,2) DEFAULT 0,
      "state" TEXT,
      "county" TEXT,
      "city" TEXT,
      "zipCode" TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "updatedAt" TIMESTAMP DEFAULT NOW(),
      UNIQUE("shopId"),
      CONSTRAINT fk_shop FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE
    );
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

  if (error) {
    console.log('⚠️  Direct table creation failed, trying alternative method...');
    console.log('   Error:', error.message);
    console.log('\n📋 Please create the table manually in Supabase Dashboard:');
    console.log('   Table name: ShopTaxSettings');
    console.log('   Columns:');
    console.log('   - id (text, primary key)');
    console.log('   - shopId (text, unique, foreign key to Shop.id)');
    console.log('   - taxRate (numeric, default 0)');
    console.log('   - taxableParts (boolean, default true)');
    console.log('   - taxableLabor (boolean, default false)');
    console.log('   - shopSuppliesRate (numeric, default 0.05)');
    console.log('   - environmentalFeeAmount (numeric, default 0)');
    console.log('   - state (text, nullable)');
    console.log('   - county (text, nullable)');
    console.log('   - city (text, nullable)');
    console.log('   - zipCode (text, nullable)');
    console.log('   - createdAt (timestamp, default now())');
    console.log('   - updatedAt (timestamp, default now())');
  } else {
    console.log('✅ ShopTaxSettings table created successfully!');
  }

  // Verify
  const { data: testQuery, error: testError } = await supabase
    .from('ShopTaxSettings')
    .select('*')
    .limit(1);

  if (!testError) {
    console.log('\n✅ Table is accessible and ready to use');
  }
}

createShopTaxSettingsTable().catch(console.error);
