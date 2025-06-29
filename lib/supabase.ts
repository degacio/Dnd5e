import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[REDACTED]' : 'undefined');
  
  // Provide fallback values to prevent Metro bundling errors
  const fallbackUrl = 'https://placeholder.supabase.co';
  const fallbackKey = 'placeholder-key';
  
  export const supabase = createClient<Database>(fallbackUrl, fallbackKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  
  export const supabaseAdmin = null;
} else {
  export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
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
}