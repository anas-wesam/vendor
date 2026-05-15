"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface InventoryItem {
  myWarehouseQty: number;
  amazonWarehouseQty: number;
  minStockAlert: number;
  asin: { product: { id: string } };
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalAsins: 0,
    totalMyQty: 0,
    totalAmazonQty: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((inventory: InventoryItem[]) => {
        const productIds = new Set(inventory.map((i) => i.asin.product.id));
        setStats({
          totalProducts: productIds.size,
          totalAsins: inventory.length,
          totalMyQty: inventory.reduce((s, i) => s + i.myWarehouseQty, 0),
          totalAmazonQty: inventory.reduce((s, i) => s + i.amazonWarehouseQty, 0),
          lowStockCount: inventory.filter(
            (i) => i.myWarehouseQty + i.amazonWarehouseQty > 0 &&
              i.myWarehouseQty + i.amazonWarehouseQty <= i.minStockAlert
          ).length,
          outOfStockCount: inventory.filter(
            (i) => i.myWarehouseQty + i.amazonWarehouseQty === 0
          ).length,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Products", value: stats.totalProducts, icon: "📦", color: "bg-blue-50 text-blue-700" },
    { label: "Total ASINs", value: stats.totalAsins, icon: "🔖", color: "bg-purple-50 text-purple-700" },
    { label: "My Warehouse Stock", value: stats.totalMyQty, icon: "🏭", color: "bg-green-50 text-green-700" },
    { label: "Amazon Warehouse Stock", value: stats.totalAmazonQty, icon: "🛒", color: "bg-orange-50 text-orange-700" },
    { label: "Low Stock ASINs", value: stats.lowStockCount, icon: "⚠️", color: "bg-yellow-50 text-yellow-700" },
    { label: "Out of Stock", value: stats.outOfStockCount, icon: "🚨", color: "bg-red-50 text-red-700" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your Amazon Vendor inventory</p>
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {cards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${card.color}`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Link
              href="/products"
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              + Add Product
            </Link>
            <a
              href="/api/export"
              className="bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              ⬇ Export to Excel
            </a>
          </div>
        </>
      )}
    </div>
  );
}
