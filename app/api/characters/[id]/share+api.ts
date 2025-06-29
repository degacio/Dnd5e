import { createClient } from '@supabase/supabase-js';

// Create server-side Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Helper function to create authenticated Supabase client
function createAuthenticatedClient(authHeader: string) {
  const token = authHeader.replace('Bearer ', '');
  return createClient(
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
}

export async function POST(request: Request, { id }: { id: string }) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createAuthenticatedClient(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Use admin client for the update operation since we need to generate new tokens
    const { data: character, error } = await supabaseAdmin
      .from('characters')
      .update({
        share_token: crypto.randomUUID(),
        token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('share_token, token_expires_at')
      .single();

    if (error) {
      console.error('Error generating share token:', error);
      return new Response('Error generating share token', { status: 500 });
    }

    return Response.json({
      share_token: character.share_token,
      expires_at: character.token_expires_at,
    });
  } catch (error) {
    console.error('API Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createAuthenticatedClient(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Use admin client for the update operation
    const { error } = await supabaseAdmin
      .from('characters')
      .update({
        share_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error revoking share token:', error);
      return new Response('Error revoking share token', { status: 500 });
    }

    return new Response('Share token revoked', { status: 200 });
  } catch (error) {
    console.error('API Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}