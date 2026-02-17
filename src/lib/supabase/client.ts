import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.VITE_NEXT_PUBLIC_SUPABASE_URL!,
    process.env.VITE_NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}