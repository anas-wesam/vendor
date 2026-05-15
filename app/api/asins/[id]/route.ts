import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.asin !== undefined) update.asin = body.asin;
  if (body.marketplace !== undefined) update.marketplace = body.marketplace;
  if (body.title !== undefined) update.title = body.title || null;
  if (body.sellingPrice !== undefined) update.sellingPrice = body.sellingPrice != null ? parseFloat(body.sellingPrice) : null;
  if (body.status !== undefined) update.status = body.status;
  if (body.unitsPerAsin !== undefined) update.unitsPerAsin = parseInt(body.unitsPerAsin) || 1;
  await db.collection("asins").doc(id).update(update);
  const doc = await db.collection("asins").doc(id).get();
  const inv = await db.collection("inventory").doc(id).get();
  const costsSnap = await db.collection("asinCosts").where("asinId", "==", id).get();
  const costs = await Promise.all(costsSnap.docs.map(async (c) => {
    const sup = await db.collection("suppliers").doc(c.data().supplierId).get();
    return { id: c.id, ...c.data(), supplier: { id: sup.id, ...sup.data() } };
  }));
  return NextResponse.json({ id, ...doc.data(), inventory: inv.exists ? { id, ...inv.data() } : null, costs });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const batch = db.batch();
  batch.delete(db.collection("inventory").doc(id));
  const costs = await db.collection("asinCosts").where("asinId", "==", id).get();
  costs.docs.forEach((c) => batch.delete(c.ref));
  batch.delete(db.collection("asins").doc(id));
  await batch.commit();
  return NextResponse.json({ success: true });
}
