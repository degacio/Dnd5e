import { createClient } from '@supabase/supabase-js';
import { CharacterUpdate } from '@/types/database';

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

// Helper function to validate and get user from token
async function validateUserFromToken(authHeader: string) {
  try {
    const token = authHeader.replace('Bearer ', '');
    
    // Use admin client to validate the token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUser(token);
    
    if (userError) {
      console.error('User validation error:', userError);
      return { user: null, error: userError };
    }
    
    if (!user || !user.id || !user.email) {
      console.error('Invalid user data:', { hasUser: !!user, hasId: !!user?.id, hasEmail: !!user?.email });
      return { user: null, error: { message: 'Invalid user data' } };
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('Token validation error:', error);
    return { user: null, error };
  }
}

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Invalid authorization header' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        details: authError?.message || 'Invalid token'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: character, error } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching character:', error);
      return new Response(JSON.stringify({ 
        error: error.code === 'PGRST116' ? 'Character not found' : 'Database error',
        details: error.message 
      }), { 
        status: error.code === 'PGRST116' ? 404 : 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return Response.json(character);
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request: Request, { id }: { id: string }) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Invalid authorization header' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        details: authError?.message || 'Invalid token'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const updateData: CharacterUpdate = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data: characters, error } = await supabaseAdmin
      .from('characters')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Error updating character:', error);
      return new Response(JSON.stringify({ 
        error: 'Database error',
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!characters || characters.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'Character not found or you do not have permission to update it'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return Response.json(characters[0]);
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Invalid authorization header' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        details: authError?.message || 'Invalid token'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // First, check if the character exists and belongs to the user
    const { data: existingCharacter, error: checkError } = await supabaseAdmin
      .from('characters')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return new Response(JSON.stringify({ 
          error: 'Character not found or you do not have permission to delete it'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      console.error('Error checking character:', checkError);
      return new Response(JSON.stringify({ 
        error: 'Database error',
        message: checkError.message
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Now delete the character
    const { error: deleteError } = await supabaseAdmin
      .from('characters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting character:', deleteError);
      return new Response(JSON.stringify({ 
        error: 'Database error',
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Character deleted successfully',
      characterName: existingCharacter.name
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}