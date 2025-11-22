/**
 * Phase 8.4: Enhanced Reporting & Analytics
 *
 * Comprehensive business intelligence, KPI tracking, financial reporting,
 * and data visualization
 */

-- ============================================================================
-- DAILY SHOP METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "DailyShopMetrics" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,

  -- Revenue Metrics
  "totalRevenue" DECIMAL(12, 2) DEFAULT 0,
  "laborRevenue" DECIMAL(12, 2) DEFAULT 0,
  "partsRevenue" DECIMAL(12, 2) DEFAULT 0,
  "paintRevenue" DECIMAL(12, 2) DEFAULT 0,
  "taxRevenue" DECIMAL(12, 2) DEFAULT 0,

  -- Cost Metrics
  "totalCosts" DECIMAL(12, 2) DEFAULT 0,
  "laborCosts" DECIMAL(12, 2) DEFAULT 0,
  "partsCosts" DECIMAL(12, 2) DEFAULT 0,
  "paintCosts" DECIMAL(12, 2) DEFAULT 0,
  "overheadCosts" DECIMAL(12, 2) DEFAULT 0,

  -- Profit Metrics
  "grossProfit" DECIMAL(12, 2) DEFAULT 0,
  "netProfit" DECIMAL(12, 2) DEFAULT 0,
  "profitMargin" DECIMAL(5, 4) DEFAULT 0, -- Percentage as decimal (0.25 = 25%)

  -- Estimate Metrics
  "estimatesCreated" INTEGER DEFAULT 0,
  "estimatesApproved" INTEGER DEFAULT 0,
  "estimatesRejected" INTEGER DEFAULT 0,
  "estimatesPending" INTEGER DEFAULT 0,
  "averageEstimateValue" DECIMAL(10, 2) DEFAULT 0,
  "conversionRate" DECIMAL(5, 4) DEFAULT 0,

  -- Job Metrics
  "jobsStarted" INTEGER DEFAULT 0,
  "jobsCompleted" INTEGER DEFAULT 0,
  "jobsInProgress" INTEGER DEFAULT 0,
  "averageJobDuration" DECIMAL(5, 2) DEFAULT 0, -- Days
  "onTimeCompletionRate" DECIMAL(5, 4) DEFAULT 0,

  -- Customer Metrics
  "newCustomers" INTEGER DEFAULT 0,
  "returningCustomers" INTEGER DEFAULT 0,
  "totalActiveCustomers" INTEGER DEFAULT 0,
  "customerSatisfactionScore" DECIMAL(3, 2) DEFAULT 0, -- 0-5 stars

  -- Operational Metrics
  "technicianUtilization" DECIMAL(5, 4) DEFAULT 0, -- Percentage
  "bayUtilization" DECIMAL(5, 4) DEFAULT 0,
  "averageCycleTime" DECIMAL(5, 2) DEFAULT 0, -- Days
  "partsOrdersFilled" INTEGER DEFAULT 0,
  "partsBackordered" INTEGER DEFAULT 0,

  -- Payment Metrics
  "paymentsReceived" INTEGER DEFAULT 0,
  "totalCollected" DECIMAL(12, 2) DEFAULT 0,
  "outstandingBalance" DECIMAL(12, 2) DEFAULT 0,
  "averageDaysToPayment" DECIMAL(5, 2) DEFAULT 0,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("shopId", "date")
);

CREATE INDEX IF NOT EXISTS "idx_daily_metrics_shop_date" ON "DailyShopMetrics"("shopId", "date" DESC);

