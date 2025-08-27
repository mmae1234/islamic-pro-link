
import { Suspense, useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import SafeModeIndex from "@/components/SafeModeIndex";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

// Simple loading component
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// iOS fallback component when Supabase fails
const IOSFallback = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">Muslim Professionals Network</h1>
        <p className="text-xl text-muted-foreground">Connect with Muslim professionals worldwide</p>
      </header>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Find Professionals</h2>
          <p className="text-muted-foreground mb-4">Search and connect with Muslim professionals in your field.</p>
          <a 
            href="/search" 
            className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Browse Professionals
          </a>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Join Community</h2>
          <p className="text-muted-foreground mb-4">Create your profile and start networking today.</p>
          <a 
            href="/login" 
            className="inline-block bg-accent text-accent-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  </div>
);

const Index = () => {
  const [showSafeMode, setShowSafeMode] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Immediate safe mode for iOS to prevent blank screens
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      // Much shorter timeout - show safe mode quickly
      const timer = setTimeout(() => {
        setShowSafeMode(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Global error catcher
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Index: Global error caught:', event.error);
      setError(event.error);
      setShowSafeMode(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Index: Unhandled promise rejection:', event.reason);
      setError(new Error(event.reason));
      setShowSafeMode(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (showSafeMode) {
    return <SafeModeIndex errorInfo={{ error, source: 'Index component' }} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary fallback={({ error, resetError }) => (
        <SafeModeIndex errorInfo={{ error, source: 'ErrorBoundary' }} />
      )}>
        <Suspense fallback={<LoadingFallback />}>
          <Header />
          <main>
            <Hero />
            <Features />
          </main>
          <Footer />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};

export default Index;
