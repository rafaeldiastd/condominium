-- Allow super_admin to upload condominium logos to avatars/condominiums/
CREATE POLICY "avatars_superadmin_upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND public.is_super_admin()
  );

CREATE POLICY "avatars_superadmin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND public.is_super_admin()
  );