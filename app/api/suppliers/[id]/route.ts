import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();
  const { name, contactName, email, phone, country, notes } = body;
  await db.collection("suppliers").doc(id).update({
    name, contactName: contactName || null, email: email || null,
    phone: phone || null, country: country || null, notes: notes || null,
    updatedAt: new Date().toISOString(),
  });
  const doc = await db.collection("suppliers").doc(id).get();
  return NextResponse.json({ id, ...doc.data() });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const products = await db.collection("products").where("supplierIds", "array-contains", id).get();
  const batch = db.batch();
  products.docs.forEach((doc) => {
    const ids: string[] = doc.data().supplierIds ?? [];
    batch.update(doc.ref, { supplierIds: ids.filter((s) => s !== id) });
  });
  batch.delete(db.collection("suppliers").doc(id));
  await batch.commit();
  return NextResponse.json({ success: true });
}
