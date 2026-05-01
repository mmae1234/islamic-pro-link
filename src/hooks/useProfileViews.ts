import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tracks an authenticated profile view. Anonymous viewers are not recorded
 * (RLS now requires viewer_id = auth.uid()), and we no longer store
 * IP addresses or user agents to avoid leaking visitor PII to profile owners.
 */
export const useProfileViews = (profileId: string) => {
  useEffect(() => {
    if (!profileId) return;

    let mounted = true;

    const trackView = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!mounted || !user || user.id === profileId) return;

        // Dedupe: skip if this viewer has already viewed in the past 24h.
        const { data: existing } = await supabase
          .from('profile_views')
          .select('id')
          .eq('viewed_profile_id', profileId)
          .eq('viewer_id', user.id)
          .gte('viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!mounted) return;

        if (!existing || existing.length === 0) {
          await supabase.from('profile_views').insert({
            viewed_profile_id: profileId,
            viewer_id: user.id,
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
