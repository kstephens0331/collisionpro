#!/bin/bash

# Add environment variables to Vercel
echo "Adding environment variables to Vercel..."

echo "https://pkyqrvrxwhlwkxalsbaz.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "https://pkyqrvrxwhlwkxalsbaz.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "https://pkyqrvrxwhlwkxalsbaz.supabase.co" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL development

echo "<REDACTED-SUPABASE-KEY>" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "<REDACTED-SUPABASE-KEY>" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo "<REDACTED-SUPABASE-KEY>" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

echo "<REDACTED-SUPABASE-KEY>" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "<REDACTED-SUPABASE-KEY>" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY preview
echo "<REDACTED-SUPABASE-KEY>" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY development

echo "postgresql://postgres:78410889Ks%21@aws-0-us-east-1.pooler.supabase.com:5432/postgres" | npx vercel env add DATABASE_URL production
echo "postgresql://postgres:78410889Ks%21@aws-0-us-east-1.pooler.supabase.com:5432/postgres" | npx vercel env add DATABASE_URL preview
echo "postgresql://postgres:78410889Ks%21@aws-0-us-east-1.pooler.supabase.com:5432/postgres" | npx vercel env add DATABASE_URL development

echo "postgresql://postgres:78410889Ks%21@aws-0-us-east-1.pooler.supabase.com:5432/postgres" | npx vercel env add DIRECT_URL production
echo "postgresql://postgres:78410889Ks%21@aws-0-us-east-1.pooler.supabase.com:5432/postgres" | npx vercel env add DIRECT_URL preview
echo "postgresql://postgres:78410889Ks%21@aws-0-us-east-1.pooler.supabase.com:5432/postgres" | npx vercel env add DIRECT_URL development

echo "✅ All environment variables added!"
echo "🔄 Redeploying..."
npx vercel --prod
