import { personName, personInitials } from "@/lib/displayName";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, AlertTriangle, User, MessageCircle, Calendar, FileText, Ban } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Header from "@/components/Header";
import AdminBusinessVerification from "@/components/AdminBusinessVerification";
import AdminOrganizations from "@/components/AdminOrganizations";
import Footer from "@/components/Footer";
import { getErrorMessage } from "@/lib/errors";
import type { ProfileNameSlice } from "@/hooks/queries/types";

// New moderation columns/tables aren't in the generated types yet.
const db = supabase as unknown as SupabaseClient;

type ReportStatus = "open" | "resolved" | "dismissed";
type EvidenceMessage = { id: string; from: "reported" | "reporter"; content: string; created_at: string };

type AbuseReport = {
  id: string;
  created_at: string;
  reason: string;
  details: string | null;
  conversation_id: string | null;
  reporter_id: string;
  accused_id: string;
  message_id: string | null;
  status: ReportStatus;
  admin_note: string | null;
  evidence: EvidenceMessage[] | null;
  reporter_profile: ProfileNameSlice;
  accused_profile: ProfileNameSlice;
};

type AbuseReportRaw = Omit<AbuseReport, "reporter_profile" | "accused_profile" | "status"> & {
  status?: ReportStatus | null;
  reporter_profile: ProfileNameSlice | ProfileNameSlice[] | null;
  accused_profile: ProfileNameSlice | ProfileNameSlice[] | null;
};

const FALLBACK_NAME: ProfileNameSlice = { first_name: "Unknown", last_name: "" };

const pickProfile = (
  p: ProfileNameSlice | ProfileNameSlice[] | null,
): ProfileNameSlice =>
  Array.isArray(p) ? p[0] ?? FALLBACK_NAME : p ?? FALLBACK_NAME;

const fullName = (p: ProfileNameSlice) => personName(p) || "Unknown";

