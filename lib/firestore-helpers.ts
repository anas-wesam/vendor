import { getDb } from "./firebase";

export async function getProductWithRelations(productId: string) {
  const db = getDb();
  const productDoc = await db.collection("products").doc(productId).get();
  if (!productDoc.exists) return null;
  const product = { id: productId, ...productDoc.data() } as Record<string, unknown>;

  const supplierIds: string[] = (product.supplierIds as string[]) ?? [];
  const supplierDocs = await Promise.all(supplierIds.map((sid) => db.collection("suppliers").doc(sid).get()));
  product.suppliers = supplierDocs.filter((d) => d.exists).map((d) => ({ supplier: { id: d.id, ...d.data() } }));

  const costsSnap = await db.collection("productCosts").where("productId", "==", productId).get();
  const suppliersMap = new Map(supplierDocs.filter((d) => d.exists).map((d) => [d.id, { id: d.id, ...d.data() }]));
  product.costs = costsSnap.docs.map((c) => {
    const data = c.data();
    return { id: c.id, ...data, supplier: suppliersMap.get(data.supplierId) ?? { id: data.supplierId, name: "?" } };
  });

  const asinSnap = await db.collection("asins").where("productId", "==", productId).get();
  product.asins = await Promise.all(
    asinSnap.docs.map(async (asinDoc) => {
      const asin = { id: asinDoc.id, ...asinDoc.data() } as Record<string, unknown>;
      const invDoc = await db.collection("inventory").doc(asinDoc.id).get();
      asin.inventory = invDoc.exists ? { id: invDoc.id, ...invDoc.data() } : null;
      return asin;
    })
  );
  return product;
}
