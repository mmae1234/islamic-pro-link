import { lazy, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Lazy so the 404 page (and its header/footer) stays out of the main bundle.
const NotFound = lazy(() => import("@/pages/NotFound"));

/**
 * Renders children only for admins (public.is_admin). Everyone else sees the
 * normal 404 page, so admin pages are not advertised. Use inside
 * ProtectedRoute, which handles signed-out visitors.
 */
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<"checking" | "admin" | "denied">("checking");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setStatus("denied");
      return;
    }
    let cancelled = false;
    supabase.rpc("is_admin", { _user_id: user.id }).then(({ data, error }) => {
      if (!cancelled) setStatus(!error && data === true ? "admin" : "denied");
    });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (status === "denied") return <NotFound />;
  return <>{children}</>;
};

export default AdminRoute;
