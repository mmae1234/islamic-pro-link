import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Building2, Search, Heart, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { CountrySelect, CitySelect as CitySelectEF, SectorSelect } from "@/components/EnhancedFormDropdowns";
import { StateProvinceSelect } from "@/components/StateProvinceSelect";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import {
  useBusinesses,
  useFavoriteBusinessIds,
  useToggleBusinessFavorite,
  useSendMessage,
  type BusinessAccount,
  type BusinessFilters,
} from "@/hooks/queries";

const setSeo = (title: string, description?: string, canonicalUrl?: string) => {
  document.title = title;
  if (description) {
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }
  if (canonicalUrl) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonicalUrl);
  }
};

type FormFilters = {
  searchTerm: string;
  country: string;
  state: string;
  city: string;
  sector: string;
  verifiedOnly: boolean;
};

const Businesses = () => {
  // The form state is what the user is editing; `appliedFilters` is what we've
  // committed to the React Query cache via the Search button.
  const [formFilters, setFormFilters] = useState<FormFilters>({
    searchTerm: "",
    country: "",
    state: "",
    city: "",
    sector: "",
    verifiedOnly: false,
  });
  const [appliedFilters, setAppliedFilters] = useState<BusinessFilters>({
    verifiedOnly: false,
  });

  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageRecipientId, setMessageRecipientId] = useState<string | null>(null);
  const [messageBusinessName, setMessageBusinessName] = useState<string>("");
  const [messageContent, setMessageContent] = useState("");
  const canonical = useMemo(() => `${window.location.origin}/businesses`, []);

  useEffect(() => {
    setSeo(
      "Find Businesses – Muslim Pros",
      "Search Muslim-owned and Muslim-friendly businesses by sector and location.",
      canonical,
    );
  }, [canonical]);

  const businessesQuery = useBusinesses(user?.id, appliedFilters);
  const favIdsQuery = useFavoriteBusinessIds(user?.id);
  const toggleFavorite = useToggleBusinessFavorite(user?.id);
  const sendMessage = useSendMessage(user?.id);

  const results: BusinessAccount[] = businessesQuery.data ?? [];
  const favoriteBusinessIds: string[] = favIdsQuery.data ?? [];
  const loading = businessesQuery.isFetching;

  const handleSearch = () => {
    setAppliedFilters({
      searchTerm: formFilters.searchTerm || undefined,
      country: formFilters.country || undefined,
      state: formFilters.state || undefined,
      city: formFilters.city || undefined,
      sector: formFilters.sector || undefined,
      verifiedOnly: formFilters.verifiedOnly,
    });
  };

  const handleFavorite = (id: string, name?: string | null) => {
    if (!user) {
      navigate(`/login?redirect=/businesses`);
      return;
    }
    const wasFav = favoriteBusinessIds.includes(id);
    toggleFavorite.mutate(
      { businessId: id, currentlyFavorited: wasFav },
      {
        onSuccess: () => {
          toast({
            title: wasFav ? "Removed from favorites" : "Added to favorites",
            description: name
              ? wasFav
                ? `${name} removed from your favorites.`
                : `${name} saved to your favorites.`
              : wasFav
              ? "Business removed."
              : "Business saved.",
          });
        },
        onError: (e: any) => {
          toast({
            title: "Could not update favorite",
            description: e?.message || "Please try again later.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const fullLocation = (b: BusinessAccount) =>
    [b.city, b.state, b.country].filter(Boolean).join(", ");

  const openMessageDialog = async (b: BusinessAccount) => {
    if (!user) {
      navigate(`/login?redirect=/businesses`);
      return;
    }
    setMessageOpen(true);
    setMessageBusinessName(b.name || "Business");
    setMessageContent("");
    try {
      const { data, error } = await supabase.rpc("get_business_owner_id", {
        _business_id: b.id,
      });
      if (error) throw error;
      if (!data) {
        toast({
          title: "Contact unavailable",
          description: "Unable to contact this business at the moment.",
        });
        setMessageOpen(false);
        return;
      }
      setMessageRecipientId(data as unknown as string);
    } catch (e) {
      console.error("Failed to load business owner", e);
      toast({
        title: "Error",
        description: "Could not open message box.",
        variant: "destructive",
      });
      setMessageOpen(false);
    }
  };

  const sendMessageToBusiness = () => {
    if (!user || !messageRecipientId || !messageContent.trim()) return;
    sendMessage.mutate(
      { recipientId: messageRecipientId, content: messageContent.trim() },
      {
        onSuccess: () => {
          toast({
            title: "Message sent!",
            description: `Your message was sent to ${messageBusinessName}.`,
          });
          setMessageOpen(false);
          setMessageContent("");
        },
        onError: (e: any) => {
          toast({
            title: "Error",
            description: e?.message || "Failed to send message.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Find Muslim Businesses</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Discover Muslim-owned and Muslim-friendly businesses by sector and location.</p>
        </header>

        <section aria-label="Business search filters" className="mb-6">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" /> Search Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="q">Search</Label>
                  <Input id="q" placeholder="Name, sector, or keywords" value={formFilters.searchTerm} onChange={(e) => setFormFilters({ ...formFilters, searchTerm: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <CountrySelect
                    value={formFilters.country}
                    onValueChange={(value) => setFormFilters({ ...formFilters, country: value, state: "", city: "" })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State/Province</Label>
                  <StateProvinceSelect
                    value={formFilters.state}
                    onValueChange={(value) => setFormFilters({ ...formFilters, state: value, city: "" })}
                    country={formFilters.country}
                    disabled={!formFilters.country}
                    placeholder="All States"
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <CitySelectEF
                    value={formFilters.city}
                    onValueChange={(value) => setFormFilters({ ...formFilters, city: value })}
                    country={formFilters.country}
                    stateProvince={formFilters.state}
                    placeholder="All Cities"
                  />
                </div>
                <div>
                  <Label htmlFor="sector">Sector</Label>
                  <SectorSelect
                    value={formFilters.sector}
                    onValueChange={(value) => setFormFilters({ ...formFilters, sector: value })}
                    placeholder="All Sectors"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox id="verified" checked={formFilters.verifiedOnly} onCheckedChange={(v) => setFormFilters({ ...formFilters, verifiedOnly: !!v })} />
                    <Label htmlFor="verified">Verified only</Label>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="accent" onClick={handleSearch} disabled={loading}>{loading ? 'Searching…' : 'Search'}</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-label="Search results" className="space-y-4">
          {!user && (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to Browse Businesses</h2>
                <p className="text-muted-foreground mb-4">Create an account or sign in to discover Muslim-owned and Muslim-friendly businesses.</p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button asChild>
                    <Link to="/login?redirect=/businesses">Sign In</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/signup?redirect=/businesses">Create Account</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {user && results.length === 0 && !loading && (
            <Card className="shadow-soft">
              <CardContent className="p-8 text-center text-muted-foreground">No businesses found. Try adjusting your filters.</CardContent>
            </Card>
          )}

          {user && results.map((b) => {
            const isFav = favoriteBusinessIds.includes(b.id);
            return (
              <Card key={b.id} className="shadow-soft">
                <CardContent className="p-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-primary" />
                      <Link to={`/business/${b.id}`} className="text-xl font-semibold text-foreground hover:text-primary transition-smooth">
                        {b.name || 'Unnamed Business'}
                      </Link>
                      {b.verified && <Badge variant="secondary">Verified</Badge>}
                    </div>
                    <p className="text-muted-foreground mt-1">{[b.sector, fullLocation(b)].filter(Boolean).join(' • ')}</p>

                    <div className="actions flex flex-wrap items-center justify-end gap-3 md:gap-4 mt-2">
                      <Button variant={isFav ? "default" : "outline"} onClick={() => handleFavorite(b.id, b.name)} aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}>
                        <Heart className={`w-4 h-4 mr-2 ${isFav ? 'fill-current' : ''}`} /> {isFav ? 'Favorited' : 'Favorite'}
                      </Button>
                      <Button variant="outline" onClick={() => openMessageDialog(b)} aria-label="Message business">
                        <MessageCircle className="w-4 h-4 mr-2" /> Message
                      </Button>
                      <Button variant="outline" asChild aria-label="View profile">
                        <Link to={`/business/${b.id}`}>View Profile</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Message {messageBusinessName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="biz-message">Message</Label>
                <Textarea id="biz-message" rows={4} value={messageContent} onChange={(e) => setMessageContent(e.target.value)} placeholder="Write your message..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={sendMessageToBusiness} disabled={!messageContent.trim() || sendMessage.isPending}>Send</Button>
                <Button variant="outline" onClick={() => setMessageOpen(false)}>Cancel</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default Businesses;
