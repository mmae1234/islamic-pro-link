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
        const [{ data: userData }, bizRes, profRes] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from('business_accounts').select('id').maybeSingle(),
          supabase.from('profiles').select('role').maybeSingle(),
        ]);

        if (!isMounted) return;

        const uid = userData.user?.id;
        const pendingType = localStorage.getItem('pending_account_type');
        const isPendingBusiness = pendingType === 'business';
        const hasBiz = !!(bizRes as any).data && uid && ((bizRes as any).data.owner_id ? (bizRes as any).data.owner_id === uid : true);
        const role = (profRes as any).data?.role;
        const userMetaType = (userData.user?.user_metadata as any)?.account_type;
        const isBusiness = isPendingBusiness || hasBiz || role === 'business' || userMetaType === 'business';

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
