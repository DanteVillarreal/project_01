-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the visitors table
CREATE TABLE IF NOT EXISTS public.visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  entry_page TEXT NOT NULL,
  country TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions for visitors table
ALTER TABLE IF EXISTS public.visitors OWNER TO postgres;
GRANT ALL ON TABLE public.visitors TO anon;
GRANT ALL ON TABLE public.visitors TO authenticated;
GRANT ALL ON TABLE public.visitors TO service_role;

-- Create the click_events table
CREATE TABLE IF NOT EXISTS public.click_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id TEXT NOT NULL,
  element_id TEXT,
  element_class TEXT,
  element_text TEXT,
  page_url TEXT NOT NULL,
  x_position INTEGER NOT NULL,
  y_position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions for click_events table
ALTER TABLE IF EXISTS public.click_events OWNER TO postgres;
GRANT ALL ON TABLE public.click_events TO anon;
GRANT ALL ON TABLE public.click_events TO authenticated;
GRANT ALL ON TABLE public.click_events TO service_role;

-- Create function to get top clicked elements
CREATE OR REPLACE FUNCTION public.get_top_clicked_elements(limit_count INTEGER)
RETURNS TABLE (
  element_id TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.element_id,
    COUNT(*) as count
  FROM public.click_events ce
  WHERE ce.element_id IS NOT NULL
  GROUP BY ce.element_id
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on function
GRANT EXECUTE ON FUNCTION public.get_top_clicked_elements(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_top_clicked_elements(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_clicked_elements(INTEGER) TO service_role; 