-- ============================================================================
-- KPI TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS "KPITarget" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  -- Target Details
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL, -- 'revenue', 'efficiency', 'quality', 'customer_satisfaction'
  "metric" TEXT NOT NULL, -- 'monthly_revenue', 'cycle_time', 'csat_score', etc.

  -- Target Values
  "targetValue" DECIMAL(12, 2) NOT NULL,
  "unit" TEXT, -- 'dollars', 'days', 'percentage', 'count'
  "targetType" TEXT DEFAULT 'minimum', -- 'minimum', 'maximum', 'exact'

  -- Time Period
  "period" TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  "startDate" DATE,
  "endDate" DATE,

  -- Status
  "isActive" BOOLEAN DEFAULT true,

  -- Notifications
  "alertOnMiss" BOOLEAN DEFAULT false,
  "alertThreshold" DECIMAL(5, 4) DEFAULT 0.1, -- Alert if within 10% of target

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_kpi_target_shop" ON "KPITarget"("shopId", "isActive");

-- KPI Achievement Tracking
CREATE TABLE IF NOT EXISTS "KPIAchievement" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "kpiTargetId" TEXT REFERENCES "KPITarget"("id") ON DELETE CASCADE,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  "date" DATE NOT NULL,
  "actualValue" DECIMAL(12, 2) NOT NULL,
  "targetValue" DECIMAL(12, 2) NOT NULL,
  "achievementRate" DECIMAL(5, 4) DEFAULT 0, -- 1.0 = 100% achieved
  "variance" DECIMAL(12, 2) DEFAULT 0, -- Difference from target
  "variancePercentage" DECIMAL(5, 4) DEFAULT 0,

  "achieved" BOOLEAN DEFAULT false,
  "notes" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("kpiTargetId", "date")
);

CREATE INDEX IF NOT EXISTS "idx_kpi_achievement_target_date" ON "KPIAchievement"("kpiTargetId", "date" DESC);

-- ============================================================================
-- FINANCIAL REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "FinancialReport" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  -- Report Details
  "reportType" TEXT NOT NULL, -- 'profit_loss', 'balance_sheet', 'cash_flow', 'revenue_analysis'
  "reportName" TEXT NOT NULL,
  "description" TEXT,

  -- Time Period
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "fiscalYear" INTEGER,
  "fiscalQuarter" INTEGER,

  -- Report Data
  "data" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "summary" JSONB DEFAULT '{}'::jsonb,

  -- Financial Totals
  "totalRevenue" DECIMAL(12, 2) DEFAULT 0,
  "totalExpenses" DECIMAL(12, 2) DEFAULT 0,
  "grossProfit" DECIMAL(12, 2) DEFAULT 0,
  "netProfit" DECIMAL(12, 2) DEFAULT 0,
  "profitMargin" DECIMAL(5, 4) DEFAULT 0,

  -- Status
  "status" TEXT DEFAULT 'draft', -- 'draft', 'finalized', 'published'
  "finalizedAt" TIMESTAMP,
  "finalizedBy" TEXT,

  -- Export
  "pdfUrl" TEXT,
  "excelUrl" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_financial_report_shop" ON "FinancialReport"("shopId", "startDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_financial_report_type" ON "FinancialReport"("reportType", "startDate" DESC);

-- ============================================================================
-- EXPENSE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Expense" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  -- Expense Details
  "category" TEXT NOT NULL, -- 'labor', 'parts', 'overhead', 'utilities', 'rent', 'insurance', etc.
  "subcategory" TEXT,
  "description" TEXT NOT NULL,

  "amount" DECIMAL(10, 2) NOT NULL,
  "taxAmount" DECIMAL(10, 2) DEFAULT 0,
  "totalAmount" DECIMAL(10, 2) NOT NULL,

  -- Dates
  "expenseDate" DATE NOT NULL,
  "dueDate" DATE,
  "paidDate" DATE,

  -- Payment Info
  "vendor" TEXT,
  "paymentMethod" TEXT, -- 'cash', 'check', 'credit_card', 'bank_transfer'
  "referenceNumber" TEXT, -- Check number, transaction ID, etc.
  "invoiceNumber" TEXT,

  -- Status
  "status" TEXT DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
  "isPaid" BOOLEAN DEFAULT false,
  "isRecurring" BOOLEAN DEFAULT false,
  "recurringFrequency" TEXT, -- 'weekly', 'monthly', 'quarterly', 'yearly'

  -- Accounting
  "accountCode" TEXT,
  "fiscalYear" INTEGER,
  "fiscalQuarter" INTEGER,

  -- Attachments
  "receiptUrl" TEXT,
  "attachments" JSONB DEFAULT '[]'::jsonb,

  -- References
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE SET NULL,
  "partsOrderId" TEXT,

  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_expense_shop_date" ON "Expense"("shopId", "expenseDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_expense_category" ON "Expense"("category", "expenseDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_expense_status" ON "Expense"("status");

