-- ============================================================
-- CONDOMIINUS - Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- CONDOMINIUMS
-- ─────────────────────────────────────────
CREATE TABLE public.condominiums (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  name        text NOT NULL,
  address     text,
  city        text,
  state       text,
  country     text DEFAULT 'BR',
  logo_url    text,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────
CREATE TABLE public.profiles (
  id                uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  condominium_id    uuid REFERENCES public.condominiums(id) ON DELETE SET NULL,
  role              text NOT NULL DEFAULT 'resident'
                      CHECK (role IN ('super_admin', 'syndic', 'resident')),
  full_name         text NOT NULL DEFAULT '',
  avatar_url        text,
  unit              text,
  phone             text,
  is_banned         boolean DEFAULT false,
  banned_at         timestamptz,
  banned_by         uuid REFERENCES public.profiles(id),
  ban_reason        text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- ─────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────
CREATE TABLE public.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  icon        text,
  sort_order  int DEFAULT 0
);

-- ─────────────────────────────────────────
-- ANNOUNCEMENTS
-- ─────────────────────────────────────────
CREATE TABLE public.announcements (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  condominium_id    uuid NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  author_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id       uuid NOT NULL REFERENCES public.categories(id),
  type              text NOT NULL
                      CHECK (type IN ('sale','service','donation','donation_request','campaign','event')),
  title             text NOT NULL,
  description       text,
  price             numeric(12,2),
  price_negotiable  boolean DEFAULT false,
  status            text DEFAULT 'active'
                      CHECK (status IN ('active','sold','closed','hidden','deleted')),
  is_featured       boolean DEFAULT false,
  featured_until    timestamptz,
  views_count       int DEFAULT 0,
  event_date        timestamptz,
  event_location    text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_announcements_condominium ON public.announcements(condominium_id);
CREATE INDEX idx_announcements_author     ON public.announcements(author_id);
CREATE INDEX idx_announcements_status     ON public.announcements(status);
CREATE INDEX idx_announcements_type       ON public.announcements(type);
CREATE INDEX idx_announcements_created    ON public.announcements(created_at DESC);

-- ─────────────────────────────────────────
-- ANNOUNCEMENT IMAGES
-- ─────────────────────────────────────────
CREATE TABLE public.announcement_images (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id   uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  storage_path      text NOT NULL,
  url               text NOT NULL,
  sort_order        int DEFAULT 0,
  is_cover          boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_announcement_images_ann ON public.announcement_images(announcement_id);

-- ─────────────────────────────────────────
-- FAVORITES
-- ─────────────────────────────────────────
CREATE TABLE public.favorites (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  announcement_id   uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (user_id, announcement_id)
);

CREATE INDEX idx_favorites_user ON public.favorites(user_id);

-- ─────────────────────────────────────────
-- REPORTS
-- ─────────────────────────────────────────
CREATE TABLE public.reports (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id   uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  reporter_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason            text NOT NULL
                      CHECK (reason IN ('spam','inappropriate','fraud','duplicate','other')),
  description       text,
  status            text DEFAULT 'pending'
                      CHECK (status IN ('pending','reviewed','dismissed')),
  reviewed_by       uuid REFERENCES public.profiles(id),
  reviewed_at       timestamptz,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_reports_announcement ON public.reports(announcement_id);
CREATE INDEX idx_reports_status       ON public.reports(status);

-- ─────────────────────────────────────────
-- CONVERSATIONS
-- ─────────────────────────────────────────
CREATE TABLE public.conversations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id   uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  participant_a     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_b     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at   timestamptz DEFAULT now(),
  created_at        timestamptz DEFAULT now(),
  UNIQUE (announcement_id, participant_a, participant_b)
);

CREATE INDEX idx_conversations_a   ON public.conversations(participant_a);
CREATE INDEX idx_conversations_b   ON public.conversations(participant_b);
CREATE INDEX idx_conversations_msg ON public.conversations(last_message_at DESC);

-- ─────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────
CREATE TABLE public.messages (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content           text NOT NULL,
  is_read           boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created      ON public.messages(created_at);

-- ─────────────────────────────────────────
-- CAMPAIGNS
-- ─────────────────────────────────────────
CREATE TABLE public.campaigns (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by        uuid NOT NULL REFERENCES public.profiles(id),
  title             text NOT NULL,
  description       text,
  image_url         text,
  target_url        text,
  starts_at         timestamptz NOT NULL,
  ends_at           timestamptz NOT NULL,
  is_active         boolean DEFAULT true,
  created_at        timestamptz DEFAULT now()
);

-- Many-to-many: condominiums that show each campaign
CREATE TABLE public.campaign_condominiums (
  campaign_id       uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  condominium_id    uuid NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, condominium_id)
);

-- ─────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE public.notifications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type              text NOT NULL,
  title             text NOT NULL,
  body              text,
  data              jsonb,
  is_read           boolean DEFAULT false,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user   ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
