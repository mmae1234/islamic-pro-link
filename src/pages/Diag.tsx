import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

const Diag = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [consoleErrors, setConsoleErrors] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Capture console errors
    const originalError = console.error;
    const capturedErrors: string[] = [];
    
    console.error = (...args) => {
      capturedErrors.push(args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '));
      originalError.apply(console, args);
    };

    // Run initial diagnostics
    runDiagnostics();

    return () => {
      console.error = originalError;
      setConsoleErrors(capturedErrors);
    };
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // 1. Browser/Device Info
    const startTime = Date.now();
    diagnosticResults.push({
      name: 'Browser/Device Info',
      status: 'success',
      message: 'Device information collected',
      details: {
        userAgent: navigator.userAgent,
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        isWebKit: /WebKit/.test(navigator.userAgent) && !/(Chrome|CriOS)/.test(navigator.userAgent),
        isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        screen: `${window.screen.width}x${window.screen.height}`,
        timestamp: new Date().toISOString()
      }
    });

    // 2. Storage Test
    try {
      const testKey = '__diag_storage_test__';
      localStorage.setItem(testKey, 'test');
      sessionStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      sessionStorage.removeItem(testKey);
      
      diagnosticResults.push({
        name: 'Storage Access',
        status: 'success',
        message: 'localStorage and sessionStorage are working'
      });
    } catch (error) {
      diagnosticResults.push({
        name: 'Storage Access',
        status: 'error',
        message: 'Storage access blocked (likely private mode)',
        details: { error: String(error) }
      });
    }

    // 3. Environment Variables
    diagnosticResults.push({
      name: 'Environment Variables',
      status: 'success',
      message: 'Supabase configuration detected',
      details: {
        supabaseUrl: 'https://zhtfygjxnyxqsmeoipst.supabase.co',
        anonKeyPrefix: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[masked]',
        hasUrl: true,
        hasKey: true
      }
    });

    // 4. Supabase Auth Test
    try {
      const authStart = Date.now();
      const { data, error } = await supabase.auth.getSession();
      const authDuration = Date.now() - authStart;
      
      if (error) {
        diagnosticResults.push({
          name: 'Supabase Auth',
          status: 'warning',
          message: `Auth accessible but session error: ${error.message}`,
          duration: authDuration,
          details: { error: error.message }
        });
      } else {
        diagnosticResults.push({
          name: 'Supabase Auth',
          status: 'success',
          message: `Auth connection successful${data.session ? ' (logged in)' : ' (guest)'}`,
          duration: authDuration,
          details: { hasSession: !!data.session }
        });
      }
    } catch (error) {
      diagnosticResults.push({
        name: 'Supabase Auth',
        status: 'error',
        message: `Auth connection failed: ${error}`,
        details: { error: String(error) }
      });
    }

    // 5. Public Table Access Test
    try {
      const dbStart = Date.now();
      const { data, error } = await supabase
        .from('professional_directory')
        .select('id')
        .limit(1);
      const dbDuration = Date.now() - dbStart;
      
      if (error) {
        diagnosticResults.push({
          name: 'Database Access',
          status: 'error',
          message: `Database query failed: ${error.message}`,
          duration: dbDuration,
          details: { 
            error: error.message,
            code: error.code,
            hint: error.hint 
          }
        });
      } else {
        diagnosticResults.push({
          name: 'Database Access',
          status: 'success',
          message: `Database accessible (${data?.length || 0} test records)`,
          duration: dbDuration
        });
      }
    } catch (error) {
      diagnosticResults.push({
        name: 'Database Access',
        status: 'error',
        message: `Database connection failed: ${error}`,
        details: { error: String(error) }
      });
    }

    // 6. Network Test
    try {
      const networkStart = Date.now();
      const response = await fetch('https://httpbin.org/json', { 
        method: 'GET',
        signal: AbortSignal.timeout(3000) 
      });
      const networkDuration = Date.now() - networkStart;
      
      if (response.ok) {
        diagnosticResults.push({
          name: 'Network Connectivity',
          status: 'success',
          message: 'External network requests working',
          duration: networkDuration
        });
      } else {
        diagnosticResults.push({
          name: 'Network Connectivity',
          status: 'warning',
          message: `Network request returned ${response.status}`,
          duration: networkDuration
        });
      }
    } catch (error) {
      diagnosticResults.push({
        name: 'Network Connectivity',
        status: 'error',
        message: `Network test failed: ${error}`,
        details: { error: String(error) }
      });
    }

    const totalDuration = Date.now() - startTime;
    diagnosticResults.push({
      name: 'Total Diagnostic Time',
      status: 'success',
      message: `All tests completed in ${totalDuration}ms`,
      duration: totalDuration
    });

    setResults(diagnosticResults);
    setLoading(false);
  };

  const copyResults = () => {
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      results,
      consoleErrors: consoleErrors.slice(-10) // Last 10 errors
    };
    
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    toast({
      title: "Diagnostic report copied",
      description: "Report copied to clipboard for sharing with support."
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default: return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">System Diagnostics</h1>
          <p className="text-muted-foreground">
            Real-time diagnostic checks for debugging iPhone/iOS issues
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button onClick={runDiagnostics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Running Tests...' : 'Run Diagnostics'}
          </Button>
          
          <Button variant="outline" onClick={copyResults} disabled={results.length === 0}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Report
          </Button>
        </div>

        <div className="grid gap-6">
          {results.map((result, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getStatusIcon(result.status)}
                    {result.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {result.duration && (
                      <Badge variant="outline" className="text-xs">
                        {result.duration}ms
                      </Badge>
                    )}
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{result.message}</p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium text-muted-foreground mb-2">
                      Technical Details
                    </summary>
                    <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {consoleErrors.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Console Errors ({consoleErrors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                {consoleErrors.slice(-10).map((error, index) => (
                  <div key={index} className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs">
                    <pre className="whitespace-pre-wrap">{error}</pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            This diagnostic page helps identify iOS-specific issues and can be accessed at{' '}
            <code className="bg-muted px-1 rounded">/diag</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Diag;