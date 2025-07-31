import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Search, 
  Users, 
  MessageCircle, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

interface MentorProfile {
  user_id: string;
  profiles: {
    full_name: string;
  };
  sector: string;
  occupation: string;
  country: string;
  city: string;
  bio: string;
  skills: string[];
  availability: string;
  experience_years: number;
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
    full_name: string;
  };
  mentor_profile?: {
    profiles: {
      full_name: string;
    };
    sector: string;
    occupation: string;
  };
}

const Mentorship = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [requestMessage, setRequestMessage] = useState("");

  useEffect(() => {
    if (user) {
      loadMentors();
      loadRequests();
    }
  }, [user]);

  const loadMentors = async () => {
    try {
      // Get professional profiles with mentor flag
      const { data: profilesData, error: profilesError } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('is_mentor', true)
        .neq('user_id', user?.id);

      if (profilesError) throw profilesError;

      // Get existing mentorship requests from current user to filter out already requested mentors
      const { data: existingRequests } = await supabase
        .from('mentorship_requests')
        .select('mentor_id, status')
        .eq('mentee_id', user?.id);

      // Filter out mentors who already have accepted requests or pending requests from current user
      const excludedMentorIds = existingRequests
        ?.filter(req => req.status === 'accepted' || req.status === 'pending')
        .map(req => req.mentor_id) || [];

      const availableProfilesData = profilesData?.filter(
        profile => !excludedMentorIds.includes(profile.user_id)
      ) || [];

      // Get corresponding user profiles
      const userIds = availableProfilesData?.map(p => p.user_id) || [];
      if (userIds.length === 0) {
        setMentors([]);
        return;
      }

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      if (usersError) throw usersError;

      // Combine the data
      const mentorsWithProfiles = availableProfilesData?.map(profile => ({
        ...profile,
        profiles: usersData?.find(u => u.user_id === profile.user_id) || { full_name: 'Unknown' }
      })) || [];

      setMentors(mentorsWithProfiles);
    } catch (error) {
      console.error('Error loading mentors:', error);
    }
  };

  const loadRequests = async () => {
    try {
      // Get requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('mentorship_requests')
        .select('*')
        .or(`mentor_id.eq.${user?.id},mentee_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Get mentee profiles
      const menteeIds = requestsData.map(r => r.mentee_id);
      const { data: menteesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', menteeIds);

      // Get mentor profiles
      const mentorIds = requestsData.map(r => r.mentor_id);
      const { data: mentorsData } = await supabase
        .from('professional_profiles')
        .select('user_id, sector, occupation')
        .in('user_id', mentorIds);

      const { data: mentorNamesData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', mentorIds);

      // Combine the data
      const requestsWithProfiles = requestsData.map(request => ({
        ...request,
        profiles: menteesData?.find(m => m.user_id === request.mentee_id) || { full_name: 'Unknown' },
        mentor_profile: {
          profiles: mentorNamesData?.find(m => m.user_id === request.mentor_id) || { full_name: 'Unknown' },
          ...mentorsData?.find(m => m.user_id === request.mentor_id) || { sector: '', occupation: '' }
        }
      }));

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMentorshipRequest = async () => {
    if (!selectedMentor || !requestMessage.trim()) return;

    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .insert({
          mentor_id: selectedMentor.user_id,
          mentee_id: user?.id,
          message: requestMessage,
          skills_requested: [],
        });

      if (error) throw error;

      toast({
        title: "Request sent!",
        description: "Your mentorship request has been sent successfully.",
      });

      setSelectedMentor(null);
      setRequestMessage("");
      await loadRequests();
      await loadMentors(); // Refresh mentors list to remove requested mentor
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send request.",
        variant: "destructive",
      });
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request updated",
        description: `Request ${status} successfully.`,
      });

      await loadRequests();
      await loadMentors(); // Refresh mentors list to show available mentors again if declined
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update request.",
        variant: "destructive",
      });
    }
  };

  const filteredMentors = mentors.filter(mentor =>
    mentor.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mentor.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              MuslimsPros Mentorship - السلام عليكم
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
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMentors.map((mentor) => (
                      <Card key={mentor.user_id} className="shadow-soft hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                              <span className="text-primary-foreground font-semibold">
                                {mentor.profiles.full_name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{mentor.profiles.full_name}</h3>
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
                                    ? `Request from ${request.profiles.full_name}`
                                    : `Request to ${request.mentor_profile?.profiles.full_name}`
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

                            {request.status === 'accepted' && (
                              <Button size="sm" variant="outline">
                                <Calendar className="w-4 h-4 mr-2" />
                                Schedule Session
                              </Button>
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

      {/* Request Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Request Mentorship</CardTitle>
              <p className="text-sm text-muted-foreground">
                Send a request to {selectedMentor.profiles.full_name}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  className="w-full mt-1 p-3 border rounded-md resize-none"
                  rows={4}
                  placeholder="Introduce yourself and explain what you're looking for in a mentor..."
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={sendMentorshipRequest}
                  disabled={!requestMessage.trim()}
                  className="flex-1"
                >
                  Send Request
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedMentor(null);
                    setRequestMessage("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Mentorship;