import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { productId, supplierId, costPrice } = body;
  if (!productId || !supplierId) return NextResponse.json({ error: "productId and supplierId required" }, { status: 400 });

  const docId = `${productId}_${supplierId}`;
  await db.collection("productCosts").doc(docId).set({
    productId, supplierId, costPrice: parseFloat(costPrice) || 0, updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ id: docId, productId, supplierId, costPrice: parseFloat(costPrice) || 0 });
}
