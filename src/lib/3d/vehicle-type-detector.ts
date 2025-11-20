/**
 * Auto-detect vehicle type from make/model for 3D visualization
 */

export type VehicleType = 'sedan' | 'suv' | 'truck' | 'coupe';

/**
 * Detect vehicle type from make and model
 */
export function getVehicleType(make: string, model: string): VehicleType {
  const makeLower = make.toLowerCase();
  const modelLower = model.toLowerCase();

  // Trucks - Most specific patterns first
  const truckPatterns = [
    'f-150', 'f-250', 'f-350', 'f-450', // Ford
    'silverado', 'colorado', // Chevy
    'sierra', // GMC
    'ram 1500', 'ram 2500', 'ram 3500', // Ram
    'tundra', 'tacoma', // Toyota
    'titan', 'frontier', // Nissan
    'ranger', // Ford
    'gladiator', // Jeep
    'ridgeline', // Honda
    'canyon', // GMC
    'pickup', 'truck',
  ];

  // SUVs/Crossovers
  const suvPatterns = [
    'explorer', 'expedition', 'bronco', 'escape', 'edge', // Ford
    'tahoe', 'suburban', 'traverse', 'equinox', 'blazer', 'trailblazer', // Chevy
    'yukon', 'acadia', 'terrain', // GMC
    '4runner', 'highlander', 'rav4', 'sequoia', 'land cruiser', // Toyota
    'pathfinder', 'armada', 'rogue', 'murano', // Nissan
    'pilot', 'cr-v', 'hr-v', 'passport', // Honda
    'grand cherokee', 'cherokee', 'wrangler', 'compass', // Jeep
    'explorer', 'aviator', 'nautilus', 'navigator', // Lincoln
    'escalade', // Cadillac
    'durango', // Dodge
    'sorento', 'sportage', 'telluride', // Kia
    'santa fe', 'tucson', 'palisade', // Hyundai
    'cx-5', 'cx-9', 'cx-30', 'cx-50', // Mazda
    'outback', 'forester', 'ascent', 'crosstrek', // Subaru
    'xt4', 'xt5', 'xt6', // Cadillac
    'q5', 'q7', 'q8', // Audi
    'x3', 'x5', 'x7', // BMW
    'glc', 'gle', 'gls', // Mercedes
    'suv', 'crossover',
  ];

  // Coupes/Sports Cars
  const coupePatterns = [
    'mustang', 'gt', // Ford
    'camaro', 'corvette', // Chevy
    'challenger', 'charger srt', // Dodge (Charger SRT is coupe-like)
    '370z', '350z', 'gt-r', // Nissan
    'supra', '86', // Toyota
    'brz', // Subaru
    'miata', 'mx-5', 'rx-7', 'rx-8', // Mazda
    'genesis coupe', // Hyundai
    's2000', 'civic si', // Honda
    'coupe', 'sports', 'roadster', 'convertible',
  ];

  // Check truck patterns
  for (const pattern of truckPatterns) {
    if (modelLower.includes(pattern)) {
      return 'truck';
    }
  }

  // Check SUV patterns
  for (const pattern of suvPatterns) {
    if (modelLower.includes(pattern)) {
      return 'suv';
    }
  }

  // Check coupe patterns
  for (const pattern of coupePatterns) {
    if (modelLower.includes(pattern)) {
      return 'coupe';
    }
  }

  // Make-specific defaults
  if (makeLower === 'ford' && modelLower.startsWith('f-')) {
    return 'truck';
  }

  if (makeLower === 'jeep') {
    return 'suv';
  }

  if (makeLower === 'tesla') {
    // Model X is SUV, Model S/3/Y are sedans
    if (modelLower.includes('model x')) {
      return 'suv';
    }
    return 'sedan';
  }

  // Default to sedan for cars
  return 'sedan';
}

/**
 * Get human-readable label for vehicle type
 */
export function getVehicleTypeLabel(type: VehicleType): string {
  const labels: Record<VehicleType, string> = {
    sedan: 'Sedan',
    suv: 'SUV/Crossover',
    truck: 'Pickup Truck',
    coupe: 'Coupe/Sports Car',
  };
  return labels[type];
}

/**
 * Get icon for vehicle type (for UI display)
 */
export function getVehicleTypeIcon(type: VehicleType): string {
  const icons: Record<VehicleType, string> = {
    sedan: '🚗',
    suv: '🚙',
    truck: '🛻',
    coupe: '🏎️',
  };
  return icons[type];
}
