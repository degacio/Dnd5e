/*
  # Fix remaining RLS policy performance issue

  1. Changes
    - Drop the existing "User can delete own character" policy that still uses auth.uid() directly
    - This policy appears to be a duplicate or leftover from previous migrations
    - Ensure all policies use the optimized (select auth.uid()) pattern

  2. Security
    - Maintains the same security level
    - Improves query performance by evaluating auth.uid() only once per query
    - Resolves the Supabase performance warning
*/

-- Drop any remaining policies that might be using the old pattern
DROP POLICY IF EXISTS "User can delete own character" ON characters;

-- Ensure we have the correct optimized policies (these should already exist from previous migration)
-- But we'll recreate them to be absolutely sure they use the optimized pattern

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can create own characters" ON characters;
DROP POLICY IF EXISTS "Users can read own characters" ON characters;
DROP POLICY IF EXISTS "Users can update own characters" ON characters;
DROP POLICY IF EXISTS "Users can delete own characters" ON characters;

-- Create optimized INSERT policy
CREATE POLICY "Users can create own characters"
  ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- Create optimized SELECT policy
CREATE POLICY "Users can read own characters"
  ON characters
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Create optimized UPDATE policy
CREATE POLICY "Users can update own characters"
  ON characters
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Create optimized DELETE policy
CREATE POLICY "Users can delete own characters"
  ON characters
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);