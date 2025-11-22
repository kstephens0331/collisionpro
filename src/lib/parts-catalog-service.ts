/**
 * Parts Catalog Service
 *
 * Multi-supplier parts catalog with smart search, recommendations, and pricing
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type PartCondition = 'new' | 'oem' | 'aftermarket' | 'used' | 'refurbished' | 'remanufactured';
export type PartQualityGrade = 'premium' | 'standard' | 'economy' | 'budget';
export type PartAvailabilityStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'backorder' | 'discontinued' | 'special_order';

export interface PartCatalogItem {
  id: string;
  partNumber: string;
  supplierPartNumber?: string;
  supplierId: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  manufacturer?: string;
  brand?: string;
  condition: PartCondition;
  qualityGrade: PartQualityGrade;

  // Fitment
  make?: string;
  model?: string;
  year?: number;
  yearStart?: number;
  yearEnd?: number;
  fitmentNotes?: string;
  universalFit: boolean;
  compatibleVehicles?: any[];

  // Pricing
  cost?: number;
  msrp?: number;
  price: number;
  coreCharge?: number;
  shippingCost?: number;
  taxable: boolean;

  // Inventory
  quantityAvailable: number;
  availabilityStatus: PartAvailabilityStatus;
  leadTimeDays: number;

  // Images
  imageUrl?: string;
  images?: string[];

  // Quality
  warrantyMonths: number;
  warrantyType?: string;
  certifications?: string[];
  qualityRating: number;
  reviewCount: number;

  // Supplier
  supplier?: any;
  isPopular?: boolean;
}

export interface PartSearchFilters {
  query?: string;
  category?: string;
  make?: string;
  model?: string;
  year?: number;
  condition?: PartCondition[];
  qualityGrade?: PartQualityGrade[];
  priceMin?: number;
  priceMax?: number;
  availabilityStatus?: PartAvailabilityStatus[];
  supplierId?: string;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'availability' | 'relevance';
  limit?: number;
  offset?: number;
}

/**
 * Search parts catalog
 */
