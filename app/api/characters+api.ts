import { supabaseAdmin, executeWithRecovery } from '@/lib/supabaseAdmin';

// Helper function to validate and get user from token
async function validateUserFromToken(authHeader: string) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not available');
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Use getUser() method which validates the JWT token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError) {
      console.error('User validation error:', userError);
      return { user: null, error: userError };
    }
    
    if (!user) {
      console.error('No user found in token');
      return { user: null, error: { message: 'No user found' } };
    }
    
    // Verify the user exists and is valid
    if (!user.id || !user.email) {
      console.error('Invalid user data:', { hasId: !!user.id, hasEmail: !!user.email });
      return { user: null, error: { message: 'Invalid user data' } };
    }
    
    return { user, error: null };
  } catch (error) {
    console.error('Token validation error:', error);
    return { user: null, error };
  }
}

export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header provided' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Invalid authorization header format' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate user from token
    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        details: authError?.message || 'Invalid or expired token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ User authenticated successfully:', { userId: user.id, email: user.email });

    // Query characters for the authenticated user using enhanced recovery
    const queryOperation = async () => {
      const { data, error } = await supabaseAdmin
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data;
    };

    try {
      const characters = await executeWithRecovery(queryOperation, 'Characters list query');
      console.log('✅ Characters fetched successfully:', { count: characters?.length || 0 });

      return new Response(JSON.stringify(characters || []), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Database select error:', error);
      
      // Enhanced error response for network issues
      if (error.message && (
        error.message.includes('fetch failed') ||
        error.message.includes('other side closed') ||
        error.message.includes('Network connection failed') ||
        error.message.includes('Circuit breaker')
      )) {
        return new Response(JSON.stringify({ 
          error: 'Temporary connection issue',
          message: 'Experiencing temporary connectivity issues. The system is attempting automatic recovery.',
          details: error.message,
          troubleshooting: [
            'Please wait a few seconds and try again',
            'The system has automatic recovery for network issues',
            'Check your internet connection if the problem persists'
          ]
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
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
  } catch (error) {
    console.error('💥 API error:', error);
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
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header provided' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Invalid authorization header format' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate user from token
    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        details: authError?.message || 'Invalid or expired token'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
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

    // Critical: Additional defensive check for user object right before using it
    if (!user || typeof user !== 'object' || !user.id || typeof user.id !== 'string') {
      console.error('💥 Critical: User object is null or invalid when creating character data:', { 
        userExists: !!user, 
        userType: typeof user,
        hasId: user ? !!user.id : false,
        idType: user && user.id ? typeof user.id : 'undefined'
      });
      return new Response(JSON.stringify({ 
        error: 'Authentication failed',
        message: 'User session is invalid - please log in again'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('✅ User authenticated for POST:', { userId: user.id, email: user.email });
    
    // Prepare character data with validated user ID
    const characterData = {
      user_id: user.id, // Now guaranteed to be a valid string
      name: body.name,
      class_name: body.class_name,
      level: body.level || 1,
      hp_current: body.hp_current || 1,
      hp_max: body.hp_max || 1,
      spell_slots: body.spell_slots || {},
      spells_known: body.spells_known || [],
      character_data: body.character_data || {},
    };

    console.log('📝 Creating character:', { name: characterData.name, class: characterData.class_name });

    // Insert the character using enhanced recovery
    const insertOperation = async () => {
      const { data, error } = await supabaseAdmin
        .from('characters')
        .insert([characterData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    };

    try {
      const character = await executeWithRecovery(insertOperation, 'Character creation');
      console.log('✅ Character created successfully:', { id: character.id, name: character.name });

      return new Response(JSON.stringify(character), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('💥 Database insert error:', error);
      
      // Enhanced error response for network issues
      if (error.message && (
        error.message.includes('fetch failed') ||
        error.message.includes('other side closed') ||
        error.message.includes('Network connection failed') ||
        error.message.includes('Circuit breaker')
      )) {
        return new Response(JSON.stringify({ 
          error: 'Temporary connection issue',
          message: 'Experiencing temporary connectivity issues while creating character. The system is attempting automatic recovery.',
          details: error.message,
          troubleshooting: [
            'Please wait a few seconds and try again',
            'The system has automatic recovery for network issues',
            'Your character data has been preserved and will be saved once connection is restored'
          ]
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
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
  } catch (error) {
    console.error('💥 API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}