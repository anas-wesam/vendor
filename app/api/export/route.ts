import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";
import * as XLSX from "xlsx";

export async function GET() {
  const db = getDb();
  const invSnap = await db.collection("inventory").get();

  const rows = await Promise.all(
    invSnap.docs.map(async (invDoc) => {
      const inv = invDoc.data();
      const asinDoc = await db.collection("asins").doc(invDoc.id).get();
      if (!asinDoc.exists) return null;
      const asin = asinDoc.data()!;
      const productDoc = await db.collection("products").doc(asin.productId).get();
      if (!productDoc.exists) return null;
      const product = productDoc.data()!;

      const supplierIds: string[] = product.supplierIds ?? [];
      const supplierDocs = await Promise.all(supplierIds.map((sid) => db.collection("suppliers").doc(sid).get()));
      const supplierNames = supplierDocs.filter((d) => d.exists).map((d) => d.data()!.name).join(", ");

      const costsSnap = await db.collection("asinCosts").where("asinId", "==", invDoc.id).get();
      const costsObj: Record<string, number | string> = {};
      await Promise.all(costsSnap.docs.map(async (c) => {
        const sup = await db.collection("suppliers").doc(c.data().supplierId).get();
        costsObj[`تكلفة ${sup.exists ? sup.data()!.name : "?"} (ج.م)`] = c.data().costPrice;
      }));

      const total = (inv.myWarehouseQty ?? 0) + (inv.amazonWarehouseQty ?? 0);
      return {
        "اسم المنتج": product.name ?? "",
        "البراند": product.brand ?? "",
        "الفئة": product.category ?? "",
        "الموردين": supplierNames,
        "ASIN": asin.asin ?? "",
        "الماركت": asin.marketplace ?? "",
        "عنوان الـ ASIN": asin.title ?? "",
        "سعر البيع (ج.م)": asin.sellingPrice ?? "",
        ...costsObj,
        "مخزوني": inv.myWarehouseQty ?? 0,
        "مخزون أمازون": inv.amazonWarehouseQty ?? 0,
        "الإجمالي": total,
        "الحد الأدنى للتنبيه": inv.minStockAlert ?? 10,
        "حالة المخزون": total === 0 ? "نفد" : total <= (inv.minStockAlert ?? 10) ? "منخفض" : "متوفر",
        "ملاحظات": inv.notes ?? "",
      };
    })
  );

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows.filter(Boolean) as object[]);
  XLSX.utils.book_append_sheet(wb, ws, "Inventory");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="inventory-${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}
