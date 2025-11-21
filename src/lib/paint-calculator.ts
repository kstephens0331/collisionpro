/**
 * Paint Material Calculator Library
 *
 * Professional paint estimation for collision repair
 * Based on industry standards (Mitchell, CCC ONE, Audatex)
 */

export interface PanelPaintTime {
  partName: string;
  category: string;
  prepTime: number; // hours
  paintTime: number; // hours
  finishTime: number; // hours
  blendTime: number; // hours
  squareFeet: number;
}

export interface PaintMaterialCosts {
  baseCoatPerQuart: number;
  clearCoatPerQuart: number;
  primerPerQuart: number;
  sealerPerQuart: number;
  reducerPerQuart: number;
  hardenerPerQuart: number;
}

export interface PaintEstimateInput {
  panels: PanelPaintTime[];
  paintType: 'solid' | 'metallic' | 'pearl' | 'tri-coat';
  materialCosts: PaintMaterialCosts;
  laborRate: number;
  includeBlend?: boolean;
}

export interface PaintEstimateResult {
  // Panel counts
  panelsToRepair: number;
  totalPanels: number;
  squareFeet: number;

  // Material costs
  baseCoatCost: number;
  clearCoatCost: number;
  primerCost: number;
  sealerCost: number;
  reducerCost: number;
  hardenerCost: number;
  totalMaterialCost: number;

  // Labor calculations
  prepHours: number;
  paintHours: number;
  finishHours: number;
  blendHours: number;
  totalLaborHours: number;

  // Totals
  laborRate: number;
  totalLaborCost: number;
  totalCost: number;

  // Breakdown by panel
  panelBreakdown: PanelEstimate[];
}

export interface PanelEstimate {
  partName: string;
  prepTime: number;
  paintTime: number;
  finishTime: number;
  blendTime: number;
  totalTime: number;
  squareFeet: number;
  materialCost: number;
  laborCost: number;
  totalCost: number;
}

/**
 * Material coverage rates (industry standard)
 */
const COVERAGE_RATES = {
  baseCoat: 100, // sq ft per quart
  clearCoat: 120, // sq ft per quart
  primer: 150, // sq ft per quart
  sealer: 150, // sq ft per quart
  reducer: 0.25, // quarts per quart of base/clear
  hardener: 0.25, // quarts per quart of clear
};

/**
 * Paint type multipliers
 */
const PAINT_TYPE_MULTIPLIERS = {
  solid: 1.0,
  metallic: 1.2,
  pearl: 1.4,
  'tri-coat': 1.8,
};

/**
 * Calculate paint estimate for repair
 */
export function calculatePaintEstimate(
  input: PaintEstimateInput
): PaintEstimateResult {
  const { panels, paintType, materialCosts, laborRate, includeBlend = false } = input;

  // Calculate totals
  let totalPrepTime = 0;
  let totalPaintTime = 0;
  let totalFinishTime = 0;
  let totalBlendTime = 0;
  let totalSquareFeet = 0;

  const panelBreakdown: PanelEstimate[] = [];

  // Calculate per-panel estimates
  for (const panel of panels) {
    const prepTime = panel.prepTime;
    const paintTime = panel.paintTime;
    const finishTime = panel.finishTime;
    const blendTime = includeBlend ? panel.blendTime : 0;
    const totalTime = prepTime + paintTime + finishTime + blendTime;

    totalPrepTime += prepTime;
    totalPaintTime += paintTime;
    totalFinishTime += finishTime;
    totalBlendTime += blendTime;
    totalSquareFeet += panel.squareFeet;

    const panelMaterialCost = calculatePanelMaterialCost(
      panel.squareFeet,
      paintType,
      materialCosts
    );
    const laborCost = totalTime * laborRate;

    panelBreakdown.push({
      partName: panel.partName,
      prepTime,
      paintTime,
      finishTime,
      blendTime,
      totalTime,
      squareFeet: panel.squareFeet,
      materialCost: panelMaterialCost,
      laborCost,
      totalCost: panelMaterialCost + laborCost,
    });
  }

  // Calculate material costs
  const typeMultiplier = PAINT_TYPE_MULTIPLIERS[paintType];

  // Base coat
  const baseCoatQuarts = (totalSquareFeet / COVERAGE_RATES.baseCoat) * typeMultiplier;
  const baseCoatCost = baseCoatQuarts * materialCosts.baseCoatPerQuart;

  // Clear coat
  const clearCoatQuarts = (totalSquareFeet / COVERAGE_RATES.clearCoat) * typeMultiplier;
  const clearCoatCost = clearCoatQuarts * materialCosts.clearCoatPerQuart;

  // Primer (assume 50% of panels need primer)
  const primerQuarts = ((totalSquareFeet * 0.5) / COVERAGE_RATES.primer);
  const primerCost = primerQuarts * materialCosts.primerPerQuart;

  // Sealer (assume 25% of panels need sealer)
  const sealerQuarts = ((totalSquareFeet * 0.25) / COVERAGE_RATES.sealer);
  const sealerCost = sealerQuarts * materialCosts.sealerPerQuart;

  // Reducer (25% of base + clear)
  const reducerQuarts = (baseCoatQuarts + clearCoatQuarts) * COVERAGE_RATES.reducer;
  const reducerCost = reducerQuarts * materialCosts.reducerPerQuart;

  // Hardener (25% of clear)
  const hardenerQuarts = clearCoatQuarts * COVERAGE_RATES.hardener;
  const hardenerCost = hardenerQuarts * materialCosts.hardenerPerQuart;

  const totalMaterialCost =
    baseCoatCost +
    clearCoatCost +
    primerCost +
    sealerCost +
    reducerCost +
    hardenerCost;

  const totalLaborHours = totalPrepTime + totalPaintTime + totalFinishTime + totalBlendTime;
  const totalLaborCost = totalLaborHours * laborRate;
  const totalCost = totalMaterialCost + totalLaborCost;

  return {
    panelsToRepair: panels.length,
    totalPanels: panels.length,
    squareFeet: totalSquareFeet,

    baseCoatCost,
    clearCoatCost,
    primerCost,
    sealerCost,
    reducerCost,
    hardenerCost,
    totalMaterialCost,

    prepHours: totalPrepTime,
    paintHours: totalPaintTime,
    finishHours: totalFinishTime,
    blendHours: totalBlendTime,
    totalLaborHours,

    laborRate,
    totalLaborCost,
    totalCost,

    panelBreakdown,
  };
}

