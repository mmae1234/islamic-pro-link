import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Heart, 
  Users, 
  MessageCircle, 
  MapPin, 
  Briefcase,
  Trash2
} from "lucide-react";

interface FavoriteProfessional {
  id: string;
  professional_id: string;
  created_at: string;
  professional_profile: {
    user_id: string;
    occupation: string;
    sector: string;
    city: string;
    country: string;
    bio: string;
    avatar_url: string;
    skills: string[];
    is_mentor: boolean;
    availability: string;
    profiles: {
      full_name: string;
    };
  };
}

interface FavoriteMentor {
  id: string;
  mentor_id: string;
  mentee_id: string;
  status: string;
  created_at: string;
  mentor_profile: {
    user_id: string;
    occupation: string;
    sector: string;
    city: string;
    country: string;
    bio: string;
    avatar_url: string;
    skills: string[];
    availability: string;
    profiles: {
      full_name: string;
    };
  };
}

const Favorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favoriteProfessionals, setFavoriteProfessionals] = useState<FavoriteProfessional[]>([]);
  const [favoriteMentors, setFavoriteMentors] = useState<FavoriteMentor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      // Load favorite professionals - using simpler query without join
      const { data: favProfs, error: favProfsError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id);

      if (favProfsError) throw favProfsError;

      // Load professional profiles separately
      if (favProfs && favProfs.length > 0) {
        const professionalIds = favProfs.map(fav => fav.professional_id);
        const { data: professionals, error: profError } = await supabase
          .from('professional_profiles')
          .select(`
            *,
            profiles!professional_profiles_user_id_fkey(full_name)
          `)
          .in('user_id', professionalIds);

        if (profError) throw profError;

        // Combine favorites with professional data
        const combinedFavorites = favProfs.map(fav => ({
          ...fav,
          professional_profile: professionals?.find(prof => prof.user_id === fav.professional_id) || null
        })).filter(fav => fav.professional_profile);

        setFavoriteProfessionals(combinedFavorites as any);
      } else {
        setFavoriteProfessionals([]);
      }

      // Load mentorship requests (as favorite mentors)
      const { data: mentorRequests, error: mentorError } = await supabase
        .from('mentorship_requests')
        .select('*')
        .eq('mentee_id', user.id);

      if (mentorError) throw mentorError;

      // Load mentor profiles separately if there are requests
      if (mentorRequests && mentorRequests.length > 0) {
        const mentorIds = mentorRequests.map(req => req.mentor_id);
        const { data: mentorProfiles, error: mentorProfError } = await supabase
          .from('professional_profiles')
          .select(`
            *,
            profiles!professional_profiles_user_id_fkey(full_name)
          `)
          .in('user_id', mentorIds);

        if (mentorProfError) throw mentorProfError;

        // Combine requests with mentor data
        const combinedMentors = mentorRequests.map(req => ({
          ...req,
          mentor_profile: mentorProfiles?.find(prof => prof.user_id === req.mentor_id) || null
        })).filter(req => req.mentor_profile);

        setFavoriteMentors(combinedMentors as any);
      } else {
        setFavoriteMentors([]);
      }
    } catch (error: any) {
      console.error('Error loading favorites:', error);
      toast({
        title: "Error",
        description: "Failed to load your favorites.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeFavoriteProfessional = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavoriteProfessionals(prev => prev.filter(fav => fav.id !== favoriteId));
      toast({
        title: "Removed from favorites",
        description: "Professional removed from your favorites.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (recipientId: string, recipientName: string) => {
    // Redirect to messages page with pre-selected recipient
    window.location.href = `/messages?recipient=${recipientId}&name=${encodeURIComponent(recipientName)}`;
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
              My Favorites
            </h1>
            <p className="text-lg text-muted-foreground">
              Keep track of professionals and mentors you're interested in connecting with.
            </p>
          </div>

          <Tabs defaultValue="professionals" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="professionals" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Favorite Professionals ({favoriteProfessionals.length})
              </TabsTrigger>
              <TabsTrigger value="mentors" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Mentorship Connections ({favoriteMentors.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="professionals" className="space-y-6">
              {favoriteProfessionals.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No favorite professionals yet</h3>
                    <p className="text-muted-foreground">
                      Start exploring professionals and add them to your favorites for easy access.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {favoriteProfessionals.map((favorite) => (
                    <Card key={favorite.id} className="shadow-soft hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                            {favorite.professional_profile.avatar_url ? (
                              <img 
                                src={favorite.professional_profile.avatar_url} 
                                alt="Avatar" 
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-primary-foreground font-semibold text-lg">
                                {favorite.professional_profile.profiles.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-foreground mb-1">
                                  {favorite.professional_profile.profiles.full_name}
                                </h3>
                                <p className="text-lg text-primary font-medium">
                                  {favorite.professional_profile.occupation}
                                </p>
                                <div className="flex items-center text-muted-foreground text-sm mb-2">
                                  <Briefcase className="w-4 h-4 mr-1" />
                                  {favorite.professional_profile.sector}
                                  {favorite.professional_profile.city && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <MapPin className="w-4 h-4 mr-1" />
                                      {favorite.professional_profile.city}, {favorite.professional_profile.country}
                                    </>
                                  )}
                                </div>
                                {favorite.professional_profile.bio && (
                                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                    {favorite.professional_profile.bio}
                                  </p>
                                )}
                                {favorite.professional_profile.skills && favorite.professional_profile.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-3">
                                    {favorite.professional_profile.skills.slice(0, 3).map((skill, index) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {favorite.professional_profile.skills.length > 3 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{favorite.professional_profile.skills.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {favorite.professional_profile.is_mentor && (
                                  <Badge className="mb-3">
                                    <Users className="w-3 h-3 mr-1" />
                                    Available as Mentor
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                onClick={() => sendMessage(
                                  favorite.professional_profile.user_id, 
                                  favorite.professional_profile.profiles.full_name
                                )}
                                className="flex items-center gap-2"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Send Message
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => removeFavoriteProfessional(favorite.id)}
                                className="flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mentors" className="space-y-6">
              {favoriteMentors.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No mentorship connections</h3>
                    <p className="text-muted-foreground">
                      Request mentorship from professionals to see them here.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {favoriteMentors.map((request) => (
                    <Card key={request.id} className="shadow-soft hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                            {request.mentor_profile.avatar_url ? (
                              <img 
                                src={request.mentor_profile.avatar_url} 
                                alt="Avatar" 
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-primary-foreground font-semibold text-lg">
                                {request.mentor_profile.profiles.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-foreground mb-1">
                                  {request.mentor_profile.profiles.full_name}
                                </h3>
                                <p className="text-lg text-primary font-medium">
                                  {request.mentor_profile.occupation}
                                </p>
                                <div className="flex items-center text-muted-foreground text-sm mb-2">
                                  <Briefcase className="w-4 h-4 mr-1" />
                                  {request.mentor_profile.sector}
                                  {request.mentor_profile.city && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <MapPin className="w-4 h-4 mr-1" />
                                      {request.mentor_profile.city}, {request.mentor_profile.country}
                                    </>
                                  )}
                                </div>
                                {request.mentor_profile.bio && (
                                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                    {request.mentor_profile.bio}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge 
                                    variant={
                                      request.status === 'accepted' ? 'default' : 
                                      request.status === 'pending' ? 'secondary' : 'destructive'
                                    }
                                  >
                                    Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                  </Badge>
                                  {request.mentor_profile.availability && (
                                    <Badge variant="outline">
                                      Available: {request.mentor_profile.availability}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2">
                              <Button 
                                onClick={() => sendMessage(
                                  request.mentor_profile.user_id, 
                                  request.mentor_profile.profiles.full_name
                                )}
                                className="flex items-center gap-2"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Send Message
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Favorites;