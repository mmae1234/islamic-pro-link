import { createContext, useContext, useEffect, useState } from "react";
import { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isIOS, hasLocalStorage, withTimeout } from "@/lib/auth-storage";
import { setSentryUser } from "@/lib/sentry";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    accountType?: string,
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const guestDefaults: AuthContextType = {
  user: null,
  loading: false,
  signUp: async () => {
    throw new Error("Auth not available");
  },
  signIn: async () => {
    throw new Error("Auth not available");
  },
  signOut: async () => {
    throw new Error("Auth not available");
  },
  resetPassword: async () => {
    throw new Error("Auth not available");
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Safe fallback so mobile/error paths don't crash the tree.
    console.warn("useAuth used outside of AuthProvider, returning guest defaults");
    return guestDefaults;
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    const ios = isIOS();

    // Hard timeout: never leave the app stuck on a "Loading…" screen.
    // iOS gets a moderate budget — 200ms was too aggressive on cold cellular
    // connections and caused logged-in users to flicker to logged-out state.
    const failsafe = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        setUser(null);
        setSentryUser(null);
      }
    }, ios ? 800 : 1500);

    // Auth state listener — set up before getSession() per Supabase guidance.
    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        // Tell Sentry who's logged in (id only — never email/name) so the
        // next captured event is attributable. Pass null on sign-out.
        setSentryUser(nextUser?.id ?? null);
        setLoading(false);
      });
      subscription = data.subscription;
    } catch (error) {
      console.log("AuthContext: auth listener failed:", error);
    }

    const initialize = async () => {
      try {
        if (!hasLocalStorage()) {
          // iOS private mode or blocked storage — proceed as guest.
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const { data, error } = (await withTimeout(
          supabase.auth.getSession(),
          2000,
          "Session timeout",
        )) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

        if (!mounted) return;
        if (error) {
          console.log("AuthContext: session error, proceeding as guest:", error.message);
          setUser(null);
          setSentryUser(null);
        } else {
          const nextUser = data.session?.user ?? null;
          setUser(nextUser);
          setSentryUser(nextUser?.id ?? null);
        }
      } catch (error) {
        if (!mounted) return;
        console.log("AuthContext: init failed, proceeding as guest:", error);
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(failsafe);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      clearTimeout(failsafe);
      try {
        subscription?.unsubscribe();
      } catch {
        // Ignore — already torn down.
      }
    };
  }, []);

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    accountType?: string,
  ) => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get("redirect") || "/dashboard";
      const emailRedirectTo = `${window.location.origin}${redirect}`;

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            first_name: firstName,
            last_name: lastName,
            account_type: accountType || "visitor",
          },
        },
      });
      if (error) throw error;

      toast({
        title: "Registration successful!",
        description: "Please check your email to verify your account.",
      });
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Registration failed",
        description: authError.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({
        title: "Welcome back!",
        description: "You have been successfully logged in.",
      });
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Login failed",
        description: authError.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // No active session — just clear local state without calling the API.
      if (!session) {
        setUser(null);
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Logout failed",
        description: authError.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: "Password reset sent",
        description:
          "This reset link is valid for 60 minutes and can only be used once. Check your email for password reset instructions.",
      });
    } catch (error) {
      const authError = error as AuthError;
      toast({
        title: "Password reset failed",
        description: authError.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