export async function searchParts(filters: PartSearchFilters): Promise<{
  parts: PartCatalogItem[];
  total: number;
}> {
  try {
    let query = supabase
      .from('PartCatalog')
      .select(`
        *,
        supplier:Supplier(id, name, logo, rating)
      `, { count: 'exact' })
      .eq('isActive', true);

    // Text search
    if (filters.query) {
      query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%,partNumber.ilike.%${filters.query}%`);
    }

    // Category filter
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    // Fitment filters
    if (filters.make) {
      query = query.or(`make.eq.${filters.make},universalFit.eq.true`);
    }
    if (filters.model) {
      query = query.or(`model.eq.${filters.model},universalFit.eq.true`);
    }
    if (filters.year) {
      query = query.or(`year.eq.${filters.year},and(yearStart.lte.${filters.year},yearEnd.gte.${filters.year}),universalFit.eq.true`);
    }

    // Condition filter
    if (filters.condition && filters.condition.length > 0) {
      query = query.in('condition', filters.condition);
    }

    // Quality grade filter
    if (filters.qualityGrade && filters.qualityGrade.length > 0) {
      query = query.in('qualityGrade', filters.qualityGrade);
    }

    // Price range
    if (filters.priceMin !== undefined) {
      query = query.gte('price', filters.priceMin);
    }
    if (filters.priceMax !== undefined) {
      query = query.lte('price', filters.priceMax);
    }

    // Availability
    if (filters.inStock) {
      query = query.in('availabilityStatus', ['in_stock', 'low_stock']);
    }
    if (filters.availabilityStatus && filters.availabilityStatus.length > 0) {
      query = query.in('availabilityStatus', filters.availabilityStatus);
    }

    // Supplier filter
    if (filters.supplierId) {
      query = query.eq('supplierId', filters.supplierId);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'rating':
        query = query.order('qualityRating', { ascending: false });
        break;
      case 'availability':
        query = query.order('quantityAvailable', { ascending: false });
        break;
      default:
        // Relevance: prioritize exact matches, then in-stock, then by rating
        query = query.order('isPopular', { ascending: false })
                     .order('availabilityStatus', { ascending: true })
                     .order('qualityRating', { ascending: false });
    }

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      parts: data || [],
      total: count || 0,
    };
  } catch (error: any) {
    console.error('Error searching parts:', error);
    throw error;
  }
}

/**
 * Get part by ID
 */
export async function getPartById(partId: string): Promise<PartCatalogItem | null> {
  try {
    const { data, error } = await supabase
      .from('PartCatalog')
      .select(`
        *,
        supplier:Supplier(*)
      `)
      .eq('id', partId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error fetching part:', error);
    return null;
  }
}

/**
 * Find compatible parts for a vehicle
 */
export async function findCompatibleParts(
  category: string,
  make: string,
  model: string,
  year: number,
  limit: number = 20
): Promise<PartCatalogItem[]> {
  try {
    const { data, error } = await supabase
      .from('PartCatalog')
      .select(`
        *,
        supplier:Supplier(id, name, rating)
      `)
      .eq('isActive', true)
      .eq('category', category)
      .or(`and(make.eq.${make},model.eq.${model},yearStart.lte.${year},yearEnd.gte.${year}),universalFit.eq.true`)
      .in('availabilityStatus', ['in_stock', 'low_stock'])
      .order('qualityRating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error finding compatible parts:', error);
    return [];
  }
}

/**
 * Compare parts across suppliers
 */
export async function compareParts(partIds: string[]): Promise<{
  parts: PartCatalogItem[];
  comparison: {
    lowestPrice: number;
    highestPrice: number;
    averagePrice: number;
    bestValue?: PartCatalogItem;
    fastestShipping?: PartCatalogItem;
    highestRated?: PartCatalogItem;
  };
}> {
  try {
    const { data, error } = await supabase
      .from('PartCatalog')
      .select(`
        *,
        supplier:Supplier(id, name, rating, shippingSpeed)
      `)
      .in('id', partIds);

    if (error) throw error;

    const parts = data || [];

    if (parts.length === 0) {
      return {
        parts: [],
        comparison: {
          lowestPrice: 0,
          highestPrice: 0,
          averagePrice: 0,
        },
      };
    }

    const prices = parts.map(p => p.price);
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // Calculate value score (price vs quality)
    const partsWithScore = parts.map(p => ({
      ...p,
      valueScore: p.qualityRating / p.price, // Higher is better
    }));

    const bestValue = partsWithScore.sort((a, b) => b.valueScore - a.valueScore)[0];
    const fastestShipping = parts.sort((a, b) => a.leadTimeDays - b.leadTimeDays)[0];
    const highestRated = parts.sort((a, b) => b.qualityRating - a.qualityRating)[0];

    return {
      parts,
      comparison: {
        lowestPrice,
        highestPrice,
        averagePrice,
        bestValue,
        fastestShipping,
        highestRated,
      },
    };
  } catch (error: any) {
    console.error('Error comparing parts:', error);
    throw error;
  }
}

/**
 * Get popular parts for a category
 */
export async function getPopularParts(
  category: string,
  limit: number = 10
): Promise<PartCatalogItem[]> {
  try {
    const { data, error } = await supabase
      .from('PartCatalog')
      .select(`
        *,
        supplier:Supplier(id, name, rating)
      `)
      .eq('isActive', true)
      .eq('category', category)
      .eq('isPopular', true)
      .in('availabilityStatus', ['in_stock', 'low_stock'])
      .order('qualityRating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching popular parts:', error);
    return [];
  }
}

/**
 * Update part pricing
 */
export async function updatePartPricing(
  partId: string,
  price: number,
  cost?: number,
  msrp?: number,
  availabilityStatus?: PartAvailabilityStatus,
  quantityAvailable?: number
): Promise<void> {
  try {
    // Record in pricing history
    await supabase.from('PartPricingHistory').insert({
      partCatalogId: partId,
      price,
      cost,
      msrp,
      availabilityStatus,
      quantityAvailable,
      source: 'api',
    });

    // Update current pricing
    const updates: any = {
      price,
      lastPriceUpdate: new Date().toISOString(),
    };

    if (cost !== undefined) updates.cost = cost;
    if (msrp !== undefined) updates.msrp = msrp;
    if (availabilityStatus) updates.availabilityStatus = availabilityStatus;
    if (quantityAvailable !== undefined) updates.quantityAvailable = quantityAvailable;

    const { error } = await supabase
      .from('PartCatalog')
      .update(updates)
      .eq('id', partId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Error updating part pricing:', error);
    throw error;
  }
}

/**
 * Get pricing history for a part
 */
export async function getPartPricingHistory(
  partId: string,
  days: number = 30
): Promise<any[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('PartPricingHistory')
      .select('*')
      .eq('partCatalogId', partId)
      .gte('recordedAt', startDate.toISOString())
      .order('recordedAt', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching pricing history:', error);
    return [];
  }
}

/**
 * Bulk import parts from supplier API
 */
export async function bulkImportParts(parts: Partial<PartCatalogItem>[]): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const part of parts) {
    try {
      const { error } = await supabase
        .from('PartCatalog')
        .upsert({
          ...part,
          updatedAt: new Date().toISOString(),
        }, {
          onConflict: 'partNumber,supplierId',
        });

      if (error) {
        results.failed++;
        results.errors.push(`${part.partNumber}: ${error.message}`);
      } else {
        results.success++;
      }
    } catch (error: any) {
      results.failed++;
      results.errors.push(`${part.partNumber}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Get parts needing price updates
 */
export async function getPartsNeedingPriceUpdate(
  supplierId?: string
): Promise<PartCatalogItem[]> {
  try {
    let query = supabase
      .from('PartCatalog')
      .select('*')
      .eq('isActive', true)
      .eq('autoUpdatePricing', true);

    if (supplierId) {
      query = query.eq('supplierId', supplierId);
    }

    // Find parts where last update was more than their update frequency
    const { data, error } = await query;

    if (error) throw error;

    // Filter based on update frequency
    const now = new Date();
    const needsUpdate = (data || []).filter(part => {
      if (!part.lastPriceUpdate) return true;

      const lastUpdate = new Date(part.lastPriceUpdate);
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

      switch (part.pricingUpdateFrequency) {
        case 'real_time':
          return hoursSinceUpdate >= 0.25; // 15 minutes
        case 'hourly':
          return hoursSinceUpdate >= 1;
        case 'daily':
          return hoursSinceUpdate >= 24;
        case 'weekly':
          return hoursSinceUpdate >= 168;
        default:
          return false;
      }
    });

    return needsUpdate;
  } catch (error: any) {
    console.error('Error fetching parts needing update:', error);
    return [];
  }
}
