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
    
    // Much shorter timeout for mobile - mobile users need faster loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.log('AuthContext: Auth initialization timeout, proceeding without auth');
        setLoading(false);
        setUser(null);
      }
    }, 3000); // 3 second timeout for mobile compatibility
    
    // Get initial session with better error handling
    const initializeAuth = async () => {
      try {
        // Add extra mobile compatibility check
        if (typeof window === 'undefined' || !window.localStorage) {
          console.log('AuthContext: localStorage not available, proceeding as guest');
          setUser(null);
          setLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        console.log('AuthContext: Initial session:', session, 'Error:', error);
        
        if (error) {
          console.error('AuthContext: Session error:', error);
          // Don't block the app, just proceed without auth
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        if (!mounted) return;
        console.error('AuthContext: Critical auth error:', error);
        // App should still work without auth - this is critical for mobile
        setUser(null);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };

    // Listen for auth changes with error handling
    let subscription: any;
    try {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        console.log('AuthContext: Auth state changed:', _event, session);
        setUser(session?.user ?? null);
        if (loading) setLoading(false);
      });
      subscription = sub;
    } catch (error) {
      console.error('AuthContext: Error setting up auth listener:', error);
      // Continue without listener
    }

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error('AuthContext: Error unsubscribing:', error);
        }
      }
    };
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
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