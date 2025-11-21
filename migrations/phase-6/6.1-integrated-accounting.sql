-- =============================================
-- Integrated Accounting System
-- =============================================
-- Full double-entry accounting with chart of accounts,
-- journal entries, and financial reporting

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS "Account" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
  "accountNumber" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountType" TEXT NOT NULL, -- asset, liability, equity, revenue, expense
  "accountSubtype" TEXT, -- current-asset, fixed-asset, current-liability, etc.
  "parentAccountId" TEXT REFERENCES "Account"("id"),
  "description" TEXT,

  -- Account properties
  "normalBalance" TEXT NOT NULL, -- debit or credit
  "isActive" BOOLEAN DEFAULT true,
  "isSystem" BOOLEAN DEFAULT false, -- System accounts can't be deleted
  "allowManualEntry" BOOLEAN DEFAULT true,

  -- Balances (cached for performance)
  "currentBalance" DECIMAL(15,2) DEFAULT 0,
  "ytdBalance" DECIMAL(15,2) DEFAULT 0,

  -- Hierarchy
  "level" INTEGER DEFAULT 1,
  "fullPath" TEXT, -- For hierarchical display

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("shopId", "accountNumber")
);

-- Seed default chart of accounts for auto collision shops
INSERT INTO "Account" ("id", "shopId", "accountNumber", "accountName", "accountType", "accountSubtype", "normalBalance", "isSystem", "level") VALUES
  -- ASSETS
  ('acc-1000', 'shop-1', '1000', 'Assets', 'asset', 'header', 'debit', true, 1),
  ('acc-1100', 'shop-1', '1100', 'Current Assets', 'asset', 'current-asset', 'debit', true, 2),
  ('acc-1110', 'shop-1', '1110', 'Cash - Checking', 'asset', 'current-asset', 'debit', true, 3),
  ('acc-1120', 'shop-1', '1120', 'Cash - Savings', 'asset', 'current-asset', 'debit', true, 3),
  ('acc-1200', 'shop-1', '1200', 'Accounts Receivable', 'asset', 'current-asset', 'debit', true, 3),
  ('acc-1210', 'shop-1', '1210', 'AR - Insurance Companies', 'asset', 'current-asset', 'debit', true, 3),
  ('acc-1220', 'shop-1', '1220', 'AR - Customers', 'asset', 'current-asset', 'debit', true, 3),
  ('acc-1300', 'shop-1', '1300', 'Inventory - Parts', 'asset', 'current-asset', 'debit', true, 3),
  ('acc-1310', 'shop-1', '1310', 'Inventory - Paint & Materials', 'asset', 'current-asset', 'debit', true, 3),
  ('acc-1400', 'shop-1', '1400', 'Prepaid Expenses', 'asset', 'current-asset', 'debit', true, 3),

  ('acc-1500', 'shop-1', '1500', 'Fixed Assets', 'asset', 'fixed-asset', 'debit', true, 2),
  ('acc-1510', 'shop-1', '1510', 'Equipment', 'asset', 'fixed-asset', 'debit', true, 3),
  ('acc-1520', 'shop-1', '1520', 'Vehicles', 'asset', 'fixed-asset', 'debit', true, 3),
  ('acc-1530', 'shop-1', '1530', 'Building', 'asset', 'fixed-asset', 'debit', true, 3),
  ('acc-1540', 'shop-1', '1540', 'Accumulated Depreciation', 'asset', 'fixed-asset', 'credit', true, 3),

  -- LIABILITIES
  ('acc-2000', 'shop-1', '2000', 'Liabilities', 'liability', 'header', 'credit', true, 1),
  ('acc-2100', 'shop-1', '2100', 'Current Liabilities', 'liability', 'current-liability', 'credit', true, 2),
  ('acc-2110', 'shop-1', '2110', 'Accounts Payable', 'liability', 'current-liability', 'credit', true, 3),
  ('acc-2120', 'shop-1', '2120', 'Payroll Liabilities', 'liability', 'current-liability', 'credit', true, 3),
  ('acc-2130', 'shop-1', '2130', 'Sales Tax Payable', 'liability', 'current-liability', 'credit', true, 3),
  ('acc-2140', 'shop-1', '2140', 'Credit Card Payable', 'liability', 'current-liability', 'credit', true, 3),

  ('acc-2200', 'shop-1', '2200', 'Long-term Liabilities', 'liability', 'long-term-liability', 'credit', true, 2),
  ('acc-2210', 'shop-1', '2210', 'Equipment Loans', 'liability', 'long-term-liability', 'credit', true, 3),
  ('acc-2220', 'shop-1', '2220', 'Building Mortgage', 'liability', 'long-term-liability', 'credit', true, 3),

  -- EQUITY
  ('acc-3000', 'shop-1', '3000', 'Equity', 'equity', 'equity', 'credit', true, 1),
  ('acc-3100', 'shop-1', '3100', 'Owner''s Equity', 'equity', 'equity', 'credit', true, 2),
  ('acc-3200', 'shop-1', '3200', 'Retained Earnings', 'equity', 'equity', 'credit', true, 2),
  ('acc-3300', 'shop-1', '3300', 'Current Year Earnings', 'equity', 'equity', 'credit', true, 2),

  -- REVENUE
  ('acc-4000', 'shop-1', '4000', 'Revenue', 'revenue', 'sales', 'credit', true, 1),
  ('acc-4100', 'shop-1', '4100', 'Labor Revenue', 'revenue', 'sales', 'credit', true, 2),
  ('acc-4110', 'shop-1', '4110', 'Body Labor', 'revenue', 'sales', 'credit', true, 3),
  ('acc-4120', 'shop-1', '4120', 'Paint Labor', 'revenue', 'sales', 'credit', true, 3),
  ('acc-4130', 'shop-1', '4130', 'Frame Labor', 'revenue', 'sales', 'credit', true, 3),
  ('acc-4140', 'shop-1', '4140', 'Mechanical Labor', 'revenue', 'sales', 'credit', true, 3),

  ('acc-4200', 'shop-1', '4200', 'Parts Revenue', 'revenue', 'sales', 'credit', true, 2),
  ('acc-4210', 'shop-1', '4210', 'OEM Parts', 'revenue', 'sales', 'credit', true, 3),
  ('acc-4220', 'shop-1', '4220', 'Aftermarket Parts', 'revenue', 'sales', 'credit', true, 3),

  ('acc-4300', 'shop-1', '4300', 'Paint & Materials Revenue', 'revenue', 'sales', 'credit', true, 2),
  ('acc-4400', 'shop-1', '4400', 'Sublet Revenue', 'revenue', 'sales', 'credit', true, 2),

  -- EXPENSES
  ('acc-5000', 'shop-1', '5000', 'Cost of Goods Sold', 'expense', 'cogs', 'debit', true, 1),
  ('acc-5100', 'shop-1', '5100', 'Parts Cost', 'expense', 'cogs', 'debit', true, 2),
  ('acc-5200', 'shop-1', '5200', 'Paint & Materials Cost', 'expense', 'cogs', 'debit', true, 2),
  ('acc-5300', 'shop-1', '5300', 'Sublet Cost', 'expense', 'cogs', 'debit', true, 2),

  ('acc-6000', 'shop-1', '6000', 'Operating Expenses', 'expense', 'operating', 'debit', true, 1),
  ('acc-6100', 'shop-1', '6100', 'Payroll Expenses', 'expense', 'operating', 'debit', true, 2),
  ('acc-6110', 'shop-1', '6110', 'Wages - Technicians', 'expense', 'operating', 'debit', true, 3),
  ('acc-6120', 'shop-1', '6120', 'Wages - Admin', 'expense', 'operating', 'debit', true, 3),
  ('acc-6130', 'shop-1', '6130', 'Payroll Taxes', 'expense', 'operating', 'debit', true, 3),
  ('acc-6140', 'shop-1', '6140', 'Benefits', 'expense', 'operating', 'debit', true, 3),

  ('acc-6200', 'shop-1', '6200', 'Rent/Lease', 'expense', 'operating', 'debit', true, 2),
  ('acc-6300', 'shop-1', '6300', 'Utilities', 'expense', 'operating', 'debit', true, 2),
  ('acc-6400', 'shop-1', '6400', 'Insurance', 'expense', 'operating', 'debit', true, 2),
  ('acc-6500', 'shop-1', '6500', 'Marketing & Advertising', 'expense', 'operating', 'debit', true, 2),
  ('acc-6600', 'shop-1', '6600', 'Office Supplies', 'expense', 'operating', 'debit', true, 2),
  ('acc-6700', 'shop-1', '6700', 'Equipment Maintenance', 'expense', 'operating', 'debit', true, 2),
  ('acc-6800', 'shop-1', '6800', 'Professional Fees', 'expense', 'operating', 'debit', true, 2),
  ('acc-6900', 'shop-1', '6900', 'Depreciation Expense', 'expense', 'operating', 'debit', true, 2)
