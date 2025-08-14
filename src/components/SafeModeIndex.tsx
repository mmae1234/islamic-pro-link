import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, Smartphone } from 'lucide-react';

interface SafeModeIndexProps {
  errorInfo?: {
    error?: Error;
    source?: string;
  };
}

const SafeModeIndex = ({ errorInfo }: SafeModeIndexProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Log error info for debugging
    if (errorInfo) {
      console.error('SafeMode: Error detected:', errorInfo);
    }
    
    // Log device and browser info for debugging
    const debugInfo = {
      userAgent: navigator.userAgent,
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
      isWebKit: /WebKit/.test(navigator.userAgent) && !/(Chrome|CriOS)/.test(navigator.userAgent),
      hasLocalStorage: (() => {
        try {
          localStorage.setItem('__test__', 'test');
          localStorage.removeItem('__test__');
          return true;
        } catch { return false; }
      })(),
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    
    console.log('SafeMode: Device info:', debugInfo);
    
    // Show loading for a brief moment
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [errorInfo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading safely...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-foreground">Muslim Professionals</h1>
            </div>
            <div className="flex items-center space-x-2">
              <a 
                href="/login" 
                className="text-sm text-primary hover:text-primary/80 transition-colors px-3 py-2"
              >
                Sign In
              </a>
              <a 
                href="/signup" 
                className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Error notification if any */}
        {errorInfo && (
          <div className="mb-8 mx-auto max-w-2xl">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-orange-800 font-medium">
                      We're experiencing some technical issues. The site is running in safe mode.
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      All core features are still available. We're working to resolve this quickly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hero section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Connect with Muslim Professionals
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join our global community of Muslim professionals. Find mentors, build your network, and grow your career.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/search" 
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Browse Professionals
            </a>
            <a 
              href="/signup" 
              className="inline-block bg-accent text-accent-foreground px-8 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors"
            >
              Join Community
            </a>
          </div>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Find Professionals</h3>
            <p className="text-muted-foreground text-sm">
              Search and connect with Muslim professionals worldwide across all industries.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Mentorship</h3>
            <p className="text-muted-foreground text-sm">
              Find mentors or become one. Share knowledge and grow together.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-3">Business Directory</h3>
            <p className="text-muted-foreground text-sm">
              Discover Muslim-owned businesses and professional services.
            </p>
          </div>
        </div>

        {/* Additional navigation */}
        <div className="mt-16 text-center border-t border-border pt-8">
          <p className="text-muted-foreground mb-4">Quick Navigation</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/businesses" className="text-primary hover:text-primary/80 text-sm">Businesses</a>
            <a href="/about" className="text-primary hover:text-primary/80 text-sm">About</a>
            <a href="/contact" className="text-primary hover:text-primary/80 text-sm">Contact</a>
            <a href="/help" className="text-primary hover:text-primary/80 text-sm">Help</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SafeModeIndex;