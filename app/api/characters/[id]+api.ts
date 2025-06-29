import { supabaseAdmin } from '@/lib/supabase';
import { CharacterUpdate } from '@/types/database';

// Helper function to validate and get user from token
async function validateUserFromToken(authHeader: string) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available - check SUPABASE_SERVICE_ROLE_KEY');
    }

    const token = authHeader.replace('Bearer ', '');

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized - missing SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({
        error: 'Server configuration error',
        details: 'Supabase admin client not available'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized - missing SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({
        error: 'Server configuration error',
        details: 'Supabase admin client not available'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  try {
    console.log('DELETE request received for character:', id);

    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized - missing SUPABASE_SERVICE_ROLE_KEY');
      return new Response(JSON.stringify({
        error: 'Server configuration error',
        details: 'Supabase admin client not available - check environment variables'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Invalid authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({
        error: 'Authentication failed',
        details: authError?.message || 'Invalid token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: existingCharacter, error: checkError } = await supabaseAdmin
      .from('characters')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError) {
      console.error('Error checking character:', checkError);
      if (checkError.code === 'PGRST116') {
        return new Response(JSON.stringify({
          error: 'Character not found or you do not have permission to delete it'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        error: 'Database error during character check',
        message: checkError.message,
        details: checkError.details || 'No additional details',
        code: checkError.code || 'UNKNOWN'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('characters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting character:', deleteError);
      return new Response(JSON.stringify({
        error: 'Database error during deletion',
        message: deleteError.message,
        details: deleteError.details || 'No additional details',
        hint: deleteError.hint || 'No hint available',
        code: deleteError.code || 'UNKNOWN'
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
    console.error('API Error in DELETE:', error);

    if (error instanceof Error && error.message.includes('fetch failed')) {
      return new Response(JSON.stringify({
        error: 'Network connection error',
        message: 'Unable to connect to database. Please check your internet connection and try again.',
        details: error.message
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
