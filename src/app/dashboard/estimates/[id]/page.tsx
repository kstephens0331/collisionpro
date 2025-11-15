"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Edit,
  Plus,
  Trash2,
  Save,
  Send,
  Download,
  Calendar,
  User,
  Car,
  Shield,
  DollarSign,
} from "lucide-react";

interface Estimate {
  id: string;
  estimateNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleVin: string;
  vehicleTrim: string;
  vehicleMileage: number;
  vehicleColor: string;
  vehicleLicensePlate: string;
  insuranceCompany: string;
  claimNumber: string;
  policyNumber: string;
  deductible: number;
  damageDescription: string;
  dateOfLoss: string;
  notes: string;
  internalNotes: string;
  laborRate: number;
  taxRate: number;
  partsSubtotal: number;
  laborSubtotal: number;
  paintSubtotal: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  createdAt: string;
}

interface LineItem {
  id: string;
  type: "part" | "labor" | "paint" | "misc";
  partName: string;
  partNumber?: string;
  laborOperation?: string;
  laborHours?: number;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export default function EstimateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const estimateId = params.id as string;

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New line item form
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    type: "part" as "part" | "labor" | "paint" | "misc",
    partName: "",
    partNumber: "",
    laborOperation: "",
    laborHours: "",
    quantity: "1",
    unitPrice: "",
  });

  useEffect(() => {
    fetchEstimate();
    fetchLineItems();
  }, [estimateId]);

  const fetchEstimate = async () => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}`);
      const data = await response.json();
      if (data.success) {
        setEstimate(data.estimate);
      }
    } catch (error) {
      console.error("Error fetching estimate:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLineItems = async () => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}/items`);
      const data = await response.json();
      if (data.success) {
        setLineItems(data.items);
      }
    } catch (error) {
      console.error("Error fetching line items:", error);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.partName.trim() || !newItem.unitPrice) {
      alert("Please fill in required fields");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newItem.type,
          partName: newItem.partName,
          partNumber: newItem.partNumber || null,
          laborOperation: newItem.laborOperation || null,
          laborHours: newItem.laborHours ? parseFloat(newItem.laborHours) : null,
          quantity: parseInt(newItem.quantity),
          unitPrice: parseFloat(newItem.unitPrice),
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchLineItems();
        fetchEstimate(); // Refresh totals
        setShowAddItem(false);
        setNewItem({
          type: "part",
          partName: "",
          partNumber: "",
          laborOperation: "",
          laborHours: "",
          quantity: "1",
          unitPrice: "",
        });
      } else {
        alert("Failed to add item: " + data.error);
      }
    } catch (error) {
      console.error("Error adding item:", error);
      alert("Failed to add item");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(
        `/api/estimates/${estimateId}/items/${itemId}`,
        { method: "DELETE" }
      );

      const data = await response.json();
      if (data.success) {
        fetchLineItems();
        fetchEstimate(); // Refresh totals
      } else {
        alert("Failed to delete item: " + data.error);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-600">Loading estimate...</div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Estimate not found</h2>
        <Button
          onClick={() => router.push("/dashboard/estimates")}
          className="mt-4"
        >
          Back to Estimates
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/estimates")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {estimate.estimateNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              Created {new Date(estimate.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          {estimate.status === "draft" && (
            <Button size="sm">
              <Send className="h-4 w-4 mr-2" />
              Send to Customer
            </Button>
          )}
        </div>
      </div>

      {/* Customer & Vehicle Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{estimate.customerName}</p>
            </div>
            {estimate.customerEmail && (
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{estimate.customerEmail}</p>
              </div>
            )}
            {estimate.customerPhone && (
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{estimate.customerPhone}</p>
              </div>
            )}
            {estimate.customerAddress && (
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{estimate.customerAddress}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Vehicle</p>
              <p className="font-medium">
                {estimate.vehicleYear} {estimate.vehicleMake}{" "}
                {estimate.vehicleModel}
                {estimate.vehicleTrim ? ` ${estimate.vehicleTrim}` : ""}
              </p>
            </div>
            {estimate.vehicleVin && (
              <div>
                <p className="text-sm text-gray-500">VIN</p>
                <p className="font-medium">{estimate.vehicleVin}</p>
              </div>
            )}
            {estimate.vehicleMileage && (
              <div>
                <p className="text-sm text-gray-500">Mileage</p>
                <p className="font-medium">
                  {estimate.vehicleMileage.toLocaleString()} miles
                </p>
              </div>
            )}
            {estimate.vehicleColor && (
              <div>
                <p className="text-sm text-gray-500">Color</p>
                <p className="font-medium">{estimate.vehicleColor}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insurance & Damage Info */}
      {(estimate.insuranceCompany || estimate.damageDescription) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {estimate.insuranceCompany && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Insurance Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Insurance Company</p>
                  <p className="font-medium">{estimate.insuranceCompany}</p>
                </div>
                {estimate.claimNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Claim Number</p>
                    <p className="font-medium">{estimate.claimNumber}</p>
                  </div>
                )}
                {estimate.policyNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Policy Number</p>
                    <p className="font-medium">{estimate.policyNumber}</p>
                  </div>
                )}
                {estimate.deductible > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Deductible</p>
                    <p className="font-medium">
                      ${estimate.deductible.toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {estimate.damageDescription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Damage Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {estimate.dateOfLoss && (
                  <div>
                    <p className="text-sm text-gray-500">Date of Loss</p>
                    <p className="font-medium">
                      {new Date(estimate.dateOfLoss).toLocaleDateString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium">{estimate.damageDescription}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Line Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button size="sm" onClick={() => setShowAddItem(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Item Form */}
          {showAddItem && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-4">Add New Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="itemType">Type</Label>
                  <select
                    id="itemType"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value={newItem.type}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        type: e.target.value as "part" | "labor" | "paint" | "misc",
                      })
                    }
                  >
                    <option value="part">Part</option>
                    <option value="labor">Labor</option>
                    <option value="paint">Paint</option>
                    <option value="misc">Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="itemName">
                    {newItem.type === "part" ? "Part Name" : "Description"} *
                  </Label>
                  <Input
                    id="itemName"
                    value={newItem.partName}
                    onChange={(e) =>
                      setNewItem({ ...newItem, partName: e.target.value })
                    }
                    placeholder={
                      newItem.type === "part"
                        ? "Front Bumper Cover"
                        : "Paint and Blend"
                    }
                  />
                </div>
                {newItem.type === "part" && (
                  <div>
                    <Label htmlFor="partNumber">Part Number</Label>
                    <Input
                      id="partNumber"
                      value={newItem.partNumber}
                      onChange={(e) =>
                        setNewItem({ ...newItem, partNumber: e.target.value })
                      }
                      placeholder="04711-06903-B0"
                    />
                  </div>
                )}
                {newItem.type === "labor" && (
                  <>
                    <div>
                      <Label htmlFor="laborOperation">Operation</Label>
                      <Input
                        id="laborOperation"
                        value={newItem.laborOperation}
                        onChange={(e) =>
                          setNewItem({
                            ...newItem,
                            laborOperation: e.target.value,
                          })
                        }
                        placeholder="R&I Bumper"
                      />
                    </div>
                    <div>
                      <Label htmlFor="laborHours">Hours</Label>
                      <Input
                        id="laborHours"
                        type="number"
                        step="0.1"
                        value={newItem.laborHours}
                        onChange={(e) =>
                          setNewItem({ ...newItem, laborHours: e.target.value })
                        }
                        placeholder="2.5"
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quantity: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="unitPrice">Unit Price * ($)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={newItem.unitPrice}
                    onChange={(e) =>
                      setNewItem({ ...newItem, unitPrice: e.target.value })
                    }
                    placeholder="215.99"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <Button onClick={handleAddItem} disabled={saving}>
                  {saving ? "Adding..." : "Add Item"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddItem(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          {lineItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No items added yet. Click "Add Item" to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm">
                        <span className="capitalize">{item.type}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {item.partName}
                          </p>
                          {item.partNumber && (
                            <p className="text-xs text-gray-500">
                              #{item.partNumber}
                            </p>
                          )}
                          {item.laborOperation && (
                            <p className="text-xs text-gray-500">
                              {item.laborOperation}
                              {item.laborHours && ` (${item.laborHours} hrs)`}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-right">
                        ${item.lineTotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Estimate Totals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Parts Subtotal</span>
              <span className="font-medium">
                ${estimate.partsSubtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Labor Subtotal</span>
              <span className="font-medium">
                ${estimate.laborSubtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Paint Subtotal</span>
              <span className="font-medium">
                ${estimate.paintSubtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm pt-3 border-t">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">
                ${estimate.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Tax ({(estimate.taxRate * 100).toFixed(2)}%)
              </span>
              <span className="font-medium">
                ${estimate.taxAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold pt-3 border-t">
              <span>Total</span>
              <span>${estimate.total.toFixed(2)}</span>
            </div>
            {estimate.deductible > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Customer Responsibility (after deductible)</span>
                <span className="font-medium">
                  ${Math.max(0, estimate.total - estimate.deductible).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
