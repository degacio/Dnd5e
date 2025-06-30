/*
  # Fix update_updated_at_column function security

  1. Security Enhancement
    - Drop existing trigger first to avoid dependency issues
    - Recreate the update_updated_at_column function with secure search_path
    - Recreate the trigger with proper configuration

  2. Changes Made
    - Added SECURITY DEFINER and explicit search_path to function
    - Ensures function runs with creator's privileges and secure schema access
    - Maintains existing functionality while improving security
*/

-- Drop the trigger first to remove dependency
DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;

-- Now we can safely drop the function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate the function with secure search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();