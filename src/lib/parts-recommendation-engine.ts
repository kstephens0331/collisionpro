/**
 * Parts Recommendation Engine
 *
 * AI-powered smart recommendations based on damage analysis, vehicle fitment,
 * historical data, and multi-factor scoring
 */

import { createClient } from '@supabase/supabase-js';
import { PartCatalogItem, findCompatibleParts } from './parts-catalog-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  vin?: string;
}

export interface DamageInfo {
  type: string; // 'front_collision', 'side_impact', 'rear_collision', etc.
  severity: 'minor' | 'moderate' | 'severe';
  affectedAreas: string[]; // ['bumper', 'hood', 'fender', 'headlight']
  description?: string;
}

export interface RecommendationOptions {
  preferOEM?: boolean;
  budgetMax?: number;
  preferQuality?: boolean; // true = prioritize quality, false = prioritize price
  preferredSuppliers?: string[];
  excludedSuppliers?: string[];
  limit?: number;
}

export interface PartRecommendation {
  part: PartCatalogItem;
  score: number;
  fitmentScore: number;
  priceScore: number;
  qualityScore: number;
  availabilityScore: number;
  reasons: string[];
  alternatives: PartCatalogItem[];
}

/**
 * Generate part recommendations for an estimate
 */
export async function generateRecommendations(
  estimateId: string,
  vehicle: VehicleInfo,
  damage: DamageInfo,
  options: RecommendationOptions = {}
): Promise<PartRecommendation[]> {
  const {
    preferOEM = false,
    budgetMax,
    preferQuality = true,
    preferredSuppliers = [],
    excludedSuppliers = [],
    limit = 10,
  } = options;

  const recommendations: PartRecommendation[] = [];

  // Map damage to part categories
  const neededCategories = mapDamageToCategories(damage);

  for (const category of neededCategories) {
    // Find compatible parts
    let parts = await findCompatibleParts(
      category,
      vehicle.make,
      vehicle.model,
      vehicle.year,
      50 // Get more than needed for filtering
    );

    // Apply filters
    if (preferOEM) {
      parts = parts.filter(p => p.condition === 'oem' || p.condition === 'new');
    }

    if (budgetMax) {
      parts = parts.filter(p => p.price <= budgetMax);
    }

    if (preferredSuppliers.length > 0) {
      parts = parts.filter(p => preferredSuppliers.includes(p.supplierId));
    }

    if (excludedSuppliers.length > 0) {
      parts = parts.filter(p => !excludedSuppliers.includes(p.supplierId));
    }

    // Score each part
    const scoredParts = await Promise.all(
      parts.map(async (part) => {
        const scores = await scorePart(part, vehicle, damage, options);
        const alternatives = await findAlternativeParts(part, parts, 3);

        return {
          part,
          score: scores.totalScore,
          fitmentScore: scores.fitmentScore,
          priceScore: scores.priceScore,
          qualityScore: scores.qualityScore,
          availabilityScore: scores.availabilityScore,
          reasons: scores.reasons,
          alternatives,
        };
      })
    );

    // Sort by score and take top results
    scoredParts.sort((a, b) => b.score - a.score);
    recommendations.push(...scoredParts.slice(0, limit));

    // Save recommendations to database
    for (const rec of scoredParts.slice(0, limit)) {
      await saveRecommendation(estimateId, rec, vehicle, damage);
    }
  }

  return recommendations;
}

/**
 * Score a part based on multiple factors
 */
