import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Browser client (uses publishable key + RLS)
export const supabase = createClient(supabaseUrl, supabasePublishableKey, { auth: { flowType: "pkce" } });

// Server client (uses secret key, bypasses RLS — only used in API routes)
export function createServerClient() {
  return createClient(supabaseUrl, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
}
