import { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // On mobile or in error conditions, return a safe default instead of throwing
    console.warn('useAuth used outside of AuthProvider, returning guest defaults');
    return {
      user: null,
      loading: false,
      signUp: async () => { throw new Error('Auth not available'); },
      signIn: async () => { throw new Error('Auth not available'); },
      signOut: async () => { throw new Error('Auth not available'); },
      resetPassword: async () => { throw new Error('Auth not available'); },
    };
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('AuthContext: Initializing auth...');
    let mounted = true;
    
    // Immediate fallback for iOS - set loading to false quickly
    const immediateTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.log('AuthContext: Fast timeout for iOS, proceeding as guest');
        setLoading(false);
        setUser(null);
      }
    }, 800); // Faster timeout for iOS compatibility
    
    // Get initial session with iOS-specific handling
    const initializeAuth = async () => {
      try {
        // iOS WebKit storage checks
        const hasStorage = (() => {
          try {
            if (typeof window === 'undefined') return false;
            const testKey = '__storage_test__';
            window.localStorage.setItem(testKey, 'test');
            window.localStorage.removeItem(testKey);
            return true;
          } catch (e) {
            console.log('AuthContext: localStorage blocked (iOS privacy mode)');
            return false;
          }
        })();

        if (!hasStorage) {
          console.log('AuthContext: Storage unavailable, proceeding as guest');
          setUser(null);
          setLoading(false);
          clearTimeout(immediateTimeout);
          return;
        }

        // Try to get session with quick timeout for iOS
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        );

        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (!mounted) return;
        
        console.log('AuthContext: Initial session:', session ? 'found' : 'none', 'Error:', error);
        
        if (error) {
          console.log('AuthContext: Session error, proceeding as guest:', error.message);
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        if (!mounted) return;
        console.log('AuthContext: Auth timeout/error, proceeding as guest:', error);
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(immediateTimeout);
        }
      }
    };

    // Simplified auth listener for iOS
    let subscription: any;
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        console.log('AuthContext: Auth state changed:', _event);
        setUser(session?.user ?? null);
        if (loading) setLoading(false);
      });
      subscription = sub;
    } catch (error) {
      console.log('AuthContext: Auth listener failed, continuing without it:', error);
    }

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(immediateTimeout);
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.log('AuthContext: Error unsubscribing:', error);
        }
      }
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      // Get redirect URL from current URL params if we're on auth-gate
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect') || '/dashboard';
      const redirectUrl = `${window.location.origin}${redirect}`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName,
            last_name: lastName,
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

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
      // Check if there's an active session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No active session, just update local state
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
        description: "This reset link is valid for 60 minutes and can only be used once. Check your email for password reset instructions.",
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

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};