async function scorePart(
  part: PartCatalogItem,
  vehicle: VehicleInfo,
  damage: DamageInfo,
  options: RecommendationOptions
): Promise<{
  totalScore: number;
  fitmentScore: number;
  priceScore: number;
  qualityScore: number;
  availabilityScore: number;
  reasons: string[];
}> {
  const reasons: string[] = [];

  // 1. Fitment Score (0-1)
  let fitmentScore = 0;
  if (part.make === vehicle.make && part.model === vehicle.model) {
    fitmentScore = 1.0;
    reasons.push('exact_vehicle_match');
  } else if (part.make === vehicle.make) {
    fitmentScore = 0.7;
    reasons.push('same_make');
  } else if (part.universalFit) {
    fitmentScore = 0.5;
    reasons.push('universal_fit');
  }

  // Check year range
  if (part.year === vehicle.year) {
    fitmentScore = Math.min(1.0, fitmentScore + 0.2);
  } else if (part.yearStart && part.yearEnd) {
    if (vehicle.year >= part.yearStart && vehicle.year <= part.yearEnd) {
      fitmentScore = Math.min(1.0, fitmentScore + 0.1);
    }
  }

  // 2. Price Score (0-1) - inverse scoring, lower price = higher score
  let priceScore = 0;
  if (options.budgetMax) {
    priceScore = 1 - (part.price / options.budgetMax);
    priceScore = Math.max(0, Math.min(1, priceScore));
  } else {
    // Compare to similar parts
    const avgPrice = await getAveragePriceForCategory(part.category);
    if (avgPrice > 0) {
      priceScore = 1 - (part.price / (avgPrice * 2)); // Score relative to 2x average
      priceScore = Math.max(0, Math.min(1, priceScore));

      if (part.price < avgPrice * 0.8) {
        reasons.push('below_average_price');
      }
    } else {
      priceScore = 0.5; // No comparison available
    }
  }

  // 3. Quality Score (0-1)
  let qualityScore = part.qualityRating / 5; // Assuming 5-star max

  // Boost for certifications
  const certifications = part.certifications || [];
  if (certifications.includes('OEM')) {
    qualityScore = Math.min(1.0, qualityScore + 0.1);
    reasons.push('oem_certified');
  }
  if (certifications.includes('CAPA')) {
    qualityScore = Math.min(1.0, qualityScore + 0.05);
    reasons.push('capa_certified');
  }

  // Boost for warranty
  if (part.warrantyMonths && part.warrantyMonths >= 36) {
    qualityScore = Math.min(1.0, qualityScore + 0.05);
    reasons.push('long_warranty');
  }

  // Boost for reviews
  if (part.reviewCount && part.reviewCount > 50) {
    qualityScore = Math.min(1.0, qualityScore + 0.05);
    reasons.push('well_reviewed');
  }

  // 4. Availability Score (0-1)
  let availabilityScore = 0;
  switch (part.availabilityStatus) {
    case 'in_stock':
      availabilityScore = 1.0;
      reasons.push('in_stock');
      break;
    case 'low_stock':
      availabilityScore = 0.8;
      break;
    case 'backorder':
      availabilityScore = 0.4;
      break;
    case 'special_order':
      availabilityScore = 0.3;
      break;
    default:
      availabilityScore = 0.1;
  }

  // Adjust for lead time
  if (part.leadTimeDays === 0) {
    availabilityScore = Math.min(1.0, availabilityScore + 0.1);
    reasons.push('same_day_available');
  } else if (part.leadTimeDays <= 2) {
    availabilityScore = Math.min(1.0, availabilityScore + 0.05);
  }

  // 5. Historical Performance
  const historicalScore = await getHistoricalScore(part.id);

  // Calculate weighted total score
  const weights = options.preferQuality
    ? { fitment: 0.3, price: 0.15, quality: 0.35, availability: 0.15, historical: 0.05 }
    : { fitment: 0.3, price: 0.35, quality: 0.15, availability: 0.15, historical: 0.05 };

  const totalScore =
    fitmentScore * weights.fitment +
    priceScore * weights.price +
    qualityScore * weights.quality +
    availabilityScore * weights.availability +
    historicalScore * weights.historical;

  // Add popularity reason
  if (part.isPopular) {
    reasons.push('popular_choice');
  }

  return {
    totalScore,
    fitmentScore,
    priceScore,
    qualityScore,
    availabilityScore,
    reasons,
  };
}

/**
 * Map damage information to part categories
 */
function mapDamageToCategories(damage: DamageInfo): string[] {
  const categories: Set<string> = new Set();

  for (const area of damage.affectedAreas) {
    switch (area.toLowerCase()) {
      case 'bumper':
      case 'front_bumper':
      case 'rear_bumper':
        categories.add('bumper');
        break;
      case 'hood':
        categories.add('hood');
        break;
      case 'fender':
      case 'front_fender':
      case 'rear_fender':
        categories.add('fender');
        break;
      case 'headlight':
      case 'headlights':
        categories.add('lighting');
        break;
      case 'taillight':
      case 'taillights':
        categories.add('lighting');
        break;
      case 'door':
      case 'front_door':
      case 'rear_door':
        categories.add('door');
        break;
      case 'mirror':
      case 'side_mirror':
        categories.add('mirror');
        break;
      case 'windshield':
        categories.add('glass');
        break;
      case 'radiator':
        categories.add('cooling');
        break;
      case 'wheel':
      case 'rim':
        categories.add('wheels');
        break;
      default:
        // Try to infer category
        if (area.includes('light')) categories.add('lighting');
        if (area.includes('glass')) categories.add('glass');
    }
  }

  // Add common related parts based on damage type
  switch (damage.type) {
    case 'front_collision':
      categories.add('bumper');
      categories.add('grille');
      if (damage.severity === 'moderate' || damage.severity === 'severe') {
        categories.add('hood');
        categories.add('lighting');
        categories.add('cooling');
      }
      break;
    case 'rear_collision':
      categories.add('bumper');
      categories.add('lighting');
      break;
    case 'side_impact':
      categories.add('door');
      categories.add('fender');
      categories.add('mirror');
      break;
  }

  return Array.from(categories);
}

