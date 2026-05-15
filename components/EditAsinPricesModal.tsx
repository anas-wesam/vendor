"use client";

import { useState } from "react";
import { Asin, ProductCost } from "@/app/products/page";

export default function EditAsinPricesModal({
  asin,
  productCosts,
  onClose,
  onSave,
}: {
  asin: Asin;
  productCosts: ProductCost[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [sellingPrice, setSellingPrice] = useState(
    asin.sellingPrice != null ? String(asin.sellingPrice) : ""
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/asins/${asin.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null }),
    });
    setSaving(false);
    onSave();
  };

  const sell = parseFloat(sellingPrice);
  const units = asin.unitsPerAsin ?? 1;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-900">سعر البيع</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{asin.asin}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSave} autoComplete="off" className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">سعر البيع (ج.م)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              autoComplete="off"
              className="w-full border border-green-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 font-medium"
              placeholder="0.00"
            />
          </div>

          {productCosts.length > 0 && !isNaN(sell) && sell > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">هامش الربح</p>
                {units > 1 && <span className="text-xs text-orange-600 font-medium">{units} قطع × التكلفة</span>}
              </div>
              {productCosts.map((c) => {
                const totalCost = c.costPrice * units;
                const profit = sell - totalCost;
                const pct = ((profit / sell) * 100).toFixed(1);
                return (
                  <div key={c.supplierId} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">🏭 {c.supplier.name} ({totalCost.toFixed(2)} ج.م)</span>
                    <span className={`font-medium px-2 py-0.5 rounded-full ${profit >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {profit >= 0 ? "+" : ""}{profit.toFixed(2)} ج.م ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              إلغاء
            </button>
            <button type="submit" disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
