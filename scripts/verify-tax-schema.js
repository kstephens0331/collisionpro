require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySchema() {
  console.log('🔍 Verifying Tax Calculation Schema\n');

  // Check Estimate table columns
  const { data: estimateColumns, error: estimateError } = await supabase
    .from('Estimate')
    .select('*')
    .limit(1);

  if (estimateError) {
    console.error('❌ Error querying Estimate table:', estimateError.message);
  } else {
    console.log('✅ Estimate table accessible');
    if (estimateColumns.length > 0) {
      const columns = Object.keys(estimateColumns[0]);
      const taxColumns = columns.filter(col =>
        ['subtotal', 'taxRate', 'taxAmount', 'shopSupplies', 'environmentalFees', 'grandTotal'].includes(col)
      );
      console.log('   Tax-related columns:', taxColumns.length > 0 ? taxColumns.join(', ') : 'None found');
    }
  }

  // Check ShopTaxSettings table
  const { data: taxSettings, error: taxError } = await supabase
    .from('ShopTaxSettings')
    .select('*')
    .limit(1);

  if (taxError) {
    console.log('\n⚠️  ShopTaxSettings table not accessible:', taxError.message);
    console.log('   This table may need to be created manually.');
  } else {
    console.log('\n✅ ShopTaxSettings table exists');
    if (taxSettings.length > 0) {
      console.log('   Found', taxSettings.length, 'tax setting(s)');
    } else {
      console.log('   Table is empty (expected for new installation)');
    }
  }

  console.log('\n✅ Schema verification complete');
}

verifySchema().catch(console.error);
