"use client";

import { useState } from "react";
import { Asin } from "@/app/products/page";

const MARKETPLACES = ["EG", "US", "UK", "DE", "FR", "IT", "ES", "CA", "AU", "JP", "AE", "SA"];

export default function EditAsinModal({
  asin,
  onClose,
  onSave,
}: {
  asin: Asin;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    asin: asin.asin,
    marketplace: asin.marketplace,
    title: asin.title ?? "",
    sellingPrice: asin.sellingPrice != null ? String(asin.sellingPrice) : "",
    marketPrice: asin.marketPrice != null ? String(asin.marketPrice) : "",
    unitsPerAsin: String(asin.unitsPerAsin ?? 1),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asin.trim()) { setError("ASIN مطلوب"); return; }
    setLoading(true);
    const res = await fetch(`/api/asins/${asin.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asin: form.asin.trim().toUpperCase(),
        marketplace: form.marketplace,
        title: form.title || null,
        sellingPrice: form.sellingPrice ? parseFloat(form.sellingPrice) : null,
        marketPrice: form.marketPrice ? parseFloat(form.marketPrice) : null,
        unitsPerAsin: parseInt(form.unitsPerAsin) || 1,
      }),
    });
    setLoading(false);
    if (res.ok) {
      onSave();
    } else {
      const data = await res.json();
      setError(data.error ?? "فشل التعديل");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">تعديل ASIN</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">ASIN *</label>
            <input
              type="text"
              value={form.asin}
              onChange={(e) => setForm({ ...form, asin: e.target.value.toUpperCase() })}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400"
              maxLength={10}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Marketplace</label>
              <select
                value={form.marketplace}
                onChange={(e) => setForm({ ...form, marketplace: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {MARKETPLACES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">عدد القطع</label>
              <input
                type="number" min="1" step="1"
                value={form.unitsPerAsin}
                onChange={(e) => setForm({ ...form, unitsPerAsin: e.target.value })}
                autoComplete="off"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">العنوان</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="عنوان الـ listing"
            />
          </div>

          {/* Prices */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">الأسعار</p>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                سعر البيع لأمازون
                <span className="text-gray-400 font-normal mr-1">(الفاتورة)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" step="0.01" min="0"
                  value={form.sellingPrice}
                  onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                  autoComplete="off"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="0.00"
                />
                <span className="text-sm text-gray-400">ج.م</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                سعر الماركت
                <span className="text-gray-400 font-normal mr-1">(سعر الكاستومر على أمازون)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" step="0.01" min="0"
                  value={form.marketPrice}
                  onChange={(e) => setForm({ ...form, marketPrice: e.target.value })}
                  autoComplete="off"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="0.00"
                />
                <span className="text-sm text-gray-400">ج.م</span>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              إلغاء
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? "جاري الحفظ..." : "حفظ"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
