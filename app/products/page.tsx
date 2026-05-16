"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import AddProductModal from "@/components/AddProductModal";

interface Inventory {
  myWarehouseQty: number;
  amazonWarehouseQty: number;
  minStockAlert: number;
  notes: string | null;
}

export interface ProductCost {
  id: string;
  supplierId: string;
  costPrice: number;
  supplier: { id: string; name: string };
}

export interface Asin {
  id: string;
  asin: string;
  marketplace: string;
  title: string | null;
  sellingPrice: number | null;
  marketPrice: number | null;
  status: string;
  unitsPerAsin: number;
  inventory: Inventory | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  brand: string | null;
  category: string | null;
  suppliers: { supplier: { id: string; name: string } }[];
  costs: ProductCost[];
  asins: Asin[];
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.asins.some((a) => a.asin.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">المنتجات</h1>
          <p className="text-xs text-gray-500 mt-0.5">{products.length} منتج · {products.reduce((s, p) => s + p.asins.length, 0)} ASIN</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          + إضافة
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="ابحث باسم المنتج أو ASIN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm">{search ? "No products match your search" : "No products yet. Add your first product!"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onRefresh={load} />
          ))}
        </div>
      )}

      {showAdd && (
        <AddProductModal
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}
