import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import { getProductWithRelations } from "@/lib/firestore-helpers";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductWithRelations(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  const { name, description, imageUrl, brand, category, supplierIds } = body;
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (name !== undefined) update.name = name;
  if (description !== undefined) update.description = description || null;
  if (imageUrl !== undefined) update.imageUrl = imageUrl || null;
  if (brand !== undefined) update.brand = brand || null;
  if (category !== undefined) update.category = category || null;
  if (supplierIds !== undefined) update.supplierIds = supplierIds;
  await db.collection("products").doc(id).update(update);
  return NextResponse.json(await getProductWithRelations(id));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const asins = await db.collection("asins").where("productId", "==", id).get();
  const batch = db.batch();
  for (const asin of asins.docs) {
    batch.delete(db.collection("inventory").doc(asin.id));
    const costs = await db.collection("asinCosts").where("asinId", "==", asin.id).get();
    costs.docs.forEach((c) => batch.delete(c.ref));
    batch.delete(asin.ref);
  }
  batch.delete(db.collection("products").doc(id));
  await batch.commit();
  return NextResponse.json({ success: true });
}
