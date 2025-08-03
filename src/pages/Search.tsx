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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Users, Loader2 } from "lucide-react";


const Search = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isGuest, setIsGuest] = useState(!user);

  useEffect(() => {
    setIsGuest(!user);
    if (user) {
      checkUserProfile();
    } else {
      // Load initial professionals for guests
      handleSearch({});
    }
  }, [user]);

  // Load initial professionals when the component mounts
  useEffect(() => {
    if (!user) {
      handleSearch({});
    }
  }, []);

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
      toast({
        title: "Error",
        description: "Failed to check your profile status.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async (filters: any) => {
    setLoading(true);
    try {
      let query = supabase
        .from('professional_profiles')
        .select(`
          *,
          profiles!professional_profiles_user_id_profiles_fkey(full_name)
        `);

      // Apply filters
      if (filters.searchTerm) {
        query = query.or(`
          occupation.ilike.%${filters.searchTerm}%,
          bio.ilike.%${filters.searchTerm}%,
          sector.ilike.%${filters.searchTerm}%
        `);
      }

      if (filters.country && filters.country !== 'all') {
        query = query.eq('country', filters.country);
      }

      if (filters.sector && filters.sector !== 'all') {
        query = query.eq('sector', filters.sector);
      }

      if (filters.isMentor) {
        query = query.eq('is_mentor', true);
      }

      if (filters.isSeekingMentor) {
        query = query.eq('is_seeking_mentor', true);
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

      // Exclude current user
      if (user) {
        query = query.neq('user_id', user.id);
      }

      const { data, error } = await query.limit(isGuest ? 6 : 50);

      if (error) throw error;

      setProfessionals(data || []);
    } catch (error: any) {
      console.error('Error searching professionals:', error);
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive",
      });
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
        <SearchFilters onSearch={handleSearch} loading={loading} />

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
                      aVal = a.profiles?.full_name || '';
                      bVal = b.profiles?.full_name || '';
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
            <div className="grid gap-6 animate-fade-in">
              {professionals.map((professional, index) => (
                <div 
                  key={professional.id}
                  className={`animate-fade-in-up ${isGuest && index >= 3 ? 'blur-sm' : ''}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ProfessionalCard
                    professional={professional}
                    showMentorshipButton={false}  // Hide mentorship button on Find Professionals page
                    showFavoriteButton={!isGuest}
                    onRequestSent={() => {
                      toast({
                        title: "Added to favorites!",
                        description: "Professional added to your favorites.",
                      });
                    }}
                  />
                </div>
              ))}
              {isGuest && professionals.length > 3 && (
                <Card className="shadow-soft bg-primary/5 border-primary/20">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Sign up to see more professionals
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Join MuslimsPros to connect with professionals and access all features.
                    </p>
                    <Button asChild>
                      <Link to="/login">Sign Up Today</Link>
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