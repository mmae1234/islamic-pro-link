import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;

    // Listen for PASSWORD_RECOVERY event — fires when Supabase exchanges the
    // recovery code/token from the email link and creates a recovery session.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setValidToken(true);
      }
    });

    const init = async () => {
      // 1) PKCE flow: email link contains ?code=... — exchange it for a session.
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (error) {
          console.error('Error exchanging recovery code:', error);
          setValidToken(false);
        } else {
          setValidToken(true);
        }
        return;
      }

      // 2) Legacy implicit flow: tokens in URL hash (#access_token=...&type=recovery)
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : '';
      const hashParams = new URLSearchParams(hash);
      const hashAccess = hashParams.get('access_token');
      const hashRefresh = hashParams.get('refresh_token');
      const hashType = hashParams.get('type');
      if (hashAccess && hashRefresh && (hashType === 'recovery' || !hashType)) {
        const { error } = await supabase.auth.setSession({
          access_token: hashAccess,
          refresh_token: hashRefresh,
        });
        if (cancelled) return;
        if (error) {
          console.error('Error setting session from hash:', error);
          setValidToken(false);
        } else {
          setValidToken(true);
        }
        return;
      }

      // 3) Query-param tokens (older flow)
      const access_token = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (cancelled) return;
        if (error) {
          console.error('Error setting session:', error);
          setValidToken(false);
        } else {
          setValidToken(true);
        }
        return;
      }

      // 4) Fallback: maybe Supabase already auto-exchanged via detectSessionInUrl.
      // Give the auth listener a brief moment to fire PASSWORD_RECOVERY.
      setTimeout(async () => {
        if (cancelled) return;
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          setValidToken(true);
        } else {
          setValidToken(false);
        }
      }, 1500);
    };

    init();

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Please ensure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Password updated successfully",
        description: "Your password has been reset. You can now sign in with your new password.",
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: unknown) {
      toast({
        title: "Password reset failed",
        description: getErrorMessage(error) || "An error occurred while resetting your password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (validToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (validToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-elegant">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-destructive">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/forgot-password')} 
              className="w-full"
              variant="hero"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            {success ? (
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            ) : (
              <span className="text-primary-foreground font-bold text-2xl">MP</span>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {success ? 'Password Reset Complete' : 'Set New Password'}
          </CardTitle>
          <CardDescription>
            {success 
              ? 'Your password has been successfully updated. Redirecting to login...' 
              : 'Please enter your new password below.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {success ? (
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                You will be redirected to the login page shortly.
              </p>
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full"
                variant="hero"
              >
                Go to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                    minLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                variant="hero"
                disabled={loading || !password || !confirmPassword}
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;