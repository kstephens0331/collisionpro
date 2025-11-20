/**
 * Phase 7: Automated Supplement Detection
 * AI-powered supplement recommendation engine
 */

import { supabaseAdmin } from '@/lib/supabase';
import { findMatchingPatterns, getEstimateRange, inferDamageLocation, inferDamageType } from './pattern-analyzer';
import type {
  SupplementSuggestion,
  EstimateContext,
  SupplementPattern,
  TriggerCondition,
  TriggerConditionResult,
} from './types';

/**
 * Check for supplement trigger conditions
 */
export function checkTriggerConditions(context: EstimateContext): TriggerConditionResult[] {
  const results: TriggerConditionResult[] = [];

  // 1. High-Impact Collision
  if (context.total >= 5000) {
    const damageLocation = inferDamageLocation(context.damageDescription, context.items);
    if (damageLocation === 'Front End' || damageLocation === 'Rear End') {
      results.push({
        condition: 'high_impact_collision',
        met: true,
        confidence: 75,
        reason: `High-value estimate ($${context.total.toLocaleString()}) with ${damageLocation.toLowerCase()} damage`,
        suggestedDocumentation: [
          'Photos of frame rails',
          'Photos of subframe',
          'Measurements of any deformation',
        ],
      });
    }
  }

  // 2. Airbag Deployment
  const hasAirbagItem = context.items.some((item) =>
    item.description.toLowerCase().includes('airbag')
  );
  if (hasAirbagItem) {
    results.push({
      condition: 'airbag_deployment',
      met: true,
      confidence: 85,
      reason: 'Airbag deployment indicates significant impact force',
      suggestedDocumentation: [
        'Photos of dash/steering column',
        'Photos of sensors',
        'Check for frame damage',
      ],
    });
  }

  // 3. Water/Flood Exposure
  const damageDesc = (context.damageDescription || '').toLowerCase();
  if (damageDesc.includes('water') || damageDesc.includes('flood')) {
    results.push({
      condition: 'water_flood_exposure',
      met: true,
      confidence: 80,
      reason: 'Water exposure can cause hidden electrical/mechanical damage',
      suggestedDocumentation: [
        'Photos of carpet/padding',
        'Photos of electrical components',
        'Document water line height',
      ],
    });
  }

  // 4. Age-Related Issues
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - context.vehicleYear;
  if (vehicleAge >= 10) {
    results.push({
      condition: 'age_related_issues',
      met: true,
      confidence: 65,
      reason: `Vehicle is ${vehicleAge} years old - increased risk of corrosion and frozen bolts`,
      suggestedDocumentation: [
        'Photos of any rust or corrosion',
        'Document condition of fasteners',
        'Additional labor if disassembly difficult',
      ],
    });
  }

  // 5. Frame Damage Likely
  const hasFrameItem = context.items.some((item) =>
    item.description.toLowerCase().includes('frame') ||
    item.description.toLowerCase().includes('rail') ||
    item.description.toLowerCase().includes('unibody')
  );
  if (hasFrameItem || context.total >= 10000) {
    results.push({
      condition: 'frame_damage_likely',
      met: true,
      confidence: 70,
      reason: hasFrameItem
        ? 'Frame/unibody work listed in estimate'
        : 'High estimate value suggests potential structural damage',
      suggestedDocumentation: [
        'Detailed frame measurements',
        'Photos of all frame rails',
        'Centering gauge readings',
      ],
    });
  }

  // 6. Sensor Replacement
  const hasSensorItem = context.items.some((item) =>
    item.description.toLowerCase().includes('sensor') ||
    item.description.toLowerCase().includes('radar') ||
    item.description.toLowerCase().includes('camera')
  );
  if (hasSensorItem) {
    results.push({
      condition: 'sensor_replacement',
      met: true,
      confidence: 90,
      reason: 'ADAS sensor replacement often requires calibration supplements',
      suggestedDocumentation: [
        'Calibration requirements',
        'Specialized equipment needs',
        'Additional labor estimates',
      ],
    });
  }

  // 7. Corrosion Risk
  if (vehicleAge >= 7 && (damageDesc.includes('rust') || damageDesc.includes('corrosion'))) {
    results.push({
      condition: 'corrosion_risk',
      met: true,
      confidence: 75,
      reason: 'Visible corrosion with older vehicle suggests hidden rust damage',
      suggestedDocumentation: [
        'Photos of all rust areas',
        'Probe/test suspect areas',
        'Document extent of corrosion',
      ],
    });
  }

  // 8. Part Availability Issues
  const isLuxury = ['BMW', 'Mercedes', 'Audi', 'Lexus', 'Porsche', 'Tesla'].includes(context.vehicleMake);
  const isOld = vehicleAge >= 15;
  if (isLuxury || isOld) {
    results.push({
      condition: 'part_availability',
      met: true,
      confidence: 60,
      reason: isLuxury
        ? 'Luxury vehicle parts may have lead times or require alternative solutions'
        : 'Older vehicle parts may be discontinued or hard to source',
      suggestedDocumentation: [
        'Part availability research',
        'Alternative part options',
        'Lead time estimates',
      ],
    });
  }

  return results;
}

