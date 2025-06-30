/*
  # Corrigir múltiplas políticas SELECT permissivas

  1. Problema
    - Existem duas políticas permissivas para SELECT: "Token-based read access" e "Users can read own characters"
    - Isso pode causar problemas de performance e comportamento inesperado

  2. Solução
    - Combinar as duas políticas em uma única política mais eficiente
    - Usar OR logic para permitir tanto acesso por token quanto acesso do próprio usuário
    - Manter a mesma funcionalidade mas com melhor performance

  3. Segurança
    - Mantém exatamente a mesma funcionalidade de segurança
    - Usuários autenticados podem ver seus próprios personagens
    - Acesso anônimo via token de compartilhamento continua funcionando
*/

-- Drop the existing SELECT policies
DROP POLICY IF EXISTS "Token-based read access" ON characters;
DROP POLICY IF EXISTS "Users can read own characters" ON characters;

-- Create a single combined SELECT policy that handles both cases
CREATE POLICY "Combined read access"
  ON characters
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Allow token-based access (for sharing with DMs)
    (share_token IS NOT NULL AND token_expires_at > now())
    OR
    -- Allow authenticated users to read their own characters
    ((select auth.uid()) = user_id)
  );