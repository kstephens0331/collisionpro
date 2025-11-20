/**
 * Phase 7: Automated Supplement Detection
 * Pattern extraction and analysis from historical supplements
 */

import { supabaseAdmin } from '@/lib/supabase';
import type {
  SupplementPattern,
  EstimateRange,
  DamageLocation,
  DamageType,
  SupplementType,
} from './types';

/**
 * Extract estimate range from total amount
 */
export function getEstimateRange(total: number): EstimateRange {
  if (total < 2000) return '$0-2K';
  if (total < 5000) return '$2K-5K';
  if (total < 10000) return '$5K-10K';
  return '$10K+';
}

/**
 * Infer damage location from description or items
 */
export function inferDamageLocation(
  damageDescription: string | null,
  items: any[]
): DamageLocation | null {
  const text = (damageDescription || '').toLowerCase();
  const itemText = items.map((i) => i.description?.toLowerCase() || '').join(' ');
  const combined = text + ' ' + itemText;

  if (combined.includes('front') && combined.includes('rear')) return 'Multiple';
  if (combined.includes('front end') || combined.includes('front bumper')) return 'Front End';
  if (combined.includes('rear end') || combined.includes('rear bumper')) return 'Rear End';
  if (combined.includes('left front') || combined.includes('lf')) return 'Left Front';
  if (combined.includes('right front') || combined.includes('rf')) return 'Right Front';
  if (combined.includes('left rear') || combined.includes('lr')) return 'Left Rear';
  if (combined.includes('right rear') || combined.includes('rr')) return 'Right Rear';
  if (combined.includes('roof')) return 'Roof';
  if (combined.includes('undercarriage') || combined.includes('underneath')) return 'Undercarriage';

  return null;
}

/**
 * Infer damage type from description
 */
export function inferDamageType(damageDescription: string | null): DamageType | null {
  if (!damageDescription) return null;

  const text = damageDescription.toLowerCase();

  if (text.includes('impact') || text.includes('collision') || text.includes('hit')) return 'Impact';
  if (text.includes('scrape') || text.includes('scratch')) return 'Scrape';
  if (text.includes('dent')) return 'Dent';
  if (text.includes('crack')) return 'Crack';
  if (text.includes('shatter') || text.includes('broken')) return 'Shatter';
  if (text.includes('bend') || text.includes('bent')) return 'Bend';
  if (text.includes('tear') || text.includes('torn')) return 'Tear';
  if (text.includes('burn') || text.includes('fire')) return 'Burn';
  if (text.includes('water') || text.includes('flood')) return 'Water';
  if (text.includes('rust') || text.includes('corrosion')) return 'Rust';

  return null;
}

/**
 * Categorize supplement trigger
 */
export function categorizeSupplementType(trigger: string): SupplementType {
  const text = trigger.toLowerCase();

  if (text.includes('frame') || text.includes('unibody') || text.includes('rail')) return 'Frame';
  if (text.includes('engine') || text.includes('transmission') || text.includes('mechanical')) return 'Mechanical';
  if (text.includes('electrical') || text.includes('wiring') || text.includes('sensor')) return 'Electrical';
  if (text.includes('rust') || text.includes('corrosion') || text.includes('rot')) return 'Corrosion';
  if (text.includes('hidden') || text.includes('discovered') || text.includes('disassembly')) return 'Hidden Damage';
  if (text.includes('part') && (text.includes('delay') || text.includes('unavailable') || text.includes('discontinued'))) return 'Part Availability';
  if (text.includes('additional labor') || text.includes('extra time')) return 'Additional Labor';
  if (text.includes('blend') || text.includes('paint match')) return 'Paint Blend';
  if (text.includes('sublet') || text.includes('outsource')) return 'Sublet';

  return 'Other';
}

/**
 * Extract supplement patterns from historical data
 * This runs as a background job to analyze all approved supplements
 */
