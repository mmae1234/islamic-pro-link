import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useProfileViews = (profileId: string) => {
  useEffect(() => {
    if (!profileId) return;

    let mounted = true;
    
    const trackView = async () => {
      try {
        // Get user's IP address and user agent for uniqueness tracking
        const response = await fetch('https://api.ipify.org?format=json');
        if (!mounted) return;
        
        const { ip } = await response.json();
        
        // Check if this IP has viewed this profile recently (within 24 hours)
        const { data: existingViews } = await supabase
          .from('profile_views')
          .select('id')
          .eq('viewed_profile_id', profileId)
          .eq('ip_address', ip)
          .gte('viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (!mounted) return;

        // Only track if no recent view from this IP
        if (!existingViews || existingViews.length === 0) {
          await supabase
            .from('profile_views')
            .insert({
              viewed_profile_id: profileId,
              ip_address: ip,
              user_agent: navigator.userAgent,
              viewer_id: null // Anonymous for now, could be set if user is logged in
            });
        }
      } catch (error) {
        if (mounted) {
          console.error('Error tracking profile view:', error);
        }
      }
    };

    trackView();

    return () => {
      mounted = false;
    };
  }, [profileId]);
};