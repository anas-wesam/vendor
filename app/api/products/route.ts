import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { getProductWithRelations } from "@/lib/firestore-helpers";

export async function GET() {
  const db = getDb();

  const [productsSnap, suppliersSnap, asinsSnap, inventorySnap, costsSnap] = await Promise.all([
    db.collection("products").get(),
    db.collection("suppliers").get(),
    db.collection("asins").get(),
    db.collection("inventory").get(),
    db.collection("productCosts").get(),
  ]);

  const suppliersMap = new Map(suppliersSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
  const inventoryMap = new Map(inventorySnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));

  const asinsByProduct = new Map<string, { id: string; [k: string]: unknown }[]>();
  for (const d of asinsSnap.docs) {
    const asin = { id: d.id, ...d.data() } as { id: string; productId?: string; [k: string]: unknown };
    const pid = asin.productId as string;
    if (!asinsByProduct.has(pid)) asinsByProduct.set(pid, []);
    asinsByProduct.get(pid)!.push(asin);
  }

  const costsByProduct = new Map<string, { id: string; [k: string]: unknown }[]>();
  for (const d of costsSnap.docs) {
    const cost = { id: d.id, ...d.data() } as { id: string; productId?: string; [k: string]: unknown };
    const pid = cost.productId as string;
    if (!costsByProduct.has(pid)) costsByProduct.set(pid, []);
    costsByProduct.get(pid)!.push(cost);
  }

  const products = productsSnap.docs
    .map((doc) => {
      const product = { id: doc.id, ...doc.data() } as Record<string, unknown>;
      const supplierIds: string[] = (product.supplierIds as string[]) ?? [];

      product.suppliers = supplierIds
        .map((sid) => suppliersMap.get(sid))
        .filter(Boolean)
        .map((s) => ({ supplier: s }));

      product.costs = (costsByProduct.get(doc.id) ?? []).map((c) => ({
        ...c,
        supplier: suppliersMap.get(c.supplierId as string) ?? { id: c.supplierId, name: "?" },
      }));

      const asins = asinsByProduct.get(doc.id) ?? [];
      product.asins = asins.map((asin) => ({
        ...asin,
        inventory: inventoryMap.get(asin.id) ?? null,
      }));

      return product;
    })
    .sort((a, b) => ((b.createdAt as string) ?? "").localeCompare((a.createdAt as string) ?? ""));

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { name, description, imageUrl, brand, category, supplierIds = [], sellingPrice } = body;
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const now = new Date().toISOString();
  const ref = await db.collection("products").add({
    name, description: description || null, imageUrl: imageUrl || null,
    brand: brand || null, category: category || null,
    sellingPrice: sellingPrice ?? null,
    supplierIds, createdAt: now, updatedAt: now,
  });
  const product = await getProductWithRelations(ref.id);
  return NextResponse.json(product, { status: 201 });
}
