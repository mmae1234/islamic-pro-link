import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AuthForm from "@/components/AuthForm";
import RoleSelection, { AccountType } from "@/components/RoleSelection";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Chrome, Mail } from "lucide-react";

const setSeo = (title: string, description?: string) => {
  document.title = title;
  if (description) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description);
  }
};

const Signup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const preselectedParam = (searchParams.get('type') as AccountType) || (searchParams.get('account_type') as AccountType);
  const preselected: AccountType = preselectedParam || 'visitor';
  const src = searchParams.get('src') || 'generic';
  const stepFromUrl = searchParams.get('step');

  const initialStep: 'auth' | 'role' = useMemo(() => {
    if (stepFromUrl === 'auth') return 'auth';
    return 'role';
  }, [stepFromUrl]);

  const [step, setStep] = useState<'auth' | 'role'>(initialStep);
  const [role, setRole] = useState<AccountType>(preselected);
  type SignupValues = Partial<{ email: string; password: string; firstName: string; lastName: string; businessName: string; phone: string; website: string }>;
  const [values, setValues] = useState<SignupValues>({});
  const handleValuesChange = (patch: SignupValues) => setValues((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    setSeo('Sign Up – Muslim Professionals', 'Create your account and choose your role');
  }, []);

  // Log analytics for entry point
  useEffect(() => {
    supabase.from('signup_events').insert({ user_id: user?.id ?? null, source: src, account_type: preselected }).then(() => {
      // ignore errors silently
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Keep URL in sync with step
    const params = new URLSearchParams(searchParams);
    params.set('step', step);
    setSearchParams(params, { replace: true });
  }, [step]);

  const handleSocialSignup = async () => {
    const redirectTo = `${window.location.origin}/signup?step=role&src=${encodeURIComponent(src)}&account_type=${encodeURIComponent(preselected)}&type=${encodeURIComponent(preselected)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    });
    if (error) {
      toast({ title: 'Google sign-in failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleRoleSubmit = async (selected: AccountType) => {
    try {
      if (!user) {
        setRole(selected);
        // Update URL with both legacy and new param names
        const params = new URLSearchParams(searchParams);
        params.set('account_type', selected);
        params.set('type', selected);
        params.set('step', 'auth');
        setSearchParams(params, { replace: true });

        // Clear only fields that don't apply
        setValues((prev) =>
          selected === 'business'
            ? { ...prev, firstName: undefined, lastName: undefined }
            : { ...prev, businessName: undefined, phone: undefined, website: undefined }
        );

        toast({ title: 'Continue to sign in', description: 'Create your account to finish setup.', variant: 'default' });
        setStep('auth');
        return;
      }

      // Update auth metadata
      const { error: metaError } = await supabase.auth.updateUser({ data: { account_type: selected } });
      if (metaError) throw metaError;

      // Update profiles.role
      const { error: profileError } = await supabase.from('profiles').upsert({ user_id: user.id, role: selected }, { onConflict: 'user_id' });
      if (profileError) throw profileError;

      // Analytics completion
      await supabase.from('signup_events').insert({ user_id: user.id, source: src, account_type: selected });

      // Redirect per role
      if (selected === 'visitor') navigate('/');
      else if (selected === 'professional') navigate('/dashboard/professional');
      else navigate('/dashboard/business');
    } catch (error: any) {
      toast({ title: 'Could not save selection', description: error.message || 'Try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground mt-2">Step {step === 'role' ? '1' : '2'} of 2</p>
        </header>

        <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl p-6 shadow-soft">
          {step === 'auth' && !user && (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account type: <span className="font-medium capitalize">{role}</span></span>
                <Button variant="link" size="sm" onClick={() => setStep('role')} aria-label="Change account type">
                  Change account type
                </Button>
              </div>
              <Button variant="accent" className="w-full" onClick={handleSocialSignup} aria-label="Continue with Google">
                <Chrome className="w-4 h-4 mr-2" /> Continue with Google
              </Button>
              <div className="relative">
                <Separator />
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-card px-3 text-xs text-muted-foreground">or</span>
              </div>
              <AuthForm 
                mode="signup" 
                selectedRole={role}
                values={values}
                onValuesChange={handleValuesChange}
                onToggleMode={() => navigate('/login')} 
              />
              <div className="text-center text-sm text-muted-foreground">
                After confirming your email, return here and continue.
              </div>
              <Button variant="hero" className="w-full" onClick={() => setStep('role')} aria-label="Continue to role selection">
                I've confirmed my email – Continue
              </Button>
            </div>
          )}

          {(step === 'role' || user) && (
            <RoleSelection defaultValue={role} onSubmit={handleRoleSubmit} onBack={!user ? () => setStep('auth') : undefined} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Signup;
