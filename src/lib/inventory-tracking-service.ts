/**
 * Inventory Tracking Service
 *
 * Shop-level inventory management with automated reorder points,
 * transaction tracking, and stock optimization
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface InventoryItem {
  id: string;
  shopId: string;
  partCatalogId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  reorderQuantity: number;
  minimumStock: number;
  maximumStock: number;
  binLocation?: string;
  averageCost?: number;
  lastCost?: number;
  totalValue?: number;
  monthlyUsage: number;
  lastUsedDate?: string;
  lastRestockedDate?: string;
  part?: any;
}

export interface InventoryTransaction {
  id?: string;
  shopInventoryId: string;
  partCatalogId: string;
  shopId: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'reserve' | 'release';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  estimateId?: string;
  partsOrderId?: string;
  invoiceNumber?: string;
  reason?: string;
  notes?: string;
  performedBy?: string;
}

/**
 * Get inventory for a shop
 */
export async function getShopInventory(
  shopId: string,
  filters?: {
    lowStock?: boolean;
    category?: string;
    search?: string;
  }
): Promise<InventoryItem[]> {
  try {
    let query = supabase
      .from('ShopInventory')
      .select(`
        *,
        part:PartCatalog(*)
      `)
      .eq('shopId', shopId)
      .eq('isActive', true);

    if (filters?.lowStock) {
      // This will be handled client-side since we need computed column
      const { data, error } = await query;
      if (error) throw error;

      return (data || []).filter(item => item.quantityAvailable <= item.reorderPoint);
    }

    if (filters?.category) {
      // Join filter on part category
      query = query.eq('part.category', filters.category);
    }

    const { data, error } = await query.order('quantityAvailable', { ascending: true });

    if (error) throw error;

    // Apply search filter client-side
    let results = data || [];
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      results = results.filter(item =>
        item.part?.name?.toLowerCase().includes(searchLower) ||
        item.part?.partNumber?.toLowerCase().includes(searchLower) ||
        item.binLocation?.toLowerCase().includes(searchLower)
      );
    }

    return results;
  } catch (error: any) {
    console.error('Error fetching shop inventory:', error);
    return [];
  }
}

/**
 * Get low stock items
 */
export async function getLowStockItems(shopId: string): Promise<InventoryItem[]> {
  try {
    const { data, error } = await supabase.rpc('get_low_stock_items', {
      p_shop_id: shopId,
    });

    if (error) {
      // Fallback if function doesn't exist
      return getShopInventory(shopId, { lowStock: true });
    }

    return data || [];
  } catch (error: any) {
    console.error('Error fetching low stock items:', error);
    return [];
  }
}

/**
 * Add or update inventory item
 */
