# Database Setup - QUICK FIX

## The 500 Error You're Seeing

The registration is failing because the database tables don't exist yet. Here's how to fix it in 2 minutes:

## Option 1: Supabase SQL Editor (FASTEST - 2 minutes)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/pkyqrvrxwhlwkxalsbaz

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy & Paste the SQL**
   - Open the file: `prisma/setup.sql` in this repo
   - Copy ALL the SQL
   - Paste into Supabase SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Tables Created**
   - Click "Table Editor" in left sidebar
   - You should see: Shop, User, RateProfile, Account, Session, VerificationToken

5. **Test Registration**
   - Go back to: https://collisionpro.vercel.app/auth/register
   - Try registering again
   - Should work now! ✅

## Option 2: Local Prisma Push (if you prefer)

```bash
# In your local project directory
cd "c:\Users\usmc3\OneDrive\Documents\Stephens Code Programs\collisionpro"

# Pull Vercel environment variables
npx vercel env pull .env.local

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Verify
npx prisma studio
```

## Troubleshooting

### Still getting 500 error?

Check Vercel logs:
1. Go to Vercel Dashboard
2. Click "Deployments"
3. Click on the latest deployment
4. Click "Functions" tab
5. Look for error messages

### Connection issues?

Verify in Vercel Settings → Environment Variables:
- ✅ DATABASE_URL is set
- ✅ DIRECT_URL is set
- ✅ Both use URL-encoded password (78410889Ks%21)

### After tables are created

You should be able to:
1. ✅ Register a new shop
2. ✅ Login with credentials
3. ✅ Access dashboard
4. ✅ See your shop name in navbar

---

## Quick SQL (Copy This)

If you just want to copy-paste, here's the minimal version:

```sql
-- Run this in Supabase SQL Editor

CREATE TABLE "Shop" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT UNIQUE NOT NULL,
    "phone" TEXT,
    "subscriptionTier" TEXT DEFAULT 'trial',
    "subscriptionStatus" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
    "email" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT DEFAULT 'estimator',
    "isActive" BOOLEAN DEFAULT true,
    "lastLogin" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "RateProfile" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "laborRate" DOUBLE PRECISION DEFAULT 50.00,
    "paintRate" DOUBLE PRECISION DEFAULT 45.00,
    "markupPercentage" DOUBLE PRECISION DEFAULT 30.00,
    "taxRate" DOUBLE PRECISION DEFAULT 8.25,
    "isDefault" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Account" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    UNIQUE("provider", "providerAccountId")
);

CREATE TABLE "Session" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "sessionToken" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP NOT NULL
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT UNIQUE NOT NULL,
    "expires" TIMESTAMP NOT NULL,
    UNIQUE("identifier", "token")
);

CREATE INDEX "User_shopId_idx" ON "User"("shopId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "RateProfile_shopId_idx" ON "RateProfile"("shopId");
```

Then try registering again!
