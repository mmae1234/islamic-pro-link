import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Home } from 'lucide-react';
import { captureException } from '@/lib/sentry';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class LazyRouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('LazyRouteErrorBoundary caught error:', error, errorInfo);
    // Lazy chunk-load failures show up here; tagging them lets us split out
    // network/CDN issues from genuine runtime bugs in dashboards.
    const isModuleError =
      /module|import|script|chunk|loading css/i.test(error?.message ?? '');
    captureException(error, {
      tags: { boundary: 'lazy-route', module_load_failure: String(isModuleError) },
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isModuleError = this.state.error?.message?.includes('module') || 
                            this.state.error?.message?.includes('import') ||
                            this.state.error?.message?.includes('script');

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {isModuleError ? 'Page Loading Issue' : 'Something went wrong'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isModuleError 
                ? 'The page couldn\'t load properly. This can happen due to network issues. Please try again.'
                : 'We encountered an unexpected error. Please try refreshing the page.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleRetry} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LazyRouteErrorBoundary;
