/*
  # Fix Characters Table RLS Policies for Insert Operations

  1. Problem
    - INSERT operations with RETURNING clause are not returning data
    - This affects the API's ability to return the created character
    - Current policies may be interfering with admin operations

  2. Solution
    - Update the INSERT policy to ensure it allows data to be returned
    - Ensure the policy works correctly with both regular users and admin operations
    - Add explicit policy for SELECT operations during INSERT

  3. Changes
    - Drop and recreate the INSERT policy with proper RETURNING support
    - Ensure policies work with service role operations
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create own characters" ON characters;

-- Create new INSERT policy that properly handles RETURNING clause
CREATE POLICY "Users can create own characters"
  ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Ensure the SELECT policy allows reading newly inserted data
DROP POLICY IF EXISTS "Combined read access" ON characters;

CREATE POLICY "Combined read access"
  ON characters
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Allow access if user owns the character
    (auth.uid() = user_id) OR
    -- Allow access via valid share token
    (share_token IS NOT NULL AND token_expires_at > now())
  );

-- Grant necessary permissions to ensure service role can perform operations
GRANT ALL ON characters TO service_role;