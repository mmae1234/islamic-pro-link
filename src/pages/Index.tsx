
import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import StaticLandingFallback from "@/components/StaticLandingFallback";
import { Loader2 } from "lucide-react";

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const Index = () => {
  const [showFallback, setShowFallback] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Safe auth access - handle mobile browsers that may block auth
  let loading = false;
  let authContext = null;
  let authError = false;
  
  try {
    authContext = useAuth();
    loading = authContext?.loading || false;
  } catch (error) {
    console.error('Index: Auth context error, showing fallback:', error);
    authError = true;
  }

  useEffect(() => {
    setMounted(true);
    
    // Mobile-specific timeout to prevent hanging
    const mobileTimeout = setTimeout(() => {
      if (!mounted) {
        console.log('Index: Mobile timeout reached, showing fallback');
        setShowFallback(true);
      }
    }, 2000);

    // Monitor for mobile-specific errors
    const handleError = (event: ErrorEvent) => {
      const errorMessage = event.error?.message || event.message || '';
      console.error('Index: Error detected:', errorMessage);
      
      if (
        errorMessage.includes('Maximum call stack size exceeded') ||
        errorMessage.includes('permission') ||
        errorMessage.includes('42P17') ||
        errorMessage.includes('useAuth must be used within') ||
        errorMessage.includes('Cannot read properties of undefined') ||
        errorMessage.includes('localStorage') ||
        errorMessage.includes('fetch')
      ) {
        console.warn('Index: Critical error detected, showing fallback:', errorMessage);
        setShowFallback(true);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || event.reason || '';
      console.error('Index: Promise rejection:', reason);
      
      if (
        reason.includes('permission') ||
        reason.includes('42P17') ||
        reason.includes('Supabase') ||
        reason.includes('auth') ||
        reason.includes('localStorage') ||
        reason.includes('fetch')
      ) {
        console.warn('Index: Supabase/Auth error detected, showing fallback:', reason);
        setShowFallback(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      clearTimeout(mobileTimeout);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [mounted]);

  // Show fallback immediately if auth error or after mobile timeout
  if (showFallback || authError) {
    return <StaticLandingFallback />;
  }

  // Don't wait for auth to load on mobile - render immediately
  if (!mounted) {
    return <LoadingFallback />;
  }

  try {
    return (
      <div className="min-h-screen bg-background">
        <Suspense fallback={<LoadingFallback />}>
          <Header />
          <main>
            <Hero />
            <Features />
          </main>
          <Footer />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('Error rendering Index page:', error);
    return <StaticLandingFallback />;
  }
};

export default Index;
