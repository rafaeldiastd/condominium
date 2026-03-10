-- ============================================================
-- Fix the profiles RLS update policy for the Profile Edit feature
-- ============================================================

-- Drop the faulty policy because it is invoking get_user_role() which selects from profiles
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Instead of a check that reads from the same table (which causes Infinite Recursion), 
-- let's use a trigger to prevent users from escalating their own privileges
-- and create a simpler update policy that only checks the ID

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Trigger to prevent role and ban escalation by the user themselves
CREATE OR REPLACE FUNCTION public.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o cara que tá rodando a query é o dono do perfil e NÃO é super admin ou sindico que tá alterando via admin panel (banned_by)
  -- We just check if they are trying to change role or is_banned
  IF auth.uid() = OLD.id AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('super_admin')
  ) THEN
    -- Prevent escalation
    NEW.role = OLD.role;
    NEW.is_banned = OLD.is_banned;
    NEW.banned_at = OLD.banned_at;
    NEW.banned_by = OLD.banned_by;
    NEW.ban_reason = OLD.ban_reason;
    -- Condominium shouldn't be changeable by standard users, nor should email directly here
    NEW.condominium_id = OLD.condominium_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_protect_profile_fields ON public.profiles;
CREATE TRIGGER trigger_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_fields();
