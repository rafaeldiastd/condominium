-- Drop the existing wide-open policy for residents
DROP POLICY IF EXISTS "announcements_resident_select" ON public.announcements;

-- Create new policy: Residents can only see active announcements in their condominium
CREATE POLICY "announcements_resident_select_active"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    condominium_id = public.get_user_condominium_id()
    AND status = 'active'
    AND NOT public.is_banned_user()
  );

-- Create new policy: Authors can see ALL of their own announcements (even sold/closed/hidden)
-- This is necessary so the "My Ads" dashboard can query and display them.
CREATE POLICY "announcements_author_select_all"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (
    author_id = (select auth.uid())
    AND condominium_id = public.get_user_condominium_id()
  );

-- Drop the existing image policy so we can recreate it tightly coupled to the new rules
DROP POLICY IF EXISTS "announcement_images_select" ON public.announcement_images;

-- Recreate image policy:
-- 1. Active announcements (visible to residents)
-- 2. Own announcements (visible to author)
-- 3. Syndic view (all in condo)
CREATE POLICY "announcement_images_select"
  ON public.announcement_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_images.announcement_id
        AND (
          (a.condominium_id = public.get_user_condominium_id() AND a.status = 'active')
          OR a.author_id = (select auth.uid())
          OR public.is_syndic_of(a.condominium_id)
        )
    )
  );
