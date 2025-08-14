import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Smartphone, ExternalLink } from 'lucide-react';

interface IOSSafeguardProps {
  children: React.ReactNode;
}

const IOSSafeguard = ({ children }: IOSSafeguardProps) => {
  const [showIOSWarning, setShowIOSWarning] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Log device info for debugging
    console.log('IOSSafeguard: Device detection', {
      isIOS,
      userAgent: navigator.userAgent
    });
    
    // Always proceed to ready state - let the app handle issues gracefully
    setIsReady(true);
  }, []);

  const dismissWarning = () => {
    setShowIOSWarning(false);
    setIsReady(true);
  };

  if (showIOSWarning) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-warning" />
            </div>
            <CardTitle className="text-lg">iOS Compatibility Notice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                <p>
                  We've detected you're using iOS Safari, which may have compatibility issues with our platform.
                </p>
              </div>
              
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium text-foreground mb-2">For the best experience:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Use Chrome or Firefox on iOS</li>
                  <li>• Disable private browsing mode</li>
                  <li>• Allow cookies and local storage</li>
                  <li>• Update to the latest iOS version</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={dismissWarning}
                className="w-full"
                variant="default"
              >
                Continue Anyway
              </Button>
              
              <Button 
                onClick={() => window.open('https://www.google.com/chrome/', '_blank')}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Download Chrome for iOS
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              This message will auto-dismiss in 10 seconds
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default IOSSafeguard;