import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const db = supabase as unknown as SupabaseClient;

/** After a new member signs in, credit the person whose invite link they used (once). */
const InviteClaimer = () => {
  const { user } = useAuth();
  useEffect(() => {
    if (!user) return;
    let code: string | null = null;
    try {
      code = localStorage.getItem("pending_invite");
    } catch {
      return;
    }
    if (!code) return;
    db.rpc("claim_invite", { _code: code }).then(() => {
      try {
        localStorage.removeItem("pending_invite");
      } catch {
        /* ignore */
      }
    });
  }, [user]);
  return null;
};

export default InviteClaimer;
