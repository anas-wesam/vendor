import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function GET() {
  const db = getDb();

  const [invSnap, asinsSnap, productsSnap] = await Promise.all([
    db.collection("inventory").get(),
    db.collection("asins").get(),
    db.collection("products").get(),
  ]);

  const asinsMap = new Map(asinsSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));
  const productsMap = new Map(productsSnap.docs.map((d) => [d.id, { id: d.id, ...d.data() }]));

  const rows = invSnap.docs.map((invDoc) => {
    const inv = invDoc.data();
    const asin = asinsMap.get(invDoc.id) as Record<string, unknown> | undefined;
    if (!asin) return null;
    const product = asin.productId ? productsMap.get(asin.productId as string) ?? null : null;
    return {
      id: invDoc.id, ...inv,
      asin: { ...asin, product },
    };
  }).filter(Boolean);

  return NextResponse.json(rows);
}

export async function PUT(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { asinId, myWarehouseQty, amazonWarehouseQty, minStockAlert, notes } = body;
  await db.collection("inventory").doc(asinId).update({
    myWarehouseQty: parseInt(myWarehouseQty) || 0,
    amazonWarehouseQty: parseInt(amazonWarehouseQty) || 0,
    minStockAlert: parseInt(minStockAlert) || 10,
    notes: notes || null,
    updatedAt: new Date().toISOString(),
  });
  const [invDoc, asinDoc] = await Promise.all([
    db.collection("inventory").doc(asinId).get(),
    db.collection("asins").doc(asinId).get(),
  ]);
  const asin = asinDoc.data()!;
  const productDoc = await db.collection("products").doc(asin.productId).get();
  return NextResponse.json({
    id: asinId, ...invDoc.data(),
    asin: { id: asinId, ...asin, product: productDoc.exists ? { id: productDoc.id, ...productDoc.data() } : null },
  });
}
