import InventoryManager from "@/components/inventory/InventoryManager";

export const dynamic = "force-dynamic";

export default function InventoryPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-gray-600 mt-1">
          Track parts inventory, stock levels, and receive automated low stock alerts
        </p>
      </div>

      <InventoryManager />
    </div>
  );
}
