import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { asinId, supplierId, costPrice } = body;
  if (!asinId || !supplierId) return NextResponse.json({ error: "asinId and supplierId required" }, { status: 400 });

  const docId = `${asinId}_${supplierId}`;
  await db.collection("asinCosts").doc(docId).set({
    asinId, supplierId, costPrice: parseFloat(costPrice) || 0, updatedAt: new Date().toISOString(),
  });
  const supDoc = await db.collection("suppliers").doc(supplierId).get();
  return NextResponse.json({ id: docId, asinId, supplierId, costPrice: parseFloat(costPrice) || 0, supplier: { id: supplierId, ...supDoc.data() } });
}
