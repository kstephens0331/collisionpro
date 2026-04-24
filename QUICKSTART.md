# CollisionPro - Quick Start Guide

## 🚀 Deploy to Vercel (5 minutes)

### Step 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kstephens0331/collisionpro)

**OR** manually:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import: `kstephens0331/collisionpro`
3. Click "Deploy"

### Step 2: Add Environment Variables

In Vercel, add these **BEFORE** deploying:

```
DATABASE_URL=postgresql://postgres:78410889Ks%21@aws-0-us-east-1.pooler.supabase.com:5432/postgres

DIRECT_URL=postgresql://postgres:78410889Ks%21@aws-0-us-east-1.pooler.supabase.com:5432/postgres

NEXT_PUBLIC_SUPABASE_URL=https://pkyqrvrxwhlwkxalsbaz.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=<REDACTED-SUPABASE-KEY>

SUPABASE_SERVICE_ROLE_KEY=<REDACTED-SUPABASE-KEY>

NEXTAUTH_URL=https://YOUR-APP.vercel.app

NEXTAUTH_SECRET=<REDACTED-NEXTAUTH-SECRET>

NODE_ENV=production
```

### Step 3: Update NEXTAUTH_URL

1. After deployment, copy your Vercel URL
2. Update `NEXTAUTH_URL` in Vercel settings
3. Redeploy (or it will auto-redeploy)

### Step 4: Setup Database

**Option A: Automatic (from local)**
```bash
vercel env pull .env.local
npm run db:push
```

**Option B: Supabase SQL Editor**
Go to Supabase → SQL Editor → Run the schema from `prisma/schema.prisma`

### Step 5: Test Your App

1. Visit your Vercel URL
2. Click "Create Account"
3. Register your shop
4. Login and access dashboard

## ✅ You're Live!

Your CollisionPro instance is now running on Vercel.

---

## 🏠 Local Development

```bash
# Clone repo
git clone https://github.com/kstephens0331/collisionpro.git
cd collisionpro

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Setup database
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📊 What You Get

- ✅ Secure authentication system
- ✅ Multi-tenant shop management
- ✅ Role-based access control
- ✅ Professional dashboard
- ✅ Production-ready deployment
- ✅ PostgreSQL database (Supabase)

---

## 🆘 Need Help?

- **Build fails**: Check environment variables
- **Can't login**: Verify NEXTAUTH_URL matches your domain
- **Database errors**: Confirm Supabase connection string

---

## 📱 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Setup database
3. ✅ Create test account
4. Begin using CollisionPro!

---

**Built to compete with Mitchell, CCC ONE, and Audatex.**

**Repository**: https://github.com/kstephens0331/collisionpro
