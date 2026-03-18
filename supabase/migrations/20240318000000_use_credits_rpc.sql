-- Description: Adds an RPC function to atomically handle credit usage and transactions.

-- 0. Ensure schema is updated (Fixes PGRST204)
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS duration_days integer;

CREATE OR REPLACE FUNCTION public.use_advertiser_credits(
    p_amount decimal(10,2),
    p_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass direct table RLS
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
    v_current_balance decimal(10,2);
BEGIN
    -- 1. Get current user ID
    v_profile_id := auth.uid();
    
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- 2. Get and lock current balance
    SELECT balance INTO v_current_balance
    FROM public.advertiser_credits
    WHERE profile_id = v_profile_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Conta de créditos não encontrada';
    END IF;

    -- 3. Check sufficiency
    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Saldo insuficiente (Possui %, necessário %)', v_current_balance, p_amount;
    END IF;

    -- 4. Deduct balance
    UPDATE public.advertiser_credits
    SET 
        balance = balance - p_amount,
        updated_at = now()
    WHERE profile_id = v_profile_id;

    -- 5. Record transaction
    INSERT INTO public.credit_transactions (
        profile_id,
        amount,
        type,
        description
    ) VALUES (
        v_profile_id,
        -p_amount,
        'usage',
        p_description
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_advertiser_credits(
    p_amount decimal(10,2),
    p_description text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id uuid;
BEGIN
    v_profile_id := auth.uid();
    
    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- 1. Increase balance
    UPDATE public.advertiser_credits
    SET 
        balance = balance + p_amount,
        updated_at = now()
    WHERE profile_id = v_profile_id;

    -- 2. Record transaction
    INSERT INTO public.credit_transactions (
        profile_id,
        amount,
        type,
        description
    ) VALUES (
        v_profile_id,
        p_amount,
        'refund',
        p_description
    );
END;
$$;

-- Grant access to the functions
GRANT EXECUTE ON FUNCTION public.use_advertiser_credits(decimal, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_advertiser_credits(decimal, text) TO authenticated;

-- 2. Update Announcements RLS for Advertisers
-- Existing announcements_insert_own is too restrictive for advertisers (requires them to have a fixed condominium_id).
-- We add a specific policy for the advertiser role.
DROP POLICY IF EXISTS "announcements_advertiser_insert" ON public.announcements;

CREATE POLICY "announcements_advertiser_insert"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'advertiser'
    AND author_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.condominiums
        WHERE id = condominium_id AND is_active = true
    )
    AND NOT public.is_banned_user()
  );
