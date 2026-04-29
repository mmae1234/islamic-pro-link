import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { captureException } from '@/lib/sentry';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    captureException(error, {
      tags: { boundary: 'subtree' },
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-muted-foreground">
                We're sorry, but there was an error loading this page. 
                Please try refreshing or contact support if the problem persists.
              </p>
            </div>
            
            <div className="space-y-4">
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
                Go to Homepage
              </Button>
            </div>

            {/* Basic navigation for guests */}
            <div className="mt-8 pt-8 border-t border-border">
              <h2 className="text-sm font-medium text-foreground mb-4">Quick Links</h2>
              <div className="space-y-2">
                <a 
                  href="/search" 
                  className="block text-primary hover:text-primary/80 transition-colors"
                >
                  Find Professionals
                </a>
                <a 
                  href="/login" 
                  className="block text-primary hover:text-primary/80 transition-colors"
                >
                  Join Community
                </a>
                <a 
                  href="/about" 
                  className="block text-primary hover:text-primary/80 transition-colors"
                >
                  About Us
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;