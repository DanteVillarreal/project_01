import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Analytics-specific functions
export const analytics = {
  async trackVisit(sessionData: {
    sessionId: string;
    entryPage: string;
    userAgent: string;
    referrer: string;
    country?: string;
    city?: string;
  }) {
    return supabase
      .from('visitors')
      .insert([
        {
          session_id: sessionData.sessionId,
          entry_page: sessionData.entryPage,
          user_agent: sessionData.userAgent,
          referrer: sessionData.referrer,
          country: sessionData.country,
          city: sessionData.city,
        },
      ]);
  },

  async trackClick(clickData: {
    visitorId: string;
    elementId: string;
    elementClass: string;
    elementText: string;
    pageUrl: string;
    xPosition: number;
    yPosition: number;
  }) {
    return supabase
      .from('click_events')
      .insert([
        {
          visitor_id: clickData.visitorId,
          element_id: clickData.elementId,
          element_class: clickData.elementClass,
          element_text: clickData.elementText,
          page_url: clickData.pageUrl,
          x_position: clickData.xPosition,
          y_position: clickData.yPosition,
        },
      ]);
  },
}; 