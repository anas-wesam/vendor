"use client";

import { useEffect, useState } from "react";
import EditInventoryModal from "@/components/EditInventoryModal";

interface InventoryRow {
  id: string;
  myWarehouseQty: number;
  amazonWarehouseQty: number;
  minStockAlert: number;
  notes: string | null;
  updatedAt: string;
  asin: {
    id: string;
    asin: string;
    marketplace: string;
    title: string | null;
    price: number | null;
    status: string;
    product: {
      id: string;
      name: string;
      brand: string | null;
      imageUrl: string | null;
    };
  };
}

type FilterType = "all" | "low" | "out";

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [editingRow, setEditingRow] = useState<InventoryRow | null>(null);

  const load = () => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then(setInventory)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = inventory.filter((row) => {
    const total = row.myWarehouseQty + row.amazonWarehouseQty;
    if (filter === "out" && total !== 0) return false;
    if (filter === "low" && !(total > 0 && total <= row.minStockAlert)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        row.asin.asin.toLowerCase().includes(q) ||
        row.asin.product.name.toLowerCase().includes(q) ||
        row.asin.product.brand?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totals = inventory.reduce(
    (acc, row) => ({
      myQty: acc.myQty + row.myWarehouseQty,
      amzQty: acc.amzQty + row.amazonWarehouseQty,
    }),
    { myQty: 0, amzQty: 0 }
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">
            {inventory.length} ASINs · My Warehouse: {totals.myQty.toLocaleString()} · Amazon: {totals.amzQty.toLocaleString()}
          </p>
        </div>
        <a
          href="/api/export"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          ⬇ Export Excel
        </a>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search ASIN, product, brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 max-w-xs px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          {(["all", "low", "out"] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 font-medium transition-colors ${
                filter === f ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f === "all" ? "All" : f === "low" ? "⚠️ Low Stock" : "🚨 Out of Stock"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">No items found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <tr>
                    <th className="px-4 py-3 text-left">Product</th>
                    <th className="px-4 py-3 text-left">ASIN</th>
                    <th className="px-4 py-3 text-left">Market</th>
                    <th className="px-4 py-3 text-right">My Wh.</th>
                    <th className="px-4 py-3 text-right">Amz Wh.</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((row) => {
                    const total = row.myWarehouseQty + row.amazonWarehouseQty;
                    const status =
                      total === 0 ? "out" : total <= row.minStockAlert ? "low" : "ok";
                    return (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 leading-tight">{row.asin.product.name}</p>
                          {row.asin.product.brand && (
                            <p className="text-xs text-gray-400">{row.asin.product.brand}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700">{row.asin.asin}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{row.asin.marketplace}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{row.myWarehouseQty}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{row.amazonWarehouseQty}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{total}</td>
                        <td className="px-4 py-3 text-center">
                          {status === "out" && <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">Out of Stock</span>}
                          {status === "low" && <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">Low Stock</span>}
                          {status === "ok" && <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">In Stock</span>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setEditingRow(row)}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Edit Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editingRow && (
        <EditInventoryModal
          asinId={editingRow.asin.id}
          asin={editingRow.asin.asin}
          inventory={{
            myWarehouseQty: editingRow.myWarehouseQty,
            amazonWarehouseQty: editingRow.amazonWarehouseQty,
            minStockAlert: editingRow.minStockAlert,
            notes: editingRow.notes,
          }}
          onClose={() => setEditingRow(null)}
          onSave={() => { setEditingRow(null); load(); }}
        />
      )}
    </div>
  );
}
