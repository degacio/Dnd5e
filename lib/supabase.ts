import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// === Validations ===
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined',
  });
  throw new Error('Missing Supabase environment variables. Please check your .env or .env.local file.');
}

if (!supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Supabase URL must start with https://');
}

if (supabaseAnonKey.length < 100) {
  console.error('Invalid Supabase anon key format - too short');
  throw new Error('Invalid Supabase anon key format');
}

// === Client for client-side use (browser/app) ===
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// === Util to test connection (optional for diagnostics) ===
export async function testSupabaseConnection() {
  try {
    const { error } = await supabase.from('characters').select('*').limit(1);
    return { success: !error, error: error?.message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}