-- Migration: Paid Ads System
-- Description: Adds advertiser role, credit system, analytics, and demographic fields.

-- 1. Update 'role' constraint in profiles to include 'advertiser'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('super_admin', 'syndic', 'resident', 'advertiser'));

-- 2. Add demographic fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

-- 3. Create paid_status enum
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paid_status') THEN
        CREATE TYPE paid_status AS ENUM ('pending', 'active', 'paused', 'expired');
    END IF;
END $$;

-- 4. Create advertiser_credits table
CREATE TABLE IF NOT EXISTS public.advertiser_credits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    balance decimal(10,2) DEFAULT 0.00 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 5. Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount decimal(10,2) NOT NULL,
    type text NOT NULL CHECK (type IN ('purchase', 'usage')),
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 6. Add paid fields to announcements
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS paid_status paid_status,
ADD COLUMN IF NOT EXISTS paid_until timestamp with time zone,
ADD COLUMN IF NOT EXISTS advertiser_id uuid REFERENCES public.profiles(id);

-- 7. Create ad_interactions table for analytics
CREATE TABLE IF NOT EXISTS public.ad_interactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    type text NOT NULL CHECK (type IN ('view', 'click', 'whatsapp_click')),
    demographics jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 8. RLS Policies
ALTER TABLE public.advertiser_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_interactions ENABLE ROW LEVEL SECURITY;

-- Advertiser Credits: Users can view their own credits
CREATE POLICY "Users can view own credits" ON public.advertiser_credits
    FOR SELECT USING (auth.uid() = profile_id);

-- Credit Transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = profile_id);

-- Ad Interactions: Advertisers can view interactions for their ads
CREATE POLICY "Advertisers can view interaction metrics" ON public.ad_interactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.announcements a
            WHERE a.id = ad_interactions.announcement_id
            AND a.advertiser_id = auth.uid()
        )
    );

-- Interaction Recording: Anyone can record an interaction
CREATE POLICY "Anyone can record interaction" ON public.ad_interactions
    FOR INSERT WITH CHECK (true);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_announcements_is_paid ON public.announcements(is_paid) WHERE is_paid = true;
CREATE INDEX IF NOT EXISTS idx_ad_interactions_announcement_id ON public.ad_interactions(announcement_id);
