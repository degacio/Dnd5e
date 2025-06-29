import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'undefined'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error('Supabase URL must start with https://');
}

// Validate key format (basic check)
if (supabaseAnonKey.length < 100) {
  console.error('Invalid Supabase anon key format - too short');
  throw new Error('Invalid Supabase anon key format');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Service role client for server-side operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = supabaseServiceKey 
  ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('characters').select('count').limit(1);
    return { success: !error, error: error?.message };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}