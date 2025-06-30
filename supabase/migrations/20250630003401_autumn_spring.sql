/*
  # Otimizar políticas RLS para melhor performance

  1. Mudanças de Performance
    - Substituir auth.uid() por (select auth.uid()) em todas as políticas
    - Isso evita re-avaliação da função para cada linha
    - Melhora significativamente a performance em consultas com muitos registros

  2. Políticas Afetadas
    - Users can create own characters
    - Users can read own characters  
    - Users can update own characters
    - Users can delete own characters

  3. Funcionalidade
    - Mantém exatamente a mesma funcionalidade de segurança
    - Apenas otimiza a performance das consultas
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create own characters" ON characters;
DROP POLICY IF EXISTS "Users can read own characters" ON characters;
DROP POLICY IF EXISTS "Users can update own characters" ON characters;
DROP POLICY IF EXISTS "Users can delete own characters" ON characters;

-- Create optimized INSERT policy for authenticated users
CREATE POLICY "Users can create own characters"
  ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Create optimized SELECT policy for authenticated users
CREATE POLICY "Users can read own characters"
  ON characters
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Create optimized UPDATE policy for authenticated users
CREATE POLICY "Users can update own characters"
  ON characters
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Create optimized DELETE policy for authenticated users
CREATE POLICY "Users can delete own characters"
  ON characters
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);