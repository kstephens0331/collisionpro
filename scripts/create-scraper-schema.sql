-- Scraper logging and monitoring table

CREATE TABLE "ScrapeLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supplierId" TEXT NOT NULL REFERENCES "PartSupplier"("id") ON DELETE CASCADE,
  "supplierName" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "partsScraped" INTEGER NOT NULL DEFAULT 0,
  "partsAdded" INTEGER NOT NULL DEFAULT 0,
  "partsUpdated" INTEGER NOT NULL DEFAULT 0,
  "errors" JSONB DEFAULT '[]',
  "duration" INTEGER NOT NULL, -- milliseconds
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_scrapelog_supplier" ON "ScrapeLog"("supplierId");
CREATE INDEX "idx_scrapelog_timestamp" ON "ScrapeLog"("timestamp" DESC);
CREATE INDEX "idx_scrapelog_success" ON "ScrapeLog"("success");

COMMENT ON TABLE "ScrapeLog" IS 'Logs of scraper runs for monitoring and debugging';
