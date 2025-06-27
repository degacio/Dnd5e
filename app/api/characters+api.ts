import { supabase } from '@/lib/supabase';
import { CharacterInsert } from '@/types/database';

export async function GET(request: Request) {
  try {
    console.log('📥 GET /api/characters - Request received');
    
    const authHeader = request.headers.get('Authorization');
    console.log('🔐 Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return new Response('Unauthorized', { status: 401 });
    }

    // Set the auth token for this request
    const token = authHeader.replace('Bearer ', '');
    console.log('🎫 Token extracted, length:', token.length);
    
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // Not needed for this operation
    });

    console.log('📊 Fetching characters from database...');
    const { data: characters, error } = await supabase
      .from('characters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('💥 Database error:', error);
      return new Response('Error fetching characters', { status: 500 });
    }

    console.log('✅ Characters fetched successfully:', characters?.length || 0);
    return Response.json(characters);
  } catch (error) {
    console.error('💥 API Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('📥 POST /api/characters - Request received');
    
    const authHeader = request.headers.get('Authorization');
    console.log('🔐 Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🎫 Token extracted, length:', token.length);
    
    // Get user from token
    console.log('👤 Getting user from token...');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('💥 Auth error:', authError);
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    // Parse request body
    console.log('📋 Parsing request body...');
    const body = await request.json();
    console.log('📦 Request body received:', {
      name: body.name,
      class_name: body.class_name,
      level: body.level,
      user_id: user.id
    });

    const characterData: CharacterInsert = {
      ...body,
      user_id: user.id,
    };

    console.log('💾 Inserting character into database...');
    const { data: character, error } = await supabase
      .from('characters')
      .insert(characterData)
      .select()
      .single();

    if (error) {
      console.error('💥 Database insert error:', error);
      return new Response(`Database error: ${error.message}`, { status: 500 });
    }

    console.log('✅ Character created successfully:', character.name);
    return Response.json(character);
  } catch (error) {
    console.error('💥 API Error:', error);
    return new Response(`Internal server error: ${error.message}`, { status: 500 });
  }
}