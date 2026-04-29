import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchFilters from "@/components/SearchFilters";
import SearchSorting from "@/components/SearchSorting";
import ProfessionalCard from "@/components/ProfessionalCard";
import ProfileSetup from "@/components/ProfileSetup";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2 } from "lucide-react";


const Search = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user) {
      checkUserProfile();
    }
  }, [user]);

  const checkUserProfile = async () => {
    if (!user) return;

    try {
      // Check if user has a basic profile first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // If user has a basic profile, they've completed the setup
      setHasProfile(!!profileData);
      if (!profileData) {
        setShowProfileSetup(true);
      } else {
        // Load initial professionals
        handleSearch({});
      }
    } catch (error: any) {
      console.error('Error checking profile:', error);
      if (toast) {
        toast({
          title: "Error",
          description: "Failed to check your profile status.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSearch = async (filters: any = {}) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('list_professional_directory', {
        _country: filters.country && filters.country !== 'all' ? filters.country : null,
        _state_province: filters.stateProvince && filters.stateProvince !== 'all' ? filters.stateProvince : null,
        _city: filters.city && filters.city !== 'all' ? filters.city : null,
        _sector: filters.sector && filters.sector !== 'all' ? filters.sector : null,
        _occupation: filters.occupation && filters.occupation !== 'all' ? filters.occupation : null,
        _is_mentor: filters.isMentor ? true : null,
        _is_seeking_mentor: filters.isSeekingMentor ? true : null,
        _search: filters.searchTerm || null,
        _limit: 50,
        _offset: 0,
      });

      if (error) {
        console.error('Directory RPC error:', error);
        setProfessionals([]);
        toast({
          title: "Unable to load profiles",
          description: "Please try refreshing the page or contact support.",
          variant: "destructive",
        });
        return;
      }

      // Shape rows to match ProfessionalCard expectations (it reads professional.profiles.first_name/last_name/avatar_url)
      let rows = (data || []).map((r: any) => ({
        ...r,
        profiles: {
          first_name: r.first_name,
          last_name: r.last_name,
          avatar_url: r.avatar_url,
        },
      }));

      // Client-side post-filters that the RPC doesn't expose yet
      if (filters.experienceMin) {
        const min = parseInt(filters.experienceMin);
        rows = rows.filter((r: any) => (r.experience_years ?? 0) >= min);
      }
      if (filters.experienceMax) {
        const max = parseInt(filters.experienceMax);
        rows = rows.filter((r: any) => (r.experience_years ?? 0) <= max);
      }

      // Apply client-side sort
      if (sortBy === 'name') {
        rows.sort((a: any, b: any) => {
          const an = `${a.first_name || ''} ${a.last_name || ''}`.trim();
          const bn = `${b.first_name || ''} ${b.last_name || ''}`.trim();
          return sortOrder === 'asc' ? an.localeCompare(bn) : bn.localeCompare(an);
        });
      }

      setProfessionals(rows);
    } catch (error: any) {
      console.error('Error searching professionals:', error);
      setProfessionals([]);
      toast({
        title: "Search failed",
        description: "Unable to load professional profiles. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false);
    setHasProfile(true);
    handleSearch({});
  };

  if (showProfileSetup && user) {
    return <ProfileSetup onComplete={handleProfileSetupComplete} />;
  }

  if (hasProfile === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Find Muslim Professionals Network
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Search and connect with Muslim professionals across various industries and locations worldwide.
          </p>
        </div>

        {!hasProfile && (
          <Alert className="mb-8 border-primary/20 bg-primary/5">
            <Users className="h-4 w-4" />
            <AlertDescription>
              Complete your professional profile to start connecting with other professionals and access all features.
            </AlertDescription>
          </Alert>
        )}

        {/* Search Filters */}
        <SearchFilters onSearch={handleSearch} loading={isLoading} />

        {/* Results */}
        <div className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-foreground">
              Search Results ({professionals.length} professionals found)
            </h2>
            
            {professionals.length > 0 && (
              <SearchSorting
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(newSortBy, newSortOrder) => {
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                  // Re-sort current results
                  const sorted = [...professionals].sort((a, b) => {
                    let aVal = a[newSortBy];
                    let bVal = b[newSortBy];
                    
                    if (newSortBy === 'name') {
                      aVal = `${a.profiles?.first_name || ''} ${a.profiles?.last_name || ''}`.trim();
                      bVal = `${b.profiles?.first_name || ''} ${b.profiles?.last_name || ''}`.trim();
                    }
                    
                    if (typeof aVal === 'string' && typeof bVal === 'string') {
                      return newSortOrder === 'asc' 
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                    }
                    
                    return newSortOrder === 'asc' 
                      ? (aVal || 0) - (bVal || 0)
                      : (bVal || 0) - (aVal || 0);
                  });
                  setProfessionals(sorted);
                }}
              />
            )}
          </div>

          {isLoading ? (
            <div className="grid gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-fade-in">
                  <Card className="shadow-soft shimmer-effect">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="h-16 w-16 bg-muted rounded-full animate-pulse-soft"></div>
                        <div className="space-y-3 flex-1">
                          <div className="h-5 bg-muted rounded animate-pulse-soft w-3/4"></div>
                          <div className="h-4 bg-muted rounded animate-pulse-soft w-1/2"></div>
                          <div className="h-4 bg-muted rounded animate-pulse-soft w-2/3"></div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="h-3 bg-muted rounded animate-pulse-soft w-full"></div>
                        <div className="h-3 bg-muted rounded animate-pulse-soft w-4/5"></div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <div className="h-6 w-16 bg-muted rounded animate-pulse-soft"></div>
                        <div className="h-6 w-20 bg-muted rounded animate-pulse-soft"></div>
                        <div className="h-6 w-14 bg-muted rounded animate-pulse-soft"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : professionals.length === 0 ? (
            <Card className="shadow-soft">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No professionals found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search filters or check back later as more professionals join the platform.
                </p>
              </CardContent>
            </Card>
          ) : (
             <div className="space-y-6">
               <div className="grid gap-6 animate-fade-in">
                 {professionals.map((professional, index) => (
                   <div 
                     key={professional.id}
                     className="animate-fade-in-up"
                     style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
                      onClick={() => {
                        // Track profile view
                        (async () => {
                          try {
                            await supabase
                              .from('profile_views')
                              .insert({
                                viewer_id: user?.id || null,
                                viewed_profile_id: professional.user_id,
                                ip_address: null,
                                user_agent: navigator.userAgent
                              });
                            console.log('Profile view tracked');
                          } catch (err) {
                            console.error('Failed to track profile view:', err);
                          }
                        })();
                      }}
                   >
                      <ProfessionalCard
                        professional={professional}
                        showMentorshipButton={false}
                        showFavoriteButton={true}
                        onRequestSent={() => {
                          toast({
                            title: "Added to favorites!",
                            description: "Professional added to your favorites.",
                          });
                        }}
                      />
                   </div>
                ))}
                </div>
              </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Search;