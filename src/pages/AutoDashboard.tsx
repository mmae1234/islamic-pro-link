import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Lightweight router that sends the user to the right dashboard
// - If they are (or intend to be) a business, go to /dashboard/business
// - Otherwise default to /dashboard/professional
const AutoDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const route = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData.user?.id;
        if (!uid) {
          navigate('/dashboard/professional', { replace: true });
          return;
        }

        const [bizRes, profRes] = await Promise.all([
          supabase.from('business_accounts').select('id').eq('owner_id', uid).maybeSingle(),
          supabase.from('profiles').select('role').eq('user_id', uid).maybeSingle(),
        ]);

        if (!isMounted) return;

        const pendingType = localStorage.getItem('pending_account_type');
        const isPendingBusiness = pendingType === 'business';
        const hasBiz = !!(bizRes as any).data;
        const role = (profRes as any).data?.role;
        // SECURITY: Trust only server-side profiles.role (immutable) and owned businesses.
        // Never read account_type from auth.user_metadata — it is user-mutable.
        const isBusiness = isPendingBusiness || hasBiz || role === 'business';

        if (isBusiness) {
          navigate('/dashboard/business', { replace: true });
        } else {
          navigate('/dashboard/professional', { replace: true });
        }
      } catch {
        navigate('/dashboard/professional', { replace: true });
      }
    };
    route();
    return () => { isMounted = false; };
  }, [navigate]);

  return null;
};

export default AutoDashboard;
