import { supabaseAdmin, testSupabaseAdminConnection } from '@/lib/supabaseAdmin';

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

// Enhanced error response function with better diagnostics
function createErrorResponse(error: any, operation: string) {
  console.error(`${operation} error:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
    stack: error.stack
  });
  
  // Check for network/connectivity errors with more specific detection
  if (error.message && (
    error.message.includes('fetch failed') ||
    error.message.includes('network error') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('timeout') ||
    error.message.includes('TypeError: fetch failed') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError')
  )) {
    return new Response(JSON.stringify({ 
      error: 'Erro de conexão com o banco de dados',
      message: 'Não foi possível conectar ao banco de dados. Verifique sua conexão com a internet e tente novamente.',
      type: 'network_error',
      troubleshooting: [
        'Verifique sua conexão com a internet',
        'Confirme se o projeto Supabase está ativo',
        'Use a aba "Testes" para diagnósticos detalhados',
        'Verifique as configurações de firewall/proxy'
      ],
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Check for authentication/permission errors
  if (error.message && (
    error.message.includes('JWT') ||
    error.message.includes('authentication') ||
    error.message.includes('permission') ||
    error.message.includes('unauthorized') ||
    error.code === '401'
  )) {
    return new Response(JSON.stringify({ 
      error: 'Erro de autenticação',
      message: 'Sessão expirada ou sem permissão. Faça login novamente.',
      type: 'auth_error',
      timestamp: new Date().toISOString()
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Check for configuration errors
  if (error.message && (
    error.message.includes('Invalid API key') ||
    error.message.includes('Project not found') ||
    error.message.includes('Invalid project')
  )) {
    return new Response(JSON.stringify({ 
      error: 'Erro de configuração',
      message: 'Configuração do banco de dados inválida. Verifique as variáveis de ambiente.',
      type: 'config_error',
      troubleshooting: [
        'Verifique EXPO_PUBLIC_SUPABASE_URL no arquivo .env',
        'Verifique SUPABASE_SERVICE_ROLE_KEY no arquivo .env',
        'Confirme se as chaves correspondem ao seu projeto Supabase'
      ],
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Generic database error
  return new Response(JSON.stringify({ 
    error: 'Erro no banco de dados',
    message: error.message || 'Erro interno do servidor. Tente novamente em alguns instantes.',
    details: error.details,
    type: 'database_error',
    timestamp: new Date().toISOString()
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Enhanced connection test function
async function testDatabaseConnection() {
  try {
    const result = await testSupabaseAdminConnection();
    if (!result.success) {
      throw new Error(`Database connection failed: ${result.error}`);
    }
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    throw error;
  }
}

export async function GET(request: Request, { id }: { id: string }) {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Erro de configuração do servidor',
        message: 'Configuração do servidor indisponível. Tente novamente mais tarde.',
        type: 'server_error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test connection before proceeding
    try {
      await testDatabaseConnection();
    } catch (connError) {
      return createErrorResponse(connError, 'Database connection test');
    }

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Erro de autorização',
        message: 'Token de autorização inválido ou ausente.',
        type: 'auth_error',
        timestamp: new Date().toISOString()
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
        type: 'auth_error',
        timestamp: new Date().toISOString()
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
        type: 'not_found',
        timestamp: new Date().toISOString()
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return Response.json(character);
  } catch (error) {
    console.error('API Error:', error);
    return createErrorResponse(error, 'API request');
  }
}

export async function PUT(request: Request, { id }: { id: string }) {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Erro de configuração do servidor',
        message: 'Configuração do servidor indisponível. Tente novamente mais tarde.',
        type: 'server_error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Test connection before proceeding
    try {
      await testDatabaseConnection();
    } catch (connError) {
      return createErrorResponse(connError, 'Database connection test');
    }

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Erro de autorização',
        message: 'Token de autorização inválido ou ausente.',
        type: 'auth_error',
        timestamp: new Date().toISOString()
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
        type: 'auth_error',
        timestamp: new Date().toISOString()
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
        type: 'not_found',
        timestamp: new Date().toISOString()
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return Response.json(character);
  } catch (error) {
    console.error('API Error:', error);
    return createErrorResponse(error, 'API request');
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    if (!supabaseAdmin) {
      return new Response(JSON.stringify({ 
        error: 'Erro de configuração do servidor',
        message: 'Configuração do servidor indisponível. Tente novamente mais tarde.',
        type: 'server_error',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Enhanced connection test before proceeding with delete operation
    console.log('🔍 Testing database connection before delete operation...');
    try {
      await testDatabaseConnection();
      console.log('✅ Database connection test passed');
    } catch (connError) {
      console.error('❌ Database connection test failed:', connError);
      return createErrorResponse(connError, 'Database connection test');
    }

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ 
        error: 'Erro de autorização',
        message: 'Token de autorização inválido ou ausente.',
        type: 'auth_error',
        timestamp: new Date().toISOString()
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
        type: 'auth_error',
        timestamp: new Date().toISOString()
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify character exists and belongs to user before deletion
    console.log(`🔍 Verifying character ${id} exists and belongs to user ${user.id}...`);
    try {
      const { data: existingCharacter, error: checkError } = await supabaseAdmin
        .from('characters')
        .select('id, name')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (checkError) {
        console.error('❌ Character verification failed:', checkError);
        return createErrorResponse(checkError, 'Character verification');
      }
      
      if (!existingCharacter) {
        return new Response(JSON.stringify({ 
          error: 'Personagem não encontrado',
          message: 'Personagem não encontrado ou você não tem permissão para excluí-lo.',
          type: 'not_found',
          timestamp: new Date().toISOString()
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      console.log(`✅ Character verified: ${existingCharacter.name}`);
    } catch (verifyErr) {
      console.error('❌ Character verification error:', verifyErr);
      return createErrorResponse(verifyErr, 'Character verification');
    }

    // Perform the deletion
    console.log(`🗑️  Attempting to delete character ${id}...`);
    const { error: deleteError } = await supabaseAdmin
      .from('characters')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('❌ Character deletion failed:', deleteError);
      return createErrorResponse(deleteError, 'Database delete');
    }

    console.log('✅ Character deleted successfully');
    return new Response(JSON.stringify({ 
      message: 'Personagem excluído com sucesso',
      success: true,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('❌ API Error:', error);
    return createErrorResponse(error, 'API request');
  }
}