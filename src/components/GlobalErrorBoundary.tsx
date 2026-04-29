import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Wifi } from 'lucide-react';
import { captureException } from '@/lib/sentry';

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

class GlobalErrorBoundary extends React.Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    console.error('GlobalErrorBoundary: Caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('GlobalErrorBoundary: Error details:', error, errorInfo);
    this.setState({ errorInfo });

    // Log iOS-specific information
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isWebKit = /WebKit/.test(navigator.userAgent);
    const isPrivateMode = !window.localStorage || !window.sessionStorage;

    console.error('Device info:', {
      isIOS,
      isWebKit,
      isPrivateMode,
      userAgent: navigator.userAgent,
      error: error.message,
      stack: error.stack
    });

    // Forward to Sentry. The boundary tag lets us filter "uncaught render
    // errors that escaped to the global catch" specifically. iOS context
    // helps reproduce mobile-only bugs.
    captureException(error, {
      tags: { boundary: 'global', ios: String(isIOS) },
      extra: {
        componentStack: errorInfo.componentStack,
        isWebKit,
        isPrivateMode,
      },
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message?.includes('network') || 
                           this.state.error?.message?.includes('fetch') ||
                           this.state.error?.message?.includes('load');
      
      const isAuthError = this.state.error?.message?.includes('permission') ||
                         this.state.error?.message?.includes('unauthorized') ||
                         this.state.error?.message?.includes('auth');

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                {isNetworkError ? (
                  <Wifi className="w-8 h-8 text-destructive" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-destructive" />
                )}
              </div>
              <CardTitle className="text-xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground text-sm mb-4">
                  {isAuthError 
                    ? "There was an authentication issue. Please try signing in again."
                    : isNetworkError
                    ? "Unable to connect to our servers. Please check your internet connection."
                    : "We're sorry, but there was an unexpected error. Please try refreshing the page."
                  }
                </p>
                
                {isIOS && (
                  <div className="bg-muted p-3 rounded-lg text-xs text-muted-foreground mb-4">
                    <p className="font-medium mb-1">iOS Users:</p>
                    <p>If you're using Safari, try switching to Chrome or Firefox. If you're in private browsing mode, try regular browsing mode.</p>
                  </div>
                )}

                {this.state.error && (
                  <details className="text-left bg-muted p-3 rounded-lg text-xs mb-4">
                    <summary className="cursor-pointer font-medium">Technical Details</summary>
                    <div className="mt-2 font-mono">
                      <p><strong>Error:</strong> {this.state.error.message}</p>
                      {this.state.error.stack && (
                        <pre className="mt-2 text-xs overflow-auto">
                          {this.state.error.stack.substring(0, 500)}...
                        </pre>
                      )}
                    </div>
                  </details>
                )}
              </div>
              
              <div className="space-y-3">
                <Button 
                  onClick={this.resetError}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Homepage
                </Button>
                
                <Button 
                  onClick={() => window.location.reload()}
                  variant="ghost"
                  className="w-full"
                >
                  Refresh Page
                </Button>
              </div>

              {/* Quick navigation for iOS users */}
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-center mb-3">Quick Access</h3>
                <div className="grid grid-cols-2 gap-2">
                  <a 
                    href="/search" 
                    className="text-center p-2 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Find Professionals
                  </a>
                  <a 
                    href="/login" 
                    className="text-center p-2 text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Login
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;