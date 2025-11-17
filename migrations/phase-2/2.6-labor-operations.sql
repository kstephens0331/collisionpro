-- =====================================================
-- LABOR OPERATIONS & SHOP SETTINGS SCHEMA
-- Industry-standard labor times + shop-specific rates
-- =====================================================

-- =====================================================
-- 1. LABOR OPERATIONS (Industry Standards)
-- =====================================================
CREATE TABLE IF NOT EXISTS "LaborOperation" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "category" TEXT NOT NULL, -- body, paint, mechanical, electrical, glass, etc.
  "operation" TEXT NOT NULL, -- e.g., "R&I Front Bumper Cover"
  "description" TEXT,
  "standardHours" DECIMAL(5,2) NOT NULL, -- Industry standard hours (e.g., 2.50)
  "difficulty" TEXT, -- easy, medium, hard, expert
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS "idx_labor_operation_category" ON "LaborOperation"("category");
CREATE INDEX IF NOT EXISTS "idx_labor_operation_code" ON "LaborOperation"("code");

-- =====================================================
-- 2. SHOP SETTINGS (Per-Shop Labor Rates)
-- =====================================================
CREATE TABLE IF NOT EXISTS "ShopSettings" (
  "id" TEXT PRIMARY KEY,
  "shopId" TEXT NOT NULL UNIQUE REFERENCES "Shop"("id") ON DELETE CASCADE,

  -- Labor Rates (per hour)
  "bodyLaborRate" DECIMAL(8,2) DEFAULT 75.00,
  "paintLaborRate" DECIMAL(8,2) DEFAULT 85.00,
  "mechanicalLaborRate" DECIMAL(8,2) DEFAULT 95.00,
  "electricalLaborRate" DECIMAL(8,2) DEFAULT 100.00,
  "glassLaborRate" DECIMAL(8,2) DEFAULT 65.00,
  "detailLaborRate" DECIMAL(8,2) DEFAULT 50.00,

  -- Diagnostic & Special Rates
  "diagnosticRate" DECIMAL(8,2) DEFAULT 125.00,
  "frameRate" DECIMAL(8,2) DEFAULT 95.00,
  "alignmentRate" DECIMAL(8,2) DEFAULT 85.00,

  -- Paint Materials
  "paintMaterialsRate" DECIMAL(8,2) DEFAULT 45.00, -- per hour of paint time
  "clearCoatRate" DECIMAL(8,2) DEFAULT 35.00,

  -- Shop Supplies & Fees
  "shopSuppliesRate" DECIMAL(5,4) DEFAULT 0.10, -- 10% of parts/labor
  "hazmatFee" DECIMAL(8,2) DEFAULT 15.00,
  "environmentalFee" DECIMAL(8,2) DEFAULT 10.00,

  -- Tax Settings
  "defaultTaxRate" DECIMAL(5,4) DEFAULT 0.0825, -- 8.25%
  "taxParts" BOOLEAN DEFAULT TRUE,
  "taxLabor" BOOLEAN DEFAULT FALSE,
  "taxPaint" BOOLEAN DEFAULT TRUE,

  -- Business Info
  "companyName" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zip" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "taxId" TEXT,
  "licenseNumber" TEXT,

  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. SEED INDUSTRY-STANDARD LABOR OPERATIONS
-- =====================================================

-- BODY WORK OPERATIONS
INSERT INTO "LaborOperation" ("id", "code", "category", "operation", "standardHours", "difficulty", "description") VALUES
('labor_rb_front_bumper', 'RB-001', 'body', 'R&I Front Bumper Cover', 1.5, 'easy', 'Remove and install front bumper cover'),
('labor_rb_rear_bumper', 'RB-002', 'body', 'R&I Rear Bumper Cover', 1.5, 'easy', 'Remove and install rear bumper cover'),
('labor_rb_front_fender', 'RB-003', 'body', 'R&I Front Fender', 2.0, 'medium', 'Remove and install front fender panel'),
('labor_rb_hood', 'RB-004', 'body', 'R&I Hood', 1.0, 'easy', 'Remove and install hood'),
('labor_rb_door_front', 'RB-005', 'body', 'R&I Front Door Shell', 2.5, 'medium', 'Remove and install front door shell'),
('labor_rb_door_rear', 'RB-006', 'body', 'R&I Rear Door Shell', 2.5, 'medium', 'Remove and install rear door shell'),
('labor_rb_door_skin_front', 'RB-007', 'body', 'Replace Front Door Skin', 3.5, 'hard', 'Replace outer door skin (front)'),
('labor_rb_door_skin_rear', 'RB-008', 'body', 'Replace Rear Door Skin', 3.5, 'hard', 'Replace outer door skin (rear)'),
('labor_rb_quarter_panel', 'RB-009', 'body', 'Replace Quarter Panel', 12.0, 'expert', 'Replace quarter panel (cut & weld)'),
('labor_rb_rocker_panel', 'RB-010', 'body', 'Replace Rocker Panel', 8.0, 'hard', 'Replace rocker panel (cut & weld)'),
('labor_rb_trunk_lid', 'RB-011', 'body', 'R&I Trunk Lid/Hatch', 1.5, 'easy', 'Remove and install trunk lid or hatchback'),
('labor_rb_tailgate', 'RB-012', 'body', 'R&I Tailgate', 2.0, 'medium', 'Remove and install tailgate'),

-- REPAIR OPERATIONS
('labor_repair_dent_small', 'RP-001', 'body', 'Repair Small Dent (<3")', 1.0, 'easy', 'Straighten small dent, prepare for paint'),
('labor_repair_dent_medium', 'RP-002', 'body', 'Repair Medium Dent (3-6")', 2.0, 'medium', 'Straighten medium dent, prepare for paint'),
('labor_repair_dent_large', 'RP-003', 'body', 'Repair Large Dent (6-12")', 4.0, 'hard', 'Straighten large dent, prepare for paint'),
('labor_repair_crease', 'RP-004', 'body', 'Repair Crease/Buckle', 3.5, 'hard', 'Repair crease or buckle damage'),
('labor_pdr_small', 'RP-005', 'body', 'Paintless Dent Repair - Small', 0.5, 'medium', 'PDR for small dings/dents'),
('labor_pdr_medium', 'RP-006', 'body', 'Paintless Dent Repair - Medium', 1.0, 'medium', 'PDR for medium dents'),

-- PAINT OPERATIONS
('labor_paint_bumper', 'PT-001', 'paint', 'Paint Bumper Cover', 3.0, 'medium', 'Prep, prime, paint, clear bumper cover'),
('labor_paint_fender', 'PT-002', 'paint', 'Paint Fender', 3.5, 'medium', 'Prep, prime, paint, clear fender'),
('labor_paint_hood', 'PT-003', 'paint', 'Paint Hood', 4.0, 'medium', 'Prep, prime, paint, clear hood'),
('labor_paint_door', 'PT-004', 'paint', 'Paint Door', 4.0, 'medium', 'Prep, prime, paint, clear door'),
('labor_paint_quarter', 'PT-005', 'paint', 'Paint Quarter Panel', 5.0, 'hard', 'Prep, prime, paint, clear quarter panel'),
('labor_paint_rocker', 'PT-006', 'paint', 'Paint Rocker Panel', 3.0, 'medium', 'Prep, prime, paint, clear rocker'),
('labor_paint_roof', 'PT-007', 'paint', 'Paint Roof', 5.0, 'hard', 'Prep, prime, paint, clear roof'),
('labor_paint_trunk', 'PT-008', 'paint', 'Paint Trunk Lid/Hatch', 3.5, 'medium', 'Prep, prime, paint, clear trunk'),
('labor_blend_panel', 'PT-009', 'paint', 'Blend Adjacent Panel', 2.0, 'medium', 'Color blend to adjacent panel'),
('labor_paint_spot', 'PT-010', 'paint', 'Spot Paint Repair', 1.5, 'easy', 'Small area spot repair'),

-- MECHANICAL OPERATIONS
('labor_mech_alignment', 'MC-001', 'mechanical', 'Wheel Alignment (4-Wheel)', 1.0, 'easy', 'Four-wheel alignment'),
('labor_mech_suspension_front', 'MC-002', 'mechanical', 'R&I Front Suspension Component', 2.0, 'medium', 'Replace front suspension part'),
('labor_mech_suspension_rear', 'MC-003', 'mechanical', 'R&I Rear Suspension Component', 1.5, 'medium', 'Replace rear suspension part'),
('labor_mech_axle_front', 'MC-004', 'mechanical', 'Replace Front Axle/CV Shaft', 3.0, 'hard', 'Replace front axle or CV shaft'),
('labor_mech_radiator', 'MC-005', 'mechanical', 'R&I Radiator', 2.5, 'medium', 'Remove and install radiator'),
('labor_mech_ac_condenser', 'MC-006', 'mechanical', 'R&I AC Condenser', 3.0, 'medium', 'Remove and install AC condenser'),

-- ELECTRICAL OPERATIONS
('labor_elec_headlight', 'EL-001', 'electrical', 'R&I Headlight Assembly', 0.5, 'easy', 'Remove and install headlight'),
('labor_elec_taillight', 'EL-002', 'electrical', 'R&I Taillight Assembly', 0.5, 'easy', 'Remove and install taillight'),
('labor_elec_mirror', 'EL-003', 'electrical', 'R&I Side Mirror', 0.8, 'easy', 'Remove and install side mirror'),
('labor_elec_sensor_front', 'EL-004', 'electrical', 'R&I Front Sensor (Parking/Radar)', 0.5, 'easy', 'Replace front parking/radar sensor'),
('labor_elec_sensor_rear', 'EL-005', 'electrical', 'R&I Rear Sensor (Parking/Radar)', 0.5, 'easy', 'Replace rear parking/radar sensor'),
('labor_elec_camera', 'EL-006', 'electrical', 'R&I Camera (Backup/Surround)', 1.0, 'medium', 'Replace backup or surround-view camera'),
('labor_elec_module', 'EL-007', 'electrical', 'R&I Control Module', 1.5, 'medium', 'Replace electronic control module'),

-- GLASS OPERATIONS
('labor_glass_windshield', 'GL-001', 'glass', 'R&I Windshield', 2.0, 'medium', 'Remove and install windshield'),
('labor_glass_door', 'GL-002', 'glass', 'R&I Door Glass', 1.5, 'medium', 'Remove and install door window glass'),
('labor_glass_rear', 'GL-003', 'glass', 'R&I Rear Glass', 2.0, 'medium', 'Remove and install rear window'),
('labor_glass_quarter', 'GL-004', 'glass', 'R&I Quarter Glass', 1.5, 'medium', 'Remove and install quarter window'),

-- FRAME/STRUCTURAL OPERATIONS
('labor_frame_measure', 'FR-001', 'frame', 'Frame Measurement & Setup', 1.5, 'medium', 'Measure frame and mount on frame rack'),
('labor_frame_pull_light', 'FR-002', 'frame', 'Frame Pull - Light', 3.0, 'hard', 'Light frame straightening'),
('labor_frame_pull_medium', 'FR-003', 'frame', 'Frame Pull - Medium', 6.0, 'hard', 'Medium frame straightening'),
('labor_frame_pull_heavy', 'FR-004', 'frame', 'Frame Pull - Heavy', 10.0, 'expert', 'Heavy frame straightening'),
('labor_frame_rail_front', 'FR-005', 'frame', 'Replace Front Frame Rail', 10.0, 'expert', 'Replace front frame rail section'),
('labor_frame_rail_rear', 'FR-006', 'frame', 'Replace Rear Frame Rail', 10.0, 'expert', 'Replace rear frame rail section'),

-- DETAIL/FINISHING OPERATIONS
('labor_detail_buff', 'DT-001', 'detail', 'Buff/Polish Panel', 0.5, 'easy', 'Machine buff and polish painted panel'),
('labor_detail_full', 'DT-002', 'detail', 'Complete Detail - Exterior', 2.0, 'easy', 'Full exterior wash, clay, wax, detail'),
('labor_detail_interior', 'DT-003', 'detail', 'Interior Detail', 1.5, 'easy', 'Vacuum, clean, condition interior'),
('labor_cleanup', 'DT-004', 'detail', 'Final Cleanup/Inspection', 0.5, 'easy', 'Final vehicle cleanup and QC inspection')

ON CONFLICT ("code") DO NOTHING;

-- =====================================================
-- 4. CREATE DEFAULT SHOP SETTINGS FOR EXISTING SHOPS
-- =====================================================
INSERT INTO "ShopSettings" ("id", "shopId")
SELECT
  'settings_' || "Shop"."id",
  "Shop"."id"
FROM "Shop"
WHERE NOT EXISTS (
  SELECT 1 FROM "ShopSettings" WHERE "ShopSettings"."shopId" = "Shop"."id"
)
ON CONFLICT ("shopId") DO NOTHING;

-- =====================================================
-- INDEXES & PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS "idx_shop_settings_shop" ON "ShopSettings"("shopId");

-- =====================================================
-- GRANT PERMISSIONS (if using RLS)
-- =====================================================
-- ALTER TABLE "LaborOperation" ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE "ShopSettings" ENABLE ROW LEVEL SECURITY;

-- Allow all users to READ labor operations (industry standards)
-- CREATE POLICY "Anyone can view labor operations" ON "LaborOperation"
--   FOR SELECT USING (true);

-- Only shop owners/admins can view/edit their shop settings
-- CREATE POLICY "Shop users can view their settings" ON "ShopSettings"
--   FOR SELECT USING (
--     "shopId" IN (
--       SELECT "shopId" FROM "ShopUser" WHERE "userId" = auth.uid()
--     )
--   );

-- CREATE POLICY "Shop admins can update their settings" ON "ShopSettings"
--   FOR UPDATE USING (
--     "shopId" IN (
--       SELECT "shopId" FROM "ShopUser"
--       WHERE "userId" = auth.uid() AND "role" IN ('owner', 'admin')
--     )
--   );
