const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVehicleModel() {
  console.log('Attempting to create test VehicleModel...\n');

  const makeId = 'make_toyota_1763618922783'; // Use existing Toyota make

  // Try with different column names
  const testColumns = [
    { modelName: 'Test1', year: 2020 },
    { model: 'Test2', year: 2020 },
    { name: 'Test3', year: 2020 },
  ];

  for (const testData of testColumns) {
    const id = `test_model_${Date.now()}`;
    console.log(`Trying with columns:`, Object.keys(testData).join(', '));

    const { data, error } = await supabase
      .from('VehicleModel')
      .insert({
        id,
        makeId,
        ...testData,
      })
      .select();

    if (error) {
      console.log(`  ❌ Error:`, error.message);
    } else {
      console.log(`  ✓ Success! Columns:`, Object.keys(data[0]).join(', '));
      console.log(`  Data:`, data[0]);

      // Clean up
      await supabase.from('VehicleModel').delete().eq('id', id);
      break;
    }
  }
}

checkVehicleModel();
