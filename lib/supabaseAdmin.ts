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

// Enhanced fetch function with better error handling and retry logic
const enhancedFetch = async (url: string, options: RequestInit = {}) => {
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Fetch attempt ${attempt}/${maxRetries} to: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': 'expo-app/1.0.0',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Connection': 'keep-alive',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      console.log(`✅ Fetch successful on attempt ${attempt}, status: ${response.status}`);
      return response;
      
    } catch (error) {
      console.error(`❌ Fetch attempt ${attempt} failed:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        cause: error instanceof Error ? error.cause : undefined,
      });
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        // Enhance error with more context
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error(`Connection timeout after 30 seconds. Please check your network connection and Supabase project status.`);
          } else if (error.message.includes('fetch failed')) {
            throw new Error(`Network connection failed. This could be due to: 1) Internet connectivity issues, 2) Supabase project is paused/inactive, 3) Firewall blocking the connection, 4) Invalid Supabase URL. Original error: ${error.message}`);
          }
        }
        throw error;
      }
      
      // Wait before retrying
      console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

// === Enhanced Admin client for API routes / server-side use ===
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: { 
    fetch: enhancedFetch,
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

// Enhanced connection test with detailed diagnostics and network troubleshooting
export async function testSupabaseAdminConnection() {
  const startTime = Date.now();
  
  try {
    console.log('🔍 Testing Supabase admin connection...');
    console.log('📡 Target URL:', supabaseUrl);
    console.log('🔑 Service key length:', supabaseServiceKey.length);
    
    // Test 1: Basic DNS resolution and connectivity
    console.log('🌐 Testing basic network connectivity...');
    
    try {
      // First, test if we can reach the Supabase URL at all
      const healthCheckUrl = `${supabaseUrl}/rest/v1/`;
      const healthResponse = await enhancedFetch(healthCheckUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        }
      });
      
      console.log('✅ Basic connectivity test passed, status:', healthResponse.status);
    } catch (connectError) {
      console.error('❌ Basic connectivity test failed:', connectError);
      throw new Error(`Cannot reach Supabase server. ${connectError instanceof Error ? connectError.message : 'Unknown connectivity error'}`);
    }
    
    // Test 2: Database query
    console.log('🗄️ Testing database query...');
    const { data, error } = await supabaseAdmin
      .from('characters')
      .select('count')
      .limit(1);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (error) {
      console.error('❌ Database query failed:', {
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
        timestamp: new Date().toISOString(),
        troubleshooting: [
          'Check if your Supabase project is active (not paused)',
          'Verify SUPABASE_SERVICE_ROLE_KEY has correct permissions',
          'Confirm the characters table exists in your database',
          'Check Supabase project logs for additional details'
        ]
      };
    } else {
      console.log('✅ Supabase admin client connected successfully');
      console.log(`⏱️  Connection time: ${duration}ms`);
      
      return {
        success: true,
        duration,
        timestamp: new Date().toISOString(),
        url: supabaseUrl,
        message: 'Connection successful'
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
    let troubleshooting = [
      'Check your internet connection',
      'Verify Supabase project is active and not paused',
      'Confirm EXPO_PUBLIC_SUPABASE_URL is correct',
      'Confirm SUPABASE_SERVICE_ROLE_KEY is correct',
      'Check firewall/proxy settings',
      'Try the Tests tab for detailed diagnostics'
    ];
    
    if (err instanceof Error) {
      if (err.message.includes('fetch failed') || err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
        console.error('🌐 Network connectivity issue detected. Troubleshooting steps:');
        troubleshooting = [
          'Check your internet connection',
          'Verify the Supabase URL is correct and accessible',
          'Check if your Supabase project is paused or deleted',
          'Disable VPN if using one',
          'Check firewall settings',
          'Try accessing your Supabase dashboard in a browser',
          'Contact your network administrator if on corporate network'
        ];
      } else if (err.message.includes('unauthorized') || err.message.includes('401')) {
        console.error('🔐 Authentication issue detected. Troubleshooting steps:');
        troubleshooting = [
          'Verify SUPABASE_SERVICE_ROLE_KEY is correct',
          'Check that the service role key has proper permissions',
          'Ensure the key is not expired',
          'Regenerate the service role key if necessary'
        ];
      } else if (err.message.includes('timeout')) {
        console.error('⏱️ Timeout issue detected. Troubleshooting steps:');
        troubleshooting = [
          'Check network stability',
          'Try again in a few minutes',
          'Check Supabase status page',
          'Consider increasing timeout if on slow connection'
        ];
      }
    }
    
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString(),
      type: 'connection_error',
      troubleshooting
    };
  }
}

// Test connection on initialization with enhanced logging
async function initializeConnection() {
  try {
    console.log('🚀 Initializing Supabase admin connection...');
    const result = await testSupabaseAdminConnection();
    
    if (!result.success) {
      console.error('🚨 Failed to initialize Supabase admin connection');
      console.error('🔧 Troubleshooting steps:');
      result.troubleshooting?.forEach((step, index) => {
        console.error(`   ${index + 1}. ${step}`);
      });
    } else {
      console.log('🎉 Supabase admin connection initialized successfully');
    }
  } catch (err) {
    console.error('🚨 Critical error during Supabase initialization:', err);
  }
}

// Initialize connection in development with better error handling
if (process.env.NODE_ENV === 'development') {
  initializeConnection();
}