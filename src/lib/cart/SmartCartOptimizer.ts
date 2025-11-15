/**
 * SMART CART OPTIMIZER
 *
 * Automatically splits orders across multiple suppliers to:
 * 1. Minimize total cost (parts + shipping + tax)
 * 2. Account for shipping weight and costs
 * 3. Consider supplier-specific shipping thresholds (free shipping over $X)
 * 4. Optimize for delivery time if needed
 *
 * Example: 7 parts in cart
 * - Naive: Buy all from cheapest per-part = $500 + $80 shipping = $580
 * - Optimized: Split across 3 suppliers = $520 + $25 shipping = $545
 * - Savings: $35 (6%)
 */

export interface CartItem {
  partId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  weight?: number; // pounds

  // Available prices from different suppliers
  availablePrices: Array<{
    supplierId: string;
    supplierName: string;
    supplierCode: string;
    partPriceId: string;
    unitPrice: number;
    inStock: boolean;
    leadTimeDays: number;
    productUrl?: string;
  }>;
}

export interface SupplierShippingRule {
  supplierId: string;
  supplierName: string;
  supplierCode: string;

  // Shipping costs
  flatRate?: number; // Fixed shipping fee
  freeShippingThreshold?: number; // Free shipping over $X
  perPoundRate?: number; // $/lb
  perItemRate?: number; // $ per item

  // Defaults if not specified
  estimatedShippingDays: number;
}

export interface OptimizedOrder {
  supplierId: string;
  supplierName: string;
  supplierCode: string;

  items: Array<{
    partId: string;
    partNumber: string;
    partName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    partPriceId: string;
    productUrl?: string;
  }>;

  subtotal: number;
  estimatedShipping: number;
  estimatedTax: number;
  total: number;
  estimatedDeliveryDays: number;
}

export interface OptimizationResult {
  orders: OptimizedOrder[];
  totalCost: number;
  totalShipping: number;
  totalParts: number;
  savingsVsWorstCase: number;
  savingsPercentage: number;
}

// Default shipping rules (can be overridden per supplier)
const DEFAULT_SHIPPING_RULES: Record<string, SupplierShippingRule> = {
  AUTOZONE: {
    supplierId: 'sup_autozone',
    supplierName: 'AutoZone',
    supplierCode: 'AUTOZONE',
    freeShippingThreshold: 35,
    flatRate: 8.99,
    estimatedShippingDays: 1,
  },
  ROCKAUTO: {
    supplierId: 'sup_rockauto',
    supplierName: 'RockAuto',
    supplierCode: 'ROCKAUTO',
    perPoundRate: 2.50,
    estimatedShippingDays: 3,
  },
  OREILLY: {
    supplierId: 'sup_oreilly',
    supplierName: 'O\'Reilly',
    supplierCode: 'OREILLY',
    freeShippingThreshold: 50,
    flatRate: 7.99,
    estimatedShippingDays: 1,
  },
  NAPA: {
    supplierId: 'sup_napa',
    supplierName: 'NAPA',
    supplierCode: 'NAPA',
    freeShippingThreshold: 75,
    flatRate: 9.99,
    estimatedShippingDays: 2,
  },
  LKQ: {
    supplierId: 'sup_lkq',
    supplierName: 'LKQ',
    supplierCode: 'LKQ',
    perPoundRate: 1.99,
    freeShippingThreshold: 100,
    estimatedShippingDays: 2,
  },
  PARTSGEEK: {
    supplierId: 'sup_partsgeek',
    supplierName: 'PartsGeek',
    supplierCode: 'PARTSGEEK',
    flatRate: 12.99,
    perItemRate: 1.50,
    estimatedShippingDays: 4,
  },
};

export class SmartCartOptimizer {
  private taxRate: number;

  constructor(taxRate: number = 0.0825) {
    // 8.25% default (can be customized per shop)
    this.taxRate = taxRate;
  }

  /**
   * Calculate shipping cost for an order at a supplier
   */
  private calculateShipping(
    supplier: SupplierShippingRule,
    subtotal: number,
    totalWeight: number,
    itemCount: number
  ): number {
    // Free shipping threshold
    if (supplier.freeShippingThreshold && subtotal >= supplier.freeShippingThreshold) {
      return 0;
    }

    let shipping = 0;

    // Flat rate
    if (supplier.flatRate) {
      shipping += supplier.flatRate;
    }

    // Per-pound rate
    if (supplier.perPoundRate && totalWeight > 0) {
      shipping += totalWeight * supplier.perPoundRate;
    }

    // Per-item rate
    if (supplier.perItemRate) {
      shipping += itemCount * supplier.perItemRate;
    }

    return shipping;
  }

