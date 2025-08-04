import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  User, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Calendar, 
  MessageCircle,
  Users,
  Star,
  Heart
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [professionalProfile, setProfessionalProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (userId) {
      loadProfile();
      if (user && user.id !== userId) {
        checkFavoriteStatus();
      }
    }
  }, [userId, user]);

  const loadProfile = async () => {
    try {
      // Load basic profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load professional profile
      const { data: professionalData, error: professionalError } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (professionalError && professionalError.code !== 'PGRST116') {
        console.error('Error loading professional profile:', professionalError);
      } else if (professionalData) {
        setProfessionalProfile(professionalData);
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
          {/* Profile Header */}
          <Card className="shadow-soft mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                  <Avatar className="w-24 h-24">
                   <AvatarImage src={professionalProfile?.avatar_url || profile?.avatar_url} />
                   <AvatarFallback className="text-2xl">
                     {`${profile?.first_name || ''}${profile?.last_name || ''}`.charAt(0).toUpperCase() || 'U'}
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
                        <Button variant="secondary" size="sm">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
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
                  {professionalProfile?.experience_years !== null && (
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
      
      <Footer />
    </div>
  );
};

export default Profile;