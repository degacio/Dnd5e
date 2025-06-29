import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { CharacterUpdate } from '@/types/database';

// Helper para validar e obter o usuário a partir do token
async function validateUserFromToken(authHeader: string) {
  try {
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

function extractIdFromUrl(request: Request): string | null {
  const url = new URL(request.url);
  const segments = url.pathname.split('/');
  return segments.pop() || null;
}

export async function GET(request: Request) {
  const id = extractIdFromUrl(request);

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing character ID in URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Invalid authorization header' }), { status: 401 });
    }

    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed', details: authError?.message || 'Invalid token' }), { status: 401 });
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
      }), { status: error.code === 'PGRST116' ? 404 : 500 });
    }

    return Response.json(character);
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 });
  }
}

export async function PUT(request: Request) {
  const id = extractIdFromUrl(request);

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing character ID in URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Invalid authorization header' }), { status: 401 });
    }

    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed', details: authError?.message || 'Invalid token' }), { status: 401 });
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
      return new Response(JSON.stringify({
        error: 'Database error',
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }), { status: 500 });
    }

    if (!characters || characters.length === 0) {
      return new Response(JSON.stringify({ error: 'Character not found or you do not have permission to update it' }), { status: 404 });
    }

    return Response.json(characters[0]);
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const id = extractIdFromUrl(request);

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing character ID in URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Invalid authorization header' }), { status: 401 });
    }

    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication failed', details: authError?.message || 'Invalid token' }), { status: 401 });
    }

    const { data: existingCharacter, error: checkError } = await supabaseAdmin
      .from('characters')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Character not found or no permission to delete it' }), { status: 404 });
      }

      return new Response(JSON.stringify({
        error: 'Database error during character check',
        message: checkError.message,
        details: checkError.details || 'No additional details',
        code: checkError.code || 'UNKNOWN'
      }), { status: 500 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('characters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      return new Response(JSON.stringify({
        error: 'Database error during deletion',
        message: deleteError.message,
        details: deleteError.details || 'No additional details',
        hint: deleteError.hint || 'No hint available',
        code: deleteError.code || 'UNKNOWN'
      }), { status: 500 });
    }

    return new Response(JSON.stringify({
      message: 'Character deleted successfully',
      characterName: existingCharacter.name
    }), { status: 200 });
  } catch (error) {
    console.error('DELETE API Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }), { status: 500 });
  }
}