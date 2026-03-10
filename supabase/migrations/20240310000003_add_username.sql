-- Add username column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username text;

-- Add partial unique index to ensure usernames are unique per condominium, but allow nulls
CREATE UNIQUE INDEX IF NOT EXISTS profiles_condominium_id_username_idx ON profiles (condominium_id, username) WHERE username IS NOT NULL;

-- Create an RPC function to check username availability
CREATE OR REPLACE FUNCTION check_username_available(
  p_username text, 
  p_condominium_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE username = p_username 
    AND condominium_id = p_condominium_id
  ) INTO v_exists;
  
  RETURN NOT v_exists;
END;
$$;
