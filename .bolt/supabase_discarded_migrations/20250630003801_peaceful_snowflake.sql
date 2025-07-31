/*
  # Fix Function Search Path Security Issue

  1. Security Fix
    - Drop the existing update_updated_at_column function
    - Recreate it with a secure, immutable search_path
    - This prevents potential security vulnerabilities from search_path manipulation

  2. Function Details
    - Sets search_path to 'public' explicitly for security
    - Maintains the same functionality for updating updated_at timestamps
    - Uses SECURITY DEFINER with restricted search_path for safety
*/

-- Drop the existing function
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

-- Ensure the trigger still exists and is properly configured
-- (This should already exist, but we'll recreate it to be safe)
DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();