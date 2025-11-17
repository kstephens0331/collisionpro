# Environment Variables Documentation

This document lists all environment variables required for CollisionPro to function correctly.

## Required Variables (All Phases)

### Database (Supabase)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to get these:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy the "Project URL" for `NEXT_PUBLIC_SUPABASE_URL`
4. Copy the "service_role" key for `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

**Note**: The `NEXT_PUBLIC_` prefix makes the URL available to the browser. Never prefix the service role key with `NEXT_PUBLIC_`.

---

## Phase 2.9: Email Delivery

### Resend (Email Service)
```bash
RESEND_API_KEY=re_your_api_key_here
```

**Where to get this:**
1. Sign up at https://resend.com (free tier available)
2. Go to "API Keys" in your dashboard
3. Create a new API key
4. Copy the key (starts with `re_`)

**Important**:
- This key must be kept secret (never commit to git)
- Required for sending estimate emails to customers
- Without this key, the "Send to Customer" button will fail

---

## Optional Variables (Future Phases)

### Phase 4: Parts Integration
```bash
PARTSTECH_API_KEY=your_partstech_key
```

### Phase 5: AI Damage Assessment
```bash
GOOGLE_CLOUD_VISION_API_KEY=your_google_vision_key
```

### Phase 6: Insurance DRP Integration
```bash
CCC_ONE_API_KEY=your_ccc_one_key
MITCHELL_API_KEY=your_mitchell_key
AUDATEX_API_KEY=your_audatex_key
```

---

## Setup Instructions

### Local Development (.env.local)

1. Create a file named `.env.local` in the project root
2. Add all required variables:

```bash
# Database (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Service (Required for Phase 2.9+)
RESEND_API_KEY=re_your_api_key_here
```

3. **Never commit `.env.local` to git** (it's already in `.gitignore`)

### Production Deployment (Vercel)

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - **Key**: Variable name (e.g., `RESEND_API_KEY`)
   - **Value**: The actual value
   - **Environment**: Select "Production", "Preview", and "Development"
4. Redeploy your application for changes to take effect

---

## Security Best Practices

✅ **DO:**
- Keep all API keys and secrets in `.env.local` (never in code)
- Use different API keys for development vs production
- Rotate API keys periodically
- Only prefix with `NEXT_PUBLIC_` if the value needs to be accessible in the browser

❌ **DON'T:**
- Never commit `.env.local` to version control
- Never share your `SUPABASE_SERVICE_ROLE_KEY` (it has full database access)
- Never prefix secret keys with `NEXT_PUBLIC_`
- Never hardcode API keys in your source code

---

## Verifying Environment Variables

### Check if variables are loaded:
```bash
npm run build
```

If any required variables are missing, you'll see an error during build.

### Test Resend email:
1. Configure all email settings in Shop Settings
2. Create a test estimate
3. Click "Send to Customer"
4. Check console for any API key errors

---

## Troubleshooting

### "Missing API key. Pass it to the constructor"
**Problem**: `RESEND_API_KEY` not set
**Solution**: Add the key to `.env.local` and restart the dev server

### "Shop email not configured"
**Problem**: Email settings not configured in Shop Settings
**Solution**: Go to Settings → Email Settings and configure sender email

### "Domain not verified"
**Problem**: Email domain not verified with Resend
**Solution**: Follow instructions in Shop Settings → Email Settings to verify your domain

---

**Last Updated**: January 2025
**Phase**: 2.9 (PDF Generation & Email Delivery)
