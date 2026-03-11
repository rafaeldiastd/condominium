-- ============================================================
-- Condomiinus: Ad Messaging & Lifecycle Migration
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Blocked users table
-- Allows ad owners to permanently block contacts.
CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- Only the blocker can see OR manage their own blocks
CREATE POLICY "Users manage their own blocks"
  ON public.blocked_users
  FOR ALL
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

-- Ad owners must be able to check if they've blocked someone,
-- but also: the blocked person needs to check if THEY are blocked by the owner.
-- Allow reading rows where the current user is EITHER the blocker OR the blocked.
DROP POLICY IF EXISTS "Users manage their own blocks" ON public.blocked_users;

CREATE POLICY "Blocker can manage, blocked can read"
  ON public.blocked_users
  FOR SELECT
  USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

CREATE POLICY "Blocker can insert"
  ON public.blocked_users
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Blocker can delete"
  ON public.blocked_users
  FOR DELETE
  USING (auth.uid() = blocker_id);


-- 2. Ad metrics snapshots table
-- Persists metrics data before an announcement is permanently deleted via "Encerrar".
CREATE TABLE IF NOT EXISTS public.ad_metrics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL,          -- intentionally NOT a FK (the ad is deleted)
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text,
  type text,
  category_id uuid,
  price numeric,
  views_count integer DEFAULT 0,
  conversation_count integer DEFAULT 0,
  closed_at timestamptz DEFAULT now(),
  created_at timestamptz                  -- original ad creation date
);

ALTER TABLE public.ad_metrics_snapshots ENABLE ROW LEVEL SECURITY;

-- Author can read their own snapshots (used for reporting / history)
CREATE POLICY "Author can read own snapshots"
  ON public.ad_metrics_snapshots
  FOR SELECT
  USING (auth.uid() = author_id);

-- Author snapshot is inserted by the app on their behalf
CREATE POLICY "Author can insert own snapshots"
  ON public.ad_metrics_snapshots
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- ============================================================
-- Done! Verify with:
-- SELECT * FROM public.blocked_users LIMIT 5;
-- SELECT * FROM public.ad_metrics_snapshots LIMIT 5;
-- ============================================================
