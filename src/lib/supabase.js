import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nzthjtxsthlgruuiigpq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

export function getSupabaseConfig() {
  return {
    url: supabaseUrl,
    hasAnonKey: Boolean(supabaseAnonKey),
    connected: Boolean(supabase)
  };
}
