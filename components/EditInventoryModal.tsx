"use client";

import { useState } from "react";

interface InventoryData {
  myWarehouseQty: number;
  amazonWarehouseQty: number;
  minStockAlert: number;
  notes: string | null;
}

export default function EditInventoryModal({
  asinId,
  asin,
  inventory,
  onClose,
  onSave,
}: {
  asinId: string;
  asin: string;
  inventory: InventoryData;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    myWarehouseQty: inventory.myWarehouseQty,
    amazonWarehouseQty: inventory.amazonWarehouseQty,
    minStockAlert: inventory.minStockAlert,
    notes: inventory.notes ?? "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asinId, ...form }),
    });
    setLoading(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">Edit Stock</h2>
            <p className="text-xs text-gray-500 font-mono">{asin}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">My Warehouse Qty</label>
              <input
                type="number"
                min="0"
                value={form.myWarehouseQty}
                onChange={(e) => setForm({ ...form, myWarehouseQty: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Amazon Warehouse Qty</label>
              <input
                type="number"
                min="0"
                value={form.amazonWarehouseQty}
                onChange={(e) => setForm({ ...form, amazonWarehouseQty: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min Stock Alert</label>
            <input
              type="number"
              min="0"
              value={form.minStockAlert}
              onChange={(e) => setForm({ ...form, minStockAlert: parseInt(e.target.value) || 0 })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <p className="text-xs text-gray-400 mt-1">Show warning when total stock drops below this number</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              placeholder="Optional notes..."
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            Total: <span className="font-bold text-gray-900">{form.myWarehouseQty + form.amazonWarehouseQty}</span> units
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
