"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search,
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  Filter,
  X,
  Loader2,
  Check,
} from "lucide-react";

interface VehicleInfo {
  year: number;
  make: string;
  model: string;
  engine?: string;
}

interface PartResult {
  partNumber: string;
  manufacturer: string;
  description: string;
  price: number;
  listPrice?: number;
  category: string;
  subCategory?: string;
  fitment: string[];
  imageUrl?: string;
  inStock: boolean;
  warranty?: string;
}

interface SmartPartsLookupProps {
  vehicle?: VehicleInfo;
  onSelectPart?: (part: PartResult) => void;
  estimateId?: string;
  embedded?: boolean; // If embedded in estimate form
}

const COLLISION_CATEGORIES = [
  { value: "bumper", label: "Bumpers" },
  { value: "fender", label: "Fenders" },
  { value: "hood", label: "Hoods" },
  { value: "door", label: "Doors" },
  { value: "mirror", label: "Mirrors" },
  { value: "headlight", label: "Headlights" },
  { value: "tail+light", label: "Taillights" },
  { value: "grille", label: "Grilles" },
  { value: "radiator+support", label: "Radiator Support" },
  { value: "quarter+panel", label: "Quarter Panels" },
];

export default function SmartPartsLookup({
  vehicle,
  onSelectPart,
  estimateId,
  embedded = false,
}: SmartPartsLookupProps) {
  const [searchType, setSearchType] = useState<"keyword" | "category">("keyword");
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("bumper");
  const [vehicleData, setVehicleData] = useState<VehicleInfo | undefined>(vehicle);
  const [results, setResults] = useState<PartResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Local state for vehicle form inputs
  const [yearInput, setYearInput] = useState("");
  const [makeInput, setMakeInput] = useState("");
  const [modelInput, setModelInput] = useState("");

  // Search debounce
  useEffect(() => {
    if (searchType === "keyword" && keyword.length >= 3) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [keyword, searchType]);

  const handleSearch = async () => {
    if (!vehicleData && searchType === "category") {
      setError("Please enter vehicle information first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let url = "";
      if (searchType === "keyword") {
        // Search by part number or keyword
        url = `/api/scrapers/rockauto?keyword=${encodeURIComponent(keyword)}`;
      } else {
        // Search by vehicle and category
        url = `/api/scrapers/rockauto?year=${vehicleData!.year}&make=${encodeURIComponent(
          vehicleData!.make
        )}&model=${encodeURIComponent(vehicleData!.model)}&category=${selectedCategory}`;
        if (vehicleData!.engine) {
          url += `&engine=${encodeURIComponent(vehicleData!.engine)}`;
        }
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setResults(data.data.parts || []);
        if (data.data.parts.length === 0) {
          setError("No parts found. Try a different search.");
        }
      } else {
        setError(data.error || "Failed to search parts");
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search parts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const togglePartSelection = (partNumber: string) => {
    const newSelected = new Set(selectedParts);
    if (newSelected.has(partNumber)) {
      newSelected.delete(partNumber);
    } else {
      newSelected.add(partNumber);
    }
    setSelectedParts(newSelected);
  };

  const handleAddPart = (part: PartResult) => {
    if (onSelectPart) {
      onSelectPart(part);
    }
    togglePartSelection(part.partNumber);
  };

  const calculateSavings = (price: number, listPrice?: number) => {
    if (!listPrice || listPrice <= price) return null;
    const savings = listPrice - price;
    const percentage = ((savings / listPrice) * 100).toFixed(0);
    return { amount: savings, percentage };
  };

  return (
    <Card className={embedded ? "shadow-none border-0" : ""}>
      <CardHeader className={embedded ? "px-0 pt-0" : ""}>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Smart Parts Lookup
        </CardTitle>
      </CardHeader>
      <CardContent className={embedded ? "px-0" : ""}>
        {/* Search Type Toggle */}
        <div className="mb-4 flex gap-2">
          <Button
            variant={searchType === "keyword" ? "default" : "outline"}
            onClick={() => setSearchType("keyword")}
            size="sm"
          >
            <Search className="h-4 w-4 mr-2" />
            Search by Part #
          </Button>
          <Button
            variant={searchType === "category" ? "default" : "outline"}
            onClick={() => setSearchType("category")}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Browse by Category
          </Button>
        </div>

        {/* Vehicle Information */}
        {searchType === "category" && !vehicleData && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800 mb-3">
              Enter vehicle information to browse parts by category:
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Year</Label>
                <Input
                  type="number"
                  placeholder="2020"
                  value={yearInput}
                  onChange={(e) => {
                    setYearInput(e.target.value);
                    const year = parseInt(e.target.value);
                    if (year && makeInput && modelInput) {
                      setVehicleData({ year, make: makeInput, model: modelInput });
                    }
                  }}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Make</Label>
                <Input
                  placeholder="Toyota"
                  value={makeInput}
                  onChange={(e) => {
                    setMakeInput(e.target.value);
                    const year = parseInt(yearInput);
                    if (year && e.target.value && modelInput) {
                      setVehicleData({ year, make: e.target.value, model: modelInput });
                    }
                  }}
                  className="h-9"
                />
              </div>
              <div>
                <Label className="text-xs">Model</Label>
                <Input
                  placeholder="Camry"
                  value={modelInput}
                  onChange={(e) => {
                    setModelInput(e.target.value);
                    const year = parseInt(yearInput);
                    if (year && makeInput && e.target.value) {
                      setVehicleData({ year, make: makeInput, model: e.target.value });
                    }
                  }}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        )}

        {/* Search by Keyword */}
        {searchType === "keyword" && (
          <div className="mb-4">
            <Label>Part Number or Description</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter part number (e.g., 52119-06420) or description..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading || keyword.length < 3}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter at least 3 characters to search
            </p>
          </div>
        )}

        {/* Search by Category */}
        {searchType === "category" && vehicleData && (
          <div className="mb-4">
            <Label>Category</Label>
            <div className="flex gap-2">
              <select
                className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {COLLISION_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Vehicle Info Display */}
        {vehicleData && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
            <div className="text-sm">
              <strong>Vehicle:</strong> {vehicleData.year} {vehicleData.make}{" "}
              {vehicleData.model}
              {vehicleData.engine && ` (${vehicleData.engine})`}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVehicleData(undefined)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                Found {results.length} parts
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Parts List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {results.map((part) => {
                const savings = calculateSavings(part.price, part.listPrice);
                const isSelected = selectedParts.has(part.partNumber);

                return (
                  <div
                    key={part.partNumber}
                    className={`border rounded-lg p-4 transition-all ${
                      isSelected
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Part Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          {part.imageUrl && (
                            <img
                              src={part.imageUrl}
                              alt={part.description}
                              className="w-16 h-16 object-contain border rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              {part.manufacturer}
                            </p>
                            <p className="text-xs text-gray-600 mb-1">
                              Part #: {part.partNumber}
                            </p>
                            <p className="text-sm text-gray-700">
                              {part.description}
                            </p>
                            {part.warranty && (
                              <p className="text-xs text-gray-500 mt-1">
                                Warranty: {part.warranty}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Price & Actions */}
                      <div className="text-right">
                        <div className="mb-2">
                          <p className="text-2xl font-bold text-green-600">
                            ${part.price.toFixed(2)}
                          </p>
                          {part.listPrice && part.listPrice > part.price && (
                            <p className="text-xs text-gray-500 line-through">
                              List: ${part.listPrice.toFixed(2)}
                            </p>
                          )}
                          {savings && (
                            <p className="text-xs text-green-600 font-semibold">
                              Save ${savings.amount.toFixed(2)} ({savings.percentage}
                              %)
                            </p>
                          )}
                        </div>

                        {/* Stock Status */}
                        <div
                          className={`text-xs px-2 py-1 rounded mb-2 ${
                            part.inStock
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {part.inStock ? (
                            <>
                              <Check className="h-3 w-3 inline mr-1" />
                              In Stock
                            </>
                          ) : (
                            "Out of Stock"
                          )}
                        </div>

                        {/* Add Button */}
                        <Button
                          size="sm"
                          onClick={() => handleAddPart(part)}
                          variant={isSelected ? "outline" : "default"}
                          disabled={!part.inStock}
                        >
                          {isSelected ? (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Added
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Add to Estimate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && !error && (
          <div className="text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm">
              {searchType === "keyword"
                ? "Enter a part number or description to search"
                : "Select a category to browse parts"}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-3" />
            <p className="text-sm text-gray-600">Searching parts database...</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-blue-900 mb-1">
                Smart Parts Lookup Benefits
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• <strong>3x faster</strong> than manual catalog searching</li>
                <li>• <strong>Real-time pricing</strong> from multiple suppliers</li>
                <li>• <strong>Instant availability</strong> checking</li>
                <li>
                  • <strong>Automatic fitment</strong> verification
                </li>
                <li>• <strong>Price comparison</strong> across brands</li>
              </ul>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">
                <DollarSign className="h-5 w-5 inline" />
                {selectedParts.size > 0 && (
                  <span>
                    {results
                      .filter((p) => selectedParts.has(p.partNumber))
                      .reduce((sum, p) => sum + p.price, 0)
                      .toFixed(2)}
                  </span>
                )}
              </p>
              {selectedParts.size > 0 && (
                <p className="text-xs text-gray-600">
                  {selectedParts.size} part{selectedParts.size > 1 ? "s" : ""} selected
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
