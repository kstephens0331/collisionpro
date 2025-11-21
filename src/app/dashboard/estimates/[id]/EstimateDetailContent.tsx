"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
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
  Wrench,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Box,
} from "lucide-react";
import LaborOperationSelector from "@/components/estimates/LaborOperationSelector";
import PhotoUpload from "@/components/photos/PhotoUpload";
import OrderPartsModal from "@/components/estimates/OrderPartsModal";
import VehicleDiagram2D, { DamageMarker } from "@/components/diagrams/VehicleDiagram2D";
import { LaborOperation, ShopSettings, calculateLaborCost } from "@/lib/labor-operations";

interface Photo {
  id: string;
  url: string;
  category: string;
  caption: string | null;
  createdAt: string;
}

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

export default function EstimateDetailContent() {
  const params = useParams();
  const router = useRouter();
  const estimateId = params?.id as string;

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [damageMarkers, setDamageMarkers] = useState<DamageMarker[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingDamageMarkers, setSavingDamageMarkers] = useState(false);

  // Modal states
  const [showLaborSelector, setShowLaborSelector] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showOrderParts, setShowOrderParts] = useState(false);

  // Status update form
  const [statusForm, setStatusForm] = useState({
    status: "",
    notes: "",
    estimatedCompletion: "",
  });

  // Valid statuses for dropdown
  const STATUS_OPTIONS = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent to Customer" },
    { value: "approved", label: "Approved" },
    { value: "received", label: "Vehicle Received" },
    { value: "in_progress", label: "In Progress" },
    { value: "waiting_for_parts", label: "Waiting for Parts" },
    { value: "ready", label: "Ready for Pickup" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  // New line item form
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
    fetchPhotos();
    fetchDamageMarkers();
    fetchShopSettings();
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

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}/photos`);
      const data = await response.json();
      if (data.success) {
        setPhotos(data.photos);
      }
    } catch (error) {
      console.error("Error fetching photos:", error);
    }
  };

  const fetchShopSettings = async () => {
    try {
      const shopId = "shop_demo";
      const response = await fetch(`/api/shop-settings?shopId=${shopId}`);
      const data = await response.json();

      if (data.success && data.settings) {
        setShopSettings(data.settings);
      }
    } catch (error) {
      console.error("Error loading shop settings:", error);
    }
  };

  const fetchDamageMarkers = async () => {
    try {
      const response = await fetch(`/api/damage-annotations?estimateId=${estimateId}`);
      const data = await response.json();
      if (data.success && data.data?.markers) {
        setDamageMarkers(data.data.markers);
      }
    } catch (error) {
      console.error("Error fetching damage markers:", error);
    }
  };

  const handleSaveDamageMarkers = async (markers: DamageMarker[]) => {
    setSavingDamageMarkers(true);
    try {
      const response = await fetch('/api/damage-annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateId,
          vehicleType: 'sedan', // Default to sedan for now
          markers,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setDamageMarkers(markers);
        alert('Damage annotations saved successfully!');
      } else {
        throw new Error(data.error || 'Failed to save damage annotations');
      }
    } catch (error: any) {
      console.error("Error saving damage markers:", error);
      alert(`Error saving damage annotations: ${error.message}`);
    } finally {
      setSavingDamageMarkers(false);
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

  const handleAddLaborOperation = async (
    operation: LaborOperation,
    customHours?: number
  ) => {
    if (!shopSettings) {
      alert("Shop settings not loaded. Please try again.");
      return;
    }

    setSaving(true);
    try {
      // Calculate labor cost based on operation category and shop settings
      const { hours, rate, cost } = calculateLaborCost(
        operation,
        shopSettings,
        customHours
      );

      const response = await fetch(`/api/estimates/${estimateId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "labor",
          partName: operation.operation,
          partNumber: null,
          laborOperation: operation.code,
          laborHours: hours,
          quantity: 1,
          unitPrice: cost, // Total labor cost (hours x rate)
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchLineItems();
        fetchEstimate(); // Refresh totals
        setShowLaborSelector(false);
      } else {
        alert("Failed to add labor operation: " + data.error);
      }
    } catch (error) {
      console.error("Error adding labor operation:", error);
      alert("Failed to add labor operation");
    } finally {
      setSaving(false);
    }
  };

  const handleSendToCustomer = async () => {
    if (!estimate) return;

    // Validate customer email exists
    if (!estimate.customerEmail || estimate.customerEmail.trim() === "") {
      alert("Customer email is required to send the estimate. Please edit the estimate and add a customer email.");
      return;
    }

    // Validate shop email is configured
    if (!shopSettings?.senderEmail || shopSettings.senderEmail.trim() === "") {
      alert("Shop email is not configured. Please configure your email settings in Shop Settings before sending estimates.");
      router.push("/dashboard/settings");
      return;
    }

    // Confirm before sending
    if (!confirm(`Send estimate to ${estimate.customerEmail}?`)) {
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (data.success) {
        alert(`Estimate sent successfully to ${estimate.customerEmail}!`);
        // Refresh estimate to show updated status
        fetchEstimate();
      } else {
        alert(`Failed to send estimate: ${data.error}`);
      }
    } catch (error) {
      console.error("Error sending estimate:", error);
      alert("Failed to send estimate. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!statusForm.status) {
      alert("Please select a status");
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusForm.status,
          notes: statusForm.notes || null,
          updatedBy: "Shop User", // TODO: Get actual user name from session
          estimatedCompletion: statusForm.estimatedCompletion || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Status updated successfully!");
        fetchEstimate(); // Refresh estimate data
        setShowStatusUpdate(false);
        setStatusForm({ status: "", notes: "", estimatedCompletion: "" });
      } else {
        alert(`Failed to update status: ${data.error}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "approved": return "bg-green-100 text-green-800";
      case "received": return "bg-indigo-100 text-indigo-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "waiting_for_parts": return "bg-orange-100 text-orange-800";
      case "ready": return "bg-purple-100 text-purple-800";
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {estimate.estimateNumber}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(estimate.status)}`}>
                {getStatusLabel(estimate.status)}
              </span>
            </div>
            <p className="text-gray-600 mt-1">
              Created {new Date(estimate.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusForm({ ...statusForm, status: estimate.status });
              setShowStatusUpdate(true);
            }}
          >
            <Clock className="h-4 w-4 mr-2" />
            Update Status
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/estimates/${estimateId}/pdf`, '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOrderParts(true)}
          >
            <Truck className="h-4 w-4 mr-2" />
            Order Parts
          </Button>
          {estimate.status === "draft" && (
            <Button
              size="sm"
              onClick={handleSendToCustomer}
              disabled={sending}
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : "Send to Customer"}
            </Button>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusUpdate && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5" />
              Update Repair Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">New Status *</Label>
                <select
                  id="status"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 mt-1"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                >
                  <option value="">Select status...</option>
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="estimatedCompletion">Estimated Completion</Label>
                <Input
                  id="estimatedCompletion"
                  type="date"
                  value={statusForm.estimatedCompletion}
                  onChange={(e) => setStatusForm({ ...statusForm, estimatedCompletion: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="statusNotes">Notes (visible to customer)</Label>
                <Input
                  id="statusNotes"
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                  placeholder="e.g., Waiting for bumper to arrive"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button onClick={handleStatusUpdate} disabled={updatingStatus}>
                {updatingStatus ? "Updating..." : "Update Status"}
              </Button>
              <Button variant="outline" onClick={() => setShowStatusUpdate(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowLaborSelector(true)}
                disabled={!shopSettings}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Add Labor
              </Button>
              <Button size="sm" onClick={() => setShowAddItem(true)}>
                <Package className="h-4 w-4 mr-2" />
                Add Part
              </Button>
            </div>
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

      {/* Photos */}
      <PhotoUpload
        estimateId={estimateId}
        photos={photos}
        onPhotosChange={fetchPhotos}
      />

      {/* 2D Damage Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Damage Diagram
            </CardTitle>
            <div className="flex items-center gap-2">
              {damageMarkers.length > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {damageMarkers.length} {damageMarkers.length === 1 ? 'Marker' : 'Markers'}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VehicleDiagram2D
            estimateId={estimateId}
            initialMarkers={damageMarkers}
            onSave={handleSaveDamageMarkers}
          />
          {savingDamageMarkers && (
            <div className="mt-4 flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Saving damage annotations...</span>
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

      {/* Labor Operation Selector Modal */}
      {showLaborSelector && (
        <LaborOperationSelector
          onSelect={handleAddLaborOperation}
          onClose={() => setShowLaborSelector(false)}
        />
      )}

      {/* Order Parts Modal */}
      <OrderPartsModal
        estimateId={estimateId}
        isOpen={showOrderParts}
        onClose={() => setShowOrderParts(false)}
        onOrderCreated={() => {
          fetchLineItems();
        }}
      />
    </div>
  );
}
