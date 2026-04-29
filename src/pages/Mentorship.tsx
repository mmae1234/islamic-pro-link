import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MentorshipSearchFilters from "@/components/MentorshipSearchFilters";
import {
  Search,
  Users,
  MessageCircle,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import {
  useMentors,
  useMentorshipRequests,
  useRequestMentorship,
  useUpdateMentorshipRequestStatus,
  useCancelMentorshipRequest,
  useDisconnectFromMentor,
  type MentorProfile,
} from "@/hooks/queries";

type AdvancedFilters = {
  searchTerm?: string;
  country?: string;
  stateProvince?: string;
  sector?: string;
  occupation?: string;
  experienceMin?: string;
  experienceMax?: string;
  skills?: string[];
  universities?: string[];
  languages?: string[];
  gender?: string;
};

const Mentorship = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({});
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [disconnectTarget, setDisconnectTarget] = useState<{ id: string; name: string } | null>(null);

  // Redirect to auth gate if not authenticated.
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth-gate?redirect=/mentorship", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const mentorsQuery = useMentors(user?.id);
  const requestsQuery = useMentorshipRequests(user?.id);

  const requestMentorship = useRequestMentorship(user?.id);
  const updateStatus = useUpdateMentorshipRequestStatus(user?.id);
  const cancelRequest = useCancelMentorshipRequest(user?.id);
  const disconnect = useDisconnectFromMentor(user?.id);

  // Surface load failures (matches old behavior).
  useEffect(() => {
    if (mentorsQuery.error) {
      toast({
        title: "Failed to load mentors",
        description: "Please refresh the page and try again.",
        variant: "destructive",
      });
    }
  }, [mentorsQuery.error, toast]);

  // Apply search term + advanced filters client-side over the cached mentors.
  const filteredMentors = useMemo(() => {
    let mentors: MentorProfile[] = mentorsQuery.data ?? [];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      mentors = mentors.filter((mentor) => {
        const fullName = `${mentor.profiles.first_name || ""} ${mentor.profiles.last_name || ""}`.trim().toLowerCase();
        return (
          fullName.includes(q) ||
          mentor.sector?.toLowerCase().includes(q) ||
          mentor.occupation?.toLowerCase().includes(q) ||
          mentor.skills?.some((s) => s.toLowerCase().includes(q))
        );
      });
    }

    const f = advancedFilters;

    if (f.searchTerm) {
      const q = f.searchTerm.toLowerCase();
      mentors = mentors.filter((mentor) => {
        const fullName = `${mentor.profiles.first_name || ""} ${mentor.profiles.last_name || ""}`.trim().toLowerCase();
        return (
          fullName.includes(q) ||
          mentor.sector?.toLowerCase().includes(q) ||
          mentor.occupation?.toLowerCase().includes(q) ||
          mentor.bio?.toLowerCase().includes(q) ||
          mentor.skills?.some((s) => s.toLowerCase().includes(q))
        );
      });
    }
    if (f.country && f.country !== "all") {
      mentors = mentors.filter((m) => m.country === f.country);
    }
    if (f.stateProvince && f.stateProvince !== "all") {
      mentors = mentors.filter((m) => m.state_province === f.stateProvince);
    }
    if (f.sector && f.sector !== "all") {
      mentors = mentors.filter((m) => m.sector === f.sector);
    }
    if (f.occupation && f.occupation !== "all") {
      mentors = mentors.filter((m) => m.occupation === f.occupation);
    }
    if (f.experienceMin) {
      const min = parseInt(f.experienceMin, 10);
      if (!Number.isNaN(min)) {
        mentors = mentors.filter((m) => (m.experience_years ?? 0) >= min);
      }
    }
    if (f.experienceMax) {
      const max = parseInt(f.experienceMax, 10);
      if (!Number.isNaN(max)) {
        mentors = mentors.filter((m) => (m.experience_years ?? 0) <= max);
      }
    }
    if (f.skills && f.skills.length > 0) {
      mentors = mentors.filter((m) =>
        m.skills?.some((s) => f.skills!.includes(s)),
      );
    }
    if (f.universities && f.universities.length > 0) {
      mentors = mentors.filter((m) =>
        f.universities!.includes(m.university ?? ""),
      );
    }
    if (f.languages && f.languages.length > 0) {
      mentors = mentors.filter((m) =>
        m.languages?.some((l) => f.languages!.includes(l)),
      );
    }
    if (f.gender && f.gender !== "all") {
      mentors = mentors.filter((m) => m.gender === f.gender);
    }

    return mentors;
  }, [mentorsQuery.data, searchTerm, advancedFilters]);

  const requests = requestsQuery.data ?? [];
  const isLoading = mentorsQuery.isLoading || requestsQuery.isLoading;

  const sendMentorshipRequest = () => {
    if (!selectedMentor || !requestMessage.trim() || requestMentorship.isPending) return;
    if (requestMessage.trim().length < 30) {
      toast({
        title: "Message too short",
        description: "Please write at least 30 characters introducing yourself.",
        variant: "destructive",
      });
      return;
    }
    requestMentorship.mutate(
      {
        mentorUserId: selectedMentor.user_id,
        message: requestMessage.trim(),
        skillsRequested: [],
      },
      {
        onSuccess: () => {
          toast({
            title: "Request sent!",
            description: "Your mentorship request has been sent successfully.",
          });
          setSelectedMentor(null);
          setRequestMessage("");
        },
        onError: (error: any) =>
          toast({
            title: "Could not send request",
            description: error?.message || "Please try again later.",
            variant: "destructive",
          }),
      },
    );
  };

  const handleUpdateStatus = (requestId: string, status: string) =>
    updateStatus.mutate(
      { requestId, status },
      {
        onSuccess: () =>
          toast({
            title: "Request updated",
            description: `Request ${status} successfully.`,
          }),
        onError: (err: any) =>
          toast({
            title: "Error",
            description: err?.message || "Failed to update request.",
            variant: "destructive",
          }),
      },
    );

  const handleCancelRequest = (requestId: string) =>
    cancelRequest.mutate(requestId, {
      onSuccess: () =>
        toast({
          title: "Request cancelled",
          description: "Your mentorship request has been cancelled successfully.",
        }),
      onError: (err: any) =>
        toast({
          title: "Error",
          description: err?.message || "Failed to cancel request.",
          variant: "destructive",
        }),
    });

  const performDisconnect = () => {
    if (!disconnectTarget) return;
    const { id: requestId, name: mentorName } = disconnectTarget;
    disconnect.mutate(requestId, {
      onSuccess: () =>
        toast({
          title: "Disconnected successfully",
          description: `You have disconnected from ${mentorName}.`,
        }),
      onError: (err: any) =>
        toast({
          title: "Error",
          description: err?.message || "Failed to disconnect from mentor.",
          variant: "destructive",
        }),
      onSettled: () => setDisconnectTarget(null),
    });
  };

  const disconnectFromMentor = (requestId: string, mentorName: string) =>
    setDisconnectTarget({ id: requestId, name: mentorName });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "declined":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  if (authLoading || isLoading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Muslim Professionals Mentorship - السلام عليكم
            </h1>
            <p className="text-lg text-muted-foreground">
              Connect with experienced Muslim professionals and grow your career with Islamic values. Build meaningful relationships guided by Islamic principles of helping one another.
            </p>
          </div>

          <Tabs defaultValue="find-mentors" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="find-mentors" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Find Mentors
              </TabsTrigger>
              <TabsTrigger value="my-requests" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                My Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="find-mentors" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search by name, sector, occupation, or skills..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                      />
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Advanced Filters */}
              <MentorshipSearchFilters onSearch={setAdvancedFilters} loading={false} />

              <Card>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMentors.map((mentor) => (
                      <Card key={mentor.user_id} className="shadow-soft hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                              <span className="text-primary-foreground font-semibold">
                                {`${mentor.profiles.first_name || ''} ${mentor.profiles.last_name || ''}`.trim().split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{`${mentor.profiles.first_name || ''} ${mentor.profiles.last_name || ''}`.trim() || 'Unknown'}</h3>
                              <p className="text-sm text-muted-foreground">{mentor.occupation}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Badge variant="secondary">{mentor.sector}</Badge>
                            <Badge variant="outline">{mentor.country}</Badge>
                            {mentor.experience_years && (
                              <Badge variant="outline">{mentor.experience_years} years exp.</Badge>
                            )}
                          </div>

                          {mentor.skills && mentor.skills.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {mentor.skills.slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {mentor.skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{mentor.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          {mentor.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {mentor.bio}
                            </p>
                          )}

                          {mentor.availability && (
                            <p className="text-sm">
                              <span className="font-medium">Available: </span>
                              {mentor.availability}
                            </p>
                          )}

                          <Button
                            className="w-full"
                            onClick={() => setSelectedMentor(mentor)}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Request Mentorship
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredMentors.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No mentors found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search criteria or check back later.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-requests" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mentorship Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <Card key={request.id} className="shadow-soft">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {getStatusIcon(request.status)}
                                <h3 className="font-medium">
                                  {request.mentor_id === user?.id
                                    ? `Request from ${`${request.profiles.first_name || ''} ${request.profiles.last_name || ''}`.trim() || 'Unknown'}`
                                    : `Request to ${`${request.mentor_profile?.profiles.first_name || ''} ${request.mentor_profile?.profiles.last_name || ''}`.trim() || 'Unknown'}`
                                  }
                                </h3>
                                <Badge variant={
                                  request.status === 'accepted' ? 'default' :
                                  request.status === 'declined' ? 'destructive' :
                                  'secondary'
                                }>
                                  {request.status}
                                </Badge>
                              </div>

                              {request.mentor_profile && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {request.mentor_profile.occupation} • {request.mentor_profile.sector}
                                </p>
                              )}

                              <p className="text-sm text-muted-foreground mb-4">
                                {request.message}
                              </p>

                              <p className="text-xs text-muted-foreground">
                                Sent {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>

                            {request.mentor_id === user?.id && request.status === 'pending' && (
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(request.id, 'accepted')}
                                  disabled={updateStatus.isPending}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(request.id, 'declined')}
                                  disabled={updateStatus.isPending}
                                >
                                  Decline
                                </Button>
                              </div>
                            )}

                            {request.mentee_id === user?.id && request.status === 'pending' && (
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleCancelRequest(request.id)}
                                  disabled={cancelRequest.isPending}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel Request
                                </Button>
                              </div>
                            )}

                            {request.status === 'accepted' && (
                              <div className="flex gap-2 ml-4">
                                <Button size="sm" variant="outline">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  Schedule Session
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => disconnectFromMentor(
                                    request.id,
                                    request.mentor_id === user?.id
                                      ? `${request.profiles.first_name || ''} ${request.profiles.last_name || ''}`.trim() || 'Unknown'
                                      : `${request.mentor_profile?.profiles.first_name || ''} ${request.mentor_profile?.profiles.last_name || ''}`.trim() || 'Unknown'
                                  )}
                                >
                                  Disconnect
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {requests.length === 0 && (
                      <div className="text-center py-12">
                        <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No requests yet</h3>
                        <p className="text-muted-foreground">
                          Start by requesting mentorship from experienced professionals.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Request Mentorship Dialog */}
      <Dialog
        open={!!selectedMentor}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMentor(null);
            setRequestMessage("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Mentorship</DialogTitle>
            {selectedMentor && (
              <DialogDescription>
                Send a request to {`${selectedMentor.profiles.first_name || ''} ${selectedMentor.profiles.last_name || ''}`.trim() || 'this mentor'}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mentorship-message">Message</Label>
              <Textarea
                id="mentorship-message"
                rows={4}
                placeholder="Introduce yourself and explain what you're looking for in a mentor (at least 30 characters)..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {requestMessage.trim().length}/30 characters minimum
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedMentor(null);
                  setRequestMessage("");
                }}
                disabled={requestMentorship.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={sendMentorshipRequest}
                disabled={requestMessage.trim().length < 30 || requestMentorship.isPending}
              >
                {requestMentorship.isPending ? 'Sending…' : 'Send Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disconnect confirmation */}
      <AlertDialog open={!!disconnectTarget} onOpenChange={(open) => !open && setDisconnectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect from mentor?</AlertDialogTitle>
            <AlertDialogDescription>
              {disconnectTarget && `Are you sure you want to disconnect from ${disconnectTarget.name}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performDisconnect}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
};

export default Mentorship;
