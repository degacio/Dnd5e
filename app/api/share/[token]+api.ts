import { createClient } from '@supabase/supabase-js';

// Create anonymous Supabase client for public access
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request, { token }: { token: string }) {
  try {
    // Validate token format (should be a UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid token format' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Use anonymous access to fetch character by token
    const { data: character, error } = await supabase
      .from('characters')
      .select('*')
      .eq('share_token', token)
      .gt('token_expires_at', new Date().toISOString())
      .single();

    if (error) {
      console.error('Error fetching character by token:', error);
      
      if (error.code === 'PGRST116') {
        // No rows found
        return new Response(JSON.stringify({ 
          error: 'Character not found or token expired' 
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        error: 'Database error',
        details: error.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!character) {
      return new Response(JSON.stringify({ 
        error: 'Character not found or token expired' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return character data without sensitive information
    const publicCharacterData = {
      id: character.id,
      name: character.name,
      class_name: character.class_name,
      level: character.level,
      hp_current: character.hp_current,
      hp_max: character.hp_max,
      spell_slots: character.spell_slots,
      spells_known: character.spells_known,
      character_data: character.character_data,
      created_at: character.created_at,
      updated_at: character.updated_at,
    };

    return Response.json(publicCharacterData);
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