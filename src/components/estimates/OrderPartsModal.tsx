"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Package, Truck, Check } from "lucide-react";

interface LineItem {
  id: string;
  partName: string;
  partNumber?: string;
  quantity: number;
  unitPrice: number;
  costPrice?: number;
  orderStatus?: string;
}

interface Supplier {
  id: string;
  name: string;
  type: string;
  isPrimary: boolean;
  discountPercentage: number;
  defaultMarkup: number;
  deliveryDays: number;
}

interface OrderPartsModalProps {
  estimateId: string;
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export default function OrderPartsModal({
  estimateId,
  isOpen,
  onClose,
  onOrderCreated,
}: OrderPartsModalProps) {
  const [items, setItems] = useState<LineItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchOrderableItems();
    }
  }, [isOpen, estimateId]);

  const fetchOrderableItems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}/order-parts`);
      const data = await response.json();

      if (data.success) {
        setItems(data.items || []);
        setSuppliers(data.suppliers || []);
        // Auto-select primary supplier
        const primary = data.suppliers?.find((s: Supplier) => s.isPrimary);
        if (primary) {
          setSelectedSupplier(primary.id);
        }
        // Auto-select all items
        setSelectedItems(data.items?.map((i: LineItem) => i.id) || []);
      }
    } catch (error) {
      console.error("Error fetching orderable items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map((i) => i.id));
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedSupplier || selectedItems.length === 0) {
      alert("Please select a supplier and at least one item");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch(`/api/estimates/${estimateId}/order-parts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          itemIds: selectedItems,
          notes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Order ${data.orderNumber} created successfully!`);
        onOrderCreated();
        onClose();
      } else {
        alert(data.error || "Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order");
    } finally {
      setCreating(false);
    }
  };

  const calculateTotal = () => {
    return items
      .filter((i) => selectedItems.includes(i.id))
      .reduce((sum, i) => sum + (i.costPrice || i.unitPrice) * i.quantity, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Order Parts
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Select parts to order from a supplier
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">
              No parts to order
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              All parts have already been ordered or there are no parts in this
              estimate.
            </p>
          </div>
        ) : (
          <div className="px-6 py-4 space-y-4">
            {/* Supplier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Supplier
              </label>
              {suppliers.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800 font-medium mb-2">
                    No suppliers configured
                  </p>
                  <p className="text-xs text-yellow-700 mb-3">
                    You need to add at least one supplier before you can order parts.
                  </p>
                  <a
                    href="/dashboard/suppliers"
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                  >
                    Add Suppliers
                  </a>
                </div>
              ) : (
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Choose a supplier...</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                      {supplier.isPrimary && " (Primary)"}
                      {supplier.deliveryDays > 0 &&
                        ` - ${supplier.deliveryDays} day delivery`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Items List */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Parts to Order
                </label>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedItems.length === items.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              </div>
              <div className="border rounded-md divide-y max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => handleToggleItem(item.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.partName}
                      </p>
                      {item.partNumber && (
                        <p className="text-xs text-gray-500">
                          Part #: {item.partNumber}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {item.quantity} x ${(item.costPrice || item.unitPrice).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        ${((item.costPrice || item.unitPrice) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Any special instructions..."
              />
            </div>

            {/* Total */}
            <div className="bg-gray-50 rounded-md p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Selected Items:</span>
                <span className="font-medium">{selectedItems.length}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Estimated Total:</span>
                <span className="font-bold text-lg">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateOrder}
            disabled={
              creating ||
              !selectedSupplier ||
              selectedItems.length === 0 ||
              suppliers.length === 0
            }
          >
            {creating ? (
              "Creating..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Create Order
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
