/*
  # Fix update_updated_at_column function with proper security

  1. Security Enhancement
    - Drop and recreate the update_updated_at_column function with SECURITY DEFINER
    - Set explicit search_path to prevent security vulnerabilities
    - Ensure trigger is properly configured

  2. Changes Made
    - Drop trigger first to remove dependency
    - Drop and recreate function with security settings
    - Recreate trigger with proper configuration
*/

-- Drop the trigger first to remove dependency on the function
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