/**
 * Find alternative parts (different suppliers, conditions, etc.)
 */
async function findAlternativeParts(
  basePart: PartCatalogItem,
  allParts: PartCatalogItem[],
  limit: number = 3
): Promise<PartCatalogItem[]> {
  // Find parts in the same category with similar fitment but different suppliers
  const alternatives = allParts
    .filter(p =>
      p.id !== basePart.id &&
      p.category === basePart.category &&
      p.make === basePart.make &&
      p.model === basePart.model
    )
    .slice(0, limit);

  return alternatives;
}

/**
 * Get average price for a category
 */
async function getAveragePriceForCategory(category: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('PartCatalog')
      .select('price')
      .eq('category', category)
      .eq('isActive', true)
      .in('availabilityStatus', ['in_stock', 'low_stock']);

    if (error || !data || data.length === 0) return 0;

    const sum = data.reduce((acc, item) => acc + item.price, 0);
    return sum / data.length;
  } catch (error) {
    return 0;
  }
}

/**
 * Get historical performance score for a part
 */
async function getHistoricalScore(partId: string): Promise<number> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data, error } = await supabase
      .from('PartAnalytics')
      .select('*')
      .eq('partCatalogId', partId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(30);

    if (error || !data || data.length === 0) return 0.5; // Neutral score

    // Calculate metrics
    const totalRecommended = data.reduce((sum, d) => sum + d.timesRecommended, 0);
    const totalSelected = data.reduce((sum, d) => sum + d.timesSelected, 0);
    const totalOrdered = data.reduce((sum, d) => sum + d.timesOrdered, 0);

    if (totalRecommended === 0) return 0.5;

    // Selection rate (how often recommended parts are selected)
    const selectionRate = totalSelected / totalRecommended;

    // Order rate (how often selected parts are ordered)
    const orderRate = totalSelected > 0 ? totalOrdered / totalSelected : 0;

    // Average fulfillment and return rates
    const avgFulfillment = data.reduce((sum, d) => sum + d.fulfillmentRate, 0) / data.length;
    const avgReturnRate = data.reduce((sum, d) => sum + d.returnRate, 0) / data.length;

    // Combined score (lower return rate is better)
    const score = (selectionRate * 0.3) + (orderRate * 0.3) + (avgFulfillment * 0.3) + ((1 - avgReturnRate) * 0.1);

    return Math.max(0, Math.min(1, score));
  } catch (error) {
    return 0.5;
  }
}

/**
 * Save recommendation to database
 */
async function saveRecommendation(
  estimateId: string,
  recommendation: PartRecommendation,
  vehicle: VehicleInfo,
  damage: DamageInfo
): Promise<void> {
  try {
    await supabase.from('PartRecommendation').insert({
      estimateId,
      partCatalogId: recommendation.part.id,
      damageType: damage.type,
      vehicleMake: vehicle.make,
      vehicleModel: vehicle.model,
      vehicleYear: vehicle.year,
      score: recommendation.score,
      fitmentScore: recommendation.fitmentScore,
      priceScore: recommendation.priceScore,
      qualityScore: recommendation.qualityScore,
      availabilityScore: recommendation.availabilityScore,
      reasons: recommendation.reasons,
      alternatives: recommendation.alternatives.map(a => a.id),
    });
  } catch (error) {
    console.error('Error saving recommendation:', error);
  }
}

/**
 * Record user feedback on recommendation
 */
export async function recordRecommendationFeedback(
  recommendationId: string,
  selected: boolean,
  feedback?: string
): Promise<void> {
  try {
    await supabase
      .from('PartRecommendation')
      .update({
        selected,
        rejected: !selected,
        userFeedback: feedback,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', recommendationId);
  } catch (error) {
    console.error('Error recording feedback:', error);
  }
}

/**
 * Get recommendations for an estimate
 */
export async function getRecommendationsForEstimate(
  estimateId: string
): Promise<PartRecommendation[]> {
  try {
    const { data, error } = await supabase
      .from('PartRecommendation')
      .select(`
        *,
        part:PartCatalog(
          *,
          supplier:Supplier(*)
        )
      `)
      .eq('estimateId', estimateId)
      .order('score', { ascending: false });

    if (error) throw error;

    return (data || []).map((rec: any) => ({
      part: rec.part,
      score: rec.score,
      fitmentScore: rec.fitmentScore,
      priceScore: rec.priceScore,
      qualityScore: rec.qualityScore,
      availabilityScore: rec.availabilityScore,
      reasons: rec.reasons || [],
      alternatives: [], // Would need to fetch separately
    }));
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
}
