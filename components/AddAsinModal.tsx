"use client";

import { useState } from "react";

const MARKETPLACES = ["EG", "US", "UK", "DE", "FR", "IT", "ES", "CA", "AU", "JP", "AE", "SA"];

export default function AddAsinModal({
  productId,
  onClose,
  onSave,
}: {
  productId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    asin: "",
    marketplace: "EG",
    title: "",
    sellingPrice: "",
    unitsPerAsin: "1",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.asin.trim()) { setError("ASIN is required"); return; }
    setLoading(true);
    const res = await fetch("/api/asins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, productId }),
    });
    setLoading(false);
    if (res.ok) {
      onSave();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to add ASIN");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Add ASIN</h2>
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
              placeholder="B0XXXXXXXXX"
              maxLength={10}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Marketplace</label>
            <select
              value={form.marketplace}
              onChange={(e) => setForm({ ...form, marketplace: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              {MARKETPLACES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Title (optional)</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="Product listing title"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">عدد القطع في الـ ASIN</label>
            <input
              type="number"
              min="1"
              step="1"
              value={form.unitsPerAsin}
              onChange={(e) => setForm({ ...form, unitsPerAsin: e.target.value })}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="1"
            />
            <p className="text-xs text-gray-400 mt-1">لو الـ ASIN فيه 2 قطعة اكتب 2 — التكلفة هتتحسب تلقائي</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">سعر البيع (ج.م)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.sellingPrice}
              onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-400 mt-1">سعر التكلفة لكل مورد تضيفه بعد إنشاء الـ ASIN</p>
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {loading ? "Adding..." : "Add ASIN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
