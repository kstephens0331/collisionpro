# CollisionPro - Vercel Deployment Guide

## Quick Deploy to Vercel

### Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New Project"
4. Import `kstephens0331/collisionpro`

### Step 2: Configure Environment Variables

In Vercel project settings, add these environment variables:

```env
# Database (Use URL-encoded password: 78410889Ks%21)
DATABASE_URL=postgresql://postgres:78410889Ks%21@aws-0-us-east-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres:78410889Ks%21@aws-0-us-east-1.pooler.supabase.com:5432/postgres

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pkyqrvrxwhlwkxalsbaz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreXFydnJ4d2hsd2t4YWxzYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDMxNzcsImV4cCI6MjA3MzgxOTE3N30.GlNIbz3m6lc5qkuNqDwifd2fS0HLN2x7plPSMuTo62o
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreXFydnJ4d2hsd2t4YWxzYmF6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODI0MzE3NywiZXhwIjoyMDczODE5MTc3fQ.cVuTu72l7g61p9OaxlRIXlxrJRXMsICEvc75rn-YEnA

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=J7OJpCMKp5L2eb+2oHwwLCAaZugcH2ExHfKA+Hu/fIBREruevLVT1kZDGg5D/KuRrrqcjgxErr2X1HX/7pIguw==

# App
NODE_ENV=production
```

### Step 3: Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Your app will be live at `https://collisionpro.vercel.app` (or similar)

### Step 4: Database Setup

After first deployment, run migrations:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Run migrations
vercel env pull .env.local
npx prisma generate
npx prisma db push
```

Or use Supabase SQL Editor to run the schema directly.

### Step 5: Update NEXTAUTH_URL

After deployment:
1. Copy your Vercel URL (e.g., `https://collisionpro-xyz.vercel.app`)
2. Update `NEXTAUTH_URL` environment variable in Vercel
3. Redeploy

## Testing the Deployment

1. Visit your deployed URL
2. Click "Create Account"
3. Register a new shop
4. Login
5. Access dashboard

## Troubleshooting

### Build Fails
- Check environment variables are set correctly
- Ensure all dependencies are in package.json
- Review build logs in Vercel

### Database Connection Issues
- Verify Supabase is running
- Check connection string format
- Ensure password is URL-encoded (%21 for !)

### Authentication Not Working
- Verify NEXTAUTH_URL matches your domain
- Check NEXTAUTH_SECRET is set
- Clear cookies and try again

## Custom Domain

1. Go to Vercel Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update NEXTAUTH_URL to match custom domain

## Monitoring

- **Analytics**: Vercel Analytics (automatic)
- **Logs**: Vercel Dashboard → Project → Logs
- **Performance**: Vercel Speed Insights
- **Database**: Supabase Dashboard

## Security Checklist

- [ ] Environment variables set in Vercel (not in code)
- [ ] NEXTAUTH_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] CORS configured properly

## Next Steps

1. Set up custom domain
2. Run database migrations
3. Create test accounts
4. Begin Phase 2 development

---

**Repository**: https://github.com/kstephens0331/collisionpro
**Vercel**: Deploy at vercel.com/new
