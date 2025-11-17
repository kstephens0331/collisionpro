"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LaborOperation, LABOR_CATEGORIES } from "@/lib/labor-operations";
import { Search, X, Plus } from "lucide-react";

interface LaborOperationSelectorProps {
  onSelect: (operation: LaborOperation, customHours?: number) => void;
  onClose: () => void;
}

export default function LaborOperationSelector({
  onSelect,
  onClose,
}: LaborOperationSelectorProps) {
  const [operations, setOperations] = useState<LaborOperation[]>([]);
  const [filteredOperations, setFilteredOperations] = useState<LaborOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedOperation, setSelectedOperation] = useState<LaborOperation | null>(null);
  const [customHours, setCustomHours] = useState<string>("");

  useEffect(() => {
    fetchOperations();
  }, []);

  useEffect(() => {
    filterOperations();
  }, [searchQuery, selectedCategory, operations]);

  const fetchOperations = async () => {
    try {
      const response = await fetch("/api/labor-operations");
      const data = await response.json();

      if (data.success) {
        setOperations(data.operations);
        setFilteredOperations(data.operations);
      }
    } catch (error) {
      console.error("Error fetching labor operations:", error);
      alert("Failed to load labor operations");
    } finally {
      setLoading(false);
    }
  };

  const filterOperations = () => {
    let filtered = operations;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((op) => op.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (op) =>
          op.operation.toLowerCase().includes(query) ||
          op.code.toLowerCase().includes(query) ||
          op.description?.toLowerCase().includes(query)
      );
    }

    setFilteredOperations(filtered);
  };

  const handleSelectOperation = (operation: LaborOperation) => {
    setSelectedOperation(operation);
    setCustomHours(operation.standardHours.toString());
  };

  const handleAddOperation = () => {
    if (!selectedOperation) return;

    const hours = customHours ? parseFloat(customHours) : selectedOperation.standardHours;
    onSelect(selectedOperation, hours);
    onClose();
  };

  // Group operations by category for display
  const groupedOperations = filteredOperations.reduce((acc, op) => {
    if (!acc[op.category]) {
      acc[op.category] = [];
    }
    acc[op.category].push(op);
    return acc;
  }, {} as Record<string, LaborOperation[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Select Labor Operation</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose from 50+ industry-standard operations
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-6 border-b space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by operation name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Categories
            </button>
            {Object.entries(LABOR_CATEGORIES).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Operations List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredOperations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No operations found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filter
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {selectedCategory === "all"
                ? Object.entries(groupedOperations).map(([category, ops]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                        {LABOR_CATEGORIES[category as keyof typeof LABOR_CATEGORIES]}
                      </h3>
                      <div className="grid gap-2">
                        {ops.map((operation) => (
                          <OperationCard
                            key={operation.id}
                            operation={operation}
                            isSelected={selectedOperation?.id === operation.id}
                            onClick={() => handleSelectOperation(operation)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                : filteredOperations.map((operation) => (
                    <OperationCard
                      key={operation.id}
                      operation={operation}
                      isSelected={selectedOperation?.id === operation.id}
                      onClick={() => handleSelectOperation(operation)}
                    />
                  ))}
            </div>
          )}
        </div>

        {/* Selected Operation & Actions */}
        {selectedOperation && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                    {selectedOperation.code}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedOperation.operation}
                  </span>
                </div>
                {selectedOperation.description && (
                  <p className="text-sm text-gray-600">{selectedOperation.description}</p>
                )}
              </div>

              <div className="flex items-end gap-4">
                <div>
                  <Label htmlFor="customHours" className="text-xs">
                    Hours
                  </Label>
                  <Input
                    id="customHours"
                    type="number"
                    step="0.1"
                    min="0"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    className="w-24 mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Standard: {selectedOperation.standardHours} hrs
                  </p>
                </div>

                <Button onClick={handleAddOperation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Operation
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface OperationCardProps {
  operation: LaborOperation;
  isSelected: boolean;
  onClick: () => void;
}

function OperationCard({ operation, isSelected, onClick }: OperationCardProps) {
  const difficultyColors = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-orange-100 text-orange-700",
    expert: "bg-red-100 text-red-700",
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition ${
        isSelected
          ? "border-blue-600 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono rounded">
              {operation.code}
            </span>
            {operation.difficulty && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${
                  difficultyColors[operation.difficulty] || "bg-gray-100 text-gray-700"
                }`}
              >
                {operation.difficulty}
              </span>
            )}
          </div>
          <p className="font-medium text-gray-900">{operation.operation}</p>
          {operation.description && (
            <p className="text-sm text-gray-600 mt-1">{operation.description}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{operation.standardHours}</p>
          <p className="text-xs text-gray-500">hours</p>
        </div>
      </div>
    </button>
  );
}
