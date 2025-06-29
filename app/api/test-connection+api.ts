export async function GET() {
  try {
    // Test basic API functionality
    const timestamp = new Date().toISOString();
    
    // Test environment variables
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const envCheck = {
      hasSupabaseUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      hasServiceKey: !!supabaseServiceKey,
      supabaseUrlFormat: supabaseUrl ? supabaseUrl.startsWith('https://') : false,
    };
    
    // Test Supabase connection
    let supabaseConnection = null;
    try {
      if (supabaseUrl && supabaseAnonKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        // Test a simple query to check connection
        const { data, error } = await supabase.from('characters').select('count').limit(1);
        
        supabaseConnection = {
          connected: !error,
          error: error?.message || null,
        };
      }
    } catch (error) {
      supabaseConnection = {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
    
    return Response.json({
      status: 'ok',
      timestamp,
      environment: envCheck,
      supabase: supabaseConnection,
      platform: 'web',
    });
  } catch (error) {
    return Response.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}