-- Brand Wall Analytics Table
-- This table tracks visits and interactions on brand walls.

CREATE TABLE IF NOT EXISTS public.brand_wall_analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE NOT NULL,
    media_id uuid REFERENCES public.brand_wall_media(id) ON DELETE CASCADE, -- NULL for wall visits
    event_type text NOT NULL, -- 'wall_visit', 'media_click', 'contact_click'
    viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- optional, if logged in
    referrer_id uuid, -- tracking source if available
    metadata jsonb, -- extra data like device, browser, etc.
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Indices for performance and filtering
CREATE INDEX IF NOT EXISTS idx_brand_wall_analytics_brand_id ON public.brand_wall_analytics(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_wall_analytics_media_id ON public.brand_wall_analytics(media_id);
CREATE INDEX IF NOT EXISTS idx_brand_wall_analytics_event_type ON public.brand_wall_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_brand_wall_analytics_created_at ON public.brand_wall_analytics(created_at);

-- RLS Policies (Read-only for brands for their own data)
ALTER TABLE public.brand_wall_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands can view their own analytics" ON public.brand_wall_analytics
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT profile_id FROM public.brands WHERE id = brand_id
        )
    );

CREATE POLICY "Allow public insert for analytics" ON public.brand_wall_analytics
    FOR INSERT
    WITH CHECK (true);
