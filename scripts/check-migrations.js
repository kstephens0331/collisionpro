const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  const tablesToCheck = [
    'EstimateAnnotation',
    'EstimateVideo',
    'WorkflowTemplate',
    'Notification',
    'InventoryItem',
    'InventoryTransaction',
    'StockAlert',
    'PurchaseOrder',
  ];

  console.log('Checking which Phase 3 & 4 tables exist...\n');

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log(`❌ ${table} - NOT FOUND (needs migration)`);
        } else {
          console.log(`⚠️  ${table} - Error: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table} - EXISTS`);
      }
    } catch (err) {
      console.log(`⚠️  ${table} - Error: ${err.message}`);
    }
  }

  console.log('\n--- Summary ---');
  console.log('If any tables show ❌, you need to run those migrations.');
}

checkTables();
