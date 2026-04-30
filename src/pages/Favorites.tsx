import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Trash2,
} from "lucide-react";
import {
  useFavoriteProfessionals,
  useFavoriteBusinesses,
  useFavoriteMentors,
  useRemoveFavoriteProfessional,
  useRemoveFavoriteBusiness,
} from "@/hooks/queries";

const Favorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const professionalsQuery = useFavoriteProfessionals(user?.id);
  const businessesQuery = useFavoriteBusinesses(user?.id);
  const mentorsQuery = useFavoriteMentors(user?.id);

  const removeProfessional = useRemoveFavoriteProfessional(user?.id);
  const removeBusiness = useRemoveFavoriteBusiness(user?.id);

  const favoriteProfessionals = professionalsQuery.data ?? [];
  const favoriteBusinesses = businessesQuery.data ?? [];
  const favoriteMentors = mentorsQuery.data ?? [];

  const loading =
    professionalsQuery.isLoading ||
    businessesQuery.isLoading ||
    mentorsQuery.isLoading;

  // Surface load failures.
  const anyError =
    professionalsQuery.error || businessesQuery.error || mentorsQuery.error;
  if (anyError) {
    console.error("Error loading favorites:", anyError);
  }

  const handleRemoveProfessional = (favoriteId: string) =>
    removeProfessional.mutate(favoriteId, {
      onSuccess: () =>
        toast({
          title: "Removed from favorites",
          description: "Professional removed from your favorites.",
        }),
      onError: (err: Error) =>
        toast({
          title: "Error",
          description: err?.message || "Failed to remove favorite.",
          variant: "destructive",
        }),
    });

  const handleRemoveBusiness = (businessId: string) =>
    removeBusiness.mutate(businessId, {
      onSuccess: () =>
        toast({
          title: "Removed from favorites",
          description: "Business removed from your favorites.",
        }),
      onError: (err: Error) =>
        toast({
          title: "Error",
          description: err?.message || "Could not remove favorite.",
          variant: "destructive",
        }),
    });

  const sendMessage = (recipientId: string, recipientName: string) => {
    // SPA navigation — preserves session and avoids full reload
    navigate(`/messages?recipient=${recipientId}&name=${encodeURIComponent(recipientName)}`);
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
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto gap-1 sm:gap-0">
              <TabsTrigger value="professionals" className="flex items-center justify-center gap-2 w-full text-xs sm:text-sm whitespace-normal sm:whitespace-nowrap py-2">
                <Heart className="w-4 h-4 shrink-0" />
                <span className="truncate">Professionals ({favoriteProfessionals.length})</span>
              </TabsTrigger>
              <TabsTrigger value="mentors" className="flex items-center justify-center gap-2 w-full text-xs sm:text-sm whitespace-normal sm:whitespace-nowrap py-2">
                <Users className="w-4 h-4 shrink-0" />
                <span className="truncate">Mentorship ({favoriteMentors.length})</span>
              </TabsTrigger>
              <TabsTrigger value="businesses" className="flex items-center justify-center gap-2 w-full text-xs sm:text-sm whitespace-normal sm:whitespace-nowrap py-2">
                <Briefcase className="w-4 h-4 shrink-0" />
                <span className="truncate">Businesses ({favoriteBusinesses.length})</span>
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
                                {`${favorite.professional_profile.profiles.first_name?.[0] || ''}${favorite.professional_profile.profiles.last_name?.[0] || ''}` || 'U'}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-foreground mb-1">
                                  {`${favorite.professional_profile.profiles.first_name || ''} ${favorite.professional_profile.profiles.last_name || ''}`.trim() || 'Anonymous User'}
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
                                  `${favorite.professional_profile.profiles.first_name || ''} ${favorite.professional_profile.profiles.last_name || ''}`.trim() || 'Anonymous User'
                                )}
                                className="flex items-center gap-2"
                              >
                                <MessageCircle className="w-4 h-4" />
                                Send Message
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleRemoveProfessional(favorite.id)}
                                disabled={removeProfessional.isPending}
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

            <TabsContent value="businesses" className="space-y-6">
              {favoriteBusinesses.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No favorite businesses yet</h3>
                    <p className="text-muted-foreground">
                      Browse businesses and add them to your favorites from the search page.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {favoriteBusinesses.map((biz) => (
                    <Card key={biz.id} className="shadow-soft hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {biz.logo_url ? (
                              <img src={biz.logo_url} alt={`${biz.name || 'Business'} logo`} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-primary-foreground font-semibold text-lg">{biz.name?.[0] || 'B'}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-foreground mb-1">{biz.name || 'Business'}</h3>
                                {biz.sector && (
                                  <p className="text-lg text-primary font-medium">{biz.sector}</p>
                                )}
                                <div className="flex items-center text-muted-foreground text-sm mb-2">
                                  {(biz.city || biz.state || biz.country) && (
                                    <>
                                      <MapPin className="w-4 h-4 mr-1" />
                                      <span>{[biz.city, biz.state, biz.country].filter(Boolean).join(', ')}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button asChild variant="accent" className="flex items-center gap-2">
                                <Link to={`/business/${biz.id}`}>View Business</Link>
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleRemoveBusiness(biz.id)}
                                disabled={removeBusiness.isPending}
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
                                {`${request.mentor_profile.profiles.first_name?.[0] || ''}${request.mentor_profile.profiles.last_name?.[0] || ''}` || 'U'}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-foreground mb-1">
                                  {`${request.mentor_profile.profiles.first_name || ''} ${request.mentor_profile.profiles.last_name || ''}`.trim() || 'Anonymous User'}
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
                                  `${request.mentor_profile.profiles.first_name || ''} ${request.mentor_profile.profiles.last_name || ''}`.trim() || 'Anonymous User'
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
