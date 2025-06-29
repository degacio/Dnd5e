import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

// Helper function to determine error type and create appropriate response
function createErrorResponse(error: any, operation: string) {
  console.error(`${operation} error:`, error);
  
  // Check for network/connectivity errors
  if (error.message && (
    error.message.includes('fetch failed') ||
    error.message.includes('network error') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('timeout') ||
    error.message.includes('TypeError: fetch failed')
  )) {
    return new Response(JSON.stringify({ 
      error: 'Erro de conexão',
      message: 'Falha na comunicação com o servidor do banco de dados. Verifique sua conexão e tente novamente.',
      type: 'network_error'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Check for authentication/permission errors
  if (error.message && (
    error.message.includes('JWT') ||
    error.message.includes('authentication') ||
    error.message.includes('permission')
  )) {
    return new Response(JSON.stringify({ 
      error: 'Erro de autenticação',
      message: 'Sessão expirada ou sem permissão. Faça login novamente.',
      type: 'auth_error'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Generic database error
  return new Response(JSON.stringify({ 
    error: 'Erro no banco de dados',
    message: error.message || 'Erro interno do servidor. Tente novamente em alguns instantes.',
    details: error.details,
    type: 'database_error'
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function GET(request: Request, { id }: { id: string }) {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Erro de configuração do servidor',
        message: 'Configuração do servidor indisponível. Tente novamente mais tarde.',
        type: 'server_error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Erro de autorização',
        message: 'Token de autorização inválido ou ausente.',
        type: 'auth_error'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Erro de autenticação',
        message: 'Falha na autenticação. Faça login novamente.',
        details: authError?.message || 'Token inválido',
        type: 'auth_error'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Query the specific character
    const { data: character, error } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return createErrorResponse(error, 'Database query');
    }

    if (!character) {
      return new Response(JSON.stringify({ 
        error: 'Personagem não encontrado',
        message: 'Personagem não encontrado ou você não tem permissão para acessá-lo.',
        type: 'not_found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return Response.json(character);
  } catch (error) {
    console.error('API Error:', error);
    
    // Handle network errors in catch block
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
      return new Response(JSON.stringify({ 
        error: 'Erro de conexão',
        message: 'Falha na comunicação com o servidor. Verifique sua conexão e tente novamente.',
        type: 'network_error'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro inesperado',
      type: 'internal_error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function PUT(request: Request, { id }: { id: string }) {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Erro de configuração do servidor',
        message: 'Configuração do servidor indisponível. Tente novamente mais tarde.',
        type: 'server_error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Erro de autorização',
        message: 'Token de autorização inválido ou ausente.',
        type: 'auth_error'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Erro de autenticação',
        message: 'Falha na autenticação. Faça login novamente.',
        details: authError?.message || 'Token inválido',
        type: 'auth_error'
      }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const updates = await request.json();
    
    // Remove fields that shouldn't be updated directly
    const { id: _, user_id, created_at, ...allowedUpdates } = updates;
    
    // Add updated_at timestamp
    const updateData = {
      ...allowedUpdates,
      updated_at: new Date().toISOString(),
    };

    // Update the character
    const { data: character, error } = await supabaseAdmin
      .from('characters')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      return createErrorResponse(error, 'Database update');
    }

    if (!character) {
      return new Response(JSON.stringify({ 
        error: 'Personagem não encontrado',
        message: 'Personagem não encontrado ou você não tem permissão para atualizá-lo.',
        type: 'not_found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return Response.json(character);
  } catch (error) {
    console.error('API Error:', error);
    
    // Handle network errors in catch block
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
      return new Response(JSON.stringify({ 
        error: 'Erro de conexão',
        message: 'Falha na comunicação com o servidor. Verifique sua conexão e tente novamente.',
        type: 'network_error'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro inesperado',
      type: 'internal_error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Erro de configuração do servidor',
        message: 'Configuração do servidor indisponível. Tente novamente mais tarde.',
        type: 'server_error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Erro de autorização',
        message: 'Token de autorização inválido ou ausente.',
        type: 'auth_error'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: 'Erro de autenticação',
        message: 'Falha na autenticação. Faça login novamente.',
        details: authError?.message || 'Token inválido',
        type: 'auth_error'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test connection before attempting delete
    try {
      const { error: testError } = await supabaseAdmin
        .from('characters')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .limit(1);
      
      if (testError) {
        console.error('Connection test failed:', testError);
        return createErrorResponse(testError, 'Database connection test');
      }
    } catch (testErr) {
      console.error('Connection test error:', testErr);
      return new Response(JSON.stringify({ 
        error: 'Erro de conexão',
        message: 'Não foi possível conectar ao banco de dados. Verifique sua conexão com a internet.',
        type: 'network_error'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete the character
    const { error } = await supabaseAdmin
      .from('characters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return createErrorResponse(error, 'Database delete');
    }

    return new Response(JSON.stringify({ 
      message: 'Personagem excluído com sucesso',
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API Error:', error);
    
    // Handle network errors in catch block
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
      return new Response(JSON.stringify({ 
        error: 'Erro de conexão',
        message: 'Falha na comunicação com o banco de dados. Verifique sua conexão com a internet e tente novamente.',
        type: 'network_error'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      message: 'Erro inesperado ao excluir personagem. Tente novamente em alguns instantes.',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      type: 'internal_error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}