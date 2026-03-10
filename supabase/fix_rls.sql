-- ============================================================
-- Correção do Erro "Infinite Recursion detected in policy for relation profiles"
-- ============================================================
-- O erro 42P17 acontece por PostgreSQL tentar dar 'inline' (misturar a lógica) 
-- em funções LANGUAGE 'sql' definidas como SECURITY DEFINER durante chamadas de Policies, 
-- o que acaba invocando a policy do profiles dentro da própria policy recursivamente.
--
-- Para resolver, nós forçamos o postgreSQL a não dar inline mudando pra 'plpgsql' e 
-- forçando o search_path pra 'public'. Além disso, criamos a get_user_role() para ser usada 
-- na policy the UPDATE.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_condominium_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  cid uuid;
BEGIN
  SELECT condominium_id INTO cid FROM public.profiles WHERE id = auth.uid();
  RETURN cid;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_syndic_of(condo_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('syndic', 'super_admin')
      AND (condominium_id = condo_id OR role = 'super_admin')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_banned_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  bnd boolean;
BEGIN
  SELECT COALESCE(is_banned, false) INTO bnd FROM public.profiles WHERE id = auth.uid();
  RETURN bnd;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  r text;
BEGIN
  SELECT role INTO r FROM public.profiles WHERE id = auth.uid();
  RETURN r;
END;
$$;

-- Recriar a policy problemática de UPDATE usando a função segura get_user_role()
-- em vez de um SELECT profiles direto no corpo da POLICY
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND role = public.get_user_role()
  );
