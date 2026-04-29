import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, User, MessageCircle, Calendar, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface AbuseReport {
  id: string;
  created_at: string;
  reason: string;
  details: string | null;
  conversation_id: string | null;
  reporter_profile: {
    first_name: string;
    last_name: string;
  };
  accused_profile: {
    first_name: string;
    last_name: string;
  };
}

const AdminReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      loadReports();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      // Use .maybeSingle() — .single() throws if no profile row exists yet,
      // showing a confusing error instead of a clean Access Denied screen.
      // Note: this is UI gating only. Real security comes from the
      // "Admins can view all reports" RLS policy on abuse_reports
      // (which uses is_admin(auth.uid()) — already in place).
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      setIsAdmin(profile?.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from('abuse_reports')
        .select(`
          *,
          reporter_profile:profiles!abuse_reports_reporter_id_fkey(first_name, last_name),
          accused_profile:profiles!abuse_reports_accused_id_fkey(first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load reports.",
        variant: "destructive",
      });
    }
  };

  const getReasonColor = (reason: string) => {
    if (reason.includes('harassment') || reason.includes('bullying') || reason.includes('threats')) {
      return 'destructive';
    }
    if (reason.includes('spam') || reason.includes('fake')) {
      return 'secondary';
    }
    return 'outline';
  };

  const getReasonIcon = (reason: string) => {
    if (reason.includes('harassment') || reason.includes('bullying') || reason.includes('threats')) {
      return <AlertTriangle className="w-4 h-4" />;
    }
    if (reason.includes('message') || reason.includes('conversation')) {
      return <MessageCircle className="w-4 h-4" />;
    }
    return <User className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access the admin reports panel.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              Abuse Reports
            </h1>
            <p className="text-lg text-muted-foreground">
              Review and manage community reports. Total reports: {reports.length}
            </p>
          </div>

          {reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-lg font-medium text-foreground mb-2">No reports yet</h3>
                <p className="text-muted-foreground">
                  Community reports will appear here when users report inappropriate content.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {reports.map((report) => (
                <Card key={report.id} className="shadow-soft">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {getReasonIcon(report.reason)}
                          <span className="capitalize">{report.reason}</span>
                          <Badge variant={getReasonColor(report.reason)}>
                            {report.conversation_id ? 'Message/Conversation' : 'Profile'}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            Reporter: {`${report.reporter_profile.first_name} ${report.reporter_profile.last_name}`}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-foreground">Reported User</h4>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                          <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground font-semibold text-xs">
                              {`${report.accused_profile.first_name} ${report.accused_profile.last_name}`.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium">
                            {`${report.accused_profile.first_name} ${report.accused_profile.last_name}`}
                          </span>
                        </div>
                      </div>
                      
                      {report.conversation_id && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground">Conversation ID</h4>
                          <div className="p-3 bg-muted rounded-lg font-mono text-xs">
                            {report.conversation_id}
                          </div>
                        </div>
                      )}
                    </div>

                    {report.details && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Additional Details
                        </h4>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-foreground">{report.details}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                      {report.conversation_id && (
                        <Button variant="outline" size="sm">
                          View Conversation
                        </Button>
                      )}
                      <Button variant="destructive" size="sm">
                        Take Action
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminReports;