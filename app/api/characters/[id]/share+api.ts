// Helper function to determine error type and create appropriate response
function createErrorResponse(error: any, operation: string) {
  console.error(`${operation} error:`, error);
  
  // Check for network/connectivity errors
  if (error.message && (
    error.message.includes('fetch failed') ||
    error.message.includes('network error') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('timeout')
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
  
  // Tratamento específico para erros de dependência do banco (exclusões bloqueadas por triggers/funções)
  if (error.message && (
    error.message.includes('depends on') ||
    error.message.includes('cannot drop') ||
    error.message.includes('trigger') ||
    error.message.includes('relation')
  )) {
    return new Response(JSON.stringify({
      error: 'Erro de dependência no banco de dados',
      message: 'Essa exclusão não é possível porque há outras partes do sistema que dependem deste recurso.',
      type: 'constraint_error',
      troubleshooting: [
        'Verifique se há gatilhos (triggers), funções ou relações que usam esse recurso',
        'Evite deletar diretamente funções ou tabelas vinculadas a outras',
        'Considere excluir os recursos dependentes primeiro ou usar DROP ... CASCADE com cautela',
        'Consulte o administrador do banco de dados se necessário'
      ],
      timestamp: new Date().toISOString(),
      technical_details: error.message
    }), {
      status: 400,
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