ON CONFLICT (id) DO NOTHING;

-- Journal Entry Headers
CREATE TABLE IF NOT EXISTS "JournalEntry" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
  "entryNumber" TEXT NOT NULL,
  "entryDate" DATE NOT NULL,
  "postDate" TIMESTAMP,

  -- Entry metadata
  "entryType" TEXT DEFAULT 'general', -- general, closing, adjusting, reversing
  "source" TEXT DEFAULT 'manual', -- manual, estimate, payment, payroll, depreciation, etc.
  "sourceId" TEXT, -- ID of source record (estimateId, paymentId, etc.)

  "description" TEXT NOT NULL,
  "memo" TEXT,

  -- Status
  "status" TEXT DEFAULT 'draft', -- draft, posted, void
  "isRecurring" BOOLEAN DEFAULT false,
  "recurringFrequency" TEXT, -- monthly, quarterly, annual

  -- Amounts (for validation)
  "totalDebit" DECIMAL(15,2) DEFAULT 0,
  "totalCredit" DECIMAL(15,2) DEFAULT 0,
  "isBalanced" BOOLEAN DEFAULT false,

  -- Audit
  "createdBy" TEXT,
  "postedBy" TEXT,
  "voidedBy" TEXT,
  "voidedAt" TIMESTAMP,
  "voidReason" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("shopId", "entryNumber")
);

