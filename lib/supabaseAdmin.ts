import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

// Variáveis de ambiente
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// === Validações iniciais ===
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

if (!supabaseUrl.startsWith('https://')) {
  console.error('❌ Invalid Supabase URL format. Must start with https://');
  throw new Error('Invalid Supabase URL format');
}

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

// === Circuit Breaker & Retry Config ===
let circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
let failureCount = 0;
let lastFailureTime = 0;
const FAILURE_THRESHOLD = 5;
const RECOVERY_TIMEOUT = 45000; // 45 segundos
const CONNECTION_TIMEOUT = 120000; // 2 minutos

// Enhanced fetch com circuit breaker, timeout e retry
const enhancedFetch = async (url: string, options: RequestInit = {}) => {
  if (circuitBreakerState === 'OPEN') {
    if (Date.now() - lastFailureTime > RECOVERY_TIMEOUT) {
      circuitBreakerState = 'HALF_OPEN';
      console.log('🔄 Circuit breaker moving to HALF_OPEN state');
    } else {
      throw new Error('Circuit breaker is OPEN - too many recent failures. Please wait before retrying.');
    }
  }

  const maxRetries = circuitBreakerState === 'HALF_OPEN' ? 1 : 5;
  const baseDelay = 1000; // 1 segundo

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Fetch attempt ${attempt}/${maxRetries} to: ${url} (Circuit: ${circuitBreakerState})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONNECTION_TIMEOUT);

      const enhancedHeaders = {
        'User-Agent': 'expo-app/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Connection': 'keep-alive', // Mantenha ou remova conforme seu backend
        'Cache-Control': 'no-cache',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        ...options.headers,
      };

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: enhancedHeaders,
      });

      clearTimeout(timeoutId);

      // Reset do circuit breaker em HALF_OPEN caso sucesso
      if (circuitBreakerState === 'HALF_OPEN') {
        circuitBreakerState = 'CLOSED';
        failureCount = 0;
        console.log('✅ Circuit breaker reset to CLOSED state');
      }

      console.log(`✅ Fetch successful on attempt ${attempt}, status: ${response.status}`);
      return response;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Fetch attempt ${attempt} failed:`, {
        error: errorMsg,
        name: error instanceof Error ? error.name : 'Unknown',
        cause: error instanceof Error ? error.cause : undefined,
        circuitState: circuitBreakerState
      });

      failureCount++;
      lastFailureTime = Date.now();

      if (failureCount >= FAILURE_THRESHOLD && circuitBreakerState === 'CLOSED') {
        circuitBreakerState = 'OPEN';
        console.error('🚨 Circuit breaker opened due to too many failures');
      }

      if (attempt === maxRetries) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error(`Connection timeout after ${CONNECTION_TIMEOUT / 1000} seconds. This may indicate network instability or Supabase server issues. Circuit breaker state: ${circuitBreakerState}`);
          } else if (
            errorMsg.includes('fetch failed') ||
            errorMsg.includes('other side closed')
          ) {
            throw new Error(`Network connection failed. Possible causes: network instability, Supabase server issues, connection pool exhaustion, firewall interference. Circuit breaker state: ${circuitBreakerState}. Original error: ${errorMsg}`);
          } else if (errorMsg.includes('ECONNREFUSED')) {
            throw new Error(`Connection refused by server. Causes: project unavailable, server overload, network routing issues. Circuit breaker state: ${circuitBreakerState}. Original error: ${errorMsg}`);
          } else if (errorMsg.includes('ENOTFOUND')) {
            throw new Error(`DNS resolution failed. Causes: DNS issues, network problems, invalid Supabase URL. Circuit breaker state: ${circuitBreakerState}. Original error: ${errorMsg}`);
          }
        }
        throw error;
      }

      // Exponential backoff com jitter
      const delay = baseDelay * Math.pow(2, attempt - 1);
      const jitter = Math.random() * 500; // até 500ms
      const adjustedDelay = circuitBreakerState === 'HALF_OPEN' ? (delay + jitter) * 2 : delay + jitter;

      console.log(`⏳ Waiting ${Math.round(adjustedDelay)}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, adjustedDelay));
    }
  }
};

// Health check adaptativo
let connectionHealthy = true;
let lastHealthCheck = 0;
let healthCheckInterval = 30000; // 30 segundos
const MIN_HEALTH_CHECK_INTERVAL = 10000; // 10 segundos
const MAX_HEALTH_CHECK_INTERVAL = 120000; // 2 minutos

