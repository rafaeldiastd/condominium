-- Migration: Credit Plans
-- Description: Adds a table to manage credit packages for advertisers.

-- 1. Create credit_plans table
CREATE TABLE IF NOT EXISTS public.credit_plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    amount integer NOT NULL,
    price decimal(10,2) NOT NULL,
    is_popular boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Enable RLS
ALTER TABLE public.credit_plans ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Public (and advertisers) can see active plans
CREATE POLICY "Anyone can view active credit plans" ON public.credit_plans
    FOR SELECT USING (is_active = true);

-- Super admins can do everything
CREATE POLICY "Super admins can manage credit plans" ON public.credit_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'
        )
    );

-- 4. updated_at trigger
CREATE TRIGGER set_credit_plans_updated_at
    BEFORE UPDATE ON public.credit_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 5. Seed initial data (matching current hardcoded packages)
INSERT INTO public.credit_plans (amount, price, is_popular) VALUES
(10, 10.00, false),
(50, 45.00, true),
(100, 80.00, false);
