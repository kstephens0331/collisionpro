"use client";

import { useState, useEffect, useCallback } from "react";

// For demo, use hardcoded shopId - in production, get from session
const SHOP_ID = "shop_demo";

interface OrderItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  status: string;
  receivedQuantity: number;
}

interface PartsOrder {
  id: string;
  orderNumber: string;
  poNumber: string | null;
  status: string;
  totalAmount: number;
  shippingCost: number;
  taxAmount: number;
  trackingNumber: string | null;
  expectedDelivery: string | null;
  actualDelivery: string | null;
  notes: string | null;
  createdAt: string;
  submittedAt: string | null;
  deliveredAt: string | null;
  PartsSupplier: {
    id: string;
    name: string;
    type: string;
  };
  Estimate: {
    id: string;
    estimateNumber: string;
    vehicleYear: string;
    vehicleMake: string;
    vehicleModel: string;
  } | null;
  PartsOrderItem: OrderItem[];
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  confirmed: "bg-indigo-100 text-indigo-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  submitted: "Submitted",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function PartsOrdersContent() {
  const [orders, setOrders] = useState<PartsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PartsOrder | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");

  const fetchOrders = useCallback(async () => {
    try {
      let url = `/api/parts-orders?shopId=${SHOP_ID}`;
      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/parts-orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
      } else {
        alert(data.error || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order:", error);
      alert("Failed to update order status");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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
              <h1 className="text-2xl font-bold text-gray-900">Parts Orders</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track and manage parts orders to suppliers
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filterStatus
                ? "No orders found with this status."
                : "Parts orders will appear here when created from estimates."}
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
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
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.PartsSupplier?.name || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.Estimate ? (
                        <div className="text-sm text-gray-900">
                          {order.Estimate.vehicleYear} {order.Estimate.vehicleMake}{" "}
                          {order.Estimate.vehicleModel}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.PartsOrderItem?.length || 0} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[order.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Order {selectedOrder.orderNumber}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedOrder.PartsSupplier?.name}
                </p>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[selectedOrder.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {statusLabels[selectedOrder.status] || selectedOrder.status}
              </span>
            </div>

            <div className="px-6 py-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="text-sm font-medium">
                    {formatDate(selectedOrder.createdAt)}
                  </p>
                </div>
                {selectedOrder.Estimate && (
                  <div>
                    <p className="text-sm text-gray-500">Vehicle</p>
                    <p className="text-sm font-medium">
                      {selectedOrder.Estimate.vehicleYear}{" "}
                      {selectedOrder.Estimate.vehicleMake}{" "}
                      {selectedOrder.Estimate.vehicleModel}
                    </p>
                  </div>
                )}
                {selectedOrder.trackingNumber && (
                  <div>
                    <p className="text-sm text-gray-500">Tracking Number</p>
                    <p className="text-sm font-medium">
                      {selectedOrder.trackingNumber}
                    </p>
                  </div>
                )}
                {selectedOrder.expectedDelivery && (
                  <div>
                    <p className="text-sm text-gray-500">Expected Delivery</p>
                    <p className="text-sm font-medium">
                      {formatDate(selectedOrder.expectedDelivery)}
                    </p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Items</h4>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase pb-2">
                        Part
                      </th>
                      <th className="text-center text-xs font-medium text-gray-500 uppercase pb-2">
                        Qty
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase pb-2">
                        Unit Cost
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase pb-2">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedOrder.PartsOrderItem?.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2">
                          <div className="text-sm font-medium text-gray-900">
                            {item.partNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.description}
                          </div>
                        </td>
                        <td className="py-2 text-center text-sm">
                          {item.quantity}
                        </td>
                        <td className="py-2 text-right text-sm">
                          {formatCurrency(item.unitCost)}
                        </td>
                        <td className="py-2 text-right text-sm font-medium">
                          {formatCurrency(item.totalCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t">
                    <tr>
                      <td colSpan={3} className="pt-2 text-right text-sm font-medium">
                        Subtotal
                      </td>
                      <td className="pt-2 text-right text-sm font-medium">
                        {formatCurrency(selectedOrder.totalAmount)}
                      </td>
                    </tr>
                    {selectedOrder.shippingCost > 0 && (
                      <tr>
                        <td colSpan={3} className="text-right text-sm text-gray-500">
                          Shipping
                        </td>
                        <td className="text-right text-sm">
                          {formatCurrency(selectedOrder.shippingCost)}
                        </td>
                      </tr>
                    )}
                    {selectedOrder.taxAmount > 0 && (
                      <tr>
                        <td colSpan={3} className="text-right text-sm text-gray-500">
                          Tax
                        </td>
                        <td className="text-right text-sm">
                          {formatCurrency(selectedOrder.taxAmount)}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="pt-2 text-right text-sm font-bold">
                        Total
                      </td>
                      <td className="pt-2 text-right text-sm font-bold">
                        {formatCurrency(
                          selectedOrder.totalAmount +
                            selectedOrder.shippingCost +
                            selectedOrder.taxAmount
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Status Actions */}
              {selectedOrder.status !== "delivered" &&
                selectedOrder.status !== "cancelled" && (
                  <div className="border-t mt-4 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Update Status
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.status === "pending" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(selectedOrder.id, "submitted")
                          }
                          className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                        >
                          Mark Submitted
                        </button>
                      )}
                      {selectedOrder.status === "submitted" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(selectedOrder.id, "confirmed")
                          }
                          className="px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
                        >
                          Mark Confirmed
                        </button>
                      )}
                      {(selectedOrder.status === "confirmed" ||
                        selectedOrder.status === "submitted") && (
                        <button
                          onClick={() =>
                            updateOrderStatus(selectedOrder.id, "shipped")
                          }
                          className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200"
                        >
                          Mark Shipped
                        </button>
                      )}
                      {selectedOrder.status === "shipped" && (
                        <button
                          onClick={() =>
                            updateOrderStatus(selectedOrder.id, "delivered")
                          }
                          className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                        >
                          Mark Delivered
                        </button>
                      )}
                      <button
                        onClick={() =>
                          updateOrderStatus(selectedOrder.id, "cancelled")
                        }
                        className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                      >
                        Cancel Order
                      </button>
                    </div>
                  </div>
                )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
