"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Package,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  BarChart3,
  Archive,
  Minus,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface InventoryItem {
  id: string;
  partNumber: string;
  partName: string;
  description?: string;
  category: string;
  manufacturer?: string;
  isOEM: boolean;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  reorderQuantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  cost: number;
  retailPrice: number;
  wholesalePrice?: number;
  location?: string;
  barcode?: string;
  preferredSupplierId?: string;
  supplierPartNumber?: string;
  leadTimeDays: number;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYearStart?: number;
  vehicleYearEnd?: number;
  notes?: string;
  lastRestocked?: string;
  alerts?: any[];
}

const CATEGORIES = [
  "bumper",
  "fender",
  "hood",
  "door",
  "mirror",
  "headlight",
  "taillight",
  "grille",
  "radiator_support",
  "quarter_panel",
  "other",
];

export default function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<
    "receive" | "sale" | "adjustment" | "damage"
  >("receive");
  const [adjustmentNotes, setAdjustmentNotes] = useState("");

  // New item form state
  const [newItem, setNewItem] = useState({
    partNumber: "",
    partName: "",
    description: "",
    category: "bumper",
    manufacturer: "",
    isOEM: false,
    quantityOnHand: 0,
    reorderPoint: 2,
    reorderQuantity: 5,
    minStockLevel: 1,
    maxStockLevel: undefined as number | undefined,
    cost: 0,
    retailPrice: 0,
    wholesalePrice: undefined as number | undefined,
    location: "",
    barcode: "",
    preferredSupplierId: "",
    supplierPartNumber: "",
    leadTimeDays: 3,
    vehicleMake: "",
    vehicleModel: "",
    vehicleYearStart: undefined as number | undefined,
    vehicleYearEnd: undefined as number | undefined,
    notes: "",
  });

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter, showLowStockOnly, searchQuery]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter) params.append("category", categoryFilter);
      if (showLowStockOnly) params.append("lowStock", "true");
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (data.success) {
        setItems(data.items);
      } else {
        console.error("Failed to fetch inventory:", data.error);
      }
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      const data = await response.json();

      if (data.success) {
        alert("Inventory item added successfully!");
        setShowAddModal(false);
        fetchInventory();
        // Reset form
        setNewItem({
          partNumber: "",
          partName: "",
          description: "",
          category: "bumper",
          manufacturer: "",
          isOEM: false,
          quantityOnHand: 0,
          reorderPoint: 2,
          reorderQuantity: 5,
          minStockLevel: 1,
          maxStockLevel: undefined,
          cost: 0,
          retailPrice: 0,
          wholesalePrice: undefined,
          location: "",
          barcode: "",
          preferredSupplierId: "",
          supplierPartNumber: "",
          leadTimeDays: 3,
          vehicleMake: "",
          vehicleModel: "",
          vehicleYearStart: undefined,
          vehicleYearEnd: undefined,
          notes: "",
        });
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item");
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem) return;

    try {
      const response = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inventoryItemId: selectedItem.id,
          type: adjustmentType,
          quantity: adjustmentQuantity,
          notes: adjustmentNotes,
          performedBy: "User", // In production, use actual user ID
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setShowAdjustModal(false);
        setSelectedItem(null);
        setAdjustmentQuantity(0);
        setAdjustmentNotes("");
        fetchInventory();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      alert("Failed to adjust stock");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`/api/inventory?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("Item deleted successfully!");
        fetchInventory();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  // Calculate inventory stats
  const stats = {
    totalItems: items.length,
    totalValue: items.reduce(
      (sum, item) => sum + item.quantityOnHand * item.cost,
      0
    ),
    lowStockCount: items.filter((item) => item.quantityAvailable <= item.reorderPoint)
      .length,
    outOfStockCount: items.filter((item) => item.quantityAvailable === 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">
                  ${stats.totalValue.toFixed(2)}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.lowStockCount}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.outOfStockCount}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Inventory Management</span>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search by part name, number, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              className="border border-gray-300 rounded-md px-3 py-2"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace("_", " ").toUpperCase()}
                </option>
              ))}
            </select>
            <Button
              variant={showLowStockOnly ? "default" : "outline"}
              onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Low Stock Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Loading inventory...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Archive className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No inventory items found</p>
              <Button
                onClick={() => setShowAddModal(true)}
                variant="outline"
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Part Info
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      On Hand
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      Available
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      Reorder Point
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                      Retail
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-semibold">{item.partName}</p>
                          <p className="text-xs text-gray-600">
                            {item.partNumber}
                          </p>
                          {item.manufacturer && (
                            <p className="text-xs text-gray-500">
                              {item.manufacturer}
                              {item.isOEM && " (OEM)"}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">
                          {item.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {item.quantityOnHand}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            item.quantityAvailable === 0
                              ? "text-red-600 font-semibold"
                              : item.quantityAvailable <= item.reorderPoint
                              ? "text-yellow-600 font-semibold"
                              : ""
                          }
                        >
                          {item.quantityAvailable}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">
                        {item.reorderPoint}
                      </td>
                      <td className="px-4 py-3 text-right">
                        ${item.cost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        ${item.retailPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.quantityAvailable === 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            <XCircle className="h-3 w-3" />
                            Out of Stock
                          </span>
                        ) : item.quantityAvailable <= item.reorderPoint ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            <CheckCircle className="h-3 w-3" />
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowAdjustModal(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Item Modal - Simplified for length */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowAddModal(false)}
        >
          <Card
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Add New Inventory Item</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Part Number *</Label>
                    <Input
                      value={newItem.partNumber}
                      onChange={(e) =>
                        setNewItem({ ...newItem, partNumber: e.target.value })
                      }
                      placeholder="e.g., 52119-06420"
                    />
                  </div>
                  <div>
                    <Label>Part Name *</Label>
                    <Input
                      value={newItem.partName}
                      onChange={(e) =>
                        setNewItem({ ...newItem, partName: e.target.value })
                      }
                      placeholder="e.g., Front Bumper Cover"
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category *</Label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={newItem.category}
                      onChange={(e) =>
                        setNewItem({ ...newItem, category: e.target.value })
                      }
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.replace("_", " ").toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Manufacturer</Label>
                    <Input
                      value={newItem.manufacturer}
                      onChange={(e) =>
                        setNewItem({ ...newItem, manufacturer: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={newItem.quantityOnHand}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          quantityOnHand: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Reorder Point</Label>
                    <Input
                      type="number"
                      value={newItem.reorderPoint}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          reorderPoint: parseInt(e.target.value) || 2,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.cost}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          cost: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Retail Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newItem.retailPrice}
                      onChange={(e) =>
                        setNewItem({
                          ...newItem,
                          retailPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem}>Add Item</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && selectedItem && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowAdjustModal(false)}
        >
          <Card
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Adjust Stock</CardTitle>
              <p className="text-sm text-gray-600">
                {selectedItem.partName} ({selectedItem.partNumber})
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded">
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p className="text-3xl font-bold">
                    {selectedItem.quantityOnHand}
                  </p>
                  <p className="text-xs text-gray-500">
                    Available: {selectedItem.quantityAvailable}
                  </p>
                </div>

                <div>
                  <Label>Adjustment Type</Label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={adjustmentType}
                    onChange={(e) =>
                      setAdjustmentType(
                        e.target.value as "receive" | "sale" | "adjustment" | "damage"
                      )
                    }
                  >
                    <option value="receive">Receive (Add Stock)</option>
                    <option value="sale">Sale (Remove Stock)</option>
                    <option value="adjustment">Manual Adjustment</option>
                    <option value="damage">Damage/Loss</option>
                  </select>
                </div>

                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={adjustmentQuantity}
                    onChange={(e) =>
                      setAdjustmentQuantity(parseInt(e.target.value) || 0)
                    }
                    placeholder={
                      adjustmentType === "receive" ? "+10" : "-5"
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use positive numbers to add, negative to remove
                  </p>
                </div>

                <div>
                  <Label>Notes</Label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={adjustmentNotes}
                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                    placeholder="Optional notes about this adjustment..."
                    rows={3}
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-gray-700">
                    New quantity will be:{" "}
                    <span className="font-bold text-lg">
                      {selectedItem.quantityOnHand + adjustmentQuantity}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdjustModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAdjustStock}>Adjust Stock</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
