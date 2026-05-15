/**
 * Migration script: SQLite → Firebase Firestore
 * Run: node scripts/migrate.mjs
 * Make sure .env.local has your Firebase credentials first.
 */

import { createClient } from "@libsql/client";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Load .env.local manually ──────────────────────────────────────────────────
const envPath = join(ROOT, ".env.local");
const envLines = readFileSync(envPath, "utf8").split("\n");
for (const line of envLines) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) {
    process.env[key.trim()] = rest.join("=").trim().replace(/^"|"$/g, "");
  }
}

// ── Firebase init ─────────────────────────────────────────────────────────────
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}
const db = getFirestore();

// ── SQLite client ─────────────────────────────────────────────────────────────
const sqlite = createClient({ url: `file:${join(ROOT, "dev.db")}` });

async function q(sql) {
  const res = await sqlite.execute(sql);
  return res.rows;
}

function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === null || v === undefined ? null : v;
  }
  return out;
}

async function writeBatch(collection, docs) {
  // Firestore batch max = 500
  for (let i = 0; i < docs.length; i += 400) {
    const chunk = docs.slice(i, i + 400);
    const batch = db.batch();
    for (const { id, data } of chunk) {
      batch.set(db.collection(collection).doc(id), data);
    }
    await batch.commit();
  }
}

async function migrate() {
  console.log("🚀 Starting migration: SQLite → Firestore\n");

  // ── Suppliers ─────────────────────────────────────────────────────────────
  const suppliers = await q("SELECT * FROM Supplier");
  await writeBatch("suppliers", suppliers.map((r) => ({
    id: r.id,
    data: clean({
      name: r.name,
      contactName: r.contactName,
      email: r.email,
      phone: r.phone,
      country: r.country,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }),
  })));
  console.log(`✅ Suppliers: ${suppliers.length}`);

  // ── Products + supplierIds ────────────────────────────────────────────────
  const products = await q("SELECT * FROM Product");
  const productSuppliers = await q("SELECT * FROM ProductSupplier");
  const supplierIdsByProduct = {};
  for (const ps of productSuppliers) {
    if (!supplierIdsByProduct[ps.productId]) supplierIdsByProduct[ps.productId] = [];
    supplierIdsByProduct[ps.productId].push(ps.supplierId);
  }
  await writeBatch("products", products.map((r) => ({
    id: r.id,
    data: clean({
      name: r.name,
      description: r.description,
      imageUrl: r.imageUrl,
      brand: r.brand,
      category: r.category,
      supplierIds: supplierIdsByProduct[r.id] ?? [],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }),
  })));
  console.log(`✅ Products: ${products.length}`);

  // ── ASINs ─────────────────────────────────────────────────────────────────
  const asins = await q("SELECT * FROM Asin");
  await writeBatch("asins", asins.map((r) => ({
    id: r.id,
    data: clean({
      asin: r.asin,
      marketplace: r.marketplace,
      title: r.title,
      sellingPrice: r.sellingPrice,
      status: r.status,
      productId: r.productId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }),
  })));
  console.log(`✅ ASINs: ${asins.length}`);

  // ── Inventory ─────────────────────────────────────────────────────────────
  const inventory = await q("SELECT * FROM Inventory");
  await writeBatch("inventory", inventory.map((r) => ({
    id: r.asinId,           // use asinId as doc ID (same pattern as new code)
    data: clean({
      asinId: r.asinId,
      myWarehouseQty: r.myWarehouseQty,
      amazonWarehouseQty: r.amazonWarehouseQty,
      minStockAlert: r.minStockAlert,
      notes: r.notes,
      updatedAt: r.updatedAt,
    }),
  })));
  console.log(`✅ Inventory: ${inventory.length}`);

  // ── AsinCosts ─────────────────────────────────────────────────────────────
  const costs = await q("SELECT * FROM AsinCost");
  await writeBatch("asinCosts", costs.map((r) => ({
    id: `${r.asinId}_${r.supplierId}`,
    data: clean({
      asinId: r.asinId,
      supplierId: r.supplierId,
      costPrice: r.costPrice,
      updatedAt: r.updatedAt,
    }),
  })));
  console.log(`✅ AsinCosts: ${costs.length}`);

  console.log("\n🎉 Migration complete! All data is now in Firestore.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
