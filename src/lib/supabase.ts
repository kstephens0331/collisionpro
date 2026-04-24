import { createClient } from '@supabase/supabase-js';

// Environment variables are required. Previous defaults hardcoded a live
// key that ended up in a public repo; fail loud if the env is missing
// instead of falling back to a baked-in value.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
  );
}

// Client-side Supabase client (uses public anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client with service role key (bypasses RLS).
// Only use this in server components or API routes.
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