/**
 * Calculate material cost for a single panel
 */
function calculatePanelMaterialCost(
  squareFeet: number,
  paintType: 'solid' | 'metallic' | 'pearl' | 'tri-coat',
  materialCosts: PaintMaterialCosts
): number {
  const typeMultiplier = PAINT_TYPE_MULTIPLIERS[paintType];

  const baseCoatQuarts = (squareFeet / COVERAGE_RATES.baseCoat) * typeMultiplier;
  const clearCoatQuarts = (squareFeet / COVERAGE_RATES.clearCoat) * typeMultiplier;
  const primerQuarts = (squareFeet * 0.5) / COVERAGE_RATES.primer;
  const sealerQuarts = (squareFeet * 0.25) / COVERAGE_RATES.sealer;
  const reducerQuarts = (baseCoatQuarts + clearCoatQuarts) * COVERAGE_RATES.reducer;
  const hardenerQuarts = clearCoatQuarts * COVERAGE_RATES.hardener;

  return (
    baseCoatQuarts * materialCosts.baseCoatPerQuart +
    clearCoatQuarts * materialCosts.clearCoatPerQuart +
    primerQuarts * materialCosts.primerPerQuart +
    sealerQuarts * materialCosts.sealerPerQuart +
    reducerQuarts * materialCosts.reducerPerQuart +
    hardenerQuarts * materialCosts.hardenerPerQuart
  );
}

/**
 * Standard panel data (industry averages)
 */
export const STANDARD_PANELS: Record<string, Omit<PanelPaintTime, 'partName'>> = {
  'Front Door': { category: 'door', prepTime: 1.5, paintTime: 1.0, finishTime: 0.5, blendTime: 0.5, squareFeet: 12.0 },
  'Rear Door': { category: 'door', prepTime: 1.5, paintTime: 1.0, finishTime: 0.5, blendTime: 0.5, squareFeet: 12.0 },
  'Front Fender': { category: 'fender', prepTime: 1.8, paintTime: 1.2, finishTime: 0.6, blendTime: 0.5, squareFeet: 15.0 },
  'Rear Fender/Quarter Panel': { category: 'quarter', prepTime: 3.0, paintTime: 2.0, finishTime: 1.0, blendTime: 0.8, squareFeet: 25.0 },
  'Hood': { category: 'hood', prepTime: 2.0, paintTime: 1.5, finishTime: 0.7, blendTime: 0.6, squareFeet: 20.0 },
  'Trunk/Deck Lid': { category: 'trunk', prepTime: 1.8, paintTime: 1.2, finishTime: 0.6, blendTime: 0.5, squareFeet: 18.0 },
  'Roof': { category: 'roof', prepTime: 2.5, paintTime: 2.0, finishTime: 1.0, blendTime: 0, squareFeet: 30.0 },
  'Front Bumper Cover': { category: 'bumper', prepTime: 1.2, paintTime: 0.8, finishTime: 0.4, blendTime: 0, squareFeet: 10.0 },
  'Rear Bumper Cover': { category: 'bumper', prepTime: 1.2, paintTime: 0.8, finishTime: 0.4, blendTime: 0, squareFeet: 10.0 },
  'Side Mirror': { category: 'panel', prepTime: 0.3, paintTime: 0.2, finishTime: 0.1, blendTime: 0, squareFeet: 1.0 },
  'Grille': { category: 'panel', prepTime: 0.5, paintTime: 0.3, finishTime: 0.2, blendTime: 0, squareFeet: 2.0 },
  'Rocker Panel': { category: 'panel', prepTime: 1.0, paintTime: 0.8, finishTime: 0.4, blendTime: 0.3, squareFeet: 8.0 },
};

/**
 * Default material costs (example pricing)
 */
export const DEFAULT_MATERIAL_COSTS: Record<string, PaintMaterialCosts> = {
  solid: {
    baseCoatPerQuart: 45,
    clearCoatPerQuart: 35,
    primerPerQuart: 25,
    sealerPerQuart: 20,
    reducerPerQuart: 15,
    hardenerPerQuart: 18,
  },
  metallic: {
    baseCoatPerQuart: 55,
    clearCoatPerQuart: 40,
    primerPerQuart: 25,
    sealerPerQuart: 20,
    reducerPerQuart: 15,
    hardenerPerQuart: 18,
  },
  pearl: {
    baseCoatPerQuart: 75,
    clearCoatPerQuart: 50,
    primerPerQuart: 25,
    sealerPerQuart: 20,
    reducerPerQuart: 15,
    hardenerPerQuart: 18,
  },
  'tri-coat': {
    baseCoatPerQuart: 95,
    clearCoatPerQuart: 60,
    primerPerQuart: 25,
    sealerPerQuart: 20,
    reducerPerQuart: 15,
    hardenerPerQuart: 18,
  },
};

/**
 * Format hours to readable string
 */
export function formatHours(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  return `${hours.toFixed(1)} hrs`;
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
