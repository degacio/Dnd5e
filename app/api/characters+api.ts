import { createClient } from '@supabase/supabase-js';

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

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createAuthenticatedClient(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: characters, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database select error:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(characters || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createAuthenticatedClient(authHeader);
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.class_name) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: name and class_name are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Ensure user_id is set to the authenticated user's ID
    const characterData = {
      ...body,
      user_id: user.id, // Force the user_id to be the authenticated user's ID
      level: body.level || 1,
      hp_current: body.hp_current || 1,
      hp_max: body.hp_max || 1,
      spell_slots: body.spell_slots || {},
      spells_known: body.spells_known || [],
      character_data: body.character_data || {},
    };

    const { data: character, error } = await supabase
      .from('characters')
      .insert([characterData])
      .select()
      .single();

    if (error) {
      console.error('💥 Database insert error:', error);
      return new Response(JSON.stringify({ 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(character), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}