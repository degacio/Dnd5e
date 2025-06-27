import { supabase } from '@/lib/supabase';
import { CharacterInsert, CharacterUpdate } from '@/types/database';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Set the auth token for this request
    const token = authHeader.replace('Bearer ', '');
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // Not needed for this operation
    });

    const { data: characters, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching characters:', error);
      return new Response('Error fetching characters', { status: 500 });
    }

    return Response.json(characters);
  } catch (error) {
    console.error('API Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const characterData: CharacterInsert = {
      ...body,
      user_id: user.id,
    };

    const { data: character, error } = await supabase
      .from('characters')
      .insert(characterData)
      .select()
      .single();

    if (error) {
      console.error('Error creating character:', error);
      return new Response('Error creating character', { status: 500 });
    }

    return Response.json(character);
  } catch (error) {
    console.error('API Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}