-- ============================================================================
-- REVENUE BREAKDOWN
-- ============================================================================

CREATE TABLE IF NOT EXISTS "RevenueBreakdown" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE CASCADE,

  "date" DATE NOT NULL,

  -- Revenue Categories
  "laborAmount" DECIMAL(10, 2) DEFAULT 0,
  "partsAmount" DECIMAL(10, 2) DEFAULT 0,
  "paintAmount" DECIMAL(10, 2) DEFAULT 0,
  "materialsAmount" DECIMAL(10, 2) DEFAULT 0,
  "subletAmount" DECIMAL(10, 2) DEFAULT 0,
  "taxAmount" DECIMAL(10, 2) DEFAULT 0,
  "discountAmount" DECIMAL(10, 2) DEFAULT 0,
  "totalAmount" DECIMAL(10, 2) DEFAULT 0,

  -- Cost Categories
  "laborCost" DECIMAL(10, 2) DEFAULT 0,
  "partsCost" DECIMAL(10, 2) DEFAULT 0,
  "paintCost" DECIMAL(10, 2) DEFAULT 0,
  "materialsCost" DECIMAL(10, 2) DEFAULT 0,
  "subletCost" DECIMAL(10, 2) DEFAULT 0,
  "totalCost" DECIMAL(10, 2) DEFAULT 0,

  -- Profit
  "grossProfit" DECIMAL(10, 2) DEFAULT 0,
  "profitMargin" DECIMAL(5, 4) DEFAULT 0,

  -- Payment Info
  "paymentMethod" TEXT,
  "paidDate" DATE,

  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_revenue_breakdown_shop_date" ON "RevenueBreakdown"("shopId", "date" DESC);
CREATE INDEX IF NOT EXISTS "idx_revenue_breakdown_estimate" ON "RevenueBreakdown"("estimateId");

-- ============================================================================
-- ANALYTICS AGGREGATIONS (MATERIALIZED VIEW)
-- ============================================================================

-- Monthly Summary View
CREATE MATERIALIZED VIEW IF NOT EXISTS "MonthlyAnalytics" AS
SELECT
  "shopId",
  DATE_TRUNC('month', "date")::DATE as "month",
  SUM("totalRevenue") as "totalRevenue",
  SUM("totalCosts") as "totalCosts",
  SUM("grossProfit") as "grossProfit",
  SUM("netProfit") as "netProfit",
  AVG("profitMargin") as "avgProfitMargin",
  SUM("estimatesCreated") as "totalEstimates",
  SUM("estimatesApproved") as "approvedEstimates",
  AVG("conversionRate") as "avgConversionRate",
  SUM("jobsCompleted") as "completedJobs",
  AVG("averageJobDuration") as "avgJobDuration",
  AVG("onTimeCompletionRate") as "avgOnTimeRate",
  SUM("newCustomers") as "newCustomers",
  AVG("customerSatisfactionScore") as "avgCSAT",
  AVG("technicianUtilization") as "avgUtilization"
