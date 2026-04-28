import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Star, 
  Users, 
  Briefcase, 
  Calendar, 
  GraduationCap, 
  MapPin, 
  Heart,
  MessageCircle,
  MoreVertical,
  Flag
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ReportDialog from "@/components/ReportDialog";
import BlockUserButton from "@/components/BlockUserButton";

const Profile = () => {
  const { userId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [professionalProfile, setProfessionalProfile] = useState<any>(null);
  const [isLimitedView, setIsLimitedView] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // Anonymous users can't view profiles (RLS + lookup_profile_basic both require auth.uid()).
  // Bounce to auth-gate matching the directory privacy rule, preserving the deep link.
  useEffect(() => {
    if (!authLoading && !user && userId) {
      navigate(`/auth-gate?redirect=${encodeURIComponent(`/profile/${userId}`)}`, { replace: true });
    }
  }, [authLoading, user, userId, navigate]);

  useEffect(() => {
    if (userId && user) {
      loadProfile();
      if (user.id !== userId) {
        checkFavoriteStatus();
      }
    }
  }, [userId, user]);

  const loadProfile = async () => {
    try {
      // Try the related-party full read first (works when can_view_profile passes)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
        const { data: professionalData } = await supabase
          .from('professional_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (professionalData) setProfessionalProfile(professionalData);
        setIsLimitedView(false);
      } else {
        // Fallback: limited public view via SECURITY DEFINER RPC
        const { data: basic, error: basicErr } = await supabase
          .rpc('lookup_profile_basic', { _user_id: userId });
        if (basicErr) throw basicErr;
        const row = Array.isArray(basic) ? basic[0] : basic;
        if (row) {
          setProfile({
            user_id: row.user_id,
            first_name: row.first_name,
            last_name: row.last_name,
            avatar_url: row.avatar_url,
          });
          setProfessionalProfile({
            avatar_url: row.avatar_url,
            occupation: row.occupation,
            sector: row.sector,
            city: row.city,
            country: row.country,
          });
          setIsLimitedView(true);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user?.id)
        .eq('professional_id', userId)
        .maybeSingle();
      
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) return;

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('professional_id', userId);
        
        if (error) throw error;
        setIsFavorite(false);
        toast({
          title: "Removed from favorites",
          description: "This professional has been removed from your favorites.",
        });
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            professional_id: userId,
          });
        
        if (error) throw error;
        setIsFavorite(true);
        toast({
          title: "Added to favorites",
          description: "This professional has been added to your favorites.",
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">The requested profile could not be found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {isLimitedView && !isOwnProfile && (
            <Alert className="mb-6 border-primary/20 bg-primary/5">
              <AlertDescription>
                You're viewing a limited profile. <span className="font-medium">Connect with this professional</span> to see their full bio, skills, education, and contact preferences.
              </AlertDescription>
            </Alert>
          )}
          {/* Profile Header */}
          <Card className="shadow-soft mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                  <Avatar className="w-24 h-24">
                   <AvatarImage src={professionalProfile?.avatar_url || profile?.avatar_url} />
                   <AvatarFallback className="text-2xl">
                     {`${(profile?.first_name || '').charAt(0)}${(profile?.last_name || '').charAt(0)}`.toUpperCase() || 'U'}
                   </AvatarFallback>
                 </Avatar>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                       <div className="flex items-center gap-4">
                         <h1 className="text-3xl font-bold text-foreground mb-2">
                           {`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
                         </h1>
                         {isOwnProfile && (
                           <Button variant="outline" size="sm" asChild>
                             <Link to="/edit-profile">Edit Profile</Link>
                           </Button>
                         )}
                       </div>
                      {professionalProfile?.occupation && professionalProfile?.sector && (
                        <p className="text-lg text-muted-foreground mb-2">
                          {professionalProfile.occupation} • {professionalProfile.sector}
                        </p>
                      )}
                      {professionalProfile && (
                        <div className="space-y-2">
                          {(professionalProfile.city || professionalProfile.country) && (
                            <div className="flex items-center text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-2" />
                              {[professionalProfile.city, professionalProfile.state_province, professionalProfile.country].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {!isOwnProfile && user && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={toggleFavorite}
                        >
                          <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
                          {isFavorite ? 'Unfavorite' : 'Favorite'}
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => navigate(`/messages?userId=${userId}`)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => setShowReportDialog(true)}
                              className="text-destructive"
                            >
                              <Flag className="w-4 h-4 mr-2" />
                              Report Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <div className="w-full">
                                <BlockUserButton 
                                  targetUserId={userId!}
                                  targetUserName={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start p-0 h-auto text-destructive hover:text-destructive"
                                />
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              {professionalProfile?.bio && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground leading-relaxed">
                      {professionalProfile.bio}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Skills */}
              {professionalProfile?.skills && professionalProfile.skills.length > 0 && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {professionalProfile.skills.map((skill: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Mentorship */}
              {(professionalProfile?.is_mentor || professionalProfile?.is_seeking_mentor) && (
                <Card className="shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Mentorship
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {professionalProfile.is_mentor && (
                        <Badge variant="secondary" className="mr-2">
                          Available as Mentor
                        </Badge>
                      )}
                      {professionalProfile.is_seeking_mentor && (
                        <Badge variant="outline" className="mr-2">
                          Seeking Mentor
                        </Badge>
                      )}
                    </div>
                    {professionalProfile.availability && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground mb-1">Availability:</p>
                        <Badge variant="outline">{professionalProfile.availability}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Personal Information */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {professionalProfile?.languages && professionalProfile.languages.length > 0 && (
                    <div>
                      <p className="text-muted-foreground mb-2">Languages:</p>
                      <div className="flex flex-wrap gap-1">
                        {professionalProfile.languages.map((language: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {language}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {professionalProfile?.preferred_communication && (
                    <div>
                      <p className="text-muted-foreground mb-2">Preferred Communication:</p>
                      <div className="flex flex-wrap gap-1">
                        {professionalProfile.preferred_communication.map((method: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {method.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Details */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Professional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {professionalProfile && professionalProfile.experience_years != null && (
                    <div>
                      <div className="flex items-center text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        Experience
                      </div>
                      <p className="font-medium">
                        {professionalProfile.experience_years} years
                      </p>
                    </div>
                  )}
                  
                  {professionalProfile?.university && (
                    <div>
                      <div className="flex items-center text-muted-foreground mb-1">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Education
                      </div>
                      <p className="font-medium">
                        {professionalProfile.university}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        accusedId={userId!}
        accusedName={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
        reportType="profile"
      />
      
      <Footer />
    </div>
  );
};

export default Profile;