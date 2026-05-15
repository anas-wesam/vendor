"use client";

import { useEffect, useState } from "react";
import { Product } from "@/app/products/page";
import ImageUpload from "./ImageUpload";

interface Supplier { id: string; name: string; }

export default function EditProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    name: product.name,
    brand: product.brand ?? "",
    category: product.category ?? "",
    description: product.description ?? "",
    imageUrl: product.imageUrl ?? "",
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>(
    product.suppliers.map((ps) => ps.supplier.id)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
  }, []);

  const toggleSupplier = (id: string) =>
    setSelectedSupplierIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("اسم المنتج مطلوب"); return; }
    setLoading(true);
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, supplierIds: selectedSupplierIds }),
    });
    setLoading(false);
    if (res.ok) onSave();
    else setError("فشل الحفظ");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">تعديل المنتج</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off" className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">صورة المنتج</label>
            <ImageUpload value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">اسم المنتج *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoComplete="off"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">البراند</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                autoComplete="off"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">الفئة</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                autoComplete="off"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">الموردين</label>
            {suppliers.length === 0 ? (
              <p className="text-xs text-gray-400">لا يوجد موردين.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {suppliers.map((s) => {
                  const selected = selectedSupplierIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSupplier(s.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selected
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                      }`}
                    >
                      🏭 {s.name} {selected && "✓"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">الوصف</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              placeholder="وصف اختياري..."
            />
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
