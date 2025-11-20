"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Package, TrendingDown, ShoppingCart, Plus, Zap } from "lucide-react";
import SmartPartsLookup from "@/components/parts/SmartPartsLookup";

interface PartPrice {
  id: string;
  price: number;
  listPrice: number;
  inStock: boolean;
  leadTimeDays: number;
  warranty: string;
  productUrl: string;
  supplier: {
    id: string;
    name: string;
    code: string;
  };
}

interface Part {
  id: string;
  partNumber: string;
  name: string;
  description: string;
  isOEM: boolean;
  make: string;
  model: string;
  yearStart: number;
  yearEnd: number;
  category: string;
  priceRange: {
    lowest: number;
    highest: number;
    average: number;
  };
  supplierCount: number;
  prices: PartPrice[];
}

export default function PartsContent() {
  const [searchMode, setSearchMode] = useState<"smart" | "catalog">("smart");
  const [searchQuery, setSearchQuery] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  // Purchase order state
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<PartPrice | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [vehicleVin, setVehicleVin] = useState("");
  const [jobNotes, setJobNotes] = useState("");
  const [creating, setCreating] = useState(false);

  // Real-time polling state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const searchParts = async (silent = false) => {
    if (!searchQuery && !make) {
      return;
    }

    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("q", searchQuery);
      if (make) params.append("make", make);
      if (model) params.append("model", model);
      if (year) params.append("year", year);

      const response = await fetch(`/api/parts/search?${params}`);
      const data = await response.json();

      if (data.success) {
        setParts(data.parts);
        setLastUpdate(new Date());
      } else {
        console.error("Search failed:", data.error);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Auto-refresh every 10 seconds when search is active
  useEffect(() => {
    if (!autoRefresh || parts.length === 0) return;

    const interval = setInterval(() => {
      searchParts(true); // Silent refresh
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, parts.length, searchQuery, make, model, year]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchParts();
    }
  };

  const handleBuyNow = (part: Part, price: PartPrice) => {
    setSelectedPrice(price);
    // Pre-fill vehicle info from search
    setMake(part.make);
    setModel(part.model);
    setYear(part.yearStart?.toString() || "");
    setShowPurchaseForm(true);
  };

  const addToCart = (part: Part) => {
    const cartItem = {
      partId: part.id,
      partNumber: part.partNumber,
      partName: part.name,
      quantity: 1,
      weight: 10, // Default weight, can be updated later
      availablePrices: part.prices.map((p) => ({
        supplierId: p.supplier.id,
        supplierName: p.supplier.name,
        supplierCode: p.supplier.code,
        partPriceId: p.id,
        unitPrice: p.price,
        inStock: p.inStock,
        leadTimeDays: p.leadTimeDays,
        productUrl: p.productUrl,
      })),
    };

    // Load existing cart
    const savedCart = localStorage.getItem("collisionpro_cart");
    const cart = savedCart ? JSON.parse(savedCart) : [];

    // Check if part already in cart
    const existingIndex = cart.findIndex((item: any) => item.partId === part.id);
    if (existingIndex >= 0) {
      // Increment quantity
      cart[existingIndex].quantity += 1;
    } else {
      // Add new item
      cart.push(cartItem);
    }

    // Save cart
    localStorage.setItem("collisionpro_cart", JSON.stringify(cart));

    alert(`Added ${part.name} to cart!`);
  };

  const createPurchaseOrder = async () => {
    if (!selectedPart || !selectedPrice) return;

    setCreating(true);
    try {
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedPrice.supplier.id,
          parts: [
            {
              partId: selectedPart.id,
              partPriceId: selectedPrice.id,
              quantity: 1,
              productUrl: selectedPrice.productUrl,
            },
          ],
          customerName,
          vehicleMake: selectedPart.make,
          vehicleModel: selectedPart.model,
          vehicleYear: selectedPart.yearStart,
          vehicleVin,
          notes: jobNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Order ${data.order.orderNumber} created! Check Orders page to track.`);
        setShowPurchaseForm(false);
        setCustomerName("");
        setVehicleVin("");
        setJobNotes("");

        // Open supplier link in new tab
        if (selectedPrice.productUrl) {
          window.open(selectedPrice.productUrl, '_blank');
        }
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Order creation error:", error);
      alert("Failed to create order");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parts Catalog</h1>
          <p className="text-gray-600 mt-1">
            Search across 6 suppliers for the best prices
          </p>
        </div>

        {/* Real-time update indicator */}
        {parts.length > 0 && searchMode === "catalog" && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Live Updates
                </>
              ) : (
                "Enable Live Updates"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Search Mode Toggle */}
      <div className="flex gap-3 p-1 bg-gray-100 rounded-lg w-fit">
        <Button
          variant={searchMode === "smart" ? "default" : "ghost"}
          onClick={() => setSearchMode("smart")}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Smart Lookup (RockAuto)
        </Button>
        <Button
          variant={searchMode === "catalog" ? "default" : "ghost"}
          onClick={() => setSearchMode("catalog")}
          className="gap-2"
        >
          <Package className="h-4 w-4" />
          Multi-Supplier Catalog
        </Button>
      </div>

      {/* Smart Lookup Mode */}
      {searchMode === "smart" && (
        <SmartPartsLookup
          onSelectPart={(part) => {
            console.log("Part selected from Smart Lookup:", part);
            alert(`Added ${part.description} to cart!`);
          }}
        />
      )}

      {/* Catalog Search Mode */}
      {searchMode === "catalog" && (
        <>
          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Parts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Part name, number, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <Input
                  placeholder="Make (e.g., Honda)"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Input
                  placeholder="Model (e.g., Civic)"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Input
                  placeholder="Year (e.g., 2022)"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  onKeyPress={handleKeyPress}
                  type="number"
                />
              </div>
              <Button onClick={() => searchParts()} disabled={loading} className="mt-4">
                <Search className="h-4 w-4 mr-2" />
                {loading ? "Searching..." : "Search Parts"}
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {/* Results - Only for Catalog Mode */}
      {searchMode === "catalog" && parts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Found {parts.length} parts
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {parts.map((part) => (
              <Card
                key={part.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedPart(part)}
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold">{part.name}</h3>
                        {part.isOEM && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            OEM
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {part.description}
                      </p>
                      <div className="flex gap-4 text-sm text-gray-500">
                        <span>Part #: {part.partNumber}</span>
                        <span>
                          {part.make} {part.model} ({part.yearStart}-{part.yearEnd})
                        </span>
                        <span className="font-medium text-green-600">
                          {part.supplierCount} suppliers
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        ${part.priceRange.lowest?.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Avg: ${part.priceRange.average?.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-400">
                        High: ${part.priceRange.highest?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Part Detail Modal */}
      {selectedPart && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPart(null)}
        >
          <Card
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {selectedPart.name}
                    {selectedPart.isOEM && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        OEM
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-normal text-gray-500 mt-1">
                    Part #: {selectedPart.partNumber}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedPart(null)}
                >
                  X
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Price Comparison Table */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Price Comparison ({selectedPart.supplierCount} suppliers)
                  </h3>
                  <div className="space-y-2">
                    {selectedPart.prices.map((price, index) => (
                      <div
                        key={price.id}
                        className={`p-4 rounded-lg border-2 ${
                          index === 0
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {price.supplier.name}
                              </span>
                              {index === 0 && (
                                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">
                                  BEST PRICE
                                </span>
                              )}
                              {price.inStock ? (
                                <span className="text-green-600 text-sm">
                                  In Stock
                                </span>
                              ) : (
                                <span className="text-red-600 text-sm">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Ships in {price.leadTimeDays} days - {price.warranty} warranty
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              ${price.price.toFixed(2)}
                            </div>
                            {price.listPrice && (
                              <div className="text-sm text-gray-500 line-through">
                                ${price.listPrice.toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => window.open(price.productUrl, '_blank')}
                              disabled={!price.productUrl}
                            >
                              View on {price.supplier.name}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(selectedPart);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add to Cart
                            </Button>
                            <Button
                              onClick={() => handleBuyNow(selectedPart, price)}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Buy Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Savings Calculation */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-600">
                          Potential Savings
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          $
                          {(
                            selectedPart.priceRange.highest -
                            selectedPart.priceRange.lowest
                          ).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          By choosing the lowest price
                        </div>
                      </div>
                      <TrendingDown className="h-12 w-12 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Purchase Order Form Modal */}
      {showPurchaseForm && selectedPart && selectedPrice && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowPurchaseForm(false)}
        >
          <Card
            className="max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Create Purchase Order</CardTitle>
              <p className="text-sm text-gray-600">
                Buying: {selectedPart.name} from {selectedPrice.supplier.name}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Vehicle Info */}
                <div>
                  <h3 className="font-semibold mb-2">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Year</Label>
                      <Input value={year} onChange={(e) => setYear(e.target.value)} />
                    </div>
                    <div>
                      <Label>Make</Label>
                      <Input value={make} onChange={(e) => setMake(e.target.value)} />
                    </div>
                    <div>
                      <Label>Model</Label>
                      <Input value={model} onChange={(e) => setModel(e.target.value)} />
                    </div>
                    <div>
                      <Label>VIN</Label>
                      <Input
                        value={vehicleVin}
                        onChange={(e) => setVehicleVin(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div>
                  <Label>Customer Name</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                {/* Job Notes */}
                <div>
                  <Label>Job Notes</Label>
                  <Input
                    value={jobNotes}
                    onChange={(e) => setJobNotes(e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                {/* Order Summary */}
                <Card className="bg-gray-50">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-semibold">Part:</span>
                        <span>{selectedPart.partNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Supplier:</span>
                        <span>{selectedPrice.supplier.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold">Price:</span>
                        <span className="text-lg font-bold">
                          ${selectedPrice.price.toFixed(2)}
                        </span>
                      </div>
                      {selectedPrice.productUrl && (
                        <div className="text-sm text-gray-600 mt-2">
                          After creating order, you'll be directed to {selectedPrice.supplier.name} to complete purchase
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowPurchaseForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createPurchaseOrder}
                    disabled={creating}
                  >
                    {creating ? "Creating..." : "Create Order & Buy"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
