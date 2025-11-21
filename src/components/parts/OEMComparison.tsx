"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, TrendingDown, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { searchOEMParts, OEMPartResult, calculateSavings } from "@/lib/oem-parts";

interface OEMComparisonProps {
  year: number;
  make: string;
  model: string;
  partName: string;
  aftermarketPrice?: number;
  onSelectPart?: (part: OEMPartResult | 'aftermarket') => void;
}

export default function OEMComparison({
  year,
  make,
  model,
  partName,
  aftermarketPrice,
  onSelectPart,
}: OEMComparisonProps) {
  const [oemParts, setOemParts] = useState<OEMPartResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await searchOEMParts({
        make,
        year,
        model,
        partName,
      });
      setOemParts(results);
      setSearched(true);
    } catch (error) {
      console.error('Error searching OEM parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (stockStatus: string) => {
    switch (stockStatus) {
      case 'in-stock':
        return 'bg-green-100 text-green-800';
      case 'backordered':
        return 'bg-yellow-100 text-yellow-800';
      case 'discontinued':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockLabel = (stockStatus: string) => {
    return stockStatus.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            OEM vs Aftermarket Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Searching for:</strong> {partName}
              </p>
              <p className="text-sm text-blue-700">
                Vehicle: {year} {make} {model}
              </p>
            </div>

            {!searched ? (
              <Button onClick={handleSearch} disabled={loading} className="w-full">
                {loading ? 'Searching OEM Parts...' : 'Compare OEM vs Aftermarket'}
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Aftermarket Option */}
                {aftermarketPrice && (
                  <Card className="border-2 border-blue-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">Aftermarket Part</h3>
                          <p className="text-sm text-gray-600">{partName}</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">Recommended</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Price</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${aftermarketPrice.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Savings vs OEM</p>
                          <p className="text-2xl font-bold text-green-600 flex items-center gap-1">
                            <TrendingDown className="h-5 w-5" />
                            {oemParts[0] ? `${calculateSavings(oemParts[0].listPrice, aftermarketPrice).toFixed(0)}%` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>CAPA Certified - Meets OEM Quality Standards</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span>Lifetime Warranty</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span>Ships in 1-2 business days</span>
                        </div>
                      </div>

                      {onSelectPart && (
                        <Button
                          className="w-full"
                          onClick={() => onSelectPart('aftermarket')}
                        >
                          Select Aftermarket Part
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* OEM Options */}
                {oemParts.length > 0 ? (
                  <>
                    <h3 className="font-semibold text-lg">Original Equipment (OEM) Options</h3>
                    {oemParts.map((part, index) => {
                      const savings = aftermarketPrice
                        ? calculateSavings(part.listPrice, aftermarketPrice)
                        : 0;

                      return (
                        <Card key={index} className="border-gray-300">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold">{part.partName}</h3>
                                <p className="text-sm text-gray-600">{part.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Part #: {part.oemPartNumber}
                                </p>
                              </div>
                              <Badge className={getBadgeColor(part.stockStatus)}>
                                {getStockLabel(part.stockStatus)}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-600">MSRP</p>
                                <p className="font-semibold">${part.msrp.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Your Cost</p>
                                <p className="font-semibold text-blue-600">
                                  ${part.yourCost?.toFixed(2) || part.listPrice.toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600">Lead Time</p>
                                <p className="font-semibold">{part.leadTimeDays} days</p>
                              </div>
                            </div>

                            {aftermarketPrice && savings > 0 && (
                              <div className="bg-red-50 p-3 rounded mb-4">
                                <p className="text-sm text-red-800 flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4" />
                                  <strong>Note:</strong> Aftermarket is {savings.toFixed(0)}% cheaper
                                  (${(part.listPrice - aftermarketPrice).toFixed(2)} savings)
                                </p>
                              </div>
                            )}

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>Genuine {part.make.toUpperCase()} Part</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>{part.warranty || 'Manufacturer Warranty'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span>Perfect Fit Guaranteed</span>
                              </div>
                            </div>

                            {onSelectPart && (
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => onSelectPart(part)}
                              >
                                Select OEM Part
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </>
                ) : (
                  <Card className="border-gray-300">
                    <CardContent className="pt-6 text-center">
                      <p className="text-gray-600">
                        No OEM parts found for this vehicle. Aftermarket is the best option.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      {searched && oemParts.length > 0 && aftermarketPrice && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 text-base flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Cost Savings Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-green-700">OEM Price</p>
                <p className="text-xl font-bold text-green-900">
                  ${oemParts[0].yourCost?.toFixed(2) || oemParts[0].listPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-green-700">Aftermarket Price</p>
                <p className="text-xl font-bold text-green-900">
                  ${aftermarketPrice.toFixed(2)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-green-700">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">
                  ${((oemParts[0].yourCost || oemParts[0].listPrice) - aftermarketPrice).toFixed(2)}
                  <span className="text-sm ml-2">
                    ({calculateSavings(oemParts[0].yourCost || oemParts[0].listPrice, aftermarketPrice).toFixed(1)}%)
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