FROM "DailyShopMetrics"
GROUP BY "shopId", DATE_TRUNC('month', "date");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_monthly_analytics_shop_month" ON "MonthlyAnalytics"("shopId", "month" DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp on metrics update
CREATE OR REPLACE FUNCTION update_metrics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_metrics_timestamp
  BEFORE UPDATE ON "DailyShopMetrics"
  FOR EACH ROW
  EXECUTE FUNCTION update_metrics_timestamp();

CREATE TRIGGER trigger_update_kpi_target_timestamp
  BEFORE UPDATE ON "KPITarget"
  FOR EACH ROW
  EXECUTE FUNCTION update_metrics_timestamp();

-- Calculate KPI achievement automatically
CREATE OR REPLACE FUNCTION calculate_kpi_achievement()
RETURNS TRIGGER AS $$
BEGIN
  NEW."variance" = NEW."actualValue" - NEW."targetValue";
  NEW."variancePercentage" = CASE
    WHEN NEW."targetValue" != 0 THEN NEW."variance" / NEW."targetValue"
    ELSE 0
  END;
  NEW."achievementRate" = CASE
    WHEN NEW."targetValue" != 0 THEN NEW."actualValue" / NEW."targetValue"
    ELSE 0
  END;
  NEW."achieved" = NEW."actualValue" >= NEW."targetValue";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_kpi_achievement
  BEFORE INSERT OR UPDATE ON "KPIAchievement"
  FOR EACH ROW
  EXECUTE FUNCTION calculate_kpi_achievement();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get revenue trends
CREATE OR REPLACE FUNCTION get_revenue_trends(
  p_shop_id TEXT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  total_revenue DECIMAL,
  labor_revenue DECIMAL,
  parts_revenue DECIMAL,
  growth_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_rev AS (
    SELECT
      "date",
      "totalRevenue",
      "laborRevenue",
      "partsRevenue",
      LAG("totalRevenue") OVER (ORDER BY "date") as prev_revenue
    FROM "DailyShopMetrics"
    WHERE "shopId" = p_shop_id
      AND "date" BETWEEN p_start_date AND p_end_date
  )
  SELECT
    "date",
    "totalRevenue",
    "laborRevenue",
    "partsRevenue",
    CASE
      WHEN prev_revenue IS NOT NULL AND prev_revenue != 0
      THEN (("totalRevenue" - prev_revenue) / prev_revenue)::DECIMAL
      ELSE 0::DECIMAL
    END as growth_rate
  FROM daily_rev
  ORDER BY "date";
END;
$$ LANGUAGE plpgsql;

-- Get top performing metrics
CREATE OR REPLACE FUNCTION get_top_metrics(
  p_shop_id TEXT,
  p_period TEXT DEFAULT 'month',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  metric_name TEXT,
  metric_value DECIMAL,
  improvement DECIMAL
) AS $$
BEGIN
  -- Implementation would analyze various metrics and return top performers
  RETURN QUERY SELECT 'placeholder'::TEXT, 0::DECIMAL, 0::DECIMAL LIMIT 0;
END;
$$ LANGUAGE plpgsql;

-- Refresh monthly analytics
CREATE OR REPLACE FUNCTION refresh_monthly_analytics()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY "MonthlyAnalytics";
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DEFAULT KPI TARGETS
-- ============================================================================

COMMENT ON TABLE "DailyShopMetrics" IS 'Daily aggregated metrics for shop performance tracking';
COMMENT ON TABLE "KPITarget" IS 'Key Performance Indicator targets and goals';
COMMENT ON TABLE "KPIAchievement" IS 'KPI achievement tracking with variance analysis';
COMMENT ON TABLE "FinancialReport" IS 'Generated financial reports (P&L, balance sheet, etc.)';
COMMENT ON TABLE "Expense" IS 'Shop expense tracking and categorization';
COMMENT ON TABLE "RevenueBreakdown" IS 'Detailed revenue breakdown by category per estimate';
COMMENT ON MATERIALIZED VIEW "MonthlyAnalytics" IS 'Pre-aggregated monthly analytics for performance';
