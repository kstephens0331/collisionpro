# Run Missing Migrations

Based on database check, these Phase 3 & 4 tables need to be created:

## Missing Tables:
- ❌ EstimateAnnotation (photo markup)
- ❌ EstimateVideo (video walkthroughs)
- ❌ WorkflowTemplate (automated workflows)
- ❌ InventoryItem, InventoryTransaction, StockAlert (inventory management)

## Already Exists:
- ✅ Notification (SMS/email logging)
- ✅ PurchaseOrder (parts ordering)

---

## Option 1: Run via psql (Recommended)

Get your DATABASE_URL from Supabase:
1. Go to Supabase Dashboard > Project Settings > Database
2. Copy the "Connection string" (starts with `postgresql://`)

```bash
# Replace with your actual DATABASE_URL
set DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]/postgres

# Run Phase 3 migrations
psql %DATABASE_URL% -f "migrations/phase-3/3.1-photo-annotations.sql"
psql %DATABASE_URL% -f "migrations/phase-3/3.2-video-walkthroughs.sql"
psql %DATABASE_URL% -f "migrations/phase-3/3.3-automated-workflows.sql"

# Run Phase 4 migrations
psql %DATABASE_URL% -f "migrations/phase-4/4.2-inventory-management.sql"
```

---

## Option 2: Run via Supabase SQL Editor (Easiest)

1. Go to Supabase Dashboard > SQL Editor
2. Click "New Query"
3. Copy/paste each SQL file content and click "Run"

### Run these files in order:

#### 1. Photo Annotations
```sql
-- Copy contents of: migrations/phase-3/3.1-photo-annotations.sql
```

#### 2. Video Walkthroughs
```sql
-- Copy contents of: migrations/phase-3/3.2-video-walkthroughs.sql
```

#### 3. Automated Workflows
```sql
-- Copy contents of: migrations/phase-3/3.3-automated-workflows.sql
```

#### 4. Inventory Management
```sql
-- Copy contents of: migrations/phase-4/4.2-inventory-management.sql
```

---

## Option 3: Node.js Script (I can create this)

Would you like me to create a Node.js script that runs all migrations automatically?

---

## Verify After Running

Run this to verify all tables exist:
```bash
node scripts/check-migrations.js
```

You should see all ✅ checkmarks.

---

## Next Steps After Migrations

1. **Set up Twilio** (for SMS)
   - Sign up at twilio.com
   - Get Account SID, Auth Token, Phone Number
   - Add to .env.local:
   ```
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1...
   ```

2. **Create Supabase Storage Bucket** (for videos)
   - Go to Supabase Dashboard > Storage
   - Click "New bucket"
   - Name: `videos`
   - Set to Public
   - Click "Create bucket"

3. **Deploy to Production**
   ```bash
   git add .
   git commit -m "Add Phase 3 & 4 features"
   git push
   ```

4. **Test Everything**
   - Upload a video
   - Send an SMS
   - Create an appointment
   - Add inventory item
   - Generate a signature

5. **Start Onboarding Shops!** 🚀
