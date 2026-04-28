
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">Loading safely...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple responsive header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">MP</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Muslim Professionals Network</h1>
            </div>
            <div className="flex items-center space-x-2">
              <a 
                href="/login" 
                className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors px-2 sm:px-3 py-2"
              >
                Sign In
              </a>
              <a 
                href="/signup" 
                className="text-xs sm:text-sm bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Mobile first */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
        {/* Error notification if any */}
        {errorInfo && (
          <div className="mb-6 sm:mb-8 mx-auto max-w-2xl">
            <Card className="border-warning/40 bg-warning/10">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-warning mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-foreground font-medium">
                      We're experiencing some technical issues. The site is running in safe mode.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All core features are still available. We're working to resolve this quickly.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Hero section - Responsive */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-3 sm:mb-4 leading-tight">
            Connect with Muslim Professionals Network
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
            Join our global community of Muslim professionals. Find mentors, build your network, and grow your career.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-sm sm:max-w-none mx-auto">
            <a 
              href="/search" 
              className="inline-block bg-primary text-primary-foreground px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm sm:text-base"
            >
              Browse Professionals
            </a>
            <a 
              href="/signup" 
              className="inline-block bg-accent text-accent-foreground px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-accent/90 transition-colors text-sm sm:text-base"
            >
              Join Community
            </a>
          </div>
        </div>

        {/* Features grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
          <div className="text-center p-4 sm:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Find Professionals</h3>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Search and connect with Muslim professionals worldwide across all industries.
            </p>
          </div>
          
          <div className="text-center p-4 sm:p-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Mentorship</h3>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Find mentors or become one. Share knowledge and grow together.
            </p>
          </div>
          
          <div className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Business Directory</h3>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Discover Muslim-owned businesses and professional services.
            </p>
          </div>
        </div>

        {/* Additional navigation - Responsive */}
        <div className="mt-12 sm:mt-16 text-center border-t border-border pt-6 sm:pt-8">
          <p className="text-muted-foreground mb-3 sm:mb-4 text-sm">Quick Navigation</p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <a href="/businesses" className="text-primary hover:text-primary/80 text-xs sm:text-sm px-2 py-1">Businesses</a>
            <a href="/about" className="text-primary hover:text-primary/80 text-xs sm:text-sm px-2 py-1">About</a>
            <a href="/contact" className="text-primary hover:text-primary/80 text-xs sm:text-sm px-2 py-1">Contact</a>
            <a href="/help" className="text-primary hover:text-primary/80 text-xs sm:text-sm px-2 py-1">Help</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SafeModeIndex;
