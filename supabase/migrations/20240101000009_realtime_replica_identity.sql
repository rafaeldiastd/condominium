-- ============================================================
-- CONDOMIINUS - Realtime: Replica Identity Full
-- ============================================================
-- postgres_changes filters on non-PK columns (e.g. conversation_id,
-- participant_a, participant_b) require REPLICA IDENTITY FULL.
-- Without this, Supabase silently drops all filtered events.
-- ============================================================

ALTER TABLE public.messages       REPLICA IDENTITY FULL;
ALTER TABLE public.conversations  REPLICA IDENTITY FULL;
