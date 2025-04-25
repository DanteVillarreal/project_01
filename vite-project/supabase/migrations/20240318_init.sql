-- Create the visitors table
CREATE TABLE IF NOT EXISTS visitors (
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

-- Create the click_events table
CREATE TABLE IF NOT EXISTS click_events (
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

-- Create function to get top clicked elements
CREATE OR REPLACE FUNCTION get_top_clicked_elements(limit_count INTEGER)
RETURNS TABLE (
  element_id TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ce.element_id,
    COUNT(*) as count
  FROM click_events ce
  WHERE ce.element_id IS NOT NULL
  GROUP BY ce.element_id
  ORDER BY count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql; 