const AdminReports = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reports, setReports] = useState<AbuseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState<"open" | "all">("open");
  const [suspended, setSuspended] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<{ userId: string; name: string; suspend: boolean; reason: string } | null>(null);

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
      // profiles.role is only an account type (visitor/professional/business).
      // Platform admin rights live in user_roles — check them the same way RLS does.
      const { data: isAdminResult, error: adminError } = await supabase.rpc('is_admin', {
        _user_id: user.id,
      });
      if (adminError) throw adminError;

      setIsAdmin(isAdminResult === true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const loadReports = async () => {
    try {
      // abuse_reports' foreign keys point at auth.users, not profiles, so a
      // PostgREST embed fails ("Could not find a relationship"). Load the
      // reports, then the names (admins can read all profiles).
      const { data, error } = await db
        .from("abuse_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const base = (data ?? []) as Array<Record<string, unknown>>;
      const ids = [
        ...new Set(base.flatMap((r) => [r.reporter_id as string, r.accused_id as string]).filter(Boolean)),
      ];
      const names = new Map<string, ProfileNameSlice>();
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, display_name")
          .in("user_id", ids);
        for (const p of (profs ?? []) as Array<{ user_id: string; first_name: string | null; last_name: string | null; display_name: string | null }>)
          names.set(p.user_id, { first_name: personName(p), last_name: "" });
      }
      const rows = base.map((r) => ({
        ...r,
        reporter_profile: names.get(r.reporter_id as string) ?? null,
        accused_profile: names.get(r.accused_id as string) ?? null,
      })) as unknown as AbuseReportRaw[];
      setReports(
        rows.map((row) => ({
          ...row,
          message_id: row.message_id ?? null,
          admin_note: row.admin_note ?? null,
          evidence: row.evidence ?? null,
          status: row.status ?? "open",
          reporter_profile: pickProfile(row.reporter_profile),
          accused_profile: pickProfile(row.accused_profile),
        })),
      );

      const { data: susp, error: suspError } = await db.from("member_suspensions").select("user_id");
      if (!suspError) setSuspended(new Set(((susp ?? []) as Array<{ user_id: string }>).map((r) => r.user_id)));
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: getErrorMessage(error) || "Failed to load reports.",
        variant: "destructive",
      });
    }
  };

  const setStatus = async (report: AbuseReport, status: ReportStatus) => {
    setBusy(report.id);
    const { error } = await db.rpc("admin_update_report", {
      _report_id: report.id,
      _status: status,
      _note: notes[report.id] ?? null,
    });
    setBusy(null);
    if (error) {
      toast({ title: "Couldn't update report", description: getErrorMessage(error), variant: "destructive" });
      return;
    }
    toast({ title: status === "open" ? "Report reopened" : status === "resolved" ? "Marked resolved" : "Dismissed" });
    loadReports();
  };

  const confirmSuspend = async () => {
    if (!suspendTarget) return;
    const { userId, suspend, reason } = suspendTarget;
    setBusy(userId);
    const { data, error } = await supabase.functions.invoke("admin-suspend-user", {
      body: { userId, suspend, reason: reason.trim() || undefined },
    });
    setBusy(null);
    setSuspendTarget(null);
    const failure = error ? getErrorMessage(error) : (data as { error?: string } | null)?.error;
    if (failure) {
      toast({ title: "Couldn't update member", description: failure, variant: "destructive" });
      return;
    }
    toast({
      title: suspend ? "Member suspended" : "Member restored",
      description: suspend
        ? "They can't sign in, message anyone, or appear in the directory."
        : "They can sign in and appear in the directory again.",
    });
    loadReports();
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

  const visible = filter === "open" ? reports.filter((r) => r.status === "open") : reports;

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
              {reports.filter((r) => r.status === "open").length} open of {reports.length} total. Each report keeps a copy
              of the last 30 messages between the two members, taken when it was filed.
            </p>
          </div>

          <AdminOrganizations />
          <AdminBusinessVerification />

          <div className="flex gap-2 mb-4">
            <Button size="sm" variant={filter === "open" ? "default" : "outline"} onClick={() => setFilter("open")}>
              Open
            </Button>
            <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
              All
            </Button>
          </div>

          {visible.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {filter === "open" ? "No open reports" : "No reports yet"}
                </h3>
                <p className="text-muted-foreground">
                  Community reports will appear here when members report someone.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {visible.map((report) => {
                const accusedName = fullName(report.accused_profile);
                const isSuspended = suspended.has(report.accused_id);
                return (
                  <Card key={report.id} className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="flex flex-wrap items-center gap-2">
                        {getReasonIcon(report.reason)}
                        <span className="capitalize">{report.reason}</span>
                        <Badge variant={getReasonColor(report.reason)}>
                          {report.message_id ? "Message" : report.conversation_id ? "Conversation" : "Profile"}
                        </Badge>
                        <Badge variant={report.status === "open" ? "destructive" : "secondary"} className="capitalize">
                          {report.status}
                        </Badge>
                        {isSuspended && <Badge variant="outline">Member suspended</Badge>}
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          Reported by{" "}
                          <Link to={`/profile/${report.reporter_id}`} className="underline">
                            {fullName(report.reporter_profile)}
                          </Link>
                        </span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-foreground">Reported member</h4>
                        <Link
                          to={`/profile/${report.accused_id}`}
                          className="inline-flex items-center gap-2 p-3 bg-muted rounded-lg font-medium hover:underline"
                        >
                          {accusedName}
                        </Link>
                      </div>

                      {report.details && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            What the reporter said
                          </h4>
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm text-foreground whitespace-pre-wrap">{report.details}</p>
                          </div>
                        </div>
                      )}

                      {report.evidence && report.evidence.length > 0 ? (
                        <div className="space-y-2">
                          <h4 className="font-medium text-foreground flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Messages between them (copy taken when reported)
                          </h4>
                          <div className="max-h-80 overflow-y-auto space-y-2 p-3 border rounded-lg">
                            {report.evidence.map((m) => (
                              <div
                                key={m.id}
                                className={`text-sm p-2 rounded-md ${
                                  m.id === report.message_id
                                    ? "bg-destructive/10 border border-destructive"
                                    : m.from === "reported"
                                      ? "bg-muted"
                                      : "bg-background border"
                                }`}
                              >
                                <p className="text-xs text-muted-foreground mb-1">
                                  {m.from === "reported" ? accusedName : fullName(report.reporter_profile)} ·{" "}
                                  {new Date(m.created_at).toLocaleString()}
                                  {m.id === report.message_id && " · reported message"}
                                </p>
                                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No messages on file for this report (profile report, or filed before message copies were kept).
                        </p>
                      )}

                      {report.admin_note && (
                        <p className="text-sm">
                          <span className="font-medium">Your note:</span> {report.admin_note}
                        </p>
                      )}

                      <div className="space-y-3 pt-4 border-t">
                        <Textarea
                          placeholder="Private note (optional), saved when you change the status"
                          value={notes[report.id] ?? ""}
                          onChange={(e) => setNotes((n) => ({ ...n, [report.id]: e.target.value }))}
                          rows={2}
                          maxLength={1000}
                        />
                        <div className="flex flex-wrap gap-2">
                          {report.status === "open" ? (
                            <>
                              <Button size="sm" disabled={busy === report.id} onClick={() => setStatus(report, "resolved")}>
                                Mark resolved
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy === report.id}
                                onClick={() => setStatus(report, "dismissed")}
                              >
                                Dismiss
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="outline" disabled={busy === report.id} onClick={() => setStatus(report, "open")}>
                              Reopen
                            </Button>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/messages?recipient=${report.reporter_id}`}>Message reporter</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant={isSuspended ? "outline" : "destructive"}
                            disabled={busy === report.accused_id}
                            onClick={() =>
                              setSuspendTarget({ userId: report.accused_id, name: accusedName, suspend: !isSuspended, reason: report.reason })
                            }
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            {isSuspended ? "Restore member" : "Suspend member"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <AlertDialog open={!!suspendTarget} onOpenChange={(o) => !o && setSuspendTarget(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {suspendTarget?.suspend ? `Suspend ${suspendTarget?.name}?` : `Restore ${suspendTarget?.name}?`}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {suspendTarget?.suspend
                    ? "They'll be signed out within the hour and can't sign back in, send or receive messages, or appear in the directory. Their data is kept, and you can restore them later."
                    : "They'll be able to sign in, message, and appear in the directory again."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmSuspend}>
                  {suspendTarget?.suspend ? "Suspend" : "Restore"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminReports;