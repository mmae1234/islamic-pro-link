import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
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
import {
  useProfessionals,
  type ProfessionalListRow,
  type ProfessionalFilters,
} from "@/hooks/queries";

const Search = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [filters, setFilters] = useState<ProfessionalFilters>({});
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Profile-existence gate. Equivalent to the previous checkUserProfile() call.
  const profileQuery = useQuery({
    queryKey: ["profile-status", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return !!data;
    },
  });

  const hasProfile = profileQuery.data;

  // The professional directory query. Disabled until the user has a basic profile.
  const directoryQuery = useProfessionals(filters, {
    enabled: !!user && hasProfile === true,
  });

  // Surface profile-existence errors as a toast (matches old behavior).
  useEffect(() => {
    if (profileQuery.error) {
      toast({
        title: "Error",
        description: "Failed to check your profile status.",
        variant: "destructive",
      });
    }
  }, [profileQuery.error, toast]);

  // Surface directory errors as a toast (matches old behavior).
  useEffect(() => {
    if (directoryQuery.error) {
      toast({
        title: "Unable to load profiles",
        description: "Please try refreshing the page or contact support.",
        variant: "destructive",
      });
    }
  }, [directoryQuery.error, toast]);

  // First-time users with no profile get the inline setup flow.
  useEffect(() => {
    if (hasProfile === false) setShowProfileSetup(true);
  }, [hasProfile]);

  // Apply sort client-side. The base data comes sorted by `created_at desc` from
  // the RPC, so the only sort that needs work is "name".
  const professionals = useMemo<ProfessionalListRow[]>(() => {
    const rows = directoryQuery.data ?? [];
    if (sortBy === "name") {
      return [...rows].sort((a, b) => {
        const an = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim();
        const bn = `${b.first_name ?? ""} ${b.last_name ?? ""}`.trim();
        return sortOrder === "asc" ? an.localeCompare(bn) : bn.localeCompare(an);
      });
    }
    if (sortBy && sortBy !== "created_at") {
      return [...rows].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortBy];
        const bVal = (b as Record<string, unknown>)[sortBy];
        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortOrder === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        const aNum = typeof aVal === "number" ? aVal : 0;
        const bNum = typeof bVal === "number" ? bVal : 0;
        return sortOrder === "asc" ? aNum - bNum : bNum - aNum;
      });
    }
    return rows;
  }, [directoryQuery.data, sortBy, sortOrder]);

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false);
    profileQuery.refetch();
  };

  // Filters arrive from <SearchFilters /> as a loose object. Narrow to the
  // typed `ProfessionalFilters` shape the query hook expects.
  type SearchFilterPayload = Partial<{
    country: string;
    stateProvince: string;
    city: string;
    sector: string;
    occupation: string;
    isMentor: boolean;
    isSeekingMentor: boolean;
    searchTerm: string;
    experienceMin: string;
    experienceMax: string;
  }>;

  const handleSearch = (next: SearchFilterPayload = {}) => {
    setFilters({
      country: next.country,
      stateProvince: next.stateProvince,
      city: next.city,
      sector: next.sector,
      occupation: next.occupation,
      isMentor: !!next.isMentor,
      isSeekingMentor: !!next.isSeekingMentor,
      searchTerm: next.searchTerm,
      experienceMin: next.experienceMin,
      experienceMax: next.experienceMax,
    });
  };

  if (showProfileSetup && user) {
    return <ProfileSetup onComplete={handleProfileSetupComplete} />;
  }

  if (hasProfile === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isLoading = directoryQuery.isLoading || directoryQuery.isFetching;

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
                    key={professional.user_id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
                  >
                    {/* Profile-view tracking moved to /profile/:userId mount —
                        tracking on card click inflated metrics from accidental clicks
                        and the wrapping div catching hover events. */}
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
