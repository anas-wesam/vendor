-- CreateTable
CREATE TABLE "ProductSupplier" (
    "productId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    PRIMARY KEY ("productId", "supplierId"),
    CONSTRAINT "ProductSupplier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductSupplier_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing data
INSERT OR IGNORE INTO "ProductSupplier" ("productId", "supplierId")
SELECT "id", "supplierId" FROM "Product" WHERE "supplierId" IS NOT NULL;

-- DropColumn supplierId from Product (done via table recreation)
