import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SearchFilters from "@/components/SearchFilters";
import ProfessionalCard from "@/components/ProfessionalCard";
import ProfileSetup from "@/components/ProfileSetup";
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

  useEffect(() => {
    if (user) {
      checkUserProfile();
    }
  }, [user]);

  const checkUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setHasProfile(!!data);
      if (!data) {
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
          profiles(full_name)
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

      const { data, error } = await query.limit(50);

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

  if (showProfileSetup) {
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
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Search Results ({professionals.length} professionals found)
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span className="ml-2">Searching professionals...</span>
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
            <div className="grid gap-6">
              {professionals.map((professional) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  onRequestSent={() => {
                    toast({
                      title: "Request sent successfully!",
                      description: "The mentor will be notified of your request.",
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Search;