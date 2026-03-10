-- ============================================================
-- CONDOMIINUS - Storage Buckets
-- ============================================================

-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('announcement-images', 'announcement-images', true, 5242880, ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('campaign-images', 'campaign-images', true, 10485760, ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────
-- announcement-images policies
-- ─────────────────────────────────────────
CREATE POLICY "announcement_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'announcement-images');

CREATE POLICY "announcement_images_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'announcement-images'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "announcement_images_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'announcement-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "announcement_images_owner_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'announcement-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────
-- avatars policies
-- ─────────────────────────────────────────
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_owner_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────
-- campaign-images policies
-- ─────────────────────────────────────────
CREATE POLICY "campaign_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-images');

CREATE POLICY "campaign_images_admin_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'campaign-images'
    AND public.is_super_admin()
  );

CREATE POLICY "campaign_images_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'campaign-images'
    AND public.is_super_admin()
  );
