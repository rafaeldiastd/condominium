-- ============================================================
-- CONDOMIINUS - Follows + Contact Type on Announcements
-- ============================================================

-- ─────────────────────────────────────────
-- FOLLOWS (morador segue outro morador)
-- ─────────────────────────────────────────
CREATE TABLE public.follows (
  follower_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  followed_id   uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CONSTRAINT no_self_follow CHECK (follower_id != followed_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_followed ON public.follows(followed_id);

-- ─────────────────────────────────────────
-- RLS - FOLLOWS
-- ─────────────────────────────────────────
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Qualquer autenticado pode ver quem segue quem (dentro do mesmo condo)
CREATE POLICY "follows_select" ON public.follows
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Só pode seguir sendo você mesmo
CREATE POLICY "follows_insert" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Só pode deixar de seguir sendo você mesmo
CREATE POLICY "follows_delete" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ─────────────────────────────────────────
-- CONTACT TYPE em announcements
-- ─────────────────────────────────────────
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS contact_type      text DEFAULT 'chat'
    CHECK (contact_type IN ('chat', 'whatsapp')),
  ADD COLUMN IF NOT EXISTS contact_whatsapp  text;
