import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  XCircle
} from "lucide-react";
import { Link } from "react-router-dom";

interface MentorProfile {
  user_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  sector: string;
  occupation: string;
  country: string;
  state_province?: string;
  city: string;
  bio: string;
  skills: string[];
  availability: string;
  experience_years: number;
  university?: string;
  languages?: string[];
  gender?: string;
}

interface MentorshipRequest {
  id: string;
  status: string;
  message: string;
  skills_requested: string[];
  created_at: string;
  mentor_id: string;
  mentee_id: string;
  profiles: {
    first_name: string;
    last_name: string;
  };
  mentor_profile?: {
    profiles: {
      first_name: string;
      last_name: string;
    };
    sector: string;
    occupation: string;
  };
}

const Mentorship = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [allMentors, setAllMentors] = useState<MentorProfile[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState<{ id: string; name: string } | null>(null);
  const [scheduleTarget, setScheduleTarget] = useState<MentorshipRequest | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleDuration, setScheduleDuration] = useState("60");
  const [scheduleMeetingLink, setScheduleMeetingLink] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [schedulingSession, setSchedulingSession] = useState(false);

  const submitScheduleSession = async () => {
    if (!scheduleTarget || !scheduleDate || !scheduleTime) {
      toast({ title: "Missing info", description: "Please pick a date and time.", variant: "destructive" });
      return;
    }
    setSchedulingSession(true);
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      if (isNaN(scheduledAt.getTime())) throw new Error("Invalid date/time");
      const { error } = await supabase.from('mentorship_sessions').insert({
        request_id: scheduleTarget.id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: parseInt(scheduleDuration) || 60,
        meeting_link: scheduleMeetingLink || null,
        notes: scheduleNotes || null,
      });
      if (error) throw error;
      toast({ title: "Session scheduled", description: "Your mentorship session has been scheduled." });
      setScheduleTarget(null);
      setScheduleDate("");
      setScheduleTime("");
      setScheduleDuration("60");
      setScheduleMeetingLink("");
      setScheduleNotes("");
    } catch (error: any) {
      toast({ title: "Error scheduling session", description: error.message, variant: "destructive" });
    } finally {
      setSchedulingSession(false);
    }
  };

  // Redirect to auth gate if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth-gate?redirect=/mentorship', { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadMentors();
      loadRequests();
    }
  }, [user]);

  const loadMentors = async () => {
    try {
      // Use SECURITY DEFINER RPC — returns only safe directory fields and respects blocks
      const { data: mentorsData, error: mentorsError } = await supabase.rpc('list_professional_directory', {
        _is_mentor: true,
        _limit: 100,
      });

      if (mentorsError) {
        console.error('Error loading mentors:', mentorsError);
        if (toast) {
          toast({
            title: "Failed to load mentors",
            description: "Please refresh the page and try again.",
            variant: "destructive",
          });
        }
        setMentors([]);
        setAllMentors([]);
        return;
      }

      // Filter out mentors already requested
      const { data: existingRequests } = await supabase
        .from('mentorship_requests')
        .select('mentor_id, status')
        .eq('mentee_id', user?.id);

      const excludedMentorIds = existingRequests
        ?.filter(req => req.status === 'accepted' || req.status === 'pending')
        .map(req => req.mentor_id) || [];

      const mentorsWithProfiles = (mentorsData || [])
        .filter((m: any) => !excludedMentorIds.includes(m.user_id))
        .map((m: any) => ({
          ...m,
          profiles: { first_name: m.first_name, last_name: m.last_name },
        }));

      setMentors(mentorsWithProfiles);
      setAllMentors(mentorsWithProfiles);
    } catch (error) {
      console.error('Error loading mentors:', error);
    }
  };

  const loadRequests = async () => {
    try {
      // Split cross-column .or() into two parallel queries (iOS-safe).
      const [{ data: asMentor, error: errMentor }, { data: asMentee, error: errMentee }] = await Promise.all([
        supabase
          .from('mentorship_requests')
          .select('*')
          .eq('mentor_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('mentorship_requests')
          .select('*')
          .eq('mentee_id', user?.id)
          .order('created_at', { ascending: false }),
      ]);

      if (errMentor) throw errMentor;
      if (errMentee) throw errMentee;

      const requestsData = [...(asMentor || []), ...(asMentee || [])]
        .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        setIsLoading(false);
        return;
      }

      // Get mentee profiles
      const menteeIds = requestsData.map(r => r.mentee_id);
      const { data: menteesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', menteeIds);

      // Get mentor profiles
      const mentorIds = requestsData.map(r => r.mentor_id);
      const { data: mentorsData } = await supabase
        .from('professional_profiles')
        .select('user_id, sector, occupation')
        .in('user_id', mentorIds);

      const { data: mentorNamesData } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', mentorIds);

      // Combine the data
      const requestsWithProfiles = requestsData.map(request => ({
        ...request,
        profiles: menteesData?.find(m => m.user_id === request.mentee_id) || { first_name: 'Unknown', last_name: '' },
        mentor_profile: {
          profiles: mentorNamesData?.find(m => m.user_id === request.mentor_id) || { first_name: 'Unknown', last_name: '' },
          ...mentorsData?.find(m => m.user_id === request.mentor_id) || { sector: '', occupation: '' }
        }
      }));

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMentorshipRequest = async () => {
    if (!selectedMentor || !requestMessage.trim() || sendingRequest) return;
    if (requestMessage.trim().length < 30) {
      toast({
        title: "Message too short",
        description: "Please write at least 30 characters introducing yourself.",
        variant: "destructive",
      });
      return;
    }

    setSendingRequest(true);
    try {
      const { error } = await supabase.rpc('request_mentorship', {
        _mentor_id: selectedMentor.user_id,
        _message: requestMessage.trim(),
        _skills_requested: [],
      });

      if (error) throw error;

      toast({
        title: "Request sent!",
        description: "Your mentorship request has been sent successfully.",
      });

      setSelectedMentor(null);
      setRequestMessage("");
      await loadRequests();
      await loadMentors();
    } catch (error: any) {
      toast({
        title: "Could not send request",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSendingRequest(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      if (toast) {
        toast({
          title: "Request updated",
          description: `Request ${status} successfully.`,
        });
      }

      await loadRequests();
      await loadMentors(); // Refresh mentors list to show available mentors again if declined
    } catch (error: any) {
      if (toast) {
        toast({
          title: "Error",
          description: error.message || "Failed to update request.",
          variant: "destructive",
        });
      }
    }
  };

  const cancelMentorshipRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;

      if (toast) {
        toast({
          title: "Request cancelled",
          description: "Your mentorship request has been cancelled successfully.",
        });
      }

      await loadRequests();
      await loadMentors(); // Refresh mentors list to show available mentors again
    } catch (error: any) {
      if (toast) {
        toast({
          title: "Error",
          description: error.message || "Failed to cancel request.",
          variant: "destructive",
        });
      }
    }
  };

  const performDisconnect = async () => {
    if (!disconnectTarget) return;
    const { id: requestId, name: mentorName } = disconnectTarget;

    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ 
          status: 'disconnected',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Disconnected successfully",
        description: `You have disconnected from ${mentorName}.`,
      });

      await loadRequests();
      await loadMentors();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to disconnect from mentor.",
        variant: "destructive",
      });
    } finally {
      setDisconnectTarget(null);
    }
  };

  const disconnectFromMentor = (requestId: string, mentorName: string) => {
    setDisconnectTarget({ id: requestId, name: mentorName });
  };

  const handleMentorSearch = (filters: any) => {
    let filteredMentors = [...allMentors];

    // Apply search term filter (from the search input)
    if (searchTerm) {
      filteredMentors = filteredMentors.filter(mentor => {
        const fullName = `${mentor.profiles.first_name || ''} ${mentor.profiles.last_name || ''}`.trim();
        return fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mentor.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      });
    }

    // Apply advanced filters
    if (filters.searchTerm) {
      filteredMentors = filteredMentors.filter(mentor => {
        const fullName = `${mentor.profiles.first_name || ''} ${mentor.profiles.last_name || ''}`.trim();
        return fullName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          mentor.sector.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          mentor.occupation.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          mentor.bio?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          mentor.skills?.some(skill => skill.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      });
    }

    if (filters.country && filters.country !== 'all') {
      filteredMentors = filteredMentors.filter(mentor => mentor.country === filters.country);
    }

    if (filters.stateProvince && filters.stateProvince !== 'all') {
      filteredMentors = filteredMentors.filter(mentor => mentor.state_province === filters.stateProvince);
    }

    if (filters.sector && filters.sector !== 'all') {
      filteredMentors = filteredMentors.filter(mentor => mentor.sector === filters.sector);
    }

    if (filters.occupation && filters.occupation !== 'all') {
      filteredMentors = filteredMentors.filter(mentor => mentor.occupation === filters.occupation);
    }

    if (filters.experienceMin) {
      const min = parseInt(filters.experienceMin);
      filteredMentors = filteredMentors.filter(mentor => 
        (mentor.experience_years ?? 0) >= min
      );
    }

    if (filters.experienceMax) {
      const max = parseInt(filters.experienceMax);
      filteredMentors = filteredMentors.filter(mentor => 
        (mentor.experience_years ?? 0) <= max
      );
    }

    if (filters.skills && filters.skills.length > 0) {
      filteredMentors = filteredMentors.filter(mentor =>
        mentor.skills?.some(skill => filters.skills.includes(skill))
      );
    }

    if (filters.universities && filters.universities.length > 0) {
      filteredMentors = filteredMentors.filter(mentor =>
        filters.universities.includes(mentor.university)
      );
    }

    if (filters.languages && filters.languages.length > 0) {
      filteredMentors = filteredMentors.filter(mentor =>
        mentor.languages?.some(lang => filters.languages.includes(lang))
      );
    }

    if (filters.gender && filters.gender !== 'all') {
      filteredMentors = filteredMentors.filter(mentor => mentor.gender === filters.gender);
    }

    setMentors(filteredMentors);
  };

  // Apply search term filtering when searchTerm changes
  useEffect(() => {
    handleMentorSearch({});
  }, [searchTerm, allMentors]);

  const filteredMentors = mentors;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'declined':
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
              <MentorshipSearchFilters onSearch={handleMentorSearch} loading={false} />

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
                                  onClick={() => updateRequestStatus(request.id, 'accepted')}
                                >
                                  Accept
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateRequestStatus(request.id, 'declined')}
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
                                  onClick={() => cancelMentorshipRequest(request.id)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Cancel Request
                                </Button>
                              </div>
                            )}

                            {request.status === 'accepted' && (
                              <div className="flex gap-2 ml-4">
                                <Button size="sm" variant="outline" onClick={() => setScheduleTarget(request)}>
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

      {/* Request Mentorship Dialog (proper a11y, focus trap, escape-to-close) */}
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
                disabled={sendingRequest}
              >
                Cancel
              </Button>
              <Button
                onClick={sendMentorshipRequest}
                disabled={requestMessage.trim().length < 30 || sendingRequest}
              >
                {sendingRequest ? 'Sending…' : 'Send Request'}
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