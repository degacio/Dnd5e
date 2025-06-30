/*
  # Fix Function Search Path Security Issue

  1. Security Fix
    - Drop the trigger first to remove dependency
    - Drop and recreate the function with secure search_path
    - Recreate the trigger with the updated function

  2. Changes Made
    - Add SECURITY DEFINER to function
    - Set search_path = public to prevent search path attacks
    - Maintain exact same functionality for updated_at column

  3. Security Benefits
    - Prevents search path manipulation attacks
    - Ensures function always executes in correct schema
    - Follows PostgreSQL security best practices
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

-- Recreate the trigger with the updated function
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();