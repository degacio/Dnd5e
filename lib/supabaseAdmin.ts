import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// For server-side API routes, we need to access environment variables differently
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// === Validations ===
if (!supabaseUrl) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// === Admin client for API routes / server-side use ===
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: { fetch },
});

// Log successful initialization (remove in production)
console.log('Supabase admin client initialized successfully');