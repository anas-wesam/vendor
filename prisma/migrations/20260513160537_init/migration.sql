-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "brand" TEXT,
    "category" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Asin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "asin" TEXT NOT NULL,
    "marketplace" TEXT NOT NULL DEFAULT 'US',
    "title" TEXT,
    "price" REAL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "productId" TEXT NOT NULL,
    CONSTRAINT "Asin_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "myWarehouseQty" INTEGER NOT NULL DEFAULT 0,
    "amazonWarehouseQty" INTEGER NOT NULL DEFAULT 0,
    "minStockAlert" INTEGER NOT NULL DEFAULT 10,
    "notes" TEXT,
    "updatedAt" DATETIME NOT NULL,
    "asinId" TEXT NOT NULL,
    CONSTRAINT "Inventory_asinId_fkey" FOREIGN KEY ("asinId") REFERENCES "Asin" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Asin_asin_key" ON "Asin"("asin");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_asinId_key" ON "Inventory"("asinId");