/**
 * Generate supplement recommendations for an estimate
 */
export async function generateRecommendations(
  context: EstimateContext,
  options: {
    includePreDisassembly?: boolean;
    includeDuringRepair?: boolean;
    minConfidence?: number;
  } = {}
): Promise<SupplementSuggestion[]> {
  const {
    includePreDisassembly = true,
    includeDuringRepair = true,
    minConfidence = 50,
  } = options;

  const suggestions: SupplementSuggestion[] = [];

  // 1. Check trigger conditions (pre-disassembly)
  if (includePreDisassembly) {
    const triggers = checkTriggerConditions(context);

    for (const trigger of triggers) {
      if (!trigger.met || trigger.confidence < minConfidence) continue;

      suggestions.push({
        id: `trigger_${trigger.condition}`,
        trigger: trigger.reason,
        category: getCategoryForTrigger(trigger.condition),
        confidence: trigger.confidence,
        suggestedAmount: getEstimatedAmountForTrigger(trigger.condition, context.total),
        justification: generateJustification(trigger),
        documentationNeeded: trigger.suggestedDocumentation,
        relatedPatterns: [],
        priority: trigger.confidence >= 80 ? 'high' : trigger.confidence >= 65 ? 'medium' : 'low',
        timing: 'pre-disassembly',
      });
    }
  }

  // 2. Find historical pattern matches
  const patterns = await findMatchingPatterns(
    {
      total: context.total,
      vehicleMake: context.vehicleMake,
      vehicleModel: context.vehicleModel,
      vehicleYear: context.vehicleYear,
      damageDescription: context.damageDescription,
      items: context.items,
    },
    minConfidence
  );

  // 3. Generate pattern-based recommendations
  for (const pattern of patterns) {
    if (pattern.confidenceScore < minConfidence) continue;

    // Calculate combined confidence (pattern confidence + context match)
    const contextMatchScore = calculateContextMatchScore(pattern, context);
    const combinedConfidence = Math.round((pattern.confidenceScore + contextMatchScore) / 2);

    if (combinedConfidence < minConfidence) continue;

    suggestions.push({
      id: `pattern_${pattern.id}`,
      trigger: pattern.supplementTrigger,
      category: pattern.supplementCategory,
      confidence: combinedConfidence,
      suggestedAmount: pattern.avgAmount,
      justification: generatePatternJustification(pattern),
      documentationNeeded: getDocumentationForType(pattern.supplementType || 'Other'),
      relatedPatterns: [pattern],
      priority: combinedConfidence >= 80 ? 'high' : combinedConfidence >= 65 ? 'medium' : 'low',
      timing: includeDuringRepair ? 'during-repair' : 'pre-disassembly',
    });
  }

  // 4. Sort by confidence and priority
  suggestions.sort((a, b) => {
    if (a.priority !== b.priority) {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.confidence - a.confidence;
  });

  // 5. Limit to top 10 recommendations
  return suggestions.slice(0, 10);
}

/**
 * Calculate how well a pattern matches the current estimate context
 */
function calculateContextMatchScore(pattern: SupplementPattern, context: EstimateContext): number {
  let score = 0;
  let factors = 0;

  // Vehicle make match (25%)
  if (pattern.vehicleMake === context.vehicleMake) {
    score += 25;
  }
  factors++;

  // Vehicle model match (25%)
  if (pattern.vehicleModel === context.vehicleModel) {
    score += 25;
  }
  factors++;

  // Vehicle year proximity (20%)
  if (pattern.vehicleYear) {
    const yearDiff = Math.abs(pattern.vehicleYear - context.vehicleYear);
    if (yearDiff === 0) score += 20;
    else if (yearDiff <= 2) score += 15;
    else if (yearDiff <= 5) score += 10;
    else if (yearDiff <= 10) score += 5;
  }
  factors++;

  // Damage location match (15%)
  const contextLocation = inferDamageLocation(context.damageDescription, context.items);
  if (pattern.damageLocation === contextLocation) {
    score += 15;
  }
  factors++;

  // Estimate range match (15%)
  const contextRange = getEstimateRange(context.total);
  if (pattern.initialEstimateRange === contextRange) {
    score += 15;
  }
  factors++;

  return score;
}

/**
 * Get category for a trigger condition
 */
function getCategoryForTrigger(condition: TriggerCondition): 'labor' | 'parts' | 'paint' | 'other' {
  switch (condition) {
    case 'sensor_replacement':
    case 'part_availability':
      return 'parts';
    case 'frame_damage_likely':
    case 'age_related_issues':
    case 'corrosion_risk':
      return 'labor';
    case 'airbag_deployment':
    case 'water_flood_exposure':
    case 'electrical_exposure':
      return 'other';
    default:
      return 'labor';
  }
}

/**
 * Estimate supplement amount based on trigger condition
 */
function getEstimatedAmountForTrigger(condition: TriggerCondition, estimateTotal: number): number {
  switch (condition) {
    case 'high_impact_collision':
      return estimateTotal * 0.15; // 15% of total
    case 'airbag_deployment':
      return 800; // Typical sensor/diagnostic costs
    case 'water_flood_exposure':
      return 1200; // Electrical repair average
    case 'age_related_issues':
      return estimateTotal * 0.10; // 10% additional labor
    case 'frame_damage_likely':
      return 2500; // Frame repair average
    case 'sensor_replacement':
      return 600; // Calibration costs
    case 'corrosion_risk':
      return 1500; // Rust repair average
    case 'part_availability':
      return estimateTotal * 0.08; // 8% for delays/alternatives
    default:
      return 1000; // Default estimate
  }
}

/**
 * Generate justification text for insurance from trigger
 */
function generateJustification(trigger: TriggerConditionResult): string {
  return `Pre-disassembly analysis indicates potential for additional damage: ${trigger.reason}. Recommend thorough inspection during disassembly with photo documentation. Estimated supplement may be required based on industry patterns for similar repairs.`;
}

/**
 * Generate justification text from pattern
 */
function generatePatternJustification(pattern: SupplementPattern): string {
  const approvalRate = pattern.avgApprovalRate || 0;
  const frequency = pattern.frequencyCount || 0;

  return `Based on historical data, repairs matching this profile have resulted in supplements ${frequency} time${frequency !== 1 ? 's' : ''} with a ${approvalRate.toFixed(0)}% approval rate. Common issue: ${pattern.supplementTrigger}. Recommend pre-inspection and documentation to streamline supplement approval if discovered during repair.`;
}

/**
 * Get recommended documentation for supplement type
 */
function getDocumentationForType(type: string): string[] {
  const docs: Record<string, string[]> = {
    'Frame': [
      'Frame measurements (before/after)',
      'Photos of damage to frame rails',
      'Centering gauge readings',
    ],
    'Mechanical': [
      'Photos of mechanical components',
      'Diagnostic reports',
      'Part failure evidence',
    ],
    'Electrical': [
      'Wiring diagrams',
      'Diagnostic trouble codes',
      'Photos of damaged wiring',
    ],
    'Corrosion': [
      'Photos showing extent of rust',
      'Probe test results',
      'Before/after metal treatment',
    ],
    'Hidden Damage': [
      'Disassembly photos',
      'Before/after comparison',
      'Detailed damage description',
    ],
    'Part Availability': [
      'Part availability research',
      'Supplier communications',
      'Alternative options explored',
    ],
    'Additional Labor': [
      'Time tracking documentation',
      'Photos showing complexity',
      'Justification for extra hours',
    ],
    'Paint Blend': [
      'Color match photos',
      'Adjacent panel photos',
      'Blend area justification',
    ],
    'Other': [
      'Detailed photos',
      'Written description',
      'Supporting documentation',
    ],
  };

  return docs[type] || docs['Other'];
}
