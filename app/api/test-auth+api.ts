export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return Response.json({
        authenticated: false,
        error: 'No authorization header',
        timestamp: new Date().toISOString()
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return Response.json({
        authenticated: false,
        error: 'Invalid authorization header format',
        timestamp: new Date().toISOString()
      });
    }

    // Test token validation
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const token = authHeader.replace('Bearer ', '');
      
      const supabase = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL!,
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          },
          global: {
            headers: {
              Authorization: authHeader
            }
          }
        }
      );

      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        return Response.json({
          authenticated: false,
          error: 'Token validation failed',
          details: userError.message,
          timestamp: new Date().toISOString()
        });
      }

      if (!user) {
        return Response.json({
          authenticated: false,
          error: 'No user found in token',
          timestamp: new Date().toISOString()
        });
      }

      return Response.json({
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      return Response.json({
        authenticated: false,
        error: 'Token processing error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    return Response.json({
      authenticated: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}