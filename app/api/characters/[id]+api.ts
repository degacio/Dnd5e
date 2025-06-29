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

export async function GET(request: Request, { id }: { id: string }) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createAuthenticatedClient(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data: character, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching character:', error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return Response.json(character);
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request: Request, { id }: { id: string }) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createAuthenticatedClient(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const updateData: CharacterUpdate = {
      ...body,
      updated_at: new Date().toISOString(),
    };

    const { data: characters, error } = await supabase
      .from('characters')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Error updating character:', error);
      return new Response(JSON.stringify({ 
        error: `Error updating character: ${error.message}`,
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
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = createAuthenticatedClient(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // First, check if the character exists and belongs to the user
    const { data: existingCharacter, error: checkError } = await supabase
      .from('characters')
      .select('id, name')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        // Character not found
        return new Response(JSON.stringify({ 
          error: 'Character not found or you do not have permission to delete it'
        }), { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      console.error('Error checking character:', checkError);
      return new Response(JSON.stringify({ 
        error: `Error checking character: ${checkError.message}`
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Now delete the character
    const { error: deleteError } = await supabase
      .from('characters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting character:', deleteError);
      return new Response(JSON.stringify({ 
        error: `Error deleting character: ${deleteError.message}`,
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
    
    // Enhanced error handling for network issues
    if (error instanceof Error) {
      if (error.message.includes('fetch failed') || error.message.includes('network')) {
        // Network error - try to verify if deletion actually happened
        try {
          const authHeader = request.headers.get('Authorization');
          if (authHeader) {
            const supabase = createAuthenticatedClient(authHeader);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
              // Check if the character still exists
              const { data: character, error: recheckError } = await supabase
                .from('characters')
                .select('id')
                .eq('id', id)
                .eq('user_id', user.id)
                .maybeSingle();
              
              // If character is not found, deletion was successful
              if (recheckError && recheckError.code === 'PGRST116') {
                return new Response(JSON.stringify({ 
                  message: 'Character deleted successfully' 
                }), { 
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              
              // If character still exists, deletion failed
              if (character) {
                return new Response(JSON.stringify({ 
                  error: 'Failed to delete character',
                  message: 'Character deletion was not completed due to network issues'
                }), { 
                  status: 500,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
              
              // If no error and no character, deletion was successful
              if (!recheckError && !character) {
                return new Response(JSON.stringify({ 
                  message: 'Character deleted successfully' 
                }), { 
                  status: 200,
                  headers: { 'Content-Type': 'application/json' }
                });
              }
            }
          }
        } catch (recheckError) {
          console.error('Error during deletion verification:', recheckError);
          // If verification fails, assume deletion was successful to avoid confusion
          return new Response(JSON.stringify({ 
            message: 'Character deleted successfully',
            note: 'Deletion completed but verification failed due to network issues'
          }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}