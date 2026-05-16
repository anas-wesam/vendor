"use client";

import { useState } from "react";
import Image from "next/image";
import { Product, Asin } from "@/app/products/page";
import AddAsinModal from "./AddAsinModal";
import EditInventoryModal from "./EditInventoryModal";
import EditAsinPricesModal from "./EditAsinPricesModal";
import EditProductCostsModal from "./EditProductCostsModal";
import EditAsinModal from "./EditAsinModal";
import EditProductModal from "./EditProductModal";

interface SupplierOption { id: string; name: string; }

function stockBadge(total: number, minAlert: number) {
  if (total === 0) return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">نفد</span>;
  if (total <= minAlert) return <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700">منخفض</span>;
  return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">متوفر</span>;
}

export default function ProductCard({ product, onRefresh }: { product: Product; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(true);
  const [showAddAsin, setShowAddAsin] = useState(false);
  const [editingInventoryAsin, setEditingInventoryAsin] = useState<Asin | null>(null);
  const [editingPricesAsin, setEditingPricesAsin] = useState<Asin | null>(null);
  const [showEditCosts, setShowEditCosts] = useState(false);
  const [showSupplierPicker, setShowSupplierPicker] = useState(false);
  const [allSuppliers, setAllSuppliers] = useState<SupplierOption[]>([]);
  const [editingUnitsAsinId, setEditingUnitsAsinId] = useState<string | null>(null);
  const [unitsInputVal, setUnitsInputVal] = useState("");
  const [editingAsin, setEditingAsin] = useState<Asin | null>(null);
  const [showEditProduct, setShowEditProduct] = useState(false);

  const currentSupplierIds = product.suppliers.map((ps) => ps.supplier.id);

  const openSupplierPicker = () => {
    fetch("/api/suppliers").then((r) => r.json()).then((data) =>
      setAllSuppliers(data.map((s: SupplierOption) => ({ id: s.id, name: s.name })))
    );
    setShowSupplierPicker(true);
  };

  const toggleSupplier = async (supplierId: string) => {
    const next = currentSupplierIds.includes(supplierId)
      ? currentSupplierIds.filter((id) => id !== supplierId)
      : [...currentSupplierIds, supplierId];
    await fetch(`/api/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierIds: next }),
    });
    onRefresh();
  };

  const handleDeleteProduct = async () => {
    if (!confirm(`Delete "${product.name}" and all its ASINs?`)) return;
    await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    onRefresh();
  };

  const saveUnits = async (asinId: string) => {
    const units = parseInt(unitsInputVal) || 1;
    await fetch(`/api/asins/${asinId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitsPerAsin: units }),
    });
    setEditingUnitsAsinId(null);
    onRefresh();
  };

  const handleDeleteAsin = async (asinId: string) => {
    if (!confirm("Delete this ASIN?")) return;
    await fetch(`/api/asins/${asinId}`, { method: "DELETE" });
    onRefresh();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 p-4">
        <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
          {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} width={80} height={80} className="object-cover w-full h-full" unoptimized />
          ) : (
            <span className="text-3xl">📦</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 text-base">{product.name}</h2>
              {product.brand && <p className="text-xs text-gray-500 mt-0.5">{product.brand}</p>}
              <div className="flex flex-wrap gap-1 mt-1">
                {product.category && (
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{product.category}</span>
                )}
                {product.suppliers.map((ps) => (
                  <span key={ps.supplier.id} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full font-medium flex items-center gap-1">
                    🏭 {ps.supplier.name}
                    <button onClick={() => toggleSupplier(ps.supplier.id)} className="text-blue-400 hover:text-red-500 ml-0.5">×</button>
                  </span>
                ))}
                <button onClick={openSupplierPicker} className="px-2 py-0.5 text-xs bg-gray-50 text-gray-500 rounded-full border border-dashed border-gray-300 hover:border-blue-400 hover:text-blue-600">
                  + مورد
                </button>
                {product.suppliers.length > 0 && (
                  <button
                    onClick={() => setShowEditCosts(true)}
                    className="px-2 py-0.5 text-xs bg-orange-50 text-orange-600 rounded-full border border-orange-200 hover:bg-orange-100 font-medium"
                  >
                    💰 تكاليف الموردين
                  </button>
                )}
              </div>

              {/* Cost + selling price summary */}
              {(product.costs.length > 0 || product.sellingPrice) && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {product.costs.map((c) => (
                    <span key={c.supplierId} className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">تكلفة {c.supplier.name}:</span> {c.costPrice.toFixed(2)} ج.م
                    </span>
                  ))}
                  {product.sellingPrice != null && (
                    <span className="text-xs text-green-700 font-medium">
                      سعر أمازون: {product.sellingPrice.toFixed(2)} ج.م
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-400">{product.asins.length} ASIN{product.asins.length !== 1 ? "s" : ""}</span>
              <button onClick={() => setExpanded(!expanded)} className="text-gray-400 text-xs px-2 py-1 border border-gray-200 rounded hover:text-gray-600">
                {expanded ? "▲" : "▼"}
              </button>
              <button onClick={() => setShowEditProduct(true)} className="text-gray-600 text-xs px-2 py-1 border border-gray-200 rounded hover:text-gray-900">
                تعديل
              </button>
              <button onClick={handleDeleteProduct} className="text-red-400 text-xs px-2 py-1 border border-red-200 rounded hover:text-red-600">
                حذف
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ASINs */}
      {expanded && (
        <div className="border-t border-gray-100">
          {product.asins.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-400 text-center">لا يوجد ASINs بعد</div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-100">
                {product.asins.map((asin) => {
                  const inv = asin.inventory;
                  const myQty = inv?.myWarehouseQty ?? 0;
                  const amzQty = inv?.amazonWarehouseQty ?? 0;
                  const total = myQty + amzQty;
                  const minAlert = inv?.minStockAlert ?? 10;
                  return (
                    <div key={asin.id} className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-700">{asin.asin}</span>
                        {stockBadge(total, minAlert)}
                      </div>
                      {asin.title && <p className="text-xs text-gray-500 truncate">{asin.title}</p>}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <p className="text-gray-500">سعر البيع</p>
                          <button onClick={() => setEditingPricesAsin(asin)} className="font-bold text-green-700 mt-0.5">
                            {asin.sellingPrice != null ? `${asin.sellingPrice.toFixed(0)} ج.م` : <span className="text-orange-400">+ سعر</span>}
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <p className="text-gray-500">مخزوني</p>
                          <p className="font-bold text-gray-800 mt-0.5">{myQty}</p>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <p className="text-gray-500">أمازون</p>
                          <p className="font-bold text-gray-800 mt-0.5">{amzQty}</p>
                        </div>
                      </div>
                      {product.costs.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {product.costs.map((c) => {
                            const units = asin.unitsPerAsin ?? 1;
                            return (
                              <span key={c.supplierId} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                {c.supplier.name}: {(c.costPrice * units).toFixed(0)} ج.م
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex gap-3 pt-1">
                        <button onClick={() => setEditingPricesAsin(asin)} className="text-xs text-orange-600 font-medium">سعر البيع</button>
                        <button onClick={() => setEditingInventoryAsin(asin)} className="text-xs text-blue-600 font-medium">مخزون</button>
                        <button onClick={() => setEditingAsin(asin)} className="text-xs text-gray-600 font-medium">تعديل</button>
                        <button onClick={() => handleDeleteAsin(asin.id)} className="text-xs text-red-500 font-medium">حذف</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 text-left">ASIN</th>
                      <th className="px-3 py-2 text-left">Title</th>
                      <th className="px-3 py-2 text-center">قطع</th>
                      <th className="px-3 py-2 text-right">سعر البيع</th>
                      {product.costs.map((c) => (
                        <th key={c.supplierId} className="px-3 py-2 text-right text-blue-600">
                          تكلفة {c.supplier.name}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right">مخزوني</th>
                      <th className="px-3 py-2 text-right">أمازون</th>
                      <th className="px-3 py-2 text-right">الإجمالي</th>
                      <th className="px-3 py-2 text-center">الحالة</th>
                      <th className="px-3 py-2 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {product.asins.map((asin) => {
                      const inv = asin.inventory;
                      const myQty = inv?.myWarehouseQty ?? 0;
                      const amzQty = inv?.amazonWarehouseQty ?? 0;
                      const total = myQty + amzQty;
                      const minAlert = inv?.minStockAlert ?? 10;
                      return (
                        <tr key={asin.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 font-mono text-xs font-medium text-blue-700 whitespace-nowrap">{asin.asin}</td>
                          <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[180px] truncate">{asin.title ?? "—"}</td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            {editingUnitsAsinId === asin.id ? (
                              <input
                                type="number" min="1" step="1"
                                value={unitsInputVal}
                                onChange={(e) => setUnitsInputVal(e.target.value)}
                                onBlur={() => saveUnits(asin.id)}
                                onKeyDown={(e) => { if (e.key === "Enter") saveUnits(asin.id); if (e.key === "Escape") setEditingUnitsAsinId(null); }}
                                autoFocus
                                className="w-14 border border-orange-300 rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-orange-400"
                              />
                            ) : (
                              <button
                                onClick={() => { setEditingUnitsAsinId(asin.id); setUnitsInputVal(String(asin.unitsPerAsin ?? 1)); }}
                                className="text-xs font-medium text-gray-700 hover:text-orange-600 px-2 py-0.5 rounded hover:bg-orange-50"
                              >
                                {asin.unitsPerAsin ?? 1} قطعة
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-green-700 whitespace-nowrap">
                            <button onClick={() => setEditingPricesAsin(asin)} className="hover:underline">
                              {asin.sellingPrice != null ? `${asin.sellingPrice.toFixed(2)} ج.م` : <span className="text-gray-300 text-xs">+ سعر</span>}
                            </button>
                          </td>
                          {product.costs.map((c) => {
                            const units = asin.unitsPerAsin ?? 1;
                            const totalCost = c.costPrice * units;
                            return (
                              <td key={c.supplierId} className="px-3 py-2.5 text-right whitespace-nowrap text-xs text-gray-700">
                                {totalCost.toFixed(2)} ج.م
                                {units > 1 && <span className="text-gray-400 mr-1">({c.costPrice.toFixed(2)}×{units})</span>}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2.5 text-right font-medium text-gray-800">{myQty}</td>
                          <td className="px-3 py-2.5 text-right font-medium text-gray-800">{amzQty}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-gray-900">{total}</td>
                          <td className="px-3 py-2.5 text-center">{stockBadge(total, minAlert)}</td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <button onClick={() => setEditingPricesAsin(asin)} className="text-xs text-orange-600 hover:underline">سعر البيع</button>
                            <span className="text-gray-300 mx-1">|</span>
                            <button onClick={() => setEditingInventoryAsin(asin)} className="text-xs text-blue-600 hover:underline">مخزون</button>
                            <span className="text-gray-300 mx-1">|</span>
                            <button onClick={() => setEditingAsin(asin)} className="text-xs text-gray-600 hover:underline">تعديل</button>
                            <span className="text-gray-300 mx-1">|</span>
                            <button onClick={() => handleDeleteAsin(asin.id)} className="text-xs text-red-500 hover:underline">حذف</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="px-4 py-3 border-t border-gray-100">
            <button onClick={() => setShowAddAsin(true)} className="text-sm text-orange-600 hover:text-orange-800 font-medium">+ إضافة ASIN</button>
          </div>
        </div>
      )}

      {/* Supplier Picker */}
      {showSupplierPicker && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xs">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-sm text-gray-900">إضافة مورد للمنتج</h3>
              <button onClick={() => setShowSupplierPicker(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto">
              {allSuppliers.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No suppliers found</p>
              ) : allSuppliers.map((s) => {
                const linked = currentSupplierIds.includes(s.id);
                return (
                  <button key={s.id} onClick={() => { toggleSupplier(s.id); setShowSupplierPicker(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm mb-1 transition-colors ${linked ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-gray-50 text-gray-700"}`}>
                    <span>🏭 {s.name}</span>
                    {linked && <span className="text-blue-500 text-xs">✓ مضاف</span>}
                  </button>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-gray-100">
              <a href="/suppliers" className="text-xs text-orange-500 hover:underline">+ إضافة مورد جديد</a>
            </div>
          </div>
        </div>
      )}

      {showAddAsin && (
        <AddAsinModal productId={product.id} onClose={() => setShowAddAsin(false)} onSave={() => { setShowAddAsin(false); onRefresh(); }} />
      )}
      {editingInventoryAsin && editingInventoryAsin.inventory && (
        <EditInventoryModal
          asinId={editingInventoryAsin.id}
          asin={editingInventoryAsin.asin}
          inventory={editingInventoryAsin.inventory}
          onClose={() => setEditingInventoryAsin(null)}
          onSave={() => { setEditingInventoryAsin(null); onRefresh(); }}
        />
      )}
      {editingPricesAsin && (
        <EditAsinPricesModal
          asin={editingPricesAsin}
          productCosts={product.costs}
          onClose={() => setEditingPricesAsin(null)}
          onSave={() => { setEditingPricesAsin(null); onRefresh(); }}
        />
      )}
      {showEditCosts && (
        <EditProductCostsModal
          product={product}
          onClose={() => setShowEditCosts(false)}
          onSave={() => { setShowEditCosts(false); onRefresh(); }}
        />
      )}
      {editingAsin && (
        <EditAsinModal
          asin={editingAsin}
          onClose={() => setEditingAsin(null)}
          onSave={() => { setEditingAsin(null); onRefresh(); }}
        />
      )}
      {showEditProduct && (
        <EditProductModal
          product={product}
          onClose={() => setShowEditProduct(false)}
          onSave={() => { setShowEditProduct(false); onRefresh(); }}
        />
      )}
    </div>
  );
}
