import { supabaseAdmin, testSupabaseAdminConnection, executeWithRecovery } from '@/lib/supabaseAdmin';

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

// Enhanced error response function with better diagnostics and user-friendly messages
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
    error.message.includes('NetworkError') ||
    error.message.includes('Connection timeout') ||
    error.message.includes('Network connection failed') ||
    error.message.includes('other side closed') ||
    error.message.includes('Connection refused') ||
    error.message.includes('DNS resolution failed') ||
    error.message.includes('Circuit breaker')
  )) {
    return new Response(JSON.stringify({ 
      error: 'Erro de conexão temporário',
      message: 'Problema temporário de conexão com o banco de dados. O sistema está tentando se recuperar automaticamente.',
      type: 'network_error',
      troubleshooting: [
        'Aguarde alguns segundos e tente novamente',
        'O sistema possui recuperação automática para problemas de rede',
        'Verifique sua conexão com a internet se o problema persistir',
        'Confirme se o projeto Supabase está ativo (não pausado)',
        'Tente recarregar a página se necessário',
        'Use a aba "Testes" para diagnósticos detalhados'
      ],
      timestamp: new Date().toISOString(),
      technical_details: error.message,
      recovery_info: 'O sistema tentará se recuperar automaticamente em alguns segundos'
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
    error.message.includes('Invalid project') ||
    error.message.includes('service role key')
  )) {
    return new Response(JSON.stringify({ 
      error: 'Erro de configuração',
      message: 'Configuração do banco de dados inválida. Verifique as variáveis de ambiente.',
      type: 'config_error',
      troubleshooting: [
        'Verifique EXPO_PUBLIC_SUPABASE_URL no arquivo .env',
        'Verifique SUPABASE_SERVICE_ROLE_KEY no arquivo .env',
        'Confirme se as chaves correspondem ao seu projeto Supabase',
        'Regenere as chaves se necessário no painel do Supabase'
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

// Enhanced connection test function with detailed logging
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection before operation...');
    const result = await testSupabaseAdminConnection();
    if (!result.success) {
      console.error('❌ Database connection test failed:', result.error);
      throw new Error(`Database connection failed: ${result.error}. Troubleshooting: ${result.troubleshooting?.join(', ')}`);
    }
    console.log('✅ Database connection test passed');
    return true;
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
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

    // Query the specific character with enhanced recovery
    const queryOperation = async () => {
      const { data, error } = await supabaseAdmin
        .from('characters')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    };

    try {
      const character = await executeWithRecovery(queryOperation, 'Character query');
      
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
    } catch (queryError) {
      return createErrorResponse(queryError, 'Database query');
    }
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

    // Update the character with enhanced recovery
    const updateOperation = async () => {
      const { data, error } = await supabaseAdmin
        .from('characters')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    };

    try {
      const character = await executeWithRecovery(updateOperation, 'Character update');
      
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
    } catch (updateError) {
      return createErrorResponse(updateError, 'Database update');
    }
  } catch (error) {
    console.error('API Error:', error);
    return createErrorResponse(error, 'API request');
  }
}

export async function DELETE(request: Request, { id }: { id: string }) {
  try {
    console.log('🗑️  DELETE request received for character:', id);
    
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not available');
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

    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
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

    console.log('🔐 Validating user token...');
    const { user, error: authError } = await validateUserFromToken(authHeader);

    if (authError || !user) {
      console.error('❌ User validation failed:', authError);
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

    console.log('✅ User validated:', user.id);

    // Verify character exists and belongs to user before deletion with enhanced recovery
    console.log(`🔍 Verifying character ${id} exists and belongs to user ${user.id}...`);
    
    const verifyOperation = async () => {
      const { data, error } = await supabaseAdmin
        .from('characters')
        .select('id, name')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      return data;
    };
    
    try {
      const existingCharacter = await executeWithRecovery(verifyOperation, 'Character verification');
      
      if (!existingCharacter) {
        console.error('❌ Character not found or access denied');
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
    } catch (verifyError) {
      console.error('❌ Character verification failed:', verifyError);
      return createErrorResponse(verifyError, 'Character verification');
    }

    // Perform the deletion with enhanced error handling and recovery
    console.log(`🗑️  Attempting to delete character ${id}...`);
    
    const deleteOperation = async () => {
      const { error } = await supabaseAdmin
        .from('characters')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
      
      return true;
    };

    try {
      await executeWithRecovery(deleteOperation, 'Character deletion');
      
      console.log('✅ Character deleted successfully');
      return new Response(JSON.stringify({ 
        message: 'Personagem excluído com sucesso',
        success: true,
        timestamp: new Date().toISOString()
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (deleteError) {
      console.error('❌ Character deletion failed:', deleteError);
      return createErrorResponse(deleteError, 'Database delete');
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    return createErrorResponse(error, 'API request');
  }
}