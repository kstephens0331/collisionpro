/**
 * VIN Decoder using NHTSA vPIC API (FREE)
 * Decodes VIN to get vehicle details
 */

interface VINDecodeResponse {
  Count: number;
  Message: string;
  SearchCriteria: string;
  Results: Array<{
    Variable: string;
    Value: string | null;
    ValueId: string | null;
    VariableId: number;
  }>;
}

export interface VehicleDetails {
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  bodyStyle: string | null;
  engineSize: string | null;
  engineCylinders: string | null;
  fuelType: string | null;
  driveType: string | null;
  transmission: string | null;
  color: string | null;
  mileage: number | null;
}

/**
 * Decode VIN using NHTSA vPIC API
 */
export async function decodeVIN(vin: string): Promise<{
  success: boolean;
  data?: VehicleDetails;
  error?: string;
}> {
  try {
    // Validate VIN format (17 characters, alphanumeric, no I, O, Q)
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
    if (!vinRegex.test(vin)) {
      return {
        success: false,
        error: 'Invalid VIN format. VIN must be 17 characters (no I, O, or Q).',
      };
    }

    // Call NHTSA vPIC API
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`;
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: 'Failed to decode VIN. Please try again.',
      };
    }

    const data: VINDecodeResponse = await response.json();

    // Extract vehicle details from response
    const getValue = (variableName: string): string | null => {
      const result = data.Results.find((r) => r.Variable === variableName);
      return result?.Value || null;
    };

    const vehicleDetails: VehicleDetails = {
      year: getValue('Model Year') ? parseInt(getValue('Model Year')!) : null,
      make: getValue('Make'),
      model: getValue('Model'),
      trim: getValue('Trim') || getValue('Series'),
      bodyStyle: getValue('Body Class'),
      engineSize: getValue('Displacement (L)'),
      engineCylinders: getValue('Engine Number of Cylinders'),
      fuelType: getValue('Fuel Type - Primary'),
      driveType: getValue('Drive Type'),
      transmission: getValue('Transmission Style'),
      color: null, // NHTSA API doesn't provide color
      mileage: null, // NHTSA API doesn't provide mileage
    };

    // Check if we got valid data
    if (!vehicleDetails.year || !vehicleDetails.make || !vehicleDetails.model) {
      return {
        success: false,
        error: 'Could not decode VIN. Please verify the VIN is correct.',
      };
    }

    return {
      success: true,
      data: vehicleDetails,
    };
  } catch (error: any) {
    console.error('VIN decode error:', error);
    return {
      success: false,
      error: 'Failed to decode VIN. Please try again.',
    };
  }
}

/**
 * Validate VIN format without decoding
 */
export function validateVIN(vin: string): boolean {
  const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/i;
  return vinRegex.test(vin);
}

/**
 * Calculate VIN check digit (for validation)
 */
export function calculateVINCheckDigit(vin: string): string | null {
  if (vin.length !== 17) return null;

  const transliterationMap: { [key: string]: number } = {
    A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
    J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
    S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
    '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  };

  const weights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = vin[i].toUpperCase();
    const value = transliterationMap[char];
    if (value === undefined) return null;
    sum += value * weights[i];
  }

  const checkDigit = sum % 11;
  return checkDigit === 10 ? 'X' : checkDigit.toString();
}

/**
 * Verify VIN check digit
 */
export function verifyVINCheckDigit(vin: string): boolean {
  if (vin.length !== 17) return false;
  const calculatedCheckDigit = calculateVINCheckDigit(vin);
  const actualCheckDigit = vin[8].toUpperCase();
  return calculatedCheckDigit === actualCheckDigit;
}
