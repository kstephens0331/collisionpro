import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (uses public anon key)
// NEXT_PUBLIC_ variables are embedded at build time
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// Server-side admin client with service role key (bypasses RLS)
// Only use this in server components or API routes
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);
