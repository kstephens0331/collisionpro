"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, ShoppingCart, Sparkles, ExternalLink, DollarSign } from "lucide-react";

interface CartItem {
  partId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  weight?: number;
  availablePrices: Array<{
    supplierId: string;
    supplierName: string;
    supplierCode: string;
    partPriceId: string;
    unitPrice: number;
    inStock: boolean;
    leadTimeDays?: number;
    productUrl?: string;
  }>;
}

interface OptimizedOrder {
  supplierName: string;
  supplierCode: string;
  items: Array<{
    partName: string;
    partNumber: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productUrl?: string;
  }>;
  subtotal: number;
  estimatedShipping: number;
  estimatedTax: number;
  total: number;
  estimatedDeliveryDays: number;
}

interface OptimizationResult {
  orders: OptimizedOrder[];
  totalCost: number;
  totalShipping: number;
  totalParts: number;
  savingsVsWorstCase: number;
  savingsPercentage: number;
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(0.0825); // Default 8.25%
  const [customerName, setCustomerName] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehicleVin, setVehicleVin] = useState("");
  const [jobNotes, setJobNotes] = useState("");

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("collisionpro_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("collisionpro_cart", JSON.stringify(cart));
  }, [cart]);

  const removeFromCart = (partId: string) => {
    setCart(cart.filter((item) => item.partId !== partId));
    setOptimization(null); // Clear optimization
  };

  const updateQuantity = (partId: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(
      cart.map((item) =>
        item.partId === partId ? { ...item, quantity } : item
      )
    );
    setOptimization(null); // Clear optimization
  };

  const optimizeCart = async () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await fetch("/api/cart/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          taxRate,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOptimization(data.optimization);
      } else {
        alert(`Optimization failed: ${data.error}`);
      }
    } catch (error: any) {
      console.error("Optimization error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const createAllOrders = async () => {
    if (!optimization) return;

    const orderPromises = optimization.orders.map(async (order) => {
      // Find supplier ID from first item's available prices
      const firstPartId = cart.find(
        (c) => c.partName === order.items[0].partName
      )?.partId;
      const firstPart = cart.find((c) => c.partId === firstPartId);
      const supplier = firstPart?.availablePrices.find(
        (p) => p.supplierCode === order.supplierCode
      );

      if (!supplier) {
        console.error(`Supplier not found for ${order.supplierCode}`);
        return null;
      }

      const parts = order.items.map((item) => {
        const cartItem = cart.find((c) => c.partName === item.partName);
        const price = cartItem?.availablePrices.find(
          (p) => p.supplierCode === order.supplierCode
        );

        return {
          partId: cartItem?.partId,
          partPriceId: price?.partPriceId,
          quantity: item.quantity,
          productUrl: price?.productUrl,
        };
      });

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: supplier.supplierId,
          parts,
          customerName: customerName || "Walk-in Customer",
          vehicleMake: vehicleMake || null,
          vehicleModel: vehicleModel || null,
          vehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
          vehicleVin: vehicleVin || null,
          notes: jobNotes || `Optimized order from cart (saved $${optimization.savingsVsWorstCase.toFixed(2)})`,
        }),
      });

      const data = await response.json();
      return data.success ? data.order : null;
    });

    const createdOrders = await Promise.all(orderPromises);
    const successfulOrders = createdOrders.filter((o) => o !== null);

    if (successfulOrders.length === optimization.orders.length) {
      alert(
        `Success! Created ${successfulOrders.length} purchase orders.\n\nOrder Numbers:\n${successfulOrders.map((o) => o.orderNumber).join("\n")}\n\nTotal Savings: $${optimization.savingsVsWorstCase.toFixed(2)}`
      );

      // Open all supplier tabs
      optimization.orders.forEach((order) => {
        const firstItem = order.items[0];
        if (firstItem.productUrl) {
          window.open(firstItem.productUrl, "_blank");
        }
      });

      // Clear cart
      setCart([]);
      setOptimization(null);
    } else {
      alert(
        `Warning: Only ${successfulOrders.length} of ${optimization.orders.length} orders were created successfully.`
      );
    }
  };

  const cartTotal = cart.reduce((sum, item) => {
    const lowestPrice = Math.min(
      ...item.availablePrices.filter((p) => p.inStock).map((p) => p.unitPrice)
    );
    return sum + lowestPrice * item.quantity;
  }, 0);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        <p className="text-gray-600 mt-2">
          Add parts and optimize across suppliers for maximum savings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-gray-600 mb-4">
                  Add parts from the Parts Catalog to get started
                </p>
                <Button asChild>
                  <a href="/dashboard/parts">Browse Parts</a>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {cart.map((item) => {
                const lowestPrice = Math.min(
                  ...item.availablePrices
                    .filter((p) => p.inStock)
                    .map((p) => p.unitPrice)
                );
                const supplierCount = item.availablePrices.filter(
                  (p) => p.inStock
                ).length;

                return (
                  <Card key={item.partId}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {item.partName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Part #: {item.partNumber}
                          </p>
                          <p className="text-sm text-blue-600 mt-1">
                            {supplierCount} suppliers available
                          </p>
                          {item.weight && (
                            <p className="text-sm text-gray-500">
                              Weight: {item.weight} lbs
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-600">From</p>
                            <p className="text-lg font-bold text-green-600">
                              ${lowestPrice.toFixed(2)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Label htmlFor={`qty-${item.partId}`} className="text-sm">
                              Qty:
                            </Label>
                            <Input
                              id={`qty-${item.partId}`}
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(
                                  item.partId,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-20"
                              min="1"
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.partId)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>

        {/* Summary & Optimization */}
        <div className="space-y-4">
          {/* Cart Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Cart Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Items:</span>
                <span className="font-semibold">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal (est):</span>
                <span className="font-semibold">${cartTotal.toFixed(2)}</span>
              </div>

              <div className="border-t pt-4">
                <Label htmlFor="taxRate" className="text-sm">
                  Tax Rate (%)
                </Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={(taxRate * 100).toFixed(2)}
                  onChange={(e) =>
                    setTaxRate(parseFloat(e.target.value) / 100 || 0.0825)
                  }
                  className="mt-1"
                />
              </div>

              <Button
                onClick={optimizeCart}
                disabled={cart.length === 0 || isOptimizing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isOptimizing ? "Optimizing..." : "Optimize Cart"}
              </Button>
            </CardContent>
          </Card>

          {/* Optimization Result */}
          {optimization && (
            <Card className="border-green-500 border-2">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Optimized Savings: ${optimization.savingsVsWorstCase.toFixed(2)}
                </CardTitle>
                <p className="text-sm text-green-700">
                  {optimization.savingsPercentage.toFixed(1)}% less than single
                  supplier
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {optimization.orders.map((order, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-4 bg-gray-50 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {order.supplierName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {order.items.length} parts • {order.estimatedDeliveryDays}{" "}
                          day delivery
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          ${order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 text-sm">
                      {order.items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex justify-between text-gray-700"
                        >
                          <span>
                            {item.quantity}x {item.partName}
                          </span>
                          <span>${item.totalPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-2 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>${order.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Shipping:</span>
                        <span>${order.estimatedShipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Tax:</span>
                        <span>${order.estimatedTax.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="border-t pt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Customer Name</Label>
                    <Input
                      id="customerName"
                      placeholder="John Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="vehicleMake">Make</Label>
                      <Input
                        id="vehicleMake"
                        placeholder="Honda"
                        value={vehicleMake}
                        onChange={(e) => setVehicleMake(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleModel">Model</Label>
                      <Input
                        id="vehicleModel"
                        placeholder="Civic"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="vehicleYear">Year</Label>
                      <Input
                        id="vehicleYear"
                        placeholder="2020"
                        value={vehicleYear}
                        onChange={(e) => setVehicleYear(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleVin">VIN</Label>
                      <Input
                        id="vehicleVin"
                        placeholder="1HGBH41..."
                        value={vehicleVin}
                        onChange={(e) => setVehicleVin(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="jobNotes">Job Notes (Optional)</Label>
                    <Input
                      id="jobNotes"
                      placeholder="Front-end collision repair"
                      value={jobNotes}
                      onChange={(e) => setJobNotes(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={createAllOrders}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Create {optimization.orders.length} Purchase Orders
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    This will create {optimization.orders.length} purchase orders and
                    open supplier tabs
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