-- Journal Entry Lines (the actual debits and credits)
CREATE TABLE IF NOT EXISTS "JournalEntryLine" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "journalEntryId" TEXT NOT NULL REFERENCES "JournalEntry"("id") ON DELETE CASCADE,
  "accountId" TEXT NOT NULL REFERENCES "Account"("id"),
  "lineNumber" INTEGER NOT NULL,

  "description" TEXT,
  "debitAmount" DECIMAL(15,2) DEFAULT 0,
  "creditAmount" DECIMAL(15,2) DEFAULT 0,

  -- Optional linking
  "customerId" TEXT,
  "vendorId" TEXT,
  "estimateId" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Financial Period (for closing books)
CREATE TABLE IF NOT EXISTS "AccountingPeriod" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
  "periodName" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "fiscalYear" INTEGER NOT NULL,
  "fiscalQuarter" INTEGER, -- 1, 2, 3, 4
  "fiscalMonth" INTEGER, -- 1-12

  "status" TEXT DEFAULT 'open', -- open, closed, locked
  "closedDate" TIMESTAMP,
  "closedBy" TEXT,

  -- Closing balances (snapshot)
  "totalRevenue" DECIMAL(15,2),
  "totalExpenses" DECIMAL(15,2),
  "netIncome" DECIMAL(15,2),

  "createdAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("shopId", "startDate", "endDate")
);

-- Budget vs Actual Tracking
CREATE TABLE IF NOT EXISTS "Budget" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
  "accountId" TEXT NOT NULL REFERENCES "Account"("id"),
  "fiscalYear" INTEGER NOT NULL,
  "fiscalMonth" INTEGER NOT NULL, -- 1-12

  "budgetedAmount" DECIMAL(15,2) NOT NULL,
  "actualAmount" DECIMAL(15,2) DEFAULT 0,
  "variance" DECIMAL(15,2) DEFAULT 0,
  "variancePercent" DECIMAL(5,2) DEFAULT 0,

  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("shopId", "accountId", "fiscalYear", "fiscalMonth")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_account_shop ON "Account"("shopId");
CREATE INDEX IF NOT EXISTS idx_account_type ON "Account"("accountType");
CREATE INDEX IF NOT EXISTS idx_account_parent ON "Account"("parentAccountId");
CREATE INDEX IF NOT EXISTS idx_journal_entry_shop ON "JournalEntry"("shopId");
CREATE INDEX IF NOT EXISTS idx_journal_entry_date ON "JournalEntry"("entryDate");
CREATE INDEX IF NOT EXISTS idx_journal_entry_status ON "JournalEntry"("status");
CREATE INDEX IF NOT EXISTS idx_journal_entry_source ON "JournalEntry"("source", "sourceId");
CREATE INDEX IF NOT EXISTS idx_journal_line_entry ON "JournalEntryLine"("journalEntryId");
CREATE INDEX IF NOT EXISTS idx_journal_line_account ON "JournalEntryLine"("accountId");
CREATE INDEX IF NOT EXISTS idx_period_shop_dates ON "AccountingPeriod"("shopId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_budget_account_year ON "Budget"("accountId", "fiscalYear");

-- Trigger to validate journal entry balance
CREATE OR REPLACE FUNCTION validate_journal_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate totals
  SELECT
    COALESCE(SUM("debitAmount"), 0),
    COALESCE(SUM("creditAmount"), 0)
  INTO NEW."totalDebit", NEW."totalCredit"
  FROM "JournalEntryLine"
  WHERE "journalEntryId" = NEW."id";

  -- Check if balanced
  NEW."isBalanced" = (NEW."totalDebit" = NEW."totalCredit");

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_journal_balance_trigger
BEFORE UPDATE ON "JournalEntry"
FOR EACH ROW
EXECUTE FUNCTION validate_journal_balance();

-- Trigger to update account balances when journal is posted
CREATE OR REPLACE FUNCTION update_account_balances()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."status" = 'posted' AND OLD."status" != 'posted' THEN
    -- Update all account balances for this journal entry
    UPDATE "Account" a
    SET "currentBalance" = "currentBalance" +
      CASE
        WHEN a."normalBalance" = 'debit' THEN jel."debitAmount" - jel."creditAmount"
        ELSE jel."creditAmount" - jel."debitAmount"
      END,
      "ytdBalance" = "ytdBalance" +
      CASE
        WHEN a."normalBalance" = 'debit' THEN jel."debitAmount" - jel."creditAmount"
        ELSE jel."creditAmount" - jel."debitAmount"
      END
    FROM "JournalEntryLine" jel
    WHERE jel."accountId" = a."id"
      AND jel."journalEntryId" = NEW."id";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_account_balances_trigger
AFTER UPDATE ON "JournalEntry"
FOR EACH ROW
WHEN (NEW."status" = 'posted')
EXECUTE FUNCTION update_account_balances();
