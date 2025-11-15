/**
 * Labor Operations & Shop Settings
 * Industry-standard labor times + shop-specific rates
 */

export interface LaborOperation {
  id: string;
  code: string;
  category: 'body' | 'paint' | 'mechanical' | 'electrical' | 'glass' | 'frame' | 'detail';
  operation: string;
  description?: string;
  standardHours: number;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  notes?: string;
}

export interface ShopSettings {
  id: string;
  shopId: string;

  // Labor Rates (per hour)
  bodyLaborRate: number;
  paintLaborRate: number;
  mechanicalLaborRate: number;
  electricalLaborRate: number;
  glassLaborRate: number;
  detailLaborRate: number;

  // Diagnostic & Special Rates
  diagnosticRate: number;
  frameRate: number;
  alignmentRate: number;

  // Paint Materials
  paintMaterialsRate: number; // per hour of paint time
  clearCoatRate: number;

  // Shop Supplies & Fees
  shopSuppliesRate: number; // percentage (e.g., 0.10 = 10%)
  hazmatFee: number;
  environmentalFee: number;

  // Tax Settings
  defaultTaxRate: number; // percentage (e.g., 0.0825 = 8.25%)
  taxParts: boolean;
  taxLabor: boolean;
  taxPaint: boolean;

  // Business Info
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  licenseNumber?: string;
}

/**
 * Calculate labor cost based on operation and shop settings
 */
export function calculateLaborCost(
  operation: LaborOperation,
  shopSettings: ShopSettings,
  customHours?: number
): {
  hours: number;
  rate: number;
  cost: number;
} {
  const hours = customHours ?? operation.standardHours;

  // Get appropriate labor rate based on category
  let rate: number;
  switch (operation.category) {
    case 'body':
      rate = shopSettings.bodyLaborRate;
      break;
    case 'paint':
      rate = shopSettings.paintLaborRate;
      break;
    case 'mechanical':
      rate = shopSettings.mechanicalLaborRate;
      break;
    case 'electrical':
      rate = shopSettings.electricalLaborRate;
      break;
    case 'glass':
      rate = shopSettings.glassLaborRate;
      break;
    case 'frame':
      rate = shopSettings.frameRate;
      break;
    case 'detail':
      rate = shopSettings.detailLaborRate;
      break;
    default:
      rate = shopSettings.bodyLaborRate; // fallback
  }

  const cost = hours * rate;

  return { hours, rate, cost };
}

/**
 * Calculate paint materials cost based on paint hours
 */
export function calculatePaintMaterialsCost(
  paintHours: number,
  shopSettings: ShopSettings
): number {
  return paintHours * shopSettings.paintMaterialsRate;
}

/**
 * Calculate shop supplies fee (percentage of parts + labor)
 */
export function calculateShopSuppliesFee(
  partsTotal: number,
  laborTotal: number,
  shopSettings: ShopSettings
): number {
  return (partsTotal + laborTotal) * shopSettings.shopSuppliesRate;
}

/**
 * Default shop settings values
 */
export const DEFAULT_SHOP_SETTINGS: Omit<ShopSettings, 'id' | 'shopId'> = {
  // Labor Rates (per hour)
  bodyLaborRate: 75.00,
  paintLaborRate: 85.00,
  mechanicalLaborRate: 95.00,
  electricalLaborRate: 100.00,
  glassLaborRate: 65.00,
  detailLaborRate: 50.00,

  // Diagnostic & Special Rates
  diagnosticRate: 125.00,
  frameRate: 95.00,
  alignmentRate: 85.00,

  // Paint Materials
  paintMaterialsRate: 45.00,
  clearCoatRate: 35.00,

  // Shop Supplies & Fees
  shopSuppliesRate: 0.10, // 10%
  hazmatFee: 15.00,
  environmentalFee: 10.00,

  // Tax Settings
  defaultTaxRate: 0.0825, // 8.25%
  taxParts: true,
  taxLabor: false,
  taxPaint: true,
};

/**
 * Labor operation categories with display names
 */
export const LABOR_CATEGORIES = {
  body: 'Body Work',
  paint: 'Paint & Refinish',
  mechanical: 'Mechanical',
  electrical: 'Electrical',
  glass: 'Glass',
  frame: 'Frame & Structural',
  detail: 'Detail & Finishing',
} as const;
