import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthForm from "@/components/AuthForm";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(() => {
    return searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  });
  const message = searchParams.get('message');

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      navigate(redirect, { replace: true });
    }
  }, [user, loading, navigate, searchParams]);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'signup') {
      setMode('signup');
      navigate('/signup');
    }
  }, [searchParams, navigate]);

  const toggleMode = () => {
    if (mode === 'login') {
      navigate('/signup');
    } else {
      setMode('login');
    }
  };

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md space-y-4">
          {message && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          <AuthForm mode={mode} onToggleMode={toggleMode} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
