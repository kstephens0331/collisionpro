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

## Phase 3: Customer Portal

### Application URL
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Phase 5: AI-Powered Damage Assessment

### Google Cloud Vision API
```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

**Where to get these:**
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable "Cloud Vision API"
4. Go to "IAM & Admin" → "Service Accounts"
5. Create a service account with "Cloud Vision API User" role
6. Generate JSON key and download it
7. Set `GOOGLE_CLOUD_PROJECT_ID` to your project ID
8. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of the downloaded JSON file

**Demo Mode**:
- Without these variables, the AI analysis returns demo data
- Configure these for real damage detection from vehicle photos

---

## Phase 6: Insurance DRP Integration

### CCC ONE API
```bash
CCC_ONE_API_URL=https://api.cccis.com/v1
CCC_ONE_CLIENT_ID=your_client_id
CCC_ONE_CLIENT_SECRET=your_client_secret
CCC_ONE_SHOP_ID=your_shop_id
```

**Where to get these:**
1. Apply for CCC ONE Developer Account at https://developer.cccis.com
2. Mention: "Multi-tenant SaaS platform for 1000+ collision repair shops"
3. Once approved, you'll receive your Client ID and Secret
4. Shop ID is your organization identifier

**Used by**: State Farm, Progressive, Allstate, Liberty Mutual, Travelers

### Mitchell Cloud API
```bash
MITCHELL_API_URL=https://api.mitchell.com/v2
MITCHELL_CLIENT_ID=your_client_id
MITCHELL_CLIENT_SECRET=your_client_secret
MITCHELL_USERNAME=your_username
MITCHELL_PASSWORD=your_password
MITCHELL_SHOP_ID=your_shop_id
```

**Where to get these:**
1. Apply at https://www.mitchell.com/solutions/estimating-workflow/
2. Request "EstimatingLink API" access
3. Provide details about your SaaS platform and shop count
4. You'll receive credentials once approved

**Used by**: GEICO, USAA, Nationwide

### Audatex/Qapter API
```bash
AUDATEX_API_URL=https://api.audatex.com/v1
AUDATEX_API_KEY=your_api_key
AUDATEX_USERNAME=your_username
AUDATEX_PASSWORD=your_password
AUDATEX_SHOP_ID=your_shop_id
```

**Where to get these:**
1. Contact Audatex at https://www.audatex.com/contact
2. Request "Qapter Web Services" API access
3. Mention your multi-tenant platform
4. Credentials provided after approval

**Used by**: Farmers, American Family

**Important Notes**:
- You need **ONE** account per platform (not one per shop)
- Each shop's data (shop ID, license, tax ID) is sent in the API payload
- Without credentials, all insurance APIs operate in **demo mode**
- Demo mode returns realistic responses for testing
- API calls typically cost $0.50-$2.00 per estimate submission

---

### Authentication
```bash
JWT_SECRET=your-jwt-secret-key-min-32-chars
```

### SMS Notifications (Twilio)
```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Where to get these:**
1. Sign up at https://twilio.com
2. Go to Console > Account Info
3. Copy Account SID and Auth Token
4. Get a phone number from Phone Numbers > Manage > Buy a number

### Payments (Stripe)
```bash
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

**Where to get these:**
1. Sign up at https://stripe.com
2. Go to Developers > API Keys for Secret Key
3. Go to Developers > Webhooks > Add endpoint
   - Endpoint URL: `https://yourdomain.com/api/payments/webhook`
   - Events: `checkout.session.completed`, `checkout.session.expired`, `payment_intent.payment_failed`
4. Copy the Signing secret for STRIPE_WEBHOOK_SECRET

---

## Optional Variables (Future Phases)

### Phase 4: Parts Integration
```bash
PARTSTECH_API_KEY=your_partstech_key
```

### Phase 5: AI Damage Assessment
```bash
# Google Cloud Vision API
GOOGLE_CLOUD_PROJECT_ID=your_gcp_project_id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Or use API key (simpler but less secure)
GOOGLE_CLOUD_VISION_API_KEY=your_google_vision_key
```

#### Setting up Google Cloud Vision:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Cloud Vision API" from APIs & Services
4. Create a Service Account with Vision API access
5. Download the JSON key file
6. Set GOOGLE_APPLICATION_CREDENTIALS to the key file path

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
