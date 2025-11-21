/**
 * Tax Calculation Library
 *
 * Handles sales tax, shop supplies, and environmental fees
 * for collision repair estimates.
 */

export interface TaxSettings {
  taxRate: number; // e.g., 0.0825 for 8.25%
  taxableParts: boolean;
  taxableLabor: boolean;
  shopSuppliesRate: number; // e.g., 0.05 for 5%
  environmentalFeeAmount: number;
  state?: string;
  county?: string;
  city?: string;
  zipCode?: string;
}

export interface EstimateTotals {
  partsSubtotal: number;
  laborSubtotal: number;
  paintSubtotal: number;
  subtotal: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  shopSupplies: number;
  environmentalFees: number;
  grandTotal: number;
}

/**
 * Default tax settings (no tax)
 */
export const DEFAULT_TAX_SETTINGS: TaxSettings = {
  taxRate: 0,
  taxableParts: true,
  taxableLabor: false,
  shopSuppliesRate: 0.05,
  environmentalFeeAmount: 0,
};

/**
 * State-specific tax rates (sample - should be updated with real data)
 */
export const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.04, // Alabama
  AK: 0.00, // Alaska (no state sales tax)
  AZ: 0.056, // Arizona
  AR: 0.065, // Arkansas
  CA: 0.0725, // California
  CO: 0.029, // Colorado
  CT: 0.0635, // Connecticut
  DE: 0.00, // Delaware (no sales tax)
  FL: 0.06, // Florida
  GA: 0.04, // Georgia
  HI: 0.04, // Hawaii
  ID: 0.06, // Idaho
  IL: 0.0625, // Illinois
  IN: 0.07, // Indiana
  IA: 0.06, // Iowa
  KS: 0.065, // Kansas
  KY: 0.06, // Kentucky
  LA: 0.0445, // Louisiana
  ME: 0.055, // Maine
  MD: 0.06, // Maryland
  MA: 0.0625, // Massachusetts
  MI: 0.06, // Michigan
  MN: 0.06875, // Minnesota
  MS: 0.07, // Mississippi
  MO: 0.04225, // Missouri
  MT: 0.00, // Montana (no sales tax)
  NE: 0.055, // Nebraska
  NV: 0.0685, // Nevada
  NH: 0.00, // New Hampshire (no sales tax)
  NJ: 0.06625, // New Jersey
  NM: 0.05125, // New Mexico
  NY: 0.04, // New York
  NC: 0.0475, // North Carolina
  ND: 0.05, // North Dakota
  OH: 0.0575, // Ohio
  OK: 0.045, // Oklahoma
  OR: 0.00, // Oregon (no sales tax)
  PA: 0.06, // Pennsylvania
  RI: 0.07, // Rhode Island
  SC: 0.06, // South Carolina
  SD: 0.045, // South Dakota
  TN: 0.07, // Tennessee
  TX: 0.0625, // Texas
  UT: 0.0485, // Utah
  VT: 0.06, // Vermont
  VA: 0.053, // Virginia
  WA: 0.065, // Washington
  WV: 0.06, // West Virginia
  WI: 0.05, // Wisconsin
  WY: 0.04, // Wyoming
};

/**
 * States where labor is taxable
 */
export const LABOR_TAXABLE_STATES = [
  'CT', 'HI', 'NM', 'SD', 'WV'
];

/**
 * Calculate tax for an estimate
 */
export function calculateTax(
  partsTotal: number,
  laborTotal: number,
  paintTotal: number,
  taxSettings: TaxSettings
): EstimateTotals {
  // Calculate subtotals
  const partsSubtotal = partsTotal;
  const laborSubtotal = laborTotal;
  const paintSubtotal = paintTotal;
  const subtotal = partsSubtotal + laborSubtotal + paintSubtotal;

  // Determine taxable amount
  let taxableAmount = 0;

  if (taxSettings.taxableParts) {
    taxableAmount += partsSubtotal + paintSubtotal;
  }

  if (taxSettings.taxableLabor) {
    taxableAmount += laborSubtotal;
  }

  // Calculate tax
  const taxAmount = taxableAmount * taxSettings.taxRate;

  // Calculate shop supplies (percentage of parts + labor)
  const shopSupplies = (partsSubtotal + laborSubtotal + paintSubtotal) * taxSettings.shopSuppliesRate;

  // Environmental fees (flat amount)
  const environmentalFees = taxSettings.environmentalFeeAmount;

  // Grand total
  const grandTotal = subtotal + taxAmount + shopSupplies + environmentalFees;

  return {
    partsSubtotal,
    laborSubtotal,
    paintSubtotal,
    subtotal,
    taxableAmount,
    taxRate: taxSettings.taxRate,
    taxAmount,
    shopSupplies,
    environmentalFees,
    grandTotal,
  };
}

/**
 * Format tax rate as percentage
 */
export function formatTaxRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Get tax settings for a state
 */
export function getTaxSettingsForState(state: string): Partial<TaxSettings> {
  const stateCode = state.toUpperCase();
  const taxRate = STATE_TAX_RATES[stateCode] || 0;
  const taxableLabor = LABOR_TAXABLE_STATES.includes(stateCode);

  return {
    taxRate,
    taxableLabor,
    state: stateCode,
  };
}

/**
 * Validate tax settings
 */
export function validateTaxSettings(settings: TaxSettings): string[] {
  const errors: string[] = [];

  if (settings.taxRate < 0 || settings.taxRate > 0.2) {
    errors.push('Tax rate must be between 0% and 20%');
  }

  if (settings.shopSuppliesRate < 0 || settings.shopSuppliesRate > 0.2) {
    errors.push('Shop supplies rate must be between 0% and 20%');
  }

  if (settings.environmentalFeeAmount < 0) {
    errors.push('Environmental fee cannot be negative');
  }

  return errors;
}
