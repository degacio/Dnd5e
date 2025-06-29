import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import Constants from 'expo-constants';

// Get environment variables from Expo Constants for proper Metro bundling
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient<Database>>;
let supabaseAdmin: ReturnType<typeof createClient<Database>> | null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[REDACTED]' : 'undefined');
  
  // Provide fallback values to prevent Metro bundling errors
  const fallbackUrl = 'https://placeholder.supabase.co';
  const fallbackKey = 'placeholder-key';
  
  supabase = createClient<Database>(fallbackUrl, fallbackKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  supabaseAdmin = null;
} else {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  });

  // Service role client for server-side operations
  const supabaseServiceKey = Constants.expoConfig?.extra?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  supabaseAdmin = supabaseServiceKey 
    ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;
}

export { supabase, supabaseAdmin };