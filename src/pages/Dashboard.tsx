import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Tbl } from "@/hooks/queries/types";

type ProfileRow = Tbl<"profiles">;
type ProfessionalProfileRow = Tbl<"professional_profiles">;
import { 
  Loader2, 
  User, 
  Briefcase, 
  Users, 
  MessageCircle, 
  Building2, 
  Search, 
  Settings, 
  Eye,
  Star,
  CheckCircle,
  Clock,
  ArrowRight,
  Bell
} from "lucide-react";

interface DashboardStats {
  profileViews: number;
  favoritesCount: number;
  mentorshipRequests: number;
  unreadMessages: number;
}

interface NotificationPreview {
  id: string;
  type: 'message' | 'mentorship_request';
  title: string;
  description: string;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [professionalProfile, setProfessionalProfile] = useState<any>(null);
  const [businessAccount, setBusinessAccount] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    profileViews: 0,
    favoritesCount: 0,
    mentorshipRequests: 0,
    unreadMessages: 0
  });
  const [notifications, setNotifications] = useState<NotificationPreview[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;
    
    try {
      // Load basic profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setProfile(profileData);

      // Redirect business users to business dashboard
      if (profileData?.role === 'business') {
        navigate('/dashboard/business');
        return;
      }

      // Load professional profile
      const { data: professionalData } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setProfessionalProfile(professionalData);

      // Load business account if exists
      const { data: businessData } = await supabase
        .from('business_accounts')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      setBusinessAccount(businessData);

      // Load stats in parallel
      const [viewsRes, favoritesRes, requestsRes, messagesRes] = await Promise.all([
        supabase.from('profile_views').select('id').eq('viewed_profile_id', user.id),
        supabase.from('favorites').select('id').eq('user_id', user.id),
        supabase.from('mentorship_requests').select('id').eq('mentor_id', user.id).eq('status', 'pending'),
        supabase.from('messages').select('id').eq('recipient_id', user.id).is('read_at', null)
      ]);

      setStats({
        profileViews: viewsRes.data?.length || 0,
        favoritesCount: favoritesRes.data?.length || 0,
        mentorshipRequests: requestsRes.data?.length || 0,
        unreadMessages: messagesRes.data?.length || 0
      });

      // Load recent notifications (messages + mentorship requests)
      await loadNotifications();

      // Load pending mentorship requests for quick actions
      await loadPendingRequests();

      // Calculate profile completion
      calculateProfileCompletion(profileData, professionalData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    const notifications: NotificationPreview[] = [];

    // Load recent messages
    const { data: messages } = await supabase
      .from('messages')
      .select(`
        id, created_at, sender_id,
        profiles!messages_sender_id_fkey(first_name, last_name)
      `)
      .eq('recipient_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(3);

    messages?.forEach(msg => {
      const profileData = Array.isArray(msg.profiles) ? msg.profiles[0] : msg.profiles;
      const senderName = profileData 
        ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() 
        : 'Someone';
      
      notifications.push({
        id: `msg-${msg.id}`,
        type: 'message',
        title: 'New Message',
        description: `${senderName} sent you a message`,
        created_at: msg.created_at
      });
    });

    // Load recent mentorship requests
    const { data: requests } = await supabase
      .from('mentorship_requests')
      .select(`
        id, created_at, mentee_id,
        profiles!mentorship_requests_mentee_id_fkey(first_name, last_name)
      `)
      .eq('mentor_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(2);

    requests?.forEach(req => {
      const profileData = Array.isArray(req.profiles) ? req.profiles[0] : req.profiles;
      const requesterName = profileData 
        ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() 
        : 'Someone';
      
      notifications.push({
        id: `req-${req.id}`,
        type: 'mentorship_request',
        title: 'Mentorship Request',
        description: `${requesterName} wants you as a mentor`,
        created_at: req.created_at
      });
    });

    // Sort by creation date and limit to 5
    notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setNotifications(notifications.slice(0, 5));
  };

  const loadPendingRequests = async () => {
    if (!user) return;

    const { data: requests } = await supabase
      .from('mentorship_requests')
      .select(`
        id, message, created_at, mentee_id,
        profiles!mentorship_requests_mentee_id_fkey(first_name, last_name, avatar_url)
      `)
      .eq('mentor_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(3);

    setPendingRequests(requests || []);
  };

  const calculateProfileCompletion = (
    profileData: ProfileRow | null,
    professionalData: ProfessionalProfileRow | null,
  ) => {
    const fields = [
      profileData?.first_name,
      profileData?.last_name,
      professionalData?.bio,
      professionalData?.country,
      professionalData?.city,
      professionalData?.sector,
      professionalData?.occupation,
      (professionalData?.skills?.length ?? 0) > 0,
      professionalData?.experience_years,
    ];

    const filledFields = fields.filter(field => field).length;
    const completion = Math.round((filledFields / fields.length) * 100);
    setProfileCompletion(completion);
  };

  const handleMentorshipAction = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      const { error } = await supabase
        .from('mentorship_requests')
        .update({ status: action === 'accept' ? 'accepted' : 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: `Request ${action}ed`,
        description: `Mentorship request has been ${action}ed.`,
      });

      loadPendingRequests();
      loadNotifications();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update request.",
        variant: "destructive",
      });
    }
  };

  const getUserDisplayName = () => {
    if (profile?.first_name || profile?.last_name) {
      return `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getAvatarUrl = () => {
    return profile?.avatar_url || professionalProfile?.avatar_url;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Welcome Section */}
          <Card className="shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={getAvatarUrl()} alt={getUserDisplayName()} />
                  <AvatarFallback className="text-lg">
                    {getUserDisplayName().split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Welcome back, {getUserDisplayName()}!
                  </h1>
                  <p className="text-muted-foreground">
                    {profile?.role === 'professional' ? 'Professional' : 'Visitor'} • {user?.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Quick Actions */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button asChild variant="outline" className="h-20 flex-col gap-2">
                      <Link to="/edit-profile">
                        <User className="w-5 h-5" />
                        <span className="text-sm">Edit Profile</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex-col gap-2">
                      <Link to="/search">
                        <Search className="w-5 h-5" />
                        <span className="text-sm">Find Professionals</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex-col gap-2">
                      <Link to="/businesses">
                        <Building2 className="w-5 h-5" />
                        <span className="text-sm">Find Businesses</span>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-20 flex-col gap-2">
                      <Link to="/messages">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm">Messages</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications Preview */}
              <Card className="shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/messages" className="flex items-center gap-1">
                      View all <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No recent notifications</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="flex items-start gap-3 p-3 rounded-lg border">
                          <div className="mt-1">
                            {notification.type === 'message' ? (
                              <MessageCircle className="w-4 h-4 text-primary" />
                            ) : (
                              <Users className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Mentorship Requests */}
              {pendingRequests.length > 0 && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Pending Mentorship Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pendingRequests.map((request) => {
                        const profileData = Array.isArray(request.profiles) ? request.profiles[0] : request.profiles;
                        const requesterName = profileData 
                          ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() 
                          : 'Someone';
                        
                        return (
                          <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={profileData?.avatar_url} alt={requesterName} />
                                <AvatarFallback>
                                  {requesterName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{requesterName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {request.message ? request.message.slice(0, 60) + '...' : 'Wants mentorship'}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleMentorshipAction(request.id, 'accept')}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleMentorshipAction(request.id, 'decline')}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Profile Completion */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Profile Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">{profileCompletion}%</span>
                    </div>
                    <Progress value={profileCompletion} className="h-2" />
                    {profileCompletion < 100 && (
                      <div className="text-sm text-muted-foreground">
                        <p>Complete your profile to get discovered by more professionals!</p>
                        <Button asChild size="sm" className="mt-2" variant="outline">
                          <Link to="/edit-profile">Complete Profile</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stats */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">Your Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Profile Views</span>
                      </div>
                      <span className="font-medium">{stats.profileViews}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Favorites</span>
                      </div>
                      <span className="font-medium">{stats.favoritesCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Unread Messages</span>
                      </div>
                      <span className="font-medium">{stats.unreadMessages}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Mentorship Requests</span>
                      </div>
                      <span className="font-medium">{stats.mentorshipRequests}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;