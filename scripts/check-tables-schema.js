const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('Checking table schemas...\n');

  // Try to query VehicleMake
  console.log('VehicleMake table:');
  const { data: makes, error: makeError } = await supabase
    .from('VehicleMake')
    .select('*')
    .limit(1);

  if (makeError) {
    console.log('  Error:', makeError.message);
  } else {
    console.log('  Sample row:', makes[0] || 'No data');
    if (makes[0]) {
      console.log('  Columns:', Object.keys(makes[0]).join(', '));
    }
  }

  // Try to query VehicleModel
  console.log('\nVehicleModel table:');
  const { data: models, error: modelError } = await supabase
    .from('VehicleModel')
    .select('*')
    .limit(1);

  if (modelError) {
    console.log('  Error:', modelError.message);
  } else {
    console.log('  Sample row:', models[0] || 'No data');
    if (models[0]) {
      console.log('  Columns:', Object.keys(models[0]).join(', '));
    }
  }

  // Try to query AftermarketPart
  console.log('\nAftermarketPart table:');
  const { data: parts, error: partError } = await supabase
    .from('AftermarketPart')
    .select('*')
    .limit(1);

  if (partError) {
    console.log('  Error:', partError.message);
  } else {
    console.log('  Sample row:', parts[0] || 'No data');
    if (parts[0]) {
      console.log('  Columns:', Object.keys(parts[0]).join(', '));
    }
  }
}

checkSchema();
