"use client";

import { useState } from "react";
import { Product, ProductCost } from "@/app/products/page";

interface Supplier { id: string; name: string; }

export default function EditProductCostsModal({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: () => void;
}) {
  const suppliers: Supplier[] = product.suppliers.map((ps) => ps.supplier);

  const [costs, setCosts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    suppliers.forEach((s) => {
      const found = product.costs.find((c) => c.supplierId === s.id);
      init[s.id] = found != null ? String(found.costPrice) : "";
    });
    return init;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await Promise.all(
      suppliers.map((s) => {
        const val = costs[s.id];
        if (val === "") return Promise.resolve();
        return fetch("/api/product-cost", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id, supplierId: s.id, costPrice: parseFloat(val) || 0 }),
        });
      })
    );
    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">تكاليف الموردين</h2>
            <p className="text-xs text-gray-500 mt-0.5">{product.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSave} autoComplete="off" className="px-6 py-4 space-y-4">
          {suppliers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              لا يوجد موردين مرتبطين بهذا المنتج.<br />
              <a href="/suppliers" className="text-orange-500 hover:underline">أضف مورد أولاً</a>
            </p>
          ) : (
            <div className="space-y-3">
              {suppliers.map((s) => (
                <div key={s.id}>
                  <label className="block text-xs font-medium text-blue-700 mb-1">🏭 {s.name}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costs[s.id]}
                      onChange={(e) => setCosts({ ...costs, [s.id]: e.target.value })}
                      autoComplete="off"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12"
                      placeholder="0.00"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">ج.م</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              إلغاء
            </button>
            {suppliers.length > 0 && (
              <button type="submit" disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
