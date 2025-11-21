"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingDown,
  Truck,
  Star,
  Clock,
  CheckCircle2,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  searchAllSuppliers,
  PriceComparisonResult,
  SupplierPrice,
  calculateTotalCost,
  formatShippingTime,
  getQualityBadgeColor,
} from "@/lib/suppliers/price-comparison";

interface PriceComparisonProps {
  partName: string;
  partNumber?: string;
  year?: number;
  make?: string;
  model?: string;
  onSelectPart?: (part: SupplierPrice) => void;
}

export default function PriceComparison({
  partName,
  partNumber,
  year,
  make,
  model,
  onSelectPart,
}: PriceComparisonProps) {
  const [results, setResults] = useState<PriceComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const comparisonResults = await searchAllSuppliers({
        partName,
        partNumber,
        year,
        make,
        model,
      });
      setResults(comparisonResults);
      setSearched(true);
    } catch (error) {
      console.error('Error searching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSupplierLogo = (supplier: string) => {
    // In production, these would be actual supplier logos
    const logos: Record<string, string> = {
      rockauto: '🚗',
      autozone: '🔧',
      oreilly: '⚙️',
      napa: '🔩',
      lkq: '♻️',
      oem: '✨',
    };
    return logos[supplier] || '📦';
  };

  const getBestBadge = (part: SupplierPrice) => {
    if (!results) return null;

    if (results.lowestPrice?.partNumber === part.partNumber) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <DollarSign className="h-3 w-3 mr-1" />
          Lowest Price
        </Badge>
      );
    }

    if (results.fastestShipping?.partNumber === part.partNumber) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Truck className="h-3 w-3 mr-1" />
          Fastest Ship
        </Badge>
      );
    }

    if (results.bestValue?.partNumber === part.partNumber) {
      return (
        <Badge className="bg-purple-100 text-purple-800">
          <Star className="h-3 w-3 mr-1" />
          Best Value
        </Badge>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Multi-Supplier Price Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-1">Searching:</p>
              <p className="text-sm text-blue-800">{partName}</p>
              {partNumber && (
                <p className="text-xs text-blue-700 mt-1">Part #: {partNumber}</p>
              )}
              {year && make && model && (
                <p className="text-xs text-blue-700">
                  Vehicle: {year} {make} {model}
                </p>
              )}
            </div>

            {!searched ? (
              <Button onClick={handleSearch} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Search className="h-4 w-4 mr-2 animate-spin" />
                    Searching 5 Suppliers...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Compare Prices from RockAuto, AutoZone, O'Reilly, NAPA & LKQ
                  </>
                )}
              </Button>
            ) : results ? (
              <>
                {/* Summary Cards */}
                {results.totalResults > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Lowest Price */}
                    {results.lowestPrice && (
                      <Card className="border-2 border-green-500">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-semibold">Lowest Price</span>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            ${results.lowestPrice.price.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {results.lowestPrice.supplierName}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Fastest Shipping */}
                    {results.fastestShipping && (
                      <Card className="border-2 border-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Truck className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-semibold">Fastest Shipping</span>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">
                            {formatShippingTime(results.fastestShipping.shippingDays)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {results.fastestShipping.supplierName}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Best Value */}
                    {results.bestValue && (
                      <Card className="border-2 border-purple-500">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Star className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-semibold">Best Value</span>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">
                            ${calculateTotalCost(results.bestValue).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            {results.bestValue.supplierName} (Total w/ Shipping)
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* All Results */}
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center justify-between">
                    <span>All Options ({results.totalResults})</span>
                    <span className="text-xs text-gray-500">
                      Updated {results.searchedAt.toLocaleTimeString()}
                    </span>
                  </h3>

                  {results.prices.map((part, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="text-3xl">{getSupplierLogo(part.supplier)}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{part.supplierName}</h4>
                                {getBestBadge(part)}
                              </div>
                              <p className="text-sm text-gray-700">{part.description}</p>
                              <p className="text-xs text-gray-500">
                                Brand: {part.brand} • Part #: {part.partNumber}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-blue-600">
                              ${part.price.toFixed(2)}
                            </p>
                            {part.listPrice && part.listPrice > part.price && (
                              <p className="text-xs text-gray-500 line-through">
                                ${part.listPrice.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                          <div>
                            <p className="text-xs text-gray-600">Shipping</p>
                            <p className="text-sm font-semibold">
                              {part.shippingCost === 0
                                ? 'FREE'
                                : `$${part.shippingCost.toFixed(2)}`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Delivery</p>
                            <p className="text-sm font-semibold flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatShippingTime(part.shippingDays)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Total Cost</p>
                            <p className="text-sm font-bold">
                              ${calculateTotalCost(part).toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Stock</p>
                            <p className="text-sm font-semibold">
                              {part.inStock ? (
                                <span className="text-green-600">In Stock ({part.quantity})</span>
                              ) : (
                                <span className="text-red-600">Backordered</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          <Badge className={getQualityBadgeColor(part.quality)}>
                            {part.quality.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{part.condition}</Badge>
                          {part.certifications.map((cert) => (
                            <Badge key={cert} className="bg-blue-100 text-blue-800">
                              {cert} Certified
                            </Badge>
                          ))}
                        </div>

                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>{part.warranty}</span>
                          </div>
                          {part.returnable && (
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>{part.returnDays} Day Returns</span>
                            </div>
                          )}
                          {part.notes && (
                            <p className="text-xs text-gray-600 italic">{part.notes}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {onSelectPart && (
                            <Button
                              className="flex-1"
                              onClick={() => onSelectPart(part)}
                              variant={getBestBadge(part) ? 'default' : 'outline'}
                            >
                              Select This Part
                            </Button>
                          )}
                          {part.productUrl && (
                            <Button variant="outline" size="icon" asChild>
                              <a
                                href={part.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Savings Summary */}
                {results.lowestPrice && results.prices.length > 1 && (
                  <Card className="bg-green-50 border-green-200">
                    <CardHeader>
                      <CardTitle className="text-green-800 text-base flex items-center gap-2">
                        <TrendingDown className="h-5 w-5" />
                        Potential Savings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-green-700">Highest Price</p>
                          <p className="text-xl font-bold text-green-900">
                            ${Math.max(...results.prices.map((p) => calculateTotalCost(p))).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-green-700">Lowest Price</p>
                          <p className="text-xl font-bold text-green-900">
                            ${Math.min(...results.prices.map((p) => calculateTotalCost(p))).toFixed(2)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-green-700">You Save by Choosing Best Price</p>
                          <p className="text-2xl font-bold text-green-600">
                            $
                            {(
                              Math.max(...results.prices.map((p) => calculateTotalCost(p))) -
                              Math.min(...results.prices.map((p) => calculateTotalCost(p)))
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-gray-300">
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-600">No results found. Try searching again.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