export async function upsertInventoryItem(
  shopId: string,
  partCatalogId: string,
  data: Partial<InventoryItem>
): Promise<InventoryItem | null> {
  try {
    const { data: result, error } = await supabase
      .from('ShopInventory')
      .upsert({
        shopId,
        partCatalogId,
        ...data,
        updatedAt: new Date().toISOString(),
      }, {
        onConflict: 'shopId,partCatalogId',
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error: any) {
    console.error('Error upserting inventory item:', error);
    return null;
  }
}

/**
 * Record inventory transaction
 */
export async function recordTransaction(
  transaction: InventoryTransaction
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('InventoryTransaction')
      .insert({
        ...transaction,
        createdAt: new Date().toISOString(),
      });

    if (error) throw error;

    // Update monthly usage if it's a sale
    if (transaction.type === 'sale') {
      await updateMonthlyUsage(transaction.shopInventoryId, Math.abs(transaction.quantity));
    }

    return true;
  } catch (error: any) {
    console.error('Error recording transaction:', error);
    return false;
  }
}

/**
 * Purchase/receive parts
 */
export async function receiveParts(
  shopId: string,
  partCatalogId: string,
  quantity: number,
  unitCost?: number,
  invoiceNumber?: string,
  notes?: string
): Promise<boolean> {
  try {
    // Get or create inventory item
    let inventoryItem = await getInventoryItemByPart(shopId, partCatalogId);

    if (!inventoryItem) {
      // Create new inventory item
      inventoryItem = await upsertInventoryItem(shopId, partCatalogId, {
        quantityOnHand: 0,
        quantityReserved: 0,
        reorderPoint: 5,
        reorderQuantity: 10,
        minimumStock: 2,
        maximumStock: 50,
        monthlyUsage: 0,
      });

      if (!inventoryItem) return false;
    }

    // Record transaction
    await recordTransaction({
      shopInventoryId: inventoryItem.id,
      partCatalogId,
      shopId,
      type: 'purchase',
      quantity,
      unitCost,
      totalCost: unitCost ? unitCost * quantity : undefined,
      invoiceNumber,
      notes,
    });

    // Update average cost
    if (unitCost) {
      const newAvgCost = calculateAverageCost(
        inventoryItem.averageCost || 0,
        inventoryItem.quantityOnHand,
        unitCost,
        quantity
      );

      await supabase
        .from('ShopInventory')
        .update({
          averageCost: newAvgCost,
          lastCost: unitCost,
        })
        .eq('id', inventoryItem.id);
    }

    return true;
  } catch (error: any) {
    console.error('Error receiving parts:', error);
    return false;
  }
}

/**
 * Use parts from inventory
 */
export async function useParts(
  shopId: string,
  partCatalogId: string,
  quantity: number,
  estimateId?: string,
  notes?: string
): Promise<boolean> {
  try {
    const inventoryItem = await getInventoryItemByPart(shopId, partCatalogId);
    if (!inventoryItem) {
      throw new Error('Part not in inventory');
    }

    if (inventoryItem.quantityAvailable < quantity) {
      throw new Error('Insufficient inventory');
    }

    // Record transaction (negative quantity for usage)
    await recordTransaction({
      shopInventoryId: inventoryItem.id,
      partCatalogId,
      shopId,
      type: 'sale',
      quantity: -quantity,
      unitCost: inventoryItem.averageCost,
      totalCost: inventoryItem.averageCost ? inventoryItem.averageCost * quantity : undefined,
      estimateId,
      notes,
    });

    return true;
  } catch (error: any) {
    console.error('Error using parts:', error);
    return false;
  }
}

/**
 * Reserve parts for an estimate
 */
export async function reserveParts(
  shopId: string,
  partCatalogId: string,
  quantity: number,
  estimateId: string
): Promise<boolean> {
  try {
    const inventoryItem = await getInventoryItemByPart(shopId, partCatalogId);
    if (!inventoryItem) {
      return false;
    }

    if (inventoryItem.quantityAvailable < quantity) {
      return false;
    }

    await recordTransaction({
      shopInventoryId: inventoryItem.id,
      partCatalogId,
      shopId,
      type: 'reserve',
      quantity,
      estimateId,
    });

    return true;
  } catch (error: any) {
    console.error('Error reserving parts:', error);
    return false;
  }
}

/**
 * Release reserved parts
 */
export async function releaseParts(
  shopId: string,
  partCatalogId: string,
  quantity: number,
  estimateId: string
): Promise<boolean> {
  try {
    const inventoryItem = await getInventoryItemByPart(shopId, partCatalogId);
    if (!inventoryItem) {
      return false;
    }

    await recordTransaction({
      shopInventoryId: inventoryItem.id,
      partCatalogId,
      shopId,
      type: 'release',
      quantity,
      estimateId,
    });

    return true;
  } catch (error: any) {
    console.error('Error releasing parts:', error);
    return false;
  }
}

/**
 * Adjust inventory (for corrections, damage, etc.)
 */
export async function adjustInventory(
  shopId: string,
  partCatalogId: string,
  quantityChange: number,
  reason: string,
  notes?: string
): Promise<boolean> {
  try {
    const inventoryItem = await getInventoryItemByPart(shopId, partCatalogId);
    if (!inventoryItem) {
      return false;
    }

    await recordTransaction({
      shopInventoryId: inventoryItem.id,
      partCatalogId,
      shopId,
      type: 'adjustment',
      quantity: quantityChange,
      reason,
      notes,
    });

    return true;
  } catch (error: any) {
    console.error('Error adjusting inventory:', error);
    return false;
  }
}

/**
 * Get transaction history
 */
export async function getTransactionHistory(
  shopId: string,
  filters?: {
    partCatalogId?: string;
    type?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }
): Promise<InventoryTransaction[]> {
  try {
    let query = supabase
      .from('InventoryTransaction')
      .select('*')
      .eq('shopId', shopId);

    if (filters?.partCatalogId) {
      query = query.eq('partCatalogId', filters.partCatalogId);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    if (filters?.startDate) {
      query = query.gte('createdAt', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('createdAt', filters.endDate.toISOString());
    }

    query = query.order('createdAt', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}

/**
 * Get inventory item by part
 */
async function getInventoryItemByPart(
  shopId: string,
  partCatalogId: string
): Promise<InventoryItem | null> {
  try {
    const { data, error } = await supabase
      .from('ShopInventory')
      .select('*')
      .eq('shopId', shopId)
      .eq('partCatalogId', partCatalogId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching inventory item:', error);
    return null;
  }
}

/**
 * Calculate weighted average cost
 */
function calculateAverageCost(
  currentAvgCost: number,
  currentQuantity: number,
  newUnitCost: number,
  newQuantity: number
): number {
  const totalCost = (currentAvgCost * currentQuantity) + (newUnitCost * newQuantity);
  const totalQuantity = currentQuantity + newQuantity;

  return totalQuantity > 0 ? totalCost / totalQuantity : newUnitCost;
}

/**
 * Update monthly usage
 */
async function updateMonthlyUsage(
  inventoryId: string,
  quantityUsed: number
): Promise<void> {
  try {
    const { data: inventory } = await supabase
      .from('ShopInventory')
      .select('monthlyUsage')
      .eq('id', inventoryId)
      .single();

    if (inventory) {
      await supabase
        .from('ShopInventory')
        .update({
          monthlyUsage: (inventory.monthlyUsage || 0) + quantityUsed,
        })
        .eq('id', inventoryId);
    }
  } catch (error) {
    console.error('Error updating monthly usage:', error);
  }
}

/**
 * Get inventory valuation
 */
export async function getInventoryValuation(shopId: string): Promise<{
  totalValue: number;
  itemCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}> {
  try {
    const inventory = await getShopInventory(shopId);

    const totalValue = inventory.reduce((sum, item) => sum + (item.totalValue || 0), 0);
    const itemCount = inventory.length;
    const lowStockCount = inventory.filter(item => item.quantityAvailable <= item.reorderPoint).length;
    const outOfStockCount = inventory.filter(item => item.quantityOnHand === 0).length;

    return {
      totalValue,
      itemCount,
      lowStockCount,
      outOfStockCount,
    };
  } catch (error: any) {
    console.error('Error calculating inventory valuation:', error);
    return {
      totalValue: 0,
      itemCount: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };
  }
}

/**
 * Generate reorder suggestions
 */
export async function generateReorderSuggestions(shopId: string): Promise<{
  partId: string;
  partName: string;
  currentStock: number;
  reorderPoint: number;
  suggestedQuantity: number;
  estimatedCost: number;
}[]> {
  try {
    const lowStock = await getLowStockItems(shopId);

    const suggestions = lowStock.map((item: any) => ({
      partId: item.part_id || item.partCatalogId,
      partName: item.part_name || item.part?.name || 'Unknown',
      currentStock: item.quantity_available || item.quantityAvailable || 0,
      reorderPoint: item.reorder_point || item.reorderPoint || 5,
      suggestedQuantity: item.reorder_quantity || item.reorderQuantity || 10,
      estimatedCost: (item.reorder_quantity || item.reorderQuantity || 10) * (item.averageCost || item.lastCost || 0),
    }));

    return suggestions;
  } catch (error: any) {
    console.error('Error generating reorder suggestions:', error);
    return [];
  }
}
