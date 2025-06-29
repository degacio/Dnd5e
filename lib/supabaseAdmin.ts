import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// For server-side API routes, we need to access environment variables differently
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// === Enhanced Validations ===
if (!supabaseUrl) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.error('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Validate URL format
if (!supabaseUrl.startsWith('https://')) {
  console.error('❌ Invalid Supabase URL format. Must start with https://');
  throw new Error('Invalid Supabase URL format');
}

// Check for placeholder values
if (supabaseUrl.includes('your-project-url') || supabaseUrl.includes('localhost')) {
  console.error('❌ Supabase URL appears to be a placeholder value');
  throw new Error('Supabase URL appears to be a placeholder value. Please set your actual Supabase project URL.');
}

if (supabaseServiceKey.length < 100) {
  console.error('❌ Service role key appears to be invalid (too short)');
  throw new Error('Service role key appears to be invalid. Please check your Supabase service role key.');
}

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔧 Service key available:', !!supabaseServiceKey);
console.log('🔧 Service key length:', supabaseServiceKey.length);

// === Enhanced Admin client for API routes / server-side use ===
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: { 
    fetch: fetch,
    headers: {
      'User-Agent': 'expo-app/1.0.0',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },
  db: {
    schema: 'public'
  },
  // Add retry configuration for network issues
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Enhanced connection test with detailed diagnostics
export async function testSupabaseAdminConnection() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing Supabase admin connection...');
    
    // Test 1: Basic connectivity
    console.log('📡 Testing basic connectivity to:', supabaseUrl);
    
    const { data, error } = await supabaseAdmin
      .from('characters')
      .select('count')
      .limit(1);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (error) {
      console.error('❌ Supabase admin connection test failed:', {
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        duration: `${duration}ms`
      });
      
      return {
        success: false,
        error: error.message,
        details: error.details,
        duration,
        timestamp: new Date().toISOString()
      };
    } else {
      console.log('✅ Supabase admin client connected successfully');
      console.log(`⏱️  Connection time: ${duration}ms`);
      
      return {
        success: true,
        duration,
        timestamp: new Date().toISOString(),
        url: supabaseUrl
      };
    }
  } catch (err) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.error('❌ Supabase admin connection test error:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: `${duration}ms`,
      stack: err instanceof Error ? err.stack : undefined
    });
    
    // Provide specific guidance based on error type
    if (err instanceof Error) {
      if (err.message.includes('fetch failed') || err.message.includes('ENOTFOUND')) {
        console.error('🌐 Network connectivity issue detected. Please check:');
        console.error('   - Internet connection');
        console.error('   - Firewall settings');
        console.error('   - VPN configuration');
        console.error('   - Supabase project status');
      } else if (err.message.includes('unauthorized') || err.message.includes('401')) {
        console.error('🔐 Authentication issue detected. Please check:');
        console.error('   - Service role key is correct');
        console.error('   - Service role key has proper permissions');
      }
    }
    
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString(),
      type: 'connection_error'
    };
  }
}

// Test connection on initialization with enhanced logging
async function initializeConnection() {
  try {
    const result = await testSupabaseAdminConnection();
    
    if (!result.success) {
      console.error('🚨 Failed to initialize Supabase admin connection');
      console.error('🔧 Troubleshooting steps:');
      console.error('   1. Check your .env file has correct EXPO_PUBLIC_SUPABASE_URL');
      console.error('   2. Check your .env file has correct SUPABASE_SERVICE_ROLE_KEY');
      console.error('   3. Verify your Supabase project is active');
      console.error('   4. Test network connectivity');
      console.error('   5. Use the Test tab in the app for detailed diagnostics');
    }
  } catch (err) {
    console.error('🚨 Critical error during Supabase initialization:', err);
  }
}

// Initialize connection in development with better error handling
if (process.env.NODE_ENV === 'development') {
  initializeConnection();
}