export async function extractSupplementPatterns(): Promise<{
  success: boolean;
  patternsCreated: number;
  patternsUpdated: number;
  error?: string;
}> {
  try {
    // Get all approved supplements with their estimates
    const { data: supplements, error: fetchError } = await supabaseAdmin
      .from('insurance_supplements')
      .select(`
        id,
        reason,
        total_amount,
        status,
        approved_amount,
        submitted_at,
        approved_at,
        items,
        estimate:estimates (
          id,
          total,
          vehicle_make,
          vehicle_model,
          vehicle_year,
          damage_description,
          items:estimate_items (
            id,
            type,
            description,
            quantity,
            unit_price,
            total
          )
        )
      `)
      .eq('status', 'approved')
      .not('approved_amount', 'is', null);

    if (fetchError) {
      console.error('Error fetching supplements:', fetchError);
      return { success: false, patternsCreated: 0, patternsUpdated: 0, error: fetchError.message };
    }

    if (!supplements || supplements.length === 0) {
      return { success: true, patternsCreated: 0, patternsUpdated: 0 };
    }

    let patternsCreated = 0;
    let patternsUpdated = 0;

    // Group supplements by similar characteristics
    const patternMap = new Map<string, any>();

    for (const supplement of supplements) {
      if (!supplement.estimate) continue;

      const estimate = Array.isArray(supplement.estimate) ? supplement.estimate[0] : supplement.estimate;
      if (!estimate) continue;

      // Extract pattern characteristics
      const vehicleMake = estimate.vehicle_make || null;
      const vehicleModel = estimate.vehicle_model || null;
      const vehicleYear = estimate.vehicle_year || null;
      const damageLocation = inferDamageLocation(estimate.damage_description, estimate.items || []);
      const damageType = inferDamageType(estimate.damage_description);
      const estimateRange = getEstimateRange(estimate.total);
      const supplementTrigger = supplement.reason;
      const supplementType = categorizeSupplementType(supplementTrigger);

      // Determine supplement category from items
      const items = supplement.items || [];
      let category: 'labor' | 'parts' | 'paint' | 'other' = 'other';
      if (Array.isArray(items) && items.length > 0) {
        const firstItem = items[0];
        if (firstItem.type) {
          category = firstItem.type as any;
        }
      }

      // Create pattern key (group by similar characteristics)
      const patternKey = [
        vehicleMake || 'ANY',
        vehicleModel || 'ANY',
        vehicleYear || 'ANY',
        damageLocation || 'ANY',
        damageType || 'ANY',
        estimateRange,
        supplementTrigger.substring(0, 50), // First 50 chars of trigger
        supplementType,
      ].join('|');

      // Calculate cycle time
      let daysToApproval = 0;
      if (supplement.submitted_at && supplement.approved_at) {
        const submitted = new Date(supplement.submitted_at);
        const approved = new Date(supplement.approved_at);
        daysToApproval = (approved.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24);
      }

      if (patternMap.has(patternKey)) {
        // Update existing pattern stats
        const pattern = patternMap.get(patternKey);
        pattern.frequencyCount++;
        pattern.approvalCount++;
        pattern.totalAmount += supplement.approved_amount || 0;
        pattern.totalDays += daysToApproval;
      } else {
        // Create new pattern
        patternMap.set(patternKey, {
          vehicleMake,
          vehicleModel,
          vehicleYear,
          damageLocation,
          damageType,
          estimateRange,
          supplementTrigger,
          supplementType,
          category,
          frequencyCount: 1,
          approvalCount: 1,
          rejectionCount: 0,
          totalAmount: supplement.approved_amount || 0,
          totalDays: daysToApproval,
        });
      }
    }

    // Insert or update patterns in database
    for (const [key, data] of patternMap.entries()) {
      const avgAmount = data.totalAmount / data.frequencyCount;
      const avgDays = data.totalDays / data.frequencyCount;
      const approvalRate = (data.approvalCount / (data.approvalCount + data.rejectionCount)) * 100;

      // Check if pattern already exists
      const { data: existingPattern } = await supabaseAdmin
        .from('supplement_patterns')
        .select('id, frequency_count, approval_count, rejection_count')
        .eq('vehicle_make', data.vehicleMake)
        .eq('vehicle_model', data.vehicleModel)
        .eq('vehicle_year', data.vehicleYear)
        .eq('damage_location', data.damageLocation)
        .eq('initial_damage_type', data.damageType)
        .eq('initial_estimate_range', data.estimateRange)
        .eq('supplement_trigger', data.supplementTrigger)
        .single();

      if (existingPattern) {
        // Update existing pattern
        const { error: updateError } = await supabaseAdmin
          .from('supplement_patterns')
          .update({
            frequency_count: existingPattern.frequency_count + data.frequencyCount,
            approval_count: existingPattern.approval_count + data.approvalCount,
            rejection_count: existingPattern.rejection_count + data.rejectionCount,
            avg_amount: avgAmount,
            avg_days_to_approval: avgDays,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', existingPattern.id);

        if (!updateError) {
          patternsUpdated++;
        }
      } else {
        // Create new pattern
        const { error: insertError } = await supabaseAdmin
          .from('supplement_patterns')
          .insert({
            vehicle_make: data.vehicleMake,
            vehicle_model: data.vehicleModel,
            vehicle_year: data.vehicleYear,
            damage_location: data.damageLocation,
            initial_damage_type: data.damageType,
            initial_estimate_range: data.estimateRange,
            supplement_trigger: data.supplementTrigger,
            supplement_category: data.category,
            supplement_type: data.supplementType,
            frequency_count: data.frequencyCount,
            approval_count: data.approvalCount,
            rejection_count: data.rejectionCount,
            avg_amount: avgAmount,
            avg_days_to_approval: avgDays,
            avg_approval_rate: approvalRate,
            last_seen_at: new Date().toISOString(),
          });

        if (!insertError) {
          patternsCreated++;
        }
      }
    }

    return {
      success: true,
      patternsCreated,
      patternsUpdated,
    };
  } catch (error) {
    console.error('Pattern extraction error:', error);
    return {
      success: false,
      patternsCreated: 0,
      patternsUpdated: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Find matching patterns for an estimate
 */
export async function findMatchingPatterns(
  estimateContext: {
    total: number;
    vehicleMake: string;
    vehicleModel: string;
    vehicleYear: number;
    damageDescription: string | null;
    items: any[];
  },
  minConfidence: number = 50
): Promise<SupplementPattern[]> {
  const damageLocation = inferDamageLocation(estimateContext.damageDescription, estimateContext.items);
  const damageType = inferDamageType(estimateContext.damageDescription);
  const estimateRange = getEstimateRange(estimateContext.total);

  // Build query with fallbacks
  // Try exact match first, then broader matches
  const queries = [
    // Exact match
    {
      vehicle_make: estimateContext.vehicleMake,
      vehicle_model: estimateContext.vehicleModel,
      vehicle_year: estimateContext.vehicleYear,
      damage_location: damageLocation,
      initial_damage_type: damageType,
    },
    // Same make/model, any year
    {
      vehicle_make: estimateContext.vehicleMake,
      vehicle_model: estimateContext.vehicleModel,
      damage_location: damageLocation,
    },
    // Same make, any model/year
    {
      vehicle_make: estimateContext.vehicleMake,
      damage_location: damageLocation,
    },
    // Any vehicle, same damage
    {
      damage_location: damageLocation,
      initial_damage_type: damageType,
    },
  ];

  const allPatterns: SupplementPattern[] = [];

  for (const query of queries) {
    const { data: patterns } = await supabaseAdmin
      .from('supplement_patterns')
      .select('*')
      .match(query)
      .gte('confidence_score', minConfidence)
      .order('confidence_score', { ascending: false })
      .limit(10);

    if (patterns && patterns.length > 0) {
      allPatterns.push(...(patterns as any[]));
      if (allPatterns.length >= 5) break; // Stop if we have enough patterns
    }
  }

  // Remove duplicates and convert to camelCase
  const uniquePatterns = Array.from(
    new Map(allPatterns.map((p) => [p.id, p])).values()
  );

  return uniquePatterns.map((p: any) => ({
    id: p.id,
    vehicleMake: p.vehicle_make,
    vehicleModel: p.vehicle_model,
    vehicleYear: p.vehicle_year,
    damageLocation: p.damage_location,
    initialDamageType: p.initial_damage_type,
    initialEstimateRange: p.initial_estimate_range,
    supplementTrigger: p.supplement_trigger,
    supplementCategory: p.supplement_category,
    supplementType: p.supplement_type,
    frequencyCount: p.frequency_count,
    approvalCount: p.approval_count,
    rejectionCount: p.rejection_count,
    avgApprovalRate: p.avg_approval_rate,
    avgAmount: p.avg_amount,
    avgDaysToApproval: p.avg_days_to_approval,
    confidenceScore: p.confidence_score,
    lastSeenAt: p.last_seen_at,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));
}
