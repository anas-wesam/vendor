import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { asin, marketplace = "EG", title, sellingPrice, marketPrice, unitsPerAsin, productId } = body;
  if (!asin || !productId) return NextResponse.json({ error: "ASIN and productId are required" }, { status: 400 });

  const existing = await db.collection("asins").where("asin", "==", asin).get();
  if (!existing.empty) return NextResponse.json({ error: "ASIN already exists" }, { status: 400 });

  const now = new Date().toISOString();
  const ref = await db.collection("asins").add({
    asin, marketplace, title: title || null,
    sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
    marketPrice: marketPrice ? parseFloat(marketPrice) : null,
    unitsPerAsin: parseInt(unitsPerAsin) || 1,
    productId, status: "active", createdAt: now, updatedAt: now,
  });

  await db.collection("inventory").doc(ref.id).set({
    asinId: ref.id, myWarehouseQty: 0, amazonWarehouseQty: 0,
    minStockAlert: 10, notes: null, updatedAt: now,
  });

  const doc = await ref.get();
  const inv = await db.collection("inventory").doc(ref.id).get();
  return NextResponse.json({ id: ref.id, ...doc.data(), inventory: { id: ref.id, ...inv.data() }, costs: [] }, { status: 201 });
}
