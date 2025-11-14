import { createClient } from '@supabase/supabase-js';

// Public Supabase configuration (safe to expose)
const supabaseUrl = 'https://pkyqrvrxwhlwkxalsbaz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBreXFydnJ4d2hsd2t4YWxzYmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNDMxNzcsImV4cCI6MjA3MzgxOTE3N30.GlNIbz3m6lc5qkuNqDwifd2fS0HLN2x7plPSMuTo62o';

// Client-side Supabase client (uses public anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side admin client with service role key (bypasses RLS)
// Only use this in server components or API routes
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);