const checkConnectionHealth = async () => {
  const now = Date.now();
  if (now - lastHealthCheck < healthCheckInterval && connectionHealthy) {
    return connectionHealthy;
  }

  try {
    console.log('🏥 Performing connection health check...');
    const healthCheckUrl = `${supabaseUrl}/rest/v1/`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

    const response = await fetch(healthCheckUrl, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const wasHealthy = connectionHealthy;
    connectionHealthy = response.ok || response.status === 401; // 401 esperado para HEAD
    lastHealthCheck = now;

    if (connectionHealthy) {
      if (!wasHealthy) {
        console.log('✅ Connection recovered!');
      }
      healthCheckInterval = Math.min(healthCheckInterval * 1.5, MAX_HEALTH_CHECK_INTERVAL);
    } else {
      console.warn(`⚠️ Connection health check failed with status: ${response.status}`);
      healthCheckInterval = Math.max(healthCheckInterval * 0.7, MIN_HEALTH_CHECK_INTERVAL);
    }

    return connectionHealthy;
  } catch (error) {
    console.error('❌ Connection health check failed:', error);
    connectionHealthy = false;
    lastHealthCheck = now;
    healthCheckInterval = MIN_HEALTH_CHECK_INTERVAL;
    return false;
  }
};

// Recovery automático
const attemptRecovery = async () => {
  console.log('🔄 Attempting connection recovery...');

  try {
    // Limpa conexões em cache
    // connectionPool.clear(); // se usar pool, senão remova

    if (circuitBreakerState === 'OPEN' && Date.now() - lastFailureTime > RECOVERY_TIMEOUT) {
      circuitBreakerState = 'HALF_OPEN';
      failureCount = Math.floor(failureCount / 2);
    }

    const isHealthy = await checkConnectionHealth();

    if (isHealthy) {
      console.log('✅ Connection recovery successful');
      return true;
    } else {
      console.log('❌ Connection recovery failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Recovery attempt failed:', error);
    return false;
  }
};

// Cliente Supabase Admin com fetch customizado e headers
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: enhancedFetch,
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Wrapper para operações com retry e recovery automático
export async function executeWithRecovery<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxAttempts: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (!connectionHealthy) {
        console.log(`⚠️ Connection unhealthy before ${operationName}, attempting recovery...`);
        await attemptRecovery();
      }

      console.log(`🔄 Executing ${operationName} (attempt ${attempt}/${maxAttempts})`);
      const result = await operation();
      console.log(`✅ ${operationName} completed successfully`);
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '';
      console.error(`❌ ${operationName} attempt ${attempt} failed:`, error);

      // Checa se erro é relacionado à rede para retry
      const isNetworkError =
        error instanceof Error &&
        (
          (typeof errorMsg === 'string') && (
            errorMsg.includes('fetch failed') ||
            errorMsg.includes('other side closed') ||
            errorMsg.includes('ECONNREFUSED') ||
            errorMsg.includes('ENOTFOUND') ||
            errorMsg.includes('timeout') ||
            errorMsg.includes('Network connection failed')
          )
        );

      if (isNetworkError && attempt < maxAttempts) {
        console.log(`🔄 Network error detected, attempting recovery before retry...`);
        await attemptRecovery();

        // Exponential backoff + jitter
        const delay = 2000 * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 500;
        const totalDelay = delay + jitter;
        console.log(`⏳ Waiting ${totalDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, totalDelay));
        continue;
      }

      if (attempt === maxAttempts) {
        throw error;
      }
    }
  }
  throw new Error(`${operationName} failed after ${maxAttempts} attempts`);
}

// Função para testar conexão na inicialização
export async function testSupabaseAdminConnection() {
  const startTime = Date.now();

  try {
    console.log('🔍 Testing Supabase admin connection...');
    console.log('📡 Target URL:', supabaseUrl);
    console.log('🔑 Service key length:', supabaseServiceKey.length);
    console.log('🔌 Circuit breaker state:', circuitBreakerState);

    // Health check
    console.log('🏥 Checking connection health...');
    const isHealthy = await checkConnectionHealth();
    if (!isHealthy) {
      console.warn('⚠️ Connection health check indicates potential issues, attempting recovery...');
      await attemptRecovery();
    }

    // Basic connectivity test
    console.log('🌐 Testing basic network connectivity...');
    const connectivityTest = async () => {
      const healthCheckUrl = `${supabaseUrl}/rest/v1/`;
      return await enhancedFetch(healthCheckUrl, {
        method: 'GET',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      });
    };

    try {
      const healthResponse = await executeWithRecovery(connectivityTest, 'Basic connectivity test');
      console.log('✅ Basic connectivity test passed, status:', healthResponse.status);
    } catch (connectError) {
      console.error('❌ Basic connectivity test failed:', connectError);
      throw new Error(`Cannot reach Supabase server. ${connectError instanceof Error ? connectError.message : 'Unknown connectivity error'}`);
    }

    // Database query test
    console.log('🗄️ Testing database query...');
    const databaseTest = async () => {
      const { data, error } = await supabaseAdmin
        .from('characters')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      return data;
    };

    try {
      const queryData = await executeWithRecovery(databaseTest, 'Database query test');

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log('✅ Supabase admin client connected successfully');
      console.log(`⏱️  Connection time: ${duration}ms`);
      console.log('🔌 Circuit breaker state:', circuitBreakerState);
      console.log('🏥 Connection healthy:', connectionHealthy);

      return {
        success: true,
        duration,
        timestamp: new Date().toISOString(),
        url: supabaseUrl,
        message: 'Connection successful',
        connectionHealthy,
        circuitBreakerState,
        failureCount
      };

    } catch (queryError) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.error('❌ Database query failed:', {
        error: queryError.message,
        details: queryError.details,
        hint: queryError.hint,
        code: queryError.code,
        duration: `${duration}ms`,
        circuitBreakerState,
        failureCount
      });

      return {
        success: false,
        error: queryError.message,
        details: queryError.details,
        duration,
        timestamp: new Date().toISOString(),
        circuitBreakerState,
        failureCount,
        troubleshooting: [
          'Check if your Supabase project is active (not paused)',
          'Verify SUPABASE_SERVICE_ROLE_KEY has correct permissions',
          'Confirm the characters table exists in your database',
          'Check Supabase project logs for additional details',
          'Try restarting your development server',
          'Check your internet connection stability',
          'Wait a few minutes if circuit breaker is open',
          'Check Supabase status page for service issues'
        ]
      };
    }
  } catch (err) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.error('❌ Supabase admin connection test error:', {
      error: err instanceof Error ? err.message : 'Unknown error',
      duration: `${duration}ms`,
      stack: err instanceof Error ? err.stack : undefined,
      circuitBreakerState,
      failureCount
    });

    let troubleshooting = [
      'Check your internet connection',
      'Verify Supabase project is active and not paused',
      'Confirm EXPO_PUBLIC_SUPABASE_URL is correct',
      'Confirm SUPABASE_SERVICE_ROLE_KEY is correct',
      'Check firewall/proxy settings',
      'Try the Tests tab for detailed diagnostics',
      'Restart your development server',
      'Wait for circuit breaker recovery if open'
    ];

    if (err instanceof Error) {
      if (err.message.includes('fetch failed') || err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED') || err.message.includes('other side closed')) {
        troubleshooting = [
          'Check your internet connection stability',
          'Verify the Supabase URL is correct and accessible',
          'Check if your Supabase project is paused or deleted',
          'Disable VPN if using one',
          'Check firewall settings',
          'Try accessing your Supabase dashboard in a browser',
          'Contact your network administrator if on corporate network',
          'Try switching to a different network (mobile hotspot)',
          'Clear DNS cache (ipconfig /flushdns on Windows, sudo dscacheutil -flushcache on Mac)',
          'Wait for automatic recovery if circuit breaker is open',
          'Check Supabase status page for service outages'
        ];
      } else if (err.message.includes('unauthorized') || err.message.includes('401')) {
        troubleshooting = [
          'Verify SUPABASE_SERVICE_ROLE_KEY is correct',
          'Check that the service role key has proper permissions',
          'Ensure the key is not expired',
          'Regenerate the service role key if necessary'
        ];
      } else if (err.message.includes('timeout') || err.message.includes('Circuit breaker')) {
        troubleshooting = [
          'Check network stability',
          'Try again in a few minutes',
          'Check Supabase status page',
          'Consider increasing timeout if on slow connection',
          'Try switching to a different network',
          'Wait for circuit breaker to reset automatically',
          'Restart the application to reset circuit breaker'
        ];
      }
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      duration,
      timestamp: new Date().toISOString(),
      type: 'connection_error',
      troubleshooting,
      connectionHealthy: false,
      circuitBreakerState,
      failureCount
    };
  }
}

// Inicializa conexão no desenvolvimento
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
    console.error('🚨 Critical error during Supabase admin initialization:', err);
  }
}

if (process.env.NODE_ENV !== 'production') {
  initializeConnection();
}
