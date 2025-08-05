import { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
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

// Enhanced error boundary fallback with mobile support
const ErrorFallback = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  return (
    <div className="min-h-screen bg-background">
      {!isMobile && (
        <div className="bg-gradient-primary p-4">
          <div className="container mx-auto">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">MP</span>
              </div>
              <span className="text-lg font-bold text-primary-foreground">Muslim Professionals</span>
            </div>
          </div>
        </div>
      )}
      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Welcome to Muslim Professionals</h1>
        <p className="text-muted-foreground mb-8">
          The largest professional network for the Muslim community worldwide.
        </p>
        <div className="space-y-4">
          <a 
            href="/search" 
            className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Find Professionals
          </a>
          <a 
            href="/login" 
            className="inline-flex items-center px-6 py-3 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors ml-4"
          >
            Join Community
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Index = () => {
  // Safe auth access - don't block rendering if auth fails
  let loading = false;
  try {
    const authContext = useAuth();
    loading = authContext?.loading || false;
  } catch (error) {
    console.error('Index: Auth context not available, continuing without auth');
    loading = false;
  }

  // Don't wait for auth to load - render the page immediately with error boundary
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
    console.error('Error rendering landing page:', error);
    return <ErrorFallback />;
  }
};

export default Index;