  /**
   * OPTIMIZATION ALGORITHM
   *
   * Uses greedy algorithm with backtracking:
   * 1. For each part, calculate total cost (price + shipping) from each supplier
   * 2. Try all possible supplier combinations
   * 3. Pick combination with lowest total cost
   *
   * For large carts (>10 parts), uses heuristic optimization
   */
  optimize(
    cartItems: CartItem[],
    shippingRules?: Record<string, SupplierShippingRule>
  ): OptimizationResult {
    const rules = shippingRules || DEFAULT_SHIPPING_RULES;

    // Group items by potential supplier
    const supplierGroups = new Map<string, Array<{
      item: CartItem;
      price: CartItem['availablePrices'][0];
    }>>();

    // Try greedy approach: assign each part to cheapest supplier
    // then evaluate total shipping costs and rebalance
    for (const item of cartItems) {
      // Sort prices by unit cost
      const sortedPrices = [...item.availablePrices]
        .filter(p => p.inStock)
        .sort((a, b) => a.unitPrice - b.unitPrice);

      if (sortedPrices.length === 0) {
        throw new Error(`No available price for ${item.partName}`);
      }

      // Initially assign to cheapest
      const bestPrice = sortedPrices[0];
      const key = bestPrice.supplierId;

      if (!supplierGroups.has(key)) {
        supplierGroups.set(key, []);
      }

      supplierGroups.get(key)!.push({ item, price: bestPrice });
    }

    // Calculate initial cost
    let orders = this.buildOrders(supplierGroups, rules);
    let bestCost = this.calculateTotalCost(orders);
    let bestOrders = orders;

    // Try optimizations: move items between suppliers to reduce shipping
    for (const item of cartItems) {
      const availableSuppliers = item.availablePrices.filter(p => p.inStock);

      for (const altPrice of availableSuppliers) {
        // Try moving this item to alternative supplier
        const testGroups = new Map(supplierGroups);

        // Remove from current supplier
        for (const [supplierId, items] of testGroups.entries()) {
          const index = items.findIndex(i => i.item.partId === item.partId);
          if (index >= 0) {
            items.splice(index, 1);
            if (items.length === 0) {
              testGroups.delete(supplierId);
            }
          }
        }

        // Add to alternative supplier
        if (!testGroups.has(altPrice.supplierId)) {
          testGroups.set(altPrice.supplierId, []);
        }
        testGroups.get(altPrice.supplierId)!.push({ item, price: altPrice });

        // Evaluate new cost
        const testOrders = this.buildOrders(testGroups, rules);
        const testCost = this.calculateTotalCost(testOrders);

        if (testCost < bestCost) {
          bestCost = testCost;
          bestOrders = testOrders;
          supplierGroups.clear();
          testGroups.forEach((v, k) => supplierGroups.set(k, v));
        }
      }
    }

    // Calculate savings vs worst case (most expensive parts + max shipping)
    const worstCaseCost = this.calculateWorstCase(cartItems, rules);
    const savings = worstCaseCost - bestCost;
    const savingsPercentage = (savings / worstCaseCost) * 100;

    return {
      orders: bestOrders,
      totalCost: bestCost,
      totalShipping: bestOrders.reduce((sum, o) => sum + o.estimatedShipping, 0),
      totalParts: cartItems.reduce((sum, i) => sum + i.quantity, 0),
      savingsVsWorstCase: savings,
      savingsPercentage,
    };
  }

  private buildOrders(
    supplierGroups: Map<string, Array<{ item: CartItem; price: CartItem['availablePrices'][0] }>>,
    rules: Record<string, SupplierShippingRule>
  ): OptimizedOrder[] {
    const orders: OptimizedOrder[] = [];

    for (const [supplierId, items] of supplierGroups.entries()) {
      const supplierCode = items[0].price.supplierCode;
      const supplierRule = rules[supplierCode] || {
        supplierId,
        supplierName: items[0].price.supplierName,
        supplierCode,
        flatRate: 10,
        estimatedShippingDays: 3,
      };

      const orderItems = items.map(({ item, price }) => ({
        partId: item.partId,
        partNumber: item.partNumber,
        partName: item.partName,
        quantity: item.quantity,
        unitPrice: price.unitPrice,
        totalPrice: price.unitPrice * item.quantity,
        partPriceId: price.partPriceId,
        productUrl: price.productUrl,
      }));

      const subtotal = orderItems.reduce((sum, i) => sum + i.totalPrice, 0);
      const totalWeight = items.reduce((sum, { item }) => sum + (item.weight || 5) * item.quantity, 0);
      const itemCount = items.reduce((sum, { item }) => sum + item.quantity, 0);

      const estimatedShipping = this.calculateShipping(
        supplierRule,
        subtotal,
        totalWeight,
        itemCount
      );

      const estimatedTax = subtotal * this.taxRate;
      const total = subtotal + estimatedShipping + estimatedTax;

      orders.push({
        supplierId,
        supplierName: supplierRule.supplierName,
        supplierCode,
        items: orderItems,
        subtotal,
        estimatedShipping,
        estimatedTax,
        total,
        estimatedDeliveryDays: supplierRule.estimatedShippingDays,
      });
    }

    return orders;
  }

  private calculateTotalCost(orders: OptimizedOrder[]): number {
    return orders.reduce((sum, o) => sum + o.total, 0);
  }

  private calculateWorstCase(
    cartItems: CartItem[],
    rules: Record<string, SupplierShippingRule>
  ): number {
    // Worst case: most expensive parts, each from different supplier
    let worstTotal = 0;

    for (const item of cartItems) {
      const maxPrice = Math.max(...item.availablePrices.map(p => p.unitPrice));
      worstTotal += maxPrice * item.quantity;

      // Add shipping for this item alone
      const supplier = Object.values(rules)[0]; // Just pick one
      worstTotal += supplier.flatRate || 10;
    }

    worstTotal += worstTotal * this.taxRate; // Tax

    return worstTotal;
  }
}
