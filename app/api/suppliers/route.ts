import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function GET() {
  const db = getDb();
  const snap = await db.collection("suppliers").orderBy("name").get();
  const suppliers = await Promise.all(
    snap.docs.map(async (doc) => {
      const productsSnap = await db.collection("products").where("supplierIds", "array-contains", doc.id).get();
      return {
        id: doc.id, ...doc.data(),
        _count: { products: productsSnap.size },
        products: productsSnap.docs.map((p) => ({ product: { id: p.id, name: p.data().name } })),
      };
    })
  );
  return NextResponse.json(suppliers);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { name, contactName, email, phone, country, notes } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Supplier name is required" }, { status: 400 });

  const now = new Date().toISOString();
  const ref = await db.collection("suppliers").add({
    name, contactName: contactName || null, email: email || null,
    phone: phone || null, country: country || null, notes: notes || null,
    createdAt: now, updatedAt: now,
  });
  const doc = await ref.get();
  return NextResponse.json({ id: ref.id, ...doc.data() }, { status: 201 });
}
