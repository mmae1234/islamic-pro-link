import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchFilters from "@/components/SearchFilters";
import SearchSorting from "@/components/SearchSorting";
import ProfessionalCard from "@/components/ProfessionalCard";
import ProfileSetup from "@/components/ProfileSetup";
import MobileErrorFallback from "@/components/MobileErrorFallback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2 } from "lucide-react";


const Search = () => {
  // Safe auth access with mobile fallback
  let user = null;
  let toast: ((props: any) => void) | null = null;
  
  try {
    const authContext = useAuth();
    user = authContext?.user || null;
    const toastContext = useToast();
    toast = toastContext.toast;
  } catch (error) {
    console.error('Search: Auth context not available, continuing as guest');
    // Continue as guest with fallback toast
    toast = null;
  }
  
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isGuest, setIsGuest] = useState(!user);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Prevent infinite loops with initialization flag
    if (initialized) return;
    
    setIsGuest(!user);
    setInitialized(true);
    
    if (user) {
      checkUserProfile();
    } else {
      // Load initial professionals for guests with error handling
      setTimeout(() => {
        handleSearch().catch(error => {
          console.error('Failed to load initial data for guest:', error);
          // Don't show toast errors for guests on mobile - just log
          setProfessionals([]);
        });
      }, 100);
    }
  }, [user, initialized]);

  const checkUserProfile = async () => {
    if (!user) return;

    try {
      // Check if user has a basic profile first
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

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
    // For guests, only allow initial load without filters
    if (isGuest && Object.keys(filters).length > 0) {
      // Only show toast if toast function is available
      if (toast) {
        toast({
          title: "Sign up required",
          description: "Create a free account to use search filters and see more professionals.",
          variant: "default",
        });
      }
      return;
    }

    setLoading(true);
    try {
      if (isGuest) {
        const { data, error } = await supabase.rpc('get_professional_directory', { limit_count: 2 });
        if (error) {
          console.error('Supabase RPC error:', error);
          setProfessionals([]);
          return;
        }
        const mapped = (data || []).map((p: any) => ({
          ...p,
          profiles: { first_name: p.first_name, last_name: p.last_name, avatar_url: p.avatar_url },
        }));
        setProfessionals(mapped);
        return;
      }
      let query = supabase
        .from('professional_profiles')
        .select(`
          *,
          profiles!professional_profiles_user_id_profiles_fkey(first_name, last_name, avatar_url)
        `);

      // Only apply filters for authenticated users
      if (!isGuest) {
        if (filters.searchTerm) {
          const term = filters.searchTerm;
          query = query.or(
            `first_name.ilike.%${term}%,last_name.ilike.%${term}%,occupation.ilike.%${term}%,bio.ilike.%${term}%,sector.ilike.%${term}%`
          );
        }

        if (filters.country && filters.country !== 'all') {
          query = query.eq('country', filters.country);
        }

        if (filters.stateProvince && filters.stateProvince !== 'all') {
          query = query.eq('state_province', filters.stateProvince);
        }

        if (filters.sector && filters.sector !== 'all') {
          query = query.eq('sector', filters.sector);
        }

        if (filters.occupation && filters.occupation !== 'all') {
          query = query.eq('occupation', filters.occupation);
        }

        if (filters.isSeekingMentor) {
          query = query.eq('is_seeking_mentor', true);
        }

        if (filters.isMentor) {
          query = query.eq('is_mentor', true);
        }

        if (filters.experienceMin) {
          query = query.gte('experience_years', parseInt(filters.experienceMin));
        }

        if (filters.experienceMax) {
          query = query.lte('experience_years', parseInt(filters.experienceMax));
        }

        if (filters.skills && filters.skills.length > 0) {
          query = query.overlaps('skills', filters.skills);
        }

        if (filters.universities && filters.universities.length > 0) {
          query = query.in('university', filters.universities);
        }

        if (filters.languages && filters.languages.length > 0) {
          query = query.overlaps('languages', filters.languages);
        }

        if (filters.gender && filters.gender !== 'all') {
          query = query.eq('gender', filters.gender);
        }

        // Exclude current user
        if (user) {
          query = query.neq('user_id', user.id);
        }

        // Apply sorting
        if (sortBy === 'name') {
          query = query.order('first_name', { ascending: sortOrder === 'asc' });
        } else {
          query = query.order(sortBy, { ascending: sortOrder === 'asc' });
        }

        query = query.limit(50);
      } else {
        // For guests, just get the first 2 profiles ordered by creation date
        query = query.order('created_at', { ascending: true }).limit(2);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error:', error);
        setProfessionals([]);
        
        // Handle specific infinite recursion error
        if (error.code === '42P17') {
          console.error('Infinite recursion detected - showing fallback');
          // Only show toast if available and not guest
          if (toast && !isGuest) {
            toast({
              title: "Search temporarily unavailable",
              description: "We're fixing a technical issue. Please try again in a moment.",
              variant: "destructive",
            });
          }
        } else if (!isGuest && toast) {
          toast({
            title: "Unable to load profiles",
            description: "Please try refreshing the page or contact support.",
            variant: "destructive",
          });
        }
        return;
      }

      setProfessionals(data || []);
    } catch (error: any) {
      console.error('Error searching professionals:', error);
      setProfessionals([]);
      
      // Check if this is a critical error that should show fallback UI
      if (error?.message?.includes('permission') || error?.code === '42P17') {
        // For critical errors on mobile, show fallback instead of toast
        if (typeof window !== 'undefined' && window.innerWidth < 768) {
          return <MobileErrorFallback 
            error={error} 
            onRetry={() => handleSearch({})} 
            title="Unable to Load Professionals"
            description="We're experiencing technical difficulties. Please try refreshing the page."
          />;
        }
      }
      
      if (!isGuest && toast) {
        toast({
          title: "Search failed",
          description: "Unable to load professional profiles. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
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
            Find Muslim Professionals
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
        <SearchFilters onSearch={handleSearch} loading={loading} isGuest={isGuest} />

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

          {loading ? (
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
                     style={{ animationDelay: `${index * 0.1}s` }}
                     onClick={() => {
                       if (!isGuest) {
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
                       }
                     }}
                   >
                     <ProfessionalCard
                       professional={professional}
                       showMentorshipButton={false}  // Hide mentorship button on Find Professionals page
                       showFavoriteButton={!isGuest}
                        onRequestSent={() => {
                          if (toast) {
                            toast({
                              title: "Added to favorites!",
                              description: "Professional added to your favorites.",
                            });
                          }
                        }}
                     />
                   </div>
                ))}
               </div>
               
               {/* Call to action for guests */}
               {isGuest && (
                 <Card className="shadow-xl bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                   <CardContent className="p-8 text-center">
                     <h3 className="text-xl font-semibold text-foreground mb-3">
                       See thousands more professionals
                     </h3>
                     <p className="text-muted-foreground mb-6">
                       Join the community to access advanced search filters, connect with professionals, and unlock all features.
                     </p>
                     <Button asChild size="lg" className="w-full sm:w-auto">
                       <Link to="/login">Sign Up for Free</Link>
                     </Button>
                   </CardContent>
                 </Card>
               )}
             </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Search;