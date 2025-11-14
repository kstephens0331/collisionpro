"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, TrendingDown, TrendingUp, ShoppingCart } from "lucide-react";

interface PartPrice {
  id: string;
  price: number;
  listPrice: number;
  inStock: boolean;
  leadTimeDays: number;
  warranty: string;
  supplier: {
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

export default function PartsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);

  const searchParts = async () => {
    if (!searchQuery && !make) {
      return;
    }

    setLoading(true);
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
      } else {
        console.error("Search failed:", data.error);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchParts();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parts Catalog</h1>
        <p className="text-gray-600 mt-1">
          Search across 6 suppliers for the best prices
        </p>
      </div>

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
          <Button onClick={searchParts} disabled={loading} className="mt-4">
            <Search className="h-4 w-4 mr-2" />
            {loading ? "Searching..." : "Search Parts"}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {parts.length > 0 && (
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
                  ✕
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
                                  ✓ In Stock
                                </span>
                              ) : (
                                <span className="text-red-600 text-sm">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Ships in {price.leadTimeDays} days • {price.warranty} warranty
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
                          <Button className="ml-4">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Estimate
                          </Button>
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
    </div>
  );
}
