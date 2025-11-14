/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pkyqrvrxwhlwkxalsbaz.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreXFydnJ4d2hsd2t4YWxzYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDMxNzcsImV4cCI6MjA3MzgxOTE3N30.GlNIbz3m6lc5qkuNqDwifd2fS0HLN2x7plPSMuTo62o',
  },
}

module.exports = nextConfig
