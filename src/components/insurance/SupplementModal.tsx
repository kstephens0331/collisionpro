"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileEdit,
  Plus,
  Trash2,
  Send,
  Loader2,
  X,
  DollarSign,
  Camera,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface SupplementItem {
  id: string;
  type: "labor" | "parts" | "paint" | "other";
  description: string;
  quantity: number;
  unitPrice: number;
  reason: string;
}

interface SupplementModalProps {
  isOpen: boolean;
  onClose: () => void;
  estimateId: string;
  submissionId?: string;
  onSubmitted?: (result: any) => void;
}

export default function SupplementModal({
  isOpen,
  onClose,
  estimateId,
  submissionId,
  onSubmitted,
}: SupplementModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<SupplementItem[]>([
    {
      id: `item_${Date.now()}`,
      type: "labor",
      description: "",
      quantity: 1,
      unitPrice: 0,
      reason: "",
    },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item_${Date.now()}`,
        type: "labor",
        description: "",
        quantity: 1,
        unitPrice: 0,
        reason: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof SupplementItem, value: any) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/insurance/supplement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateId,
          submissionId,
          reason,
          items: items.map((item) => ({
            type: item.type,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            reason: item.reason,
          })),
          totalAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        onSubmitted?.(data.data);
      } else {
        setError(data.error || "Supplement submission failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileEdit className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Create Supplement</h2>
              <p className="text-sm text-gray-500">
                Request additional repairs from insurance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Success Result */}
          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-700">
                    Supplement Submitted
                  </h3>
                  <p className="text-sm text-green-600 mt-1">{result.message}</p>
                  <Button className="mt-4" onClick={onClose}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-700">Submission Failed</h3>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          {!result && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Overall Reason */}
              <div className="space-y-2">
                <Label>Supplement Reason *</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe why additional repairs are needed..."
                  required
                  rows={3}
                />
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Supplement Items</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Item {index + 1}</span>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-3">
                        <div className="col-span-1">
                          <Label className="text-xs">Type</Label>
                          <select
                            value={item.type}
                            onChange={(e) =>
                              updateItem(item.id, "type", e.target.value)
                            }
                            className="w-full p-2 border rounded-md text-sm"
                          >
                            <option value="labor">Labor</option>
                            <option value="parts">Parts</option>
                            <option value="paint">Paint</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Description *</Label>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateItem(item.id, "description", e.target.value)
                            }
                            placeholder="e.g., Replace door shell"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min="0.01"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Unit Price</Label>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateItem(
                                item.id,
                                "unitPrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Total</Label>
                          <div className="p-2 bg-gray-50 rounded-md font-medium">
                            ${(item.quantity * item.unitPrice).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Reason for Item *</Label>
                        <Input
                          value={item.reason}
                          onChange={(e) =>
                            updateItem(item.id, "reason", e.target.value)
                          }
                          placeholder="Why is this additional work needed?"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="p-4 bg-gray-100 rounded-lg flex items-center justify-between">
                <span className="font-medium">Total Supplement Amount</span>
                <span className="text-xl font-bold text-blue-600">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Photo Upload Hint */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-start gap-2">
                <Camera className="h-4 w-4 mt-0.5" />
                <p>
                  Tip: Upload photos of the additional damage through the Photos
                  tab to support your supplement request.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !reason || items.some((i) => !i.description)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Supplement
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
