-- ============================================================
-- CONDOMIINUS - Functions & Triggers
-- ============================================================

-- ─────────────────────────────────────────
-- update_updated_at trigger function
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to tables with updated_at
CREATE TRIGGER condominiums_updated_at
  BEFORE UPDATE ON public.condominiums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────
-- handle_new_user trigger
-- Automatically creates a profile when a user signs up
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    condominium_id
  ) VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1),
      'Usuário'
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'resident'),
    CASE
      WHEN NEW.raw_user_meta_data->>'condominium_id' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'condominium_id')::uuid
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────
-- increment_announcement_views
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_announcement_views(announcement_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.announcements
  SET views_count = views_count + 1
  WHERE id = announcement_id AND status = 'active';
$$;

-- ─────────────────────────────────────────
-- update_conversation_last_message
-- Updates last_message_at when a new message is inserted
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_message_inserted
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- ─────────────────────────────────────────
-- get_unread_message_count
-- Returns unread message count for a user in a conversation
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_unread_message_count(conv_id uuid, user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.messages m
  JOIN public.conversations c ON c.id = m.conversation_id
  WHERE m.conversation_id = conv_id
    AND m.sender_id != user_id
    AND m.is_read = false
    AND (c.participant_a = user_id OR c.participant_b = user_id);
$$;
