import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// For server-side API routes, we need to access environment variables differently
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// === Validations ===
if (!supabaseUrl) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  console.error('Invalid Supabase URL format. Must start with https://');
  throw new Error('Invalid Supabase URL format');
}

console.log('Supabase URL:', supabaseUrl);
console.log('Service key available:', !!supabaseServiceKey);

// === Admin client for API routes / server-side use ===
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: { 
    fetch: fetch,
    headers: {
      'User-Agent': 'expo-app/1.0.0'
    }
  },
  db: {
    schema: 'public'
  }
});

// Test connection on initialization
async function testConnection() {
  try {
    const { data, error } = await supabaseAdmin
      .from('characters')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('✅ Supabase admin client initialized and connected successfully');
    }
  } catch (err) {
    console.error('❌ Supabase connection test error:', err);
  }
}

// Test connection in development
if (process.env.NODE_ENV === 'development') {
  testConnection();
}