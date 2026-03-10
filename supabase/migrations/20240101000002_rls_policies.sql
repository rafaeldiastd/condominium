-- ============================================================
-- CONDOMIINUS - Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.condominiums        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_condominiums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────
-- HELPER FUNCTIONS
-- ─────────────────────────────────────────

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

-- ─────────────────────────────────────────
-- CONDOMINIUMS
-- ─────────────────────────────────────────
-- Anyone authenticated can read active condominiums (for slug resolution)
CREATE POLICY "condominiums_select_active"
  ON public.condominiums FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_super_admin());

-- Only super_admin can insert/update/delete
CREATE POLICY "condominiums_admin_all"
  ON public.condominiums FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ─────────────────────────────────────────
-- PROFILES
-- ─────────────────────────────────────────
-- Users can read profiles from their own condominium
CREATE POLICY "profiles_select_same_condo"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    condominium_id = public.get_user_condominium_id()
    OR id = (select auth.uid())
    OR public.is_super_admin()
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() 
    AND role = public.get_user_role()
  );

-- Syndics can update profiles in their condominium (for ban)
CREATE POLICY "profiles_syndic_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    condominium_id = public.get_user_condominium_id()
    AND public.is_syndic_of(condominium_id)
  );

-- Service role can insert (for Edge Functions creating users)
CREATE POLICY "profiles_insert_service"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = (select auth.uid()) OR public.is_super_admin());

-- ─────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────
CREATE POLICY "categories_select_all"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "categories_admin_write"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ─────────────────────────────────────────
-- ANNOUNCEMENTS
-- ─────────────────────────────────────────
-- Residents see active announcements in their condominium
CREATE POLICY "announcements_resident_select"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    condominium_id = public.get_user_condominium_id()
    AND status IN ('active', 'sold')
    AND NOT public.is_banned_user()
  );

-- Syndics see all announcements in their condominium (including hidden/deleted)
CREATE POLICY "announcements_syndic_select"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    public.is_syndic_of(condominium_id)
  );

-- Super admin sees all
CREATE POLICY "announcements_admin_select"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- Authors can insert their own announcements
CREATE POLICY "announcements_insert_own"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = (select auth.uid())
    AND condominium_id = public.get_user_condominium_id()
    AND NOT public.is_banned_user()
  );

-- Authors can update their own announcements; syndics can update in their condo
CREATE POLICY "announcements_update_own"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (
    author_id = (select auth.uid())
    OR public.is_syndic_of(condominium_id)
  );

-- Authors can soft-delete their own; syndics can delete in their condo
CREATE POLICY "announcements_delete_own"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (
    author_id = (select auth.uid())
    OR public.is_syndic_of(condominium_id)
  );

-- ─────────────────────────────────────────
-- ANNOUNCEMENT IMAGES
-- ─────────────────────────────────────────
-- Images follow same visibility as announcements
CREATE POLICY "announcement_images_select"
  ON public.announcement_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_id
        AND (
          (a.condominium_id = public.get_user_condominium_id() AND a.status IN ('active','sold'))
          OR public.is_syndic_of(a.condominium_id)
        )
    )
  );

CREATE POLICY "announcement_images_insert"
  ON public.announcement_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_id AND a.author_id = (select auth.uid())
    )
  );

CREATE POLICY "announcement_images_delete"
  ON public.announcement_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_id
        AND (a.author_id = (select auth.uid()) OR public.is_syndic_of(a.condominium_id))
    )
  );

-- ─────────────────────────────────────────
-- FAVORITES
-- ─────────────────────────────────────────
CREATE POLICY "favorites_own"
  ON public.favorites FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ─────────────────────────────────────────
-- REPORTS
-- ─────────────────────────────────────────
-- Users can insert reports
CREATE POLICY "reports_insert"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (reporter_id = (select auth.uid()) AND NOT public.is_banned_user());

-- Syndics see reports for their condominium
CREATE POLICY "reports_syndic_select"
  ON public.reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_id AND public.is_syndic_of(a.condominium_id)
    )
  );

-- Syndics can update report status
CREATE POLICY "reports_syndic_update"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_id AND public.is_syndic_of(a.condominium_id)
    )
  );

-- ─────────────────────────────────────────
-- CONVERSATIONS
-- ─────────────────────────────────────────
CREATE POLICY "conversations_participants"
  ON public.conversations FOR ALL
  TO authenticated
  USING (participant_a = (select auth.uid()) OR participant_b = (select auth.uid()))
  WITH CHECK (participant_a = (select auth.uid()) OR participant_b = (select auth.uid()));

-- ─────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────
CREATE POLICY "messages_participants"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_a = (select auth.uid()) OR c.participant_b = (select auth.uid()))
    )
  );

CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_a = (select auth.uid()) OR c.participant_b = (select auth.uid()))
    )
  );

CREATE POLICY "messages_update_read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_a = (select auth.uid()) OR c.participant_b = (select auth.uid()))
    )
  );

-- ─────────────────────────────────────────
-- CAMPAIGNS
-- ─────────────────────────────────────────
-- Users see active campaigns for their condominium
CREATE POLICY "campaigns_resident_select"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND starts_at <= now()
    AND ends_at >= now()
    AND EXISTS (
      SELECT 1 FROM public.campaign_condominiums cc
      WHERE cc.campaign_id = id
        AND cc.condominium_id = public.get_user_condominium_id()
    )
  );

-- Admin sees all campaigns
CREATE POLICY "campaigns_admin_all"
  ON public.campaigns FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "campaign_condominiums_select"
  ON public.campaign_condominiums FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "campaign_condominiums_admin"
  ON public.campaign_condominiums FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE POLICY "notifications_own"
  ON public.notifications FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));
