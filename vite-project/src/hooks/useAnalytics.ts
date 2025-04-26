import { useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { analytics } from '../services/supabase';

const SESSION_ID_KEY = 'analytics_session_id';

export const useAnalytics = () => {
  // Initialize session ID on mount
  useEffect(() => {
    // Check for existing session ID or create new one
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }

    const trackInitialVisit = async () => {
      try {
        await analytics.trackVisit({
          sessionId,
          entryPage: window.location.pathname,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          // Note: In a production app, you'd want to use a geolocation service
          // to get these values accurately
          country: 'Unknown',
          city: 'Unknown',
        });
      } catch (error) {
        console.error('Failed to track visit:', error);
      }
    };

    trackInitialVisit();
  }, []);

  // Click tracking handler
  const trackClick = useCallback(async (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    
    if (!sessionId) {
      console.error('No session ID found for click tracking');
      return;
    }
    
    try {
      await analytics.trackClick({
        visitorId: sessionId,
        elementId: target.id || 'no-id',
        elementClass: Array.from(target.classList).join(' ') || 'no-class',
        elementText: target.textContent || '',
        pageUrl: window.location.href,
        xPosition: event.clientX,
        yPosition: event.clientY,
      });
    } catch (error) {
      console.error('Failed to track click:', error);
    }
  }, []);

  // Set up click tracking
  useEffect(() => {
    document.addEventListener('click', trackClick);
    return () => {
      document.removeEventListener('click', trackClick);
    };
  }, [trackClick]);
};

export default useAnalytics; 