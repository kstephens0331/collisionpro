import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "✗ Missing",
      DATABASE_URL: process.env.DATABASE_URL ? "✓ Set" : "✗ Missing",
      DIRECT_URL: process.env.DIRECT_URL ? "✓ Set" : "✗ Missing",
    },
    urls: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    }
  });
}
