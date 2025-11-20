"use client";

import { useState, useEffect, useCallback } from "react";

// For demo, use hardcoded shopId - in production, get from session
const SHOP_ID = "shop_demo";

interface Supplier {
  id: string;
  name: string;
  type: string;
  accountNumber: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  discountPercentage: number;
  defaultMarkup: number;
  deliveryDays: number;
  isActive: boolean;
  isPrimary: boolean;
  notes: string | null;
}

interface SupplierFormData {
  name: string;
  type: string;
  accountNumber: string;
  apiKey: string;
  apiEndpoint: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  discountPercentage: number;
  defaultMarkup: number;
  deliveryDays: number;
  isPrimary: boolean;
  notes: string;
}

const initialFormData: SupplierFormData = {
  name: "",
  type: "local_dealer",
  accountNumber: "",
  apiKey: "",
  apiEndpoint: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  discountPercentage: 0,
  defaultMarkup: 30,
  deliveryDays: 1,
  isPrimary: false,
  notes: "",
};

const supplierTypes = [
  { value: "local_dealer", label: "Local Dealer" },
  { value: "national", label: "National Supplier" },
  { value: "aftermarket", label: "Aftermarket" },
  { value: "oem", label: "OEM Parts" },
];

export default function SuppliersContent() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await fetch(`/api/suppliers?shopId=${SHOP_ID}`);
      const data = await response.json();

      if (data.success) {
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = "/api/suppliers";
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { id: editingId, shopId: SHOP_ID, ...formData }
        : { shopId: SHOP_ID, ...formData };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        setEditingId(null);
        setFormData(initialFormData);
        fetchSuppliers();
      } else {
        alert(data.error || "Failed to save supplier");
      }
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert("Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name,
      type: supplier.type,
      accountNumber: supplier.accountNumber || "",
      apiKey: "",
      apiEndpoint: "",
      contactName: supplier.contactName || "",
      contactEmail: supplier.contactEmail || "",
      contactPhone: supplier.contactPhone || "",
      address: supplier.address || "",
      city: supplier.city || "",
      state: supplier.state || "",
      zipCode: supplier.zipCode || "",
      discountPercentage: supplier.discountPercentage,
      defaultMarkup: supplier.defaultMarkup,
      deliveryDays: supplier.deliveryDays,
      isPrimary: supplier.isPrimary,
      notes: supplier.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this supplier?")) return;

    try {
      const response = await fetch(`/api/suppliers?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchSuppliers();
      } else {
        alert(data.error || "Failed to delete supplier");
      }
    } catch (error) {
      console.error("Error deleting supplier:", error);
      alert("Failed to delete supplier");
    }
  };

  const getTypeLabel = (type: string) => {
    return supplierTypes.find((t) => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Parts Suppliers</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your parts suppliers and pricing
              </p>
            </div>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData(initialFormData);
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Supplier
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {suppliers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No suppliers</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first parts supplier.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Add Supplier
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {supplier.name}
                            {supplier.isPrimary && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Primary
                              </span>
                            )}
                          </div>
                          {supplier.accountNumber && (
                            <div className="text-sm text-gray-500">
                              Account: {supplier.accountNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getTypeLabel(supplier.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.contactName || "-"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {supplier.contactPhone || supplier.contactEmail || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.discountPercentage}% discount
                      </div>
                      <div className="text-sm text-gray-500">
                        {supplier.defaultMarkup}% markup
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          supplier.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {supplier.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(supplier.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingId ? "Edit Supplier" : "Add New Supplier"}
                </h3>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type *
                    </label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {supplierTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, accountNumber: e.target.value })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>

                {/* Contact Info */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.contactName}
                        onChange={(e) =>
                          setFormData({ ...formData, contactName: e.target.value })
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, contactPhone: e.target.value })
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, contactEmail: e.target.value })
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Address</h4>
                  <div>
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <input
                        type="text"
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="State"
                        value={formData.state}
                        onChange={(e) =>
                          setFormData({ ...formData, state: e.target.value })
                        }
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="ZIP"
                        value={formData.zipCode}
                        onChange={(e) =>
                          setFormData({ ...formData, zipCode: e.target.value })
                        }
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Pricing Settings
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Discount %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.discountPercentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            discountPercentage: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Default Markup %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.defaultMarkup}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultMarkup: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Delivery Days
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.deliveryDays}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deliveryDays: parseInt(e.target.value) || 1,
                          })
                        }
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="border-t pt-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={formData.isPrimary}
                      onChange={(e) =>
                        setFormData({ ...formData, isPrimary: e.target.checked })
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isPrimary"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Set as primary supplier
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setFormData(initialFormData);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
