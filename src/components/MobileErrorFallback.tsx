import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Wifi, AlertTriangle } from "lucide-react";

interface MobileErrorFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

const MobileErrorFallback = ({ 
  error, 
  onRetry, 
  title = "Content Unavailable",
  description = "We're experiencing technical difficulties. Please try again." 
}: MobileErrorFallbackProps) => {
  const isNetworkError = error?.message?.includes('network') || error?.message?.includes('fetch');
  const isPermissionError = error?.message?.includes('permission') || error?.message?.includes('unauthorized');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            {isNetworkError ? (
              <Wifi className="w-6 h-6 text-destructive" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-destructive" />
            )}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            {isPermissionError 
              ? "Please check your internet connection and try again."
              : isNetworkError
              ? "Unable to connect to our servers. Please check your internet connection."
              : description
            }
          </p>
          
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="outline" 
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          
          <div className="space-y-2">
            <Button 
              variant="default" 
              className="w-full" 
              onClick={() => window.location.href = '/'}
            >
              Go to Homepage
            </Button>
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileErrorFallback;