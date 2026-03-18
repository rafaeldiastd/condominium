-- Migration: Fix Refund Constraint and Analytics Views
-- Description: Updates constraints to allow refunds and creates views for advertiser analytics.

-- 1. Update credit_transactions_type_check
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_type_check;
ALTER TABLE public.credit_transactions ADD CONSTRAINT credit_transactions_type_check 
    CHECK (type IN ('purchase', 'usage', 'refund'));

-- 1.1 Update ad_interactions_type_check
ALTER TABLE public.ad_interactions DROP CONSTRAINT IF EXISTS ad_interactions_type_check;
ALTER TABLE public.ad_interactions ADD CONSTRAINT ad_interactions_type_check 
    CHECK (type IN ('view', 'click', 'whatsapp_click', 'favorite', 'carousel_view'));

-- 2. Create ad_analytics_summary view
DROP VIEW IF EXISTS public.ad_analytics_summary;
CREATE OR REPLACE VIEW public.ad_analytics_summary AS
SELECT 
    announcement_id,
    COUNT(*) FILTER (WHERE type IN ('view', 'carousel_view')) as total_views,
    COUNT(*) FILTER (WHERE type = 'click') as total_clicks,
    COUNT(*) FILTER (WHERE type = 'whatsapp_click') as total_whatsapp_clicks,
    COUNT(*) FILTER (WHERE type = 'favorite') as total_favorites,
    COUNT(DISTINCT user_id) as unique_users
FROM public.ad_interactions
GROUP BY announcement_id;

-- 3. Create daily analytics view
DROP VIEW IF EXISTS public.ad_daily_analytics;
CREATE OR REPLACE VIEW public.ad_daily_analytics AS
SELECT 
    announcement_id,
    date_trunc('day', created_at) as interaction_date,
    COUNT(*) FILTER (WHERE type IN ('view', 'carousel_view')) as views,
    COUNT(*) FILTER (WHERE type = 'click') as clicks,
    COUNT(*) FILTER (WHERE type = 'whatsapp_click') as whatsapp_clicks,
    COUNT(*) FILTER (WHERE type = 'favorite') as favorites
FROM public.ad_interactions
GROUP BY announcement_id, date_trunc('day', created_at);

-- Grant access
GRANT SELECT ON public.ad_analytics_summary TO authenticated;
GRANT SELECT ON public.ad_daily_analytics TO